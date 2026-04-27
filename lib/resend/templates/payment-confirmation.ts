import { renderLayout, escapeHtml, plainTextFromHtml } from "./_layout";

export interface PaymentConfirmationVars {
  vendorName: string;
  location: string;
  date: string;
  amount: string;
  setupTime?: string;
  whatToBring?: string;
}

export function paymentConfirmationTemplate(v: PaymentConfirmationVars): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `Payment Confirmed for ${v.location} on ${v.date}`;
  const setup = v.setupTime
    ? `<p><strong>Setup time:</strong> ${escapeHtml(v.setupTime)}</p>`
    : "";
  const bring = v.whatToBring
    ? `<p><strong>What to bring:</strong> ${escapeHtml(v.whatToBring)}</p>`
    : "";

  const html = renderLayout({
    title: subject,
    preheader: "Your booth is reserved.",
    bodyHtml: `
      <p>Hi ${escapeHtml(v.vendorName)},</p>
      <p>Payment of <strong>${escapeHtml(v.amount)}</strong> received. Your booth at <strong>${escapeHtml(v.location)}</strong> on <strong>${escapeHtml(v.date)}</strong> is reserved.</p>
      ${setup}
      ${bring}
      <p>You will get the vendor map and your booth assignment closer to the event.</p>
      <p>Move Mountains Market</p>
    `,
  });
  return { subject, html, text: plainTextFromHtml(html) };
}
