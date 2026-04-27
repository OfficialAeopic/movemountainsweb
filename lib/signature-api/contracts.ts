import {
  isSignatureApiConfigured,
  signatureApiRequest,
} from "./client";
import {
  getTemplateIdForLocation,
  normalizeLocationSlug,
  type LocationSlug,
} from "./templates";

export interface CreateContractInput {
  location: LocationSlug | string;
  signerName: string;
  signerEmail: string;
  title?: string;
  webhookUrl?: string;
  // Optional metadata to attach to the envelope.
  metadata?: Record<string, string>;
}

export interface ContractEnvelope {
  envelopeId: string;
  status: string;
  signUrl: string | null;
  templateId: string;
  stub: boolean;
}

export interface ContractStatus {
  envelopeId: string;
  status: string;
  signedDocumentUrl: string | null;
  completedAt: string | null;
  stub: boolean;
}

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://movemountainsmarket.com";

const DEFAULT_WEBHOOK = `${APP_URL.replace(/\/$/, "")}/api/webhooks/signatureapi`;

/**
 * Create a contract envelope. Stubs to a fake envelope when env is missing.
 */
export async function createContract(
  input: CreateContractInput
): Promise<ContractEnvelope> {
  const loc = normalizeLocationSlug(String(input.location));
  if (!loc) {
    throw new Error(`Unknown location for SignatureAPI template: ${input.location}`);
  }
  const templateId = getTemplateIdForLocation(loc);
  const title = input.title ?? "Move Mountains Artisan Market - Liability Waiver";
  const webhookUrl = input.webhookUrl ?? DEFAULT_WEBHOOK;

  if (!isSignatureApiConfigured()) {
    return {
      envelopeId: `stub_${Date.now()}_${loc}`,
      status: "stub",
      signUrl: null,
      templateId,
      stub: true,
    };
  }

  const res = await signatureApiRequest<{
    id?: string;
    envelope_id?: string;
    status?: string;
    sign_url?: string;
    signers?: Array<{ sign_url?: string }>;
  }>("/envelopes", {
    method: "POST",
    body: {
      title,
      documents: [{ template_id: templateId }],
      signers: [
        {
          name: input.signerName,
          email: input.signerEmail,
          places: [
            { label: "signature", page: 4, x: 100, y: 600 },
            { label: "date", page: 4, x: 400, y: 600 },
          ],
        },
      ],
      webhook_url: webhookUrl,
      metadata: input.metadata,
    },
  });

  if (!res.ok || !res.data) {
    throw new Error(
      `SignatureAPI createContract failed: ${res.errorMessage ?? "unknown error"}`
    );
  }

  const envelopeId = res.data.id ?? res.data.envelope_id ?? "";
  const signUrl =
    res.data.sign_url ??
    res.data.signers?.[0]?.sign_url ??
    null;

  return {
    envelopeId,
    status: res.data.status ?? "sent",
    signUrl,
    templateId,
    stub: false,
  };
}

/**
 * Convenience wrapper. createContract already initiates sending. This is here
 * for callers who want a clearer two-step API.
 */
export async function sendForSignature(
  input: CreateContractInput
): Promise<ContractEnvelope> {
  return createContract(input);
}

export async function getStatus(envelopeId: string): Promise<ContractStatus> {
  if (!isSignatureApiConfigured()) {
    return {
      envelopeId,
      status: "stub",
      signedDocumentUrl: null,
      completedAt: null,
      stub: true,
    };
  }

  const res = await signatureApiRequest<{
    status?: string;
    document_url?: string;
    signed_document_url?: string;
    completed_at?: string;
  }>(`/envelopes/${encodeURIComponent(envelopeId)}`);

  if (!res.ok || !res.data) {
    throw new Error(
      `SignatureAPI getStatus failed: ${res.errorMessage ?? "unknown error"}`
    );
  }

  return {
    envelopeId,
    status: res.data.status ?? "unknown",
    signedDocumentUrl:
      res.data.signed_document_url ?? res.data.document_url ?? null,
    completedAt: res.data.completed_at ?? null,
    stub: false,
  };
}

/**
 * Download the signed PDF as a Buffer. Used by the webhook handler so the
 * file can be uploaded to Supabase Storage.
 */
export async function downloadSignedDocument(
  envelopeId: string
): Promise<{ buffer: Buffer | null; contentType: string; stub: boolean }> {
  if (!isSignatureApiConfigured()) {
    return { buffer: null, contentType: "application/pdf", stub: true };
  }
  const status = await getStatus(envelopeId);
  if (!status.signedDocumentUrl) {
    return { buffer: null, contentType: "application/pdf", stub: false };
  }

  const res = await fetch(status.signedDocumentUrl, {
    headers: {
      Authorization: `Bearer ${process.env.SIGNATURE_API_KEY}`,
    },
  });
  if (!res.ok) {
    throw new Error(`Failed to download signed PDF: HTTP ${res.status}`);
  }
  const arrayBuf = await res.arrayBuffer();
  const contentType = res.headers.get("content-type") ?? "application/pdf";
  return { buffer: Buffer.from(arrayBuf), contentType, stub: false };
}
