import { sendEmail } from "../notifications/email";
import { renderBrandedEmail } from "../notifications/email-template";

const dashboardUrl = () => process.env.DASHBOARD_URL || "http://localhost:3001";

export async function sendWelcomeEmail(to: string, name: string): Promise<void> {
  const rendered = renderBrandedEmail({
    title: `Welcome to GFW, ${name}!`,
    preheader: "Your account is verified and ready",
    bodyText: `Hi ${name},\n\nThanks for joining GFW — community savings, collective prosperity. Your account is now verified and ready to use. Explore circles, savings groups, and more from your dashboard.`,
    cta: { label: "Go to dashboard", url: dashboardUrl() },
  });
  await sendEmail({ to, subject: "Welcome to GFW", htmlBody: rendered.html, textBody: rendered.text });
}

export async function sendPasswordResetEmail(
  to: string,
  name: string,
  code: string,
  link: string,
): Promise<void> {
  const bodyHtml = `<p style="margin:0 0 18px;font-size:16px;line-height:1.6;color:#1A1A1A;">Hi ${escapeHtml(name)},\n\nWe received a request to reset your password. Click the button below to choose a new password — it opens a form that's already filled in for you.</p>
    <p style="margin:0 0 18px;font-size:16px;line-height:1.6;color:#1A1A1A;">If the button doesn't work, you can instead enter this verification code manually:</p>
    <div style="display:inline-block;padding:14px 22px;border:1px dashed #B8860B;border-radius:12px;font-size:28px;letter-spacing:8px;font-weight:700;color:#2D5A3D;background:#EFEAE0;margin-bottom:18px;">${code}</div>
    <p style="margin:0;font-size:13px;line-height:1.6;color:#5A5A5A;">This link and code expire in 60 minutes. If you didn't request a password reset, you can safely ignore this email — your password will stay the same.</p>`;

  const rendered = renderBrandedEmail({
    title: "Reset your password",
    preheader: "We received a request to reset your password",
    bodyHtml,
    cta: { label: "Reset password", url: link },
  });
  await sendEmail({ to, subject: "Reset your GFW password", htmlBody: rendered.html, textBody: rendered.text });
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
