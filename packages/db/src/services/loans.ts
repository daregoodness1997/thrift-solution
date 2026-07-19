import nodeCrypto from "node:crypto";
import { prisma } from "./prisma";

export function calculateLoanTerms(amount: number, termMonths: number, annualRate: number = 5) {
  const monthlyRate = annualRate / 100 / 12;
  const monthlyPayment = monthlyRate > 0
    ? (amount * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / (Math.pow(1 + monthlyRate, termMonths) - 1)
    : amount / termMonths;
  const totalRepayment = monthlyPayment * termMonths;
  return {
    monthlyPayment: Math.round(monthlyPayment * 100) / 100,
    totalRepayment: Math.round(totalRepayment * 100) / 100,
    interestRate: annualRate,
  };
}

export function resolveLoanProcessingFee(
  type?: "fixed" | "percent" | string | null,
  value?: number | string | null,
): { processingFeeType: "fixed" | "percent" | null; processingFeeValue: number | null } {
  if (type !== "fixed" && type !== "percent") return { processingFeeType: null, processingFeeValue: null };
  const numeric = typeof value === "string" ? Number(value) : value;
  if (numeric == null || isNaN(numeric) || numeric < 0) return { processingFeeType: null, processingFeeValue: null };
  return { processingFeeType: type, processingFeeValue: Math.round(numeric * 100) / 100 };
}

export function computeLoanProcessingFee(
  type: "fixed" | "percent" | null | undefined,
  value: number | null | undefined,
  principal: number,
): number {
  if (type !== "fixed" && type !== "percent") return 0;
  if (value == null || value <= 0) return 0;
  const fee = type === "fixed" ? value : principal * (value / 100);
  return Math.round(fee * 100) / 100;
}

export async function createLoan(data: {
  borrowerId: string;
  amount: number;
  interestRate: number;
  termMonths: number;
  monthlyPayment: number;
  totalRepayment: number;
  purpose?: string;
  processingFeeType?: "fixed" | "percent" | null;
  processingFeeValue?: number | null;
}) {
  const { processingFeeType, processingFeeValue } = resolveLoanProcessingFee(
    data.processingFeeType ?? null,
    data.processingFeeValue ?? null,
  );
  const processingFee = computeLoanProcessingFee(processingFeeType, processingFeeValue, data.amount);
  return prisma.loan.create({
    data: {
      borrowerId: data.borrowerId,
      amount: data.amount,
      interestRate: data.interestRate,
      termMonths: data.termMonths,
      monthlyPayment: data.monthlyPayment,
      totalRepayment: data.totalRepayment,
      purpose: data.purpose,
      processingFeeType,
      processingFeeValue,
      processingFee,
    },
  });
}

export async function getLoanById(id: string) {
  return prisma.loan.findUnique({
    where: { id },
    include: {
      borrower: { select: { id: true, name: true, email: true } },
      schedule: { orderBy: { installmentNo: "asc" } },
      repayments: { orderBy: { createdAt: "desc" } },
    },
  });
}

export async function getLoansByBorrower(borrowerId: string, opts?: { page?: number; limit?: number; status?: string }) {
  const page = opts?.page ?? 1;
  const limit = opts?.limit ?? 20;
  const where: Record<string, unknown> = { borrowerId };
  if (opts?.status) where.status = opts.status;

  const [items, total, allLoans] = await Promise.all([
    prisma.loan.findMany({
      where,
      include: {
        schedule: { orderBy: { installmentNo: "asc" } },
        repayments: { orderBy: { createdAt: "desc" } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.loan.count({ where }),
    prisma.loan.findMany({
      where: { borrowerId },
      select: { status: true, amount: true, paidAmount: true },
    }),
  ]);

  const stats = {
    total: allLoans.length,
    completedCount: allLoans.filter((l) => l.status === "completed").length,
    totalBorrowed: allLoans.filter((l) => l.status === "disbursed" || l.status === "completed").reduce((sum, l) => sum + l.amount, 0),
    totalRepaid: allLoans.reduce((sum, l) => sum + (l.paidAmount ?? 0), 0),
  };

  return { items, total, page, limit, totalPages: Math.ceil(total / limit), stats };
}

export async function getAllLoans(params: {
  page?: number;
  limit?: number;
  status?: string;
}) {
  const { page = 1, limit = 20, status } = params;
  const where: Record<string, unknown> = {};
  if (status) where.status = status;

  const [items, total] = await Promise.all([
    prisma.loan.findMany({
      where,
      include: { borrower: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.loan.count({ where }),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function updateLoan(id: string, data: Record<string, unknown>) {
  return prisma.loan.update({
    where: { id },
    data,
    include: { borrower: { select: { id: true, name: true, email: true } } },
  });
}

function generateSchedule(
  amount: number,
  termMonths: number,
  monthlyRate: number,
  monthlyPayment: number,
  startDate: Date,
) {
  const items: Array<{
    installmentNo: number;
    dueDate: Date;
    principal: number;
    interest: number;
    totalDue: number;
  }> = [];

  let balance = amount;
  for (let i = 1; i <= termMonths; i++) {
    const interestPart = balance * monthlyRate;
    let principalPart = monthlyPayment - interestPart;
    let totalDue = monthlyPayment;

    if (i === termMonths) {
      principalPart = balance;
      totalDue = principalPart + interestPart;
    }

    balance = Math.max(0, balance - principalPart);

    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + i);

    items.push({
      installmentNo: i,
      dueDate,
      principal: Math.round(principalPart * 100) / 100,
      interest: Math.round(interestPart * 100) / 100,
      totalDue: Math.round(totalDue * 100) / 100,
    });
  }
  return items;
}

function resolveDisbursedAmount(
  loan: { amount: number; processingFee: number | null },
  disbursedAmount?: number,
) {
  const requested = disbursedAmount ?? loan.amount;
  const processingFee = loan.processingFee ?? 0;
  const amount = Math.round((requested - processingFee) * 100) / 100;
  if (amount <= 0) throw new Error("Disbursed amount must be greater than the processing fee");
  return amount;
}

export async function disburseLoan(
  id: string,
  disbursedAmount?: number,
  opts?: {
    method?: string;
    disbursementStatus?: string;
    disbursementRef?: string;
    disbursementNote?: string;
    disbursedById?: string;
  },
) {
  const loan = await prisma.loan.findUnique({ where: { id } });
  if (!loan) throw new Error("Loan not found");
  if (loan.status !== "approved") throw new Error("Only approved loans can be disbursed");

  const amount = resolveDisbursedAmount(loan, disbursedAmount);
  const monthlyRate = loan.interestRate / 100 / 12;
  const schedule = generateSchedule(
    amount,
    loan.termMonths,
    monthlyRate,
    loan.monthlyPayment,
    new Date(),
  );

  return prisma.$transaction(async (tx) => {
    const created = await tx.loan.update({
      where: { id },
      data: {
        status: "disbursed",
        disbursedAt: new Date(),
        disbursedAmount: amount,
        outstandingBalance: amount,
        nextDueDate: schedule[0]?.dueDate ?? null,
        disbursementMethod: opts?.method ?? "manual",
        disbursementStatus: opts?.disbursementStatus ?? "completed",
        disbursementRef: opts?.disbursementRef,
        disbursementNote: opts?.disbursementNote,
        disbursedById: opts?.disbursedById,
      },
    });

    await tx.loanScheduleItem.createMany({
      data: schedule.map((s) => ({ ...s, loanId: id })),
    });

    const txnRef =
      opts?.disbursementRef || `LOANDIS-${Date.now().toString(36)}-${nodeCrypto.randomBytes(6).toString("hex")}`;
    await tx.transaction.create({
      data: {
        userId: loan.borrowerId,
        loanId: id,
        type: "loan_payout",
        amount,
        reference: txnRef,
        status: opts?.disbursementStatus === "pending" ? "pending" : "completed",
        description: "Loan disbursement sent to your bank account",
      },
    });

    return created;
  });
}

/**
 * Disburse an approved loan by transferring the (net of processing fee) amount
 * to the borrower's saved bank account via a payout provider (Flutterwave).
 *
 * The `transfer` callback performs the actual provider call so the db package
 * stays decoupled from the HTTP client. The loan is only marked `disbursed`
 * (and a repayment schedule generated) when the transfer succeeds or is
 * accepted as pending. A failed transfer leaves the loan `approved` and records
 * the failure metadata so an admin can retry.
 */
export async function disburseLoanViaFlutterwave(
  id: string,
  adminId: string,
  transfer: (params: {
    accountNumber: string;
    bankCode: string;
    amount: number;
    reference: string;
  }) => Promise<{ status: string; providerRef?: string }>,
  disbursedAmount?: number,
) {
  const loan = await prisma.loan.findUnique({
    where: { id },
    include: { borrower: true },
  });
  if (!loan) throw new Error("Loan not found");
  if (loan.status !== "approved") throw new Error("Only approved loans can be disbursed");

  const borrower = loan.borrower;
  if (!borrower.bankAccountNumber || !borrower.bankCode) {
    throw new Error("Borrower has no saved bank account number and bank code for transfer");
  }

  const amount = resolveDisbursedAmount(loan, disbursedAmount);
  const reference = `LOANDIS-${Date.now().toString(36)}-${nodeCrypto.randomBytes(6).toString("hex")}`;

  let result: { status: string; providerRef?: string };
  try {
    result = await transfer({
      accountNumber: borrower.bankAccountNumber,
      bankCode: borrower.bankCode,
      amount,
      reference,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Transfer failed";
    await prisma.loan.update({
      where: { id },
      data: {
        disbursementMethod: "flutterwave",
        disbursementStatus: "failed",
        disbursementRef: reference,
        disbursementNote: message,
        disbursedById: adminId,
      },
    });
    throw new Error(`Disbursement failed: ${message}`);
  }

  const succeeded = result.status === "completed" || result.status === "pending";
  if (!succeeded) {
    await prisma.loan.update({
      where: { id },
      data: {
        disbursementMethod: "flutterwave",
        disbursementStatus: "failed",
        disbursementRef: result.providerRef || reference,
        disbursementNote: `Provider returned status "${result.status}"`,
        disbursedById: adminId,
      },
    });
    throw new Error(`Disbursement failed: provider returned status "${result.status}"`);
  }

  return disburseLoan(id, disbursedAmount, {
    method: "flutterwave",
    disbursementStatus: result.status === "completed" ? "completed" : "pending",
    disbursementRef: result.providerRef || reference,
    disbursedById: adminId,
  });
}

/**
 * Reconcile a loan disbursement transfer from a Flutterwave `transfer` webhook.
 * Matches the loan by its stored `disbursementRef` (either our own reference or
 * the provider ref) and updates the disbursement status. Returns true when a
 * matching loan was found and updated.
 */
export async function reconcileLoanDisbursementByRef(
  reference: string,
  status: "completed" | "failed",
): Promise<boolean> {
  const loan = await prisma.loan.findFirst({
    where: { disbursementRef: reference, disbursementMethod: "flutterwave" },
  });
  if (!loan) return false;
  if (loan.disbursementStatus === status) return true;

  await prisma.$transaction(async (tx) => {
    if (status === "failed") {
      // A pending transfer that later fails: unwind the disbursement so the
      // loan can be retried. Remove the generated schedule and reset balances.
      await tx.loanScheduleItem.deleteMany({ where: { loanId: loan.id } });
      await tx.loan.update({
        where: { id: loan.id },
        data: {
          status: "approved",
          disbursementStatus: "failed",
          disbursedAt: null,
          disbursedAmount: null,
          outstandingBalance: 0,
          nextDueDate: null,
        },
      });
    } else {
      await tx.loan.update({
        where: { id: loan.id },
        data: { disbursementStatus: status },
      });
    }
    await tx.transaction.updateMany({
      where: { loanId: loan.id, type: "loan_payout", reference, status: { not: status } },
      data: { status },
    });
  });
  return true;
}

export async function getLoanSchedule(loanId: string) {
  return prisma.loanScheduleItem.findMany({
    where: { loanId },
    orderBy: { installmentNo: "asc" },
  });
}

export async function recordLoanRepayment(data: {
  loanId: string;
  borrowerId: string;
  amount: number;
  method?: string;
  note?: string;
  reference?: string;
  installmentNo?: number;
}) {
  const loan = await prisma.loan.findUnique({
    where: { id: data.loanId },
    include: {
      schedule: {
        where: {
          status: { not: "paid" },
          ...(data.installmentNo ? { installmentNo: data.installmentNo } : {}),
        },
        orderBy: { installmentNo: "asc" },
      },
    },
  });
  if (!loan) throw new Error("Loan not found");
  if (loan.status !== "disbursed" && loan.status !== "completed") {
    throw new Error("Loan is not active for repayment");
  }
  if (data.installmentNo && loan.schedule.length === 0) {
    throw new Error("That installment is not available for repayment");
  }

  let remaining = Math.round(data.amount * 100) / 100;
  let principalPortion = 0;
  let interestPortion = 0;

  const scheduleUpdates: Array<{ id: string; principalPaid: number; interestPaid: number; status: string; paidAt: Date | null }> = [];

  for (const item of loan.schedule) {
    if (remaining <= 0) break;
    const interestDue = Math.max(0, Math.round((item.interest - item.interestPaid) * 100) / 100);
    const principalDue = Math.max(0, Math.round((item.principal - item.principalPaid) * 100) / 100);
    const itemTotalDue = Math.round((interestDue + principalDue) * 100) / 100;

    if (itemTotalDue <= 0) continue;

    const pay = Math.min(remaining, itemTotalDue);
    const payInterest = Math.min(pay, interestDue);
    const payPrincipal = Math.round((pay - payInterest) * 100) / 100;

    interestPortion = Math.round((interestPortion + payInterest) * 100) / 100;
    principalPortion = Math.round((principalPortion + payPrincipal) * 100) / 100;
    remaining = Math.round((remaining - pay) * 100) / 100;

    const newInterestPaid = Math.round((item.interestPaid + payInterest) * 100) / 100;
    const newPrincipalPaid = Math.round((item.principalPaid + payPrincipal) * 100) / 100;
    const itemSettled = Math.abs(newInterestPaid - item.interest) < 0.005 &&
      Math.abs(newPrincipalPaid - item.principal) < 0.005;

    scheduleUpdates.push({
      id: item.id,
      principalPaid: newPrincipalPaid,
      interestPaid: newInterestPaid,
      status: itemSettled ? "paid" : "partial",
      paidAt: itemSettled ? new Date() : null,
    });
  }

  const totalApplied = Math.round((principalPortion + interestPortion) * 100) / 100;
  const reference = `LOANREP-${Date.now()}-${nodeCrypto.randomBytes(4).toString("hex")}`;

  return prisma.$transaction(async (tx) => {
    const repayment = await tx.loanRepayment.create({
      data: {
        loanId: data.loanId,
        borrowerId: data.borrowerId,
        amount: totalApplied,
        principal: principalPortion,
        interest: interestPortion,
        method: data.method ?? "wallet",
        reference: data.reference ?? reference,
        note: data.note,
        status: "completed",
      },
    });

    for (const u of scheduleUpdates) {
      await tx.loanScheduleItem.update({
        where: { id: u.id },
        data: {
          principalPaid: u.principalPaid,
          interestPaid: u.interestPaid,
          status: u.status,
          paidAt: u.paidAt,
        },
      });
    }

    const updatedLoan = await tx.loan.update({
      where: { id: data.loanId },
      data: {
        paidAmount: { increment: totalApplied },
        principalPaid: { increment: principalPortion },
        interestPaid: { increment: interestPortion },
        outstandingBalance: Math.max(0, Math.round((loan.outstandingBalance - principalPortion) * 100) / 100),
      },
    });

    if (updatedLoan.outstandingBalance <= 0.005) {
      await tx.loan.update({
        where: { id: data.loanId },
        data: { status: "completed", completedAt: new Date(), nextDueDate: null },
      });
    } else {
      const nextItem = await tx.loanScheduleItem.findFirst({
        where: { loanId: data.loanId, status: { not: "paid" } },
        orderBy: { installmentNo: "asc" },
      });
      if (nextItem) {
        await tx.loan.update({
          where: { id: data.loanId },
          data: { nextDueDate: nextItem.dueDate },
        });
      }
    }

    return repayment;
  });
}

export async function getLoanRepayments(loanId: string) {
  return prisma.loanRepayment.findMany({
    where: { loanId },
    orderBy: { createdAt: "desc" },
  });
}

export async function findLoanRepaymentByReference(reference: string) {
  return prisma.loanRepayment.findUnique({ where: { reference } });
}

/**
 * Apply a confirmed Flutterwave (or other provider) payment to a loan. Used by
 * the payment callback / webhook after the provider confirms success. Records
 * the repayment, settles schedule items, and updates loan balances. Idempotent:
 * if a repayment with the same reference already exists it is returned as-is.
 */
export async function recordLoanRepaymentByReference(data: {
  reference: string;
  loanId: string;
  borrowerId: string;
  amount: number;
  provider: string;
  installmentNo?: number;
}) {
  const existing = await prisma.loanRepayment.findUnique({ where: { reference: data.reference } });
  if (existing) return existing;

  return recordLoanRepayment({
    loanId: data.loanId,
    borrowerId: data.borrowerId,
    amount: data.amount,
    method: data.provider,
    note: `Payment via ${data.provider}`,
    installmentNo: data.installmentNo,
  });
}

/**
 * Liquidate a loan by paying off its entire remaining outstanding balance in a
 * single transaction. Returns the amount that was paid.
 */
export async function liquidateLoan(id: string) {
  const loan = await prisma.loan.findUnique({ where: { id } });
  if (!loan) throw new Error("Loan not found");
  if (loan.status !== "disbursed" && loan.status !== "completed") {
    throw new Error("Only disbursed loans can be liquidated");
  }
  const outstanding = Math.round((loan.outstandingBalance ?? 0) * 100) / 100;
  if (outstanding <= 0) throw new Error("Loan is already fully repaid");

  const reference = `LOANLIQ-${Date.now()}-${nodeCrypto.randomBytes(4).toString("hex")}`;
  await recordLoanRepayment({
    loanId: id,
    borrowerId: loan.borrowerId,
    amount: outstanding,
    method: "liquidation",
    note: "Loan liquidated - full balance paid",
    reference,
  });
  return { amount: outstanding, reference };
}

/**
 * Admin force-settle / write-off a loan. Marks the loan completed without
 * requiring the borrower to pay the outstanding balance (settlement or waiver).
 */
export async function adminSettleLoan(id: string, note?: string) {
  const loan = await prisma.loan.findUnique({ where: { id } });
  if (!loan) throw new Error("Loan not found");
  if (loan.status !== "disbursed") {
    throw new Error("Only disbursed loans can be settled");
  }

  return prisma.$transaction(async (tx) => {
    await tx.loanScheduleItem.updateMany({
      where: { loanId: id, status: { not: "paid" } },
      data: { status: "paid", paidAt: new Date() },
    });

    const updated = await tx.loan.update({
      where: { id },
      data: { status: "completed", completedAt: new Date() },
    });

    await tx.loanRepayment.create({
      data: {
        loanId: id,
        borrowerId: loan.borrowerId,
        amount: 0,
        principal: 0,
        interest: 0,
        method: "admin_settlement",
        reference: `LOANSET-${Date.now()}-${nodeCrypto.randomBytes(4).toString("hex")}`,
        note: note || "Loan settled / written off by admin",
        status: "completed",
      },
    });

    return updated;
  });
}
