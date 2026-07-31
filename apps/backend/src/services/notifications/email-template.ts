export interface EmailCta {
  label: string;
  url: string;
}

export interface EmailTemplateInput {
  title: string;
  preheader?: string;
  bodyHtml?: string;
  bodyText?: string;
  cta?: EmailCta;
}

interface BrandTheme {
  name: string;
  tagline: string;
  logo?: string;
  contact: { email: string; website: string };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textMuted: string;
  };
}

const BRAND: BrandTheme = {
  name: "Global Freedom Worldwide",
  tagline: "Community savings, collective prosperity.",
  logo: "data:image/png;base64,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B6LUYVzd7qcTnupDtQ51/ZOIMFW+szP7ZFZzbgwS0jzx0E6es0/+mKu6hAiPC4q4mkgQF3mloc5P5QZZyqDqYAge/gGD1ljdttq0uDsFDUL+vqgeIqcMyg4S/dMiiMgccpEtr3wfw1lNyZujkHcwYFCraoIjKUMFVnde2QyLvXjQsKocdW4pA5/cGBHRQ0F7qA1yY4uB0qPURPBRdBQSI5tAIdRR/ZgYzQl7lIRgKAMUj5lAGdemyKavwEUgQ00JyNExaTNhAOdbInU915UmC1E/J6WxJ3jTPpDxo/zQGZlsxGhE6gbo+Mx4lMhCs9YmG4enjoyynnlA2748695X4WECT7/E1/YGa4D5IVZ49ag1OiNdtb46zKHdk1s2XXpNDFuv9DR3Ou1X2q+YfG51fOW4/WEQ5eLhU2u5neX0C9f7nZ3nYDdv2jFaz0N7d7g7+rbX9ZfuB4lT+eU8vt+/7X499tXt/dO9vPr76X3p35e+HT5X/7y8sv+3v/5aenZ2b+2V/3+Xl/9vX0D+5vzv9NX5//+Tn52/dv+3f/3P3/3//+2v7+3/6Pv9/eD/5z7+3/3r/9b/73/3/9H/3///+/v7/9/7/3/9f/73/9f//z/7/3/9v//z/9/3/9f/7//f/73/7/7X///+/7//3/7//7/7v///v/7///v/////f/7//n/3///v/7//r/3///7/9//v/7//3/7//v///7/7//n/7/7/3///P//7//f/7/7/3/7/73//7//3/7//f//f/7//v/7/7/3//7/73/3/9f/3//////7P/////wAAAP//AAD//w==",
  contact: { email: "hello@globalfreedomworldwide.com", website: "https://app.globalfreedomworldwide.com" },
  colors: {
    primary: "#1F6FEB",
    secondary: "#4F46E5",
    accent: "#22C55E",
    background: "#F9FAFB",
    surface: "#FFFFFF",
    text: "#0B1220",
    textMuted: "#64748B",
  },
};

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttr(input: string): string {
  return escapeHtml(input);
}

function absoluteUrl(pathOrUrl: string): string | null {
  if (!pathOrUrl) return null;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const base = BRAND.contact.website?.replace(/\/$/, "");
  if (pathOrUrl.startsWith("/") && base) return `${base}${pathOrUrl}`;
  return null;
}

export interface RenderedEmail {
  html: string;
  text: string;
}

export function renderBrandedEmail(input: EmailTemplateInput): RenderedEmail {
  const brand = BRAND;
  const primary = brand.colors.primary;
  const secondary = brand.colors.secondary;
  const accent = brand.colors.accent;
  const bg = brand.colors.background;
  const surface = brand.colors.surface;
  const textColor = brand.colors.text;
  const muted = brand.colors.textMuted;

  const name = brand.name;
  const tagline = brand.tagline;
  const contactEmail = brand.contact.email;
  const website = brand.contact.website;
  const logoUrl = brand.logo;

  const preheaderText = input.preheader ?? input.title;
  const bodyHtml = input.bodyHtml
    ? input.bodyHtml
    : `<p style="margin:0;font-size:16px;line-height:1.6;color:${textColor};font-family:'Inter',ui-sans-serif,system-ui,-apple-system,sans-serif;">${escapeHtml(input.bodyText ?? "")}</p>`;

  const ctaHtml = input.cta
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 4px;">
          <tr>
            <td style="border-radius:12px;background:${primary};">
              <a href="${escapeAttr(input.cta.url)}" target="_blank" style="display:inline-block;padding:12px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;font-family:'Inter',ui-sans-serif,system-ui,-apple-system,sans-serif;border-radius:12px;">${escapeHtml(input.cta.label)}</a>
            </td>
          </tr>
        </table>`
    : "";

  const headerHtml = logoUrl
    ? `<img src="${escapeAttr(logoUrl)}" alt="${escapeHtml(name)}" height="40" style="height:40px;width:auto;display:block;border-radius:8px;" />`
    : `<div style="width:44px;height:44px;border-radius:12px;background:${primary};color:#ffffff;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:700;font-family:'Inter',ui-sans-serif,system-ui,sans-serif;">${escapeHtml(name.charAt(0))}</div>`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(input.title)}</title>
</head>
<body style="margin:0;padding:0;background:${bg};font-family:'Inter',ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${textColor};">
  <span style="display:none;max-height:0;overflow:hidden;opacity:0;font-size:0;line-height:0;color:${bg};">${escapeHtml(preheaderText)}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${bg};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:100%;background:${surface};border-radius:16px;overflow:hidden;border:1px solid rgba(0,0,0,0.05);">
          <tr>
            <td style="padding:28px 32px 20px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td valign="middle">${headerHtml}</td>
                  <td valign="middle" style="padding-left:14px;font-size:18px;font-weight:700;color:${secondary};font-family:'Space Grotesk',ui-sans-serif,system-ui,sans-serif;">${escapeHtml(name)}</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 8px;height:1px;background:linear-gradient(90deg, ${primary} 0%, ${accent} 100%);"></td>
          </tr>
          <tr>
            <td style="padding:24px 32px 8px;">
              <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;color:${secondary};font-family:'Space Grotesk',ui-sans-serif,system-ui,sans-serif;font-weight:700;">${escapeHtml(input.title)}</h1>
              <div style="font-family:'Inter',ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${textColor};font-size:16px;line-height:1.6;">${bodyHtml}</div>
              ${ctaHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid rgba(0,0,0,0.08);padding-top:18px;">
                <tr>
                  <td style="font-size:13px;line-height:1.6;color:${muted};font-family:'Inter',ui-sans-serif,system-ui,-apple-system,sans-serif;">
                    <span style="display:block;font-weight:600;color:${secondary};margin-bottom:6px;">${escapeHtml(name)}</span>
                    <span style="display:block;">${escapeHtml(tagline)}</span><br />
                    ${contactEmail ? `<a href="mailto:${escapeAttr(contactEmail)}" style="color:${primary};text-decoration:none;">${escapeHtml(contactEmail)}</a>` : ""}
                    ${website ? ` &middot; <a href="${escapeAttr(website)}" style="color:${primary};text-decoration:none;">${escapeHtml(website.replace(/^https?:\/\//, ""))}</a>` : ""}<br />
                    <span style="font-size:12px;">You're receiving this email because you have email notifications enabled for your ${escapeHtml(name)} account. Manage your preferences in your account settings.</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        <p style="margin:16px 0 0;font-size:12px;color:${muted};font-family:'Inter',ui-sans-serif,system-ui,sans-serif;">&copy; ${new Date().getFullYear()} ${escapeHtml(name)}. All rights reserved.</p>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text =
    `${input.title}\n` +
    `${"-".repeat(input.title.length)}\n\n` +
    `${input.bodyText ?? (input.bodyHtml ? input.bodyHtml.replace(/<[^>]+>/g, "") : "")}\n\n` +
    (input.cta ? `${input.cta.label}: ${input.cta.url}\n\n` : "") +
    `${tagline}\n${contactEmail ?? ""}${website ? ` · ${website}` : ""}\n` +
    `You're receiving this email because you have email notifications enabled. Manage your preferences in your account settings.`;

  return { html, text };
}
