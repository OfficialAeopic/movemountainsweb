import { renderLayout, escapeHtml, plainTextFromHtml } from "./_layout";

export interface WelcomeVars {
  vendorName: string;
  portalUrl: string;
}

export function welcomeTemplate(v: WelcomeVars): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = "Welcome to Move Mountains Artisan Market";
  const html = renderLayout({
    title: subject,
    preheader: "Your vendor account is ready.",
    bodyHtml: `
      <p>Hi ${escapeHtml(v.vendorName)},</p>
      <p>Thank you for joining Move Mountains Artisan Market. Your vendor account has been created.</p>
      <p>Use the portal to track applications, sign waivers, submit payments, and view booth assignments.</p>
      <p style="margin:28px 0;">
        <a href="${escapeHtml(v.portalUrl)}" style="background:#3F5B3F;color:#ffffff;padding:12px 22px;text-decoration:none;border-radius:4px;display:inline-block;">Open Vendor Portal</a>
      </p>
      <p>The next market date is on the schedule. See you there.</p>
      <p>Move Mountains Market</p>
    `,
  });
  return { subject, html, text: plainTextFromHtml(html) };
}
