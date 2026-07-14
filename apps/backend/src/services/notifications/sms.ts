export function normalizePhone(phone: string): string {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("00234")) {
    digits = digits.slice(2);
  }
  if (digits.startsWith("0") && digits.length === 11) {
    return "234" + digits.slice(1);
  }
  if (digits.startsWith("234") && digits.length === 12) {
    return digits;
  }
  throw new Error(`Invalid Nigerian phone number: ${phone}`);
}

export interface TermiiSendSmsResponse {
  message_id?: string;
  message?: string;
  status?: string;
}

export async function sendSms(
  to: string,
  message: string,
): Promise<TermiiSendSmsResponse> {
  const apiKey = process.env.TERMII_API_KEY || "";
  const senderId = process.env.TERMII_SENDER_ID || "StringsApp";
  const baseUrl =
    process.env.TERMII_BASE_URL || "https://v3.api.termii.com/api";

  if (!apiKey) {
    console.warn("TERMII_API_KEY is not set — SMS will not be sent");
    return { message: "skipped" };
  }

  const normalizedTo = normalizePhone(to);
  console.log(`[sendSms] to=${normalizedTo} from=${senderId} channel=generic`);

  const body = {
    api_key: apiKey,
    to: normalizedTo,
    from: senderId,
    sms: message,
    type: "plain",
    channel: "generic",
  };

  try {
    const response = await fetch(`${baseUrl}/sms/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = (await response.json()) as TermiiSendSmsResponse;
    if (!response.ok) {
      console.error("Termii API error:", response.status, result);
      throw new Error(`SMS failed: ${result.message || response.statusText}`);
    }
    console.log(`SMS sent to ${normalizedTo} — message_id: ${result.message_id}`);
    return result;
  } catch (error) {
    console.error("Failed to send SMS via Termii:", error);
    throw error;
  }
}
