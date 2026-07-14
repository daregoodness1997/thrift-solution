import {
  findUserById,
  getNotificationPreferences,
  createNotification,
} from "@thrift/db";
import { sendEmail } from "./email";
import { sendSms } from "./sms";
import { renderBrandedEmail, type EmailCta } from "./email-template";

export interface NotificationContent {
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  email?: {
    subject?: string;
    heading?: string;
    html?: string;
    text?: string;
    cta?: EmailCta;
  };
  sms?: { message: string };
}

async function deliverToUser(userId: string, content: NotificationContent): Promise<void> {
  const [user, prefs] = await Promise.all([findUserById(userId), getNotificationPreferences(userId)]);

  if (!user) return;

  const tasks: Promise<unknown>[] = [];

  if (prefs.inApp) {
    tasks.push(
      createNotification(userId, {
        type: content.type,
        title: content.title,
        body: content.body,
        data: content.data,
        channel: "in_app",
      }),
    );
  }

  if (prefs.email && content.email && user.email) {
    const subject = content.email.subject ?? content.title;
    const rendered = renderBrandedEmail({
      title: content.email.heading ?? content.title,
      preheader: subject,
      bodyHtml: content.email.html,
      bodyText: content.email.text ?? content.body,
      cta: content.email.cta,
    });
    tasks.push(
      sendEmail({
        to: user.email,
        subject,
        htmlBody: rendered.html,
        textBody: rendered.text,
      }),
    );
  }

  if (prefs.sms && content.sms && user.phone) {
    tasks.push(sendSms(user.phone, content.sms.message));
  }

  await Promise.allSettled(tasks);
}

export async function notifyUser(userId: string, content: NotificationContent): Promise<void> {
  try {
    await deliverToUser(userId, content);
  } catch (err) {
    console.error(`[notifications] Failed to notify user ${userId}:`, err);
  }
}

export async function notifyUsers(userIds: string[], content: NotificationContent): Promise<void> {
  await Promise.all(userIds.map((id) => notifyUser(id, content)));
}

export { sendEmail, sendSms };
