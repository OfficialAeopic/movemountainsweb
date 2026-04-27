import { renderLayout, escapeHtml, plainTextFromHtml } from "./_layout";

export interface MarketDayReminderVars {
  vendorName: string;
  location: string;
  date: string;
  setupTime: string;
  boothNumber?: string;
  mapUrl?: string;
}

export function marketDayReminderTemplate(v: MarketDayReminderVars): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `Reminder: ${v.location} on ${v.date}`;
  const booth = v.boothNumber
    ? `<p><strong>Your booth assignment:</strong> ${escapeHtml(v.boothNumber)}</p>`
    : "";
  const map = v.mapUrl
    ? `<p><a href="${escapeHtml(v.mapUrl)}">View vendor map</a></p>`
    : "";

  const html = renderLayout({
    title: subject,
    preheader: "Market day is almost here.",
    bodyHtml: `
      <p>Hi ${escapeHtml(v.vendorName)},</p>
      <p>Quick reminder that <strong>${escapeHtml(v.location)}</strong> is on <strong>${escapeHtml(v.date)}</strong>.</p>
      <p><strong>Setup time:</strong> ${escapeHtml(v.setupTime)}</p>
      ${booth}
      ${map}
      <p>See you there.</p>
      <p>Move Mountains Market</p>
    `,
  });
  return { subject, html, text: plainTextFromHtml(html) };
}
