import { renderLayout, escapeHtml, plainTextFromHtml } from "./_layout";

export interface PostMarketSurveyVars {
  vendorName: string;
  location: string;
  surveyUrl: string;
  nextEvent?: string;
}

export function postMarketSurveyTemplate(v: PostMarketSurveyVars): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `How was ${v.location}? Quick Survey`;
  const next = v.nextEvent
    ? `<p>Next up: <strong>${escapeHtml(v.nextEvent)}</strong>. Reply if you want to be included.</p>`
    : "";

  const html = renderLayout({
    title: subject,
    preheader: "Share your feedback in two minutes.",
    bodyHtml: `
      <p>Hi ${escapeHtml(v.vendorName)},</p>
      <p>Thank you for being part of <strong>${escapeHtml(v.location)}</strong>.</p>
      <p>Your feedback helps shape the next event. Two minutes, six questions.</p>
      <p style="margin:28px 0;">
        <a href="${escapeHtml(v.surveyUrl)}" style="background:#3F5B3F;color:#ffffff;padding:12px 22px;text-decoration:none;border-radius:4px;display:inline-block;">Take the Survey</a>
      </p>
      ${next}
      <p>Move Mountains Market</p>
    `,
  });
  return { subject, html, text: plainTextFromHtml(html) };
}
