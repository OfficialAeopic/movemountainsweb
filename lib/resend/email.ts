import {
  getResendClient,
  isResendConfigured,
  getDefaultFromAddress,
} from "./client";

export interface EmailAttachment {
  filename: string;
  // Either a base64 string or raw Buffer/Uint8Array.
  content: string | Buffer | Uint8Array;
  contentType?: string;
}

export interface SendEmailInput {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  attachments?: EmailAttachment[];
  // Optional tag for tracking (Resend supports tags).
  tags?: { name: string; value: string }[];
}

export interface SendEmailResult {
  success: boolean;
  id: string | null;
  errorMessage: string | null;
  stub: boolean;
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const from = input.from ?? getDefaultFromAddress();

  if (!isResendConfigured()) {
    console.warn(
      `[resend] stubbed sendEmail to=${Array.isArray(input.to) ? input.to.join(",") : input.to} subject=${input.subject}`
    );
    return { success: true, id: null, errorMessage: null, stub: true };
  }

  const client = getResendClient();
  if (!client) {
    return {
      success: false,
      id: null,
      errorMessage: "Resend client unavailable",
      stub: false,
    };
  }

  try {
    const payload: Parameters<typeof client.emails.send>[0] = {
      from,
      to: input.to,
      subject: input.subject,
      html: input.html,
    };
    if (input.text) (payload as unknown as Record<string, unknown>).text = input.text;
    if (input.replyTo) (payload as unknown as Record<string, unknown>).replyTo = input.replyTo;
    if (input.attachments && input.attachments.length > 0) {
      (payload as unknown as Record<string, unknown>).attachments = input.attachments.map((a) => ({
        filename: a.filename,
        content: a.content,
        contentType: a.contentType,
      }));
    }
    if (input.tags && input.tags.length > 0) {
      (payload as unknown as Record<string, unknown>).tags = input.tags;
    }

    const res = await client.emails.send(payload);

    if (res.error) {
      return {
        success: false,
        id: null,
        errorMessage: res.error.message ?? "send failed",
        stub: false,
      };
    }
    return {
      success: true,
      id: res.data?.id ?? null,
      errorMessage: null,
      stub: false,
    };
  } catch (err) {
    return {
      success: false,
      id: null,
      errorMessage: err instanceof Error ? err.message : String(err),
      stub: false,
    };
  }
}

export interface SendCampaignRecipient {
  email: string;
  // Optional per-recipient template substitutions; merged onto a base record.
  vars?: Record<string, string>;
}

export interface SendCampaignInput {
  recipients: SendCampaignRecipient[];
  subject: string;
  // HTML can either be a constant string or a function rendering per recipient.
  html: string | ((vars: Record<string, string>) => string);
  text?: string | ((vars: Record<string, string>) => string);
  from?: string;
  replyTo?: string;
  baseVars?: Record<string, string>;
  attachments?: EmailAttachment[];
}

export async function sendCampaign(input: SendCampaignInput): Promise<{
  sent: number;
  failed: number;
  results: SendEmailResult[];
}> {
  const results: SendEmailResult[] = [];
  let sent = 0;
  let failed = 0;

  for (const r of input.recipients) {
    const vars = { ...(input.baseVars ?? {}), ...(r.vars ?? {}) };
    const html =
      typeof input.html === "function" ? input.html(vars) : input.html;
    const text =
      typeof input.text === "function" ? input.text(vars) : input.text;

    const res = await sendEmail({
      to: r.email,
      subject: input.subject,
      html,
      text,
      from: input.from,
      replyTo: input.replyTo,
      attachments: input.attachments,
    });
    results.push(res);
    if (res.success) sent++;
    else failed++;
  }

  return { sent, failed, results };
}

export async function sendWithAttachment(
  input: Omit<SendEmailInput, "attachments"> & { attachments: EmailAttachment[] }
): Promise<SendEmailResult> {
  return sendEmail(input);
}
