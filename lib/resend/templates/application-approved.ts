import { renderLayout, escapeHtml, plainTextFromHtml } from "./_layout";

export interface ApplicationApprovedVars {
  vendorName: string;
  location: string;
  date: string;
  waiverUrl: string;
  paymentInstructions?: string;
  portalUrl?: string;
}

export function applicationApprovedTemplate(v: ApplicationApprovedVars): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = "Welcome to Move Mountains Artisan Market!";
  const payment = v.paymentInstructions
    ? `<p><strong>Payment instructions:</strong> ${escapeHtml(v.paymentInstructions)}</p>`
    : `<p><strong>Payment:</strong> Pay via Zelle, Venmo, or CashApp to 512-612-8850 to reserve your booth.</p>`;
  const portal = v.portalUrl
    ? `<p>Track your status anytime in the <a href="${escapeHtml(v.portalUrl)}">Vendor Portal</a>.</p>`
    : "";

  const html = renderLayout({
    title: subject,
    preheader: "Application approved. Sign your waiver to lock in your booth.",
    bodyHtml: `
      <p>Hi ${escapeHtml(v.vendorName)},</p>
      <p>Great news. Your application for <strong>${escapeHtml(v.location)}</strong> on <strong>${escapeHtml(v.date)}</strong> has been approved.</p>
      <p>Two steps to confirm your booth:</p>
      <ol>
        <li>Sign the liability waiver</li>
        <li>Submit payment</li>
      </ol>
      <p style="margin:28px 0;">
        <a href="${escapeHtml(v.waiverUrl)}" style="background:#3F5B3F;color:#ffffff;padding:12px 22px;text-decoration:none;border-radius:4px;display:inline-block;">Sign Liability Waiver</a>
      </p>
      ${payment}
      ${portal}
      <p>Move Mountains Market</p>
    `,
  });
  return { subject, html, text: plainTextFromHtml(html) };
}
