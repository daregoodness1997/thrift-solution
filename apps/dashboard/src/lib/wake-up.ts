const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const MAX_RETRIES = 10;
const RETRY_DELAY = 2000;

export async function wakeUpServer(): Promise<boolean> {
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const res = await fetch(`${API_URL}/api/health/wake`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.status === "awake") {
          return true;
        }
      }
    } catch {
      // Server may still be starting up, wait and retry
    }
    if (i < MAX_RETRIES - 1) {
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
    }
  }
  return false;
}
