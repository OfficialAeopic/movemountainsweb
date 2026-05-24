import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const TO_EMAIL = 'movemountainsmarket@gmail.com';
const FROM_EMAIL = 'Move Mountains Website <noreply@movemountainsmarket.com>';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = req.body || {};
  if (body.honeypot || body.website) {
    return res.status(200).json({ success: true, skipped: true });
  }

  const email = String(body.email || '').trim();
  if (!email) {
    return res.status(400).json({ error: 'Email address is required.' });
  }
  if (!isEmail(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  const source = String(body.source || 'website-footer').trim();

  const rows = [
    ['Email', email],
    ['Source', source],
    ['Submitted', new Date().toISOString()]
  ];

  return sendFormEmail(res, {
    subject: `Newsletter signup: ${email}`,
    replyTo: email,
    heading: 'New Newsletter Signup',
    intro: 'Please add this address to the Move Mountains newsletter list.',
    rows
  });
}

async function sendFormEmail(res, { subject, replyTo, heading, intro, rows }) {
  if (!process.env.RESEND_API_KEY) {
    return res.status(500).json({ error: 'Email is not configured yet.' });
  }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: TO_EMAIL,
      reply_to: replyTo,
      subject,
      html: renderEmail(heading, intro, rows),
      text: renderText(heading, intro, rows)
    });
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('[forms/newsletter] Resend error:', error);
    return res.status(500).json({ error: 'Could not save your signup. Please try again later.' });
  }
}

function renderEmail(heading, intro, rows) {
  const tableRows = rows
    .filter(([, value]) => String(value || '').trim())
    .map(([label, value]) => `
      <tr>
        <td style="padding:8px 0;font-weight:700;color:#0E7C7B;width:180px;vertical-align:top;">${escapeHtml(label)}</td>
        <td style="padding:8px 0;color:#2C1810;white-space:pre-wrap;">${escapeHtml(value)}</td>
      </tr>
    `)
    .join('');

  return `
    <div style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto;border:1px solid #ddd4c4;border-radius:8px;overflow:hidden;">
      <div style="background:#0E7C7B;color:#fff;padding:24px 28px;">
        <h1 style="font-size:22px;line-height:1.2;margin:0 0 8px;">${escapeHtml(heading)}</h1>
        <p style="margin:0;color:#FAF3E0;">${escapeHtml(intro)}</p>
      </div>
      <div style="padding:24px 28px;background:#FEFCF8;">
        <table style="width:100%;border-collapse:collapse;">${tableRows}</table>
      </div>
    </div>
  `;
}

function renderText(heading, intro, rows) {
  return [
    heading,
    intro,
    '',
    ...rows
      .filter(([, value]) => String(value || '').trim())
      .map(([label, value]) => `${label}: ${value}`)
  ].join('\n');
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
