import { runWeeklyInterestJob } from "@thrift/db";

export async function circleInterestJob() {
  console.log("[Circle Interest Job] Starting weekly interest calculation...");
  const startTime = Date.now();

  try {
    const result = await runWeeklyInterestJob();
    const elapsed = Date.now() - startTime;
    console.log(
      `[Circle Interest Job] Completed in ${elapsed}ms. Processed: ${result.processed}, Errors: ${result.errors}, Total: ${result.total}`
    );
    return result;
  } catch (err) {
    console.error("[Circle Interest Job] Fatal error:", err);
    throw err;
  }
}
