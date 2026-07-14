import { SendMailClient } from "zeptomail";

let client: SendMailClient | null = null;

function getClient(): SendMailClient {
  if (!client) {
    const url = "api.zeptomail.com/";
    const token = process.env.ZEPTOMAIL_TOKEN || "";
    if (!token) {
      console.warn("ZEPTOMAIL_TOKEN is not set — emails will not be sent");
    }
    client = new SendMailClient({ url, token });
  }
  return client;
}

const fromAddress = () => process.env.ZEPTOMAIL_FROM || "admin@lumenware.com.ng";
const fromName = () => process.env.ZEPTOMAIL_FROM_NAME || "APM Campaign";

export interface SendEmailParams {
  to: string;
  toName?: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
}

export async function sendEmail(params: SendEmailParams) {
  const { to, toName, subject, htmlBody, textBody } = params;

  const fromAddr = fromAddress();
  const fromNm = fromName();
  const token = process.env.ZEPTOMAIL_TOKEN || "";

  console.log(`[ZeptoMail] Attempting to send email...
  From: ${fromNm} <${fromAddr}>
  To: ${toName || ""} <${to}>
  Subject: ${subject}
  Token set: ${!!token}
  Token prefix: ${token ? token.substring(0, 20) + "..." : "(empty)"}`);

  if (!token) {
    console.warn("[ZeptoMail] ZEPTOMAIL_TOKEN is not set — aborting send");
    throw new Error("ZEPTOMAIL_TOKEN is not configured on the server");
  }

  try {
    const mailClient = getClient();
    const result = await mailClient.sendMail({
      from: { address: fromAddr, name: fromNm },
      to: [
        {
          email_address: {
            address: to,
            name: toName || "",
          },
        },
      ],
      subject,
      htmlbody: htmlBody,
      textbody: textBody || "",
      track_clicks: true,
      track_opens: true,
    });
    console.log("[ZeptoMail] Email sent successfully:", JSON.stringify(result));
    return result;
  } catch (error) {
    console.error("[ZeptoMail] Failed to send email:", error);
    throw error;
  }
}
