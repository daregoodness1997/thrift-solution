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
  name: "Arosco",
  tagline: "Community savings, collective prosperity.",
  logo: "/logo.svg",
  contact: { email: "hello@arosco.app", website: "https://arosco.app" },
  colors: {
    primary: "#2D5A3D",
    secondary: "#1E3D2A",
    accent: "#B8860B",
    background: "#F8F6F0",
    surface: "#EFEAE0",
    text: "#1A1A1A",
    textMuted: "#5A5A5A",
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
  const logoUrl = absoluteUrl(brand.logo ?? "");

  const preheaderText = input.preheader ?? input.title;
  const bodyHtml = input.bodyHtml
    ? input.bodyHtml
    : `<p style="margin:0;font-size:16px;line-height:1.6;color:${textColor};">${escapeHtml(input.bodyText ?? "")}</p>`;

  const ctaHtml = input.cta
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 4px;">
         <tr>
           <td style="border-radius:10px;background:${primary};">
             <a href="${escapeAttr(input.cta.url)}" target="_blank" style="display:inline-block;padding:13px 26px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;font-family:inherit;border-radius:10px;">${escapeHtml(input.cta.label)}</a>
           </td>
         </tr>
       </table>`
    : "";

  const headerHtml = logoUrl
    ? `<img src="${escapeAttr(logoUrl)}" alt="${escapeHtml(name)}" height="40" style="height:40px;width:auto;display:block;" />`
    : `<div style="width:44px;height:44px;border-radius:12px;background:${primary};color:#ffffff;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:700;font-family:inherit;">${escapeHtml(name.charAt(0))}</div>`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(input.title)}</title>
</head>
<body style="margin:0;padding:0;background:${bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <span style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheaderText)}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${bg};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:100%;background:${surface};border-radius:16px;overflow:hidden;border:1px solid rgba(0,0,0,0.05);">
          <tr>
            <td style="padding:28px 32px 20px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td valign="middle">${headerHtml}</td>
                  <td valign="middle" style="padding-left:14px;font-size:18px;font-weight:700;color:${secondary};font-family:inherit;">${escapeHtml(name)}</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 8px;height:1px;background:linear-gradient(90deg, ${accent} 0%, ${accent} 100%);"></td>
          </tr>
          <tr>
            <td style="padding:24px 32px 8px;">
              <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;color:${secondary};font-family:inherit;font-weight:700;">${escapeHtml(input.title)}</h1>
              <div style="font-family:inherit;color:${textColor};">${bodyHtml}</div>
              ${ctaHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid rgba(0,0,0,0.08);padding-top:18px;">
                <tr>
                  <td style="font-size:13px;line-height:1.6;color:${muted};font-family:inherit;">
                    ${escapeHtml(tagline)}<br />
                    ${contactEmail ? `<a href="mailto:${escapeAttr(contactEmail)}" style="color:${primary};text-decoration:none;">${escapeHtml(contactEmail)}</a>` : ""}
                    ${website ? ` &middot; <a href="${escapeAttr(website)}" style="color:${primary};text-decoration:none;">${escapeHtml(website.replace(/^https?:\/\//, ""))}</a>` : ""}<br />
                    <span style="font-size:12px;">You're receiving this email because you have email notifications enabled for your ${escapeHtml(name)} account. Manage your preferences in your account settings.</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        <p style="margin:16px 0 0;font-size:12px;color:${muted};font-family:inherit;">&copy; ${new Date().getFullYear()} ${escapeHtml(name)}. All rights reserved.</p>
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
