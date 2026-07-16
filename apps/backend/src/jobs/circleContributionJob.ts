import { runWeeklyContributionJob } from "@thrift/db";

export async function circleContributionJob() {
  console.log("[Circle Contribution Job] Starting weekly contribution debit...");
  const startTime = Date.now();

  try {
    const result = await runWeeklyContributionJob();
    const elapsed = Date.now() - startTime;
    console.log(
      `[Circle Contribution Job] Completed in ${elapsed}ms. Charged: ${result.charged}, Defaulted: ${result.defaulted}, Errors: ${result.errors}, Total: ${result.total}`,
    );
    return result;
  } catch (err) {
    console.error("[Circle Contribution Job] Fatal error:", err);
    throw err;
  }
}
