import "dotenv/config";
import {
  prisma,
  createUser,
  setUserBankDetails,
  fundWallet,
  getWalletBalance,
  createCircle,
  openCircleAccount,
  processWeeklyContributionForAccount,
  getDefaultsByUser,
  clearCircleDefault,
  matureCircleAccount,
  clearCirclePayoutRequest,
  markCirclePayoutRequestDisbursed,
  disburseCirclePayoutRequestViaFlutterwave,
  getCircleAccountById,
} from "@thrift/db";

const KEEP = process.argv.includes("--keep");
const TAG = `test-circle-${Date.now()}`;

let pass = 0;
let fail = 0;

function check(label: string, cond: boolean, detail?: unknown) {
  if (cond) {
    pass++;
    console.log(`  PASS  ${label}`);
  } else {
    fail++;
    console.error(`  FAIL  ${label}${detail !== undefined ? ` -> ${JSON.stringify(detail)}` : ""}`);
  }
}

function section(title: string) {
  console.log(`\n=== ${title} ===`);
}

async function main() {
  const created: { userId?: string; circleId?: string; accountId?: string } = {};

  try {
    section("Setup: weekly circle (clearance payout) + funded user");
    const circle = await createCircle({
      name: `${TAG} Weekly Circle`,
      description: "integration test",
      cycleType: "weekly_contribution",
      amount: 0,
      weeklyAmount: 1000,
      totalWeeks: 4,
      durationMonths: 1,
      interestRateAnnual: 0,
      maxAccountsPerUser: 1,
      payoutMode: "clearance",
      blockPayoutOnDefault: false,
    });
    created.circleId = circle.id;
    check("circle cycleType is weekly_contribution", circle.cycleType === "weekly_contribution", circle.cycleType);
    check("circle payoutMode is clearance", circle.payoutMode === "clearance", circle.payoutMode);
    check("circle autoPayout resolved to false", circle.autoPayout === false, circle.autoPayout);

    const user = await createUser({
      email: `${TAG}@example.com`,
      name: "Test Circle User",
      passwordHash: "x",
    });
    created.userId = user.id;
    await setUserBankDetails(user.id, {
      bankName: "Test Bank",
      bankCode: "058",
      bankAccountNumber: "0690000031",
      bankAccountName: "Test Circle User",
    });
    const withBank = await prisma.user.findUnique({ where: { id: user.id } });
    check("bank details saved", withBank?.bankAccountNumber === "0690000031" && withBank?.bankCode === "058");

    await fundWallet(user.id, 5000);
    check("wallet funded to 5000", (await getWalletBalance(user.id)) === 5000);

    section("Open weekly account (week 1 debited)");
    const account = await openCircleAccount(circle.id, user.id);
    created.accountId = account.id;
    check("account created", !!account.id);
    check("weeksContributed == 1 after open", account.weeksContributed === 1, account.weeksContributed);
    check("principal == weeklyAmount (1000)", account.principalAmount === 1000, account.principalAmount);
    check("wallet debited to 4000", (await getWalletBalance(user.id)) === 4000);

    section("Force a default: drain wallet + backdate contribution attempt");
    // spend wallet down below weeklyAmount so next processing defaults
    await prisma.$transaction(async (tx) => {
      await tx.transaction.create({
        data: {
          userId: user.id,
          type: "contribution",
          amount: 3500,
          reference: `${TAG}-drain`,
          status: "completed",
          description: "drain for default test",
        },
      });
    });
    check("wallet drained to 500 (< weeklyAmount)", (await getWalletBalance(user.id)) === 500);

    // backdate lastContributionAttempt by 8 days -> 1 week due
    const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
    await prisma.circleAccount.update({
      where: { id: account.id },
      data: { lastContributionAttempt: eightDaysAgo },
    });

    const wk = await processWeeklyContributionForAccount(account.id);
    check("weekly job processed 1 week", wk?.processed === 1, wk);
    check("weekly job recorded 1 default", wk?.defaulted === 1, wk);

    const defaultsRes = await getDefaultsByUser(user.id, { status: "outstanding" });
    check("1 outstanding default exists", defaultsRes.total === 1, defaultsRes.total);
    const def = defaultsRes.items[0];
    check("default amountDue == 1000", def?.amountDue === 1000, def?.amountDue);
    check("default clearanceAmount == 2000 (2x)", def?.clearanceAmount === 2000, def?.clearanceAmount);

    const afterDefaultAcct = await getCircleAccountById(account.id);
    check("weeksDefaulted == 1", afterDefaultAcct?.weeksDefaulted === 1, afterDefaultAcct?.weeksDefaulted);

    section("Clear the default (debits 2x from wallet)");
    await fundWallet(user.id, 3000);
    const balBeforeClear = await getWalletBalance(user.id);
    await clearCircleDefault(def.id, user.id);
    const balAfterClear = await getWalletBalance(user.id);
    check("wallet debited by 2000 on clear", balBeforeClear - balAfterClear === 2000, {
      before: balBeforeClear,
      after: balAfterClear,
    });
    const clearedDef = await prisma.circleDefault.findUnique({ where: { id: def.id } });
    check("default status == cleared", clearedDef?.status === "cleared", clearedDef?.status);
    const acctAfterClear = await getCircleAccountById(account.id);
    check("weeksDefaulted back to 0", acctAfterClear?.weeksDefaulted === 0, acctAfterClear?.weeksDefaulted);
    check("weeksContributed incremented to 2", acctAfterClear?.weeksContributed === 2, acctAfterClear?.weeksContributed);

    section("Mature account -> clearance payout request created (not auto)");
    await prisma.circleAccount.update({
      where: { id: account.id },
      data: { maturityDate: new Date(Date.now() - 1000) },
    });
    const matureResult = await matureCircleAccount(account.id, user.id);
    check(
      "maturity returns payout_request (clearance mode)",
      (matureResult as { type?: string }).type === "payout_request",
      matureResult,
    );
    const request = (matureResult as { request: { id: string; status: string } }).request;
    check("payout request status pending", request.status === "pending", request.status);

    section("Admin clears request, then marks disbursed (manual proof)");
    const cleared = await clearCirclePayoutRequest(request.id, "admin-test", "looks good");
    check("request status cleared", cleared.status === "cleared", cleared.status);

    const disbursed = await markCirclePayoutRequestDisbursed(request.id, "admin-test", {
      proofUrl: "https://example.com/proof.png",
      reference: "MANUAL-REF-123",
      note: "paid manually",
    });
    check("request status disbursed", disbursed.status === "disbursed", disbursed.status);
    check("disbursement method manual", disbursed.disbursementMethod === "manual", disbursed.disbursementMethod);
    check("proof url stored", disbursed.disbursementProofUrl === "https://example.com/proof.png");

    const finalAcct = await getCircleAccountById(account.id);
    check("account status withdrawn after disbursement", finalAcct?.status === "withdrawn", finalAcct?.status);

    section("Guard: cannot disburse an already-disbursed request via flutterwave");
    let guardThrew = false;
    try {
      await disburseCirclePayoutRequestViaFlutterwave(request.id, "admin-test", async () => ({ status: "completed" }));
    } catch {
      guardThrew = true;
    }
    check("re-disburse rejected", guardThrew);
  } finally {
    if (!KEEP && created.userId) {
      section("Cleanup");
      await prisma.circleContribution.deleteMany({ where: { userId: created.userId } });
      await prisma.circleDefault.deleteMany({ where: { userId: created.userId } });
      await prisma.circlePayoutRequest.deleteMany({ where: { userId: created.userId } });
      await prisma.circleAccount.deleteMany({ where: { userId: created.userId } });
      await prisma.transaction.deleteMany({ where: { userId: created.userId } });
      if (created.circleId) await prisma.circle.delete({ where: { id: created.circleId } }).catch(() => {});
      await prisma.user.delete({ where: { id: created.userId } }).catch(() => {});
      console.log("  cleaned up test data");
    } else if (KEEP) {
      console.log(`\n(kept test data: user=${created.userId} circle=${created.circleId})`);
    }
  }

  console.log(`\n----------------------------------------`);
  console.log(`RESULT: ${pass} passed, ${fail} failed`);
  if (fail > 0) process.exitCode = 1;
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
