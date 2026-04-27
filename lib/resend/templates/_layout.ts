// Shared HTML scaffold for transactional emails.
// Inline styles only. No external CSS, no JS, no web fonts.

export interface LayoutOptions {
  title: string;
  preheader?: string;
  bodyHtml: string;
  footerNote?: string;
}

const BRAND = {
  primary: "#3F5B3F", // deep olive green, directional brand color
  accent: "#C46A3F", // warm terracotta
  cream: "#F7F1E6",
  text: "#1F1F1F",
  muted: "#6B6B6B",
};

export function renderLayout(opts: LayoutOptions): string {
  const preheader = opts.preheader ?? "";
  const footer =
    opts.footerNote ??
    "Move Mountains Artisan Market. Reply to this email if you have questions.";

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(opts.title)}</title>
</head>
<body style="margin:0;padding:0;background:${BRAND.cream};font-family:Georgia,serif;color:${BRAND.text};">
  <span style="display:none!important;visibility:hidden;opacity:0;height:0;width:0;overflow:hidden;">${escapeHtml(preheader)}</span>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${BRAND.cream};">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:6px;overflow:hidden;">
          <tr>
            <td style="background:${BRAND.primary};padding:20px 28px;color:#ffffff;font-size:18px;font-weight:600;letter-spacing:0.04em;">
              MOVE MOUNTAINS ARTISAN MARKET
            </td>
          </tr>
          <tr>
            <td style="padding:28px;font-size:16px;line-height:1.6;color:${BRAND.text};">
              ${opts.bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="background:${BRAND.cream};padding:18px 28px;font-size:12px;color:${BRAND.muted};border-top:1px solid #e6dfce;">
              ${escapeHtml(footer)}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function plainTextFromHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
