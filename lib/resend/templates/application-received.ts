import { renderLayout, escapeHtml, plainTextFromHtml } from "./_layout";

export interface ApplicationReceivedVars {
  vendorName: string;
  location: string;
  date: string;
}

export function applicationReceivedTemplate(v: ApplicationReceivedVars): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `Application Received for ${v.location} on ${v.date}`;
  const html = renderLayout({
    title: subject,
    preheader: "Your application is being reviewed.",
    bodyHtml: `
      <p>Hi ${escapeHtml(v.vendorName)},</p>
      <p>Your vendor application for <strong>${escapeHtml(v.location)}</strong> on <strong>${escapeHtml(v.date)}</strong> has been received.</p>
      <p>Review typically takes one to three business days. You will get a separate email once a decision is made.</p>
      <p>If you need to update anything in the meantime, reply to this email.</p>
      <p>Move Mountains Market</p>
    `,
  });
  return { subject, html, text: plainTextFromHtml(html) };
}
