import crypto from "node:crypto";
import {
  createVerificationToken,
  deleteVerificationTokens,
  findValidVerificationToken,
  consumeVerificationToken,
  type VerificationType,
  type VerificationChannel,
} from "@thrift/db";
import { sendEmail } from "../notifications/email";
import { sendSms } from "../notifications/sms";
import { renderBrandedEmail } from "../notifications/email-template";

export const OTP_TTL_MS = 10 * 60 * 1000;

export function generateOtp(length = 6): string {
  return crypto.randomInt(0, 10 ** length).toString().padStart(length, "0");
}

interface IssueOtpArgs {
  userId: string;
  type: VerificationType;
  channel: VerificationChannel;
  destination: string;
  title: string;
  actionLabel: string;
  ttlMs?: number;
}

export async function issueOtp(args: IssueOtpArgs): Promise<string> {
  const code = generateOtp();
  const expiresAt = new Date(Date.now() + (args.ttlMs ?? OTP_TTL_MS));

  await deleteVerificationTokens(args.userId, args.type);
  await createVerificationToken({
    userId: args.userId,
    type: args.type,
    channel: args.channel,
    destination: args.destination,
    code,
    expiresAt,
  });

  const bodyHtml = `<p style="margin:0 0 18px;font-size:16px;line-height:1.6;color:#1A1A1A;">Use the verification code below to ${args.actionLabel}. This code expires in ${Math.round((args.ttlMs ?? OTP_TTL_MS) / 60000)} minutes.</p>
    <div style="display:inline-block;padding:14px 22px;border:1px dashed #B8860B;border-radius:12px;font-size:28px;letter-spacing:8px;font-weight:700;color:#2D5A3D;background:#EFEAE0;">${code}</div>`;

  try {
    if (args.channel === "email") {
      const rendered = renderBrandedEmail({ title: args.title, bodyHtml });
      await sendEmail({ to: args.destination, subject: args.title, htmlBody: rendered.html, textBody: rendered.text });
    } else {
      await sendSms(args.destination, `${args.title}. Your code is ${code}. It expires in ${Math.round((args.ttlMs ?? OTP_TTL_MS) / 60000)} minutes.`);
    }
  } catch (err) {
    console.error(`[otp] Failed to send ${args.channel} OTP to ${args.destination}:`, err);
    console.log(`[otp:dev] ${args.type} code for ${args.destination}: ${code}`);
  }

  return code;
}

export async function verifyOtp(userId: string, type: VerificationType, code: string): Promise<boolean> {
  const token = await findValidVerificationToken(userId, type, code);
  if (!token) return false;
  await consumeVerificationToken(token.id);
  return true;
}
