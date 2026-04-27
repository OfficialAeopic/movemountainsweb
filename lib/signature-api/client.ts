// SignatureAPI client. No official SDK is in package.json, so we use fetch.
// TODO: if the team adopts an official @signatureapi/node SDK, swap fetch for it.

const DEFAULT_BASE_URL = "https://api.signatureapi.com/v1";

export function getSignatureApiKey(): string | null {
  const key = process.env.SIGNATURE_API_KEY;
  if (!key) {
    console.warn(
      "[signature-api] SIGNATURE_API_KEY missing. E-signature features disabled, returning stubs."
    );
    return null;
  }
  return key;
}

export function getSignatureApiBaseUrl(): string {
  return process.env.SIGNATURE_API_BASE_URL ?? DEFAULT_BASE_URL;
}

export function isSignatureApiConfigured(): boolean {
  return Boolean(process.env.SIGNATURE_API_KEY);
}

export function getSignatureWebhookSecret(): string | null {
  return process.env.SIGNATURE_API_WEBHOOK_SECRET ?? null;
}

export interface SignatureApiRequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
}

export interface SignatureApiResponse<T> {
  ok: boolean;
  status: number;
  data: T | null;
  errorMessage: string | null;
}

export async function signatureApiRequest<T>(
  path: string,
  options: SignatureApiRequestOptions = {}
): Promise<SignatureApiResponse<T>> {
  const key = getSignatureApiKey();
  if (!key) {
    return {
      ok: false,
      status: 0,
      data: null,
      errorMessage: "SIGNATURE_API_KEY not configured",
    };
  }

  const url = `${getSignatureApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${key}`,
    Accept: "application/json",
    ...(options.headers ?? {}),
  };

  try {
    const res = await fetch(url, {
      method: options.method ?? "GET",
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    let parsed: unknown = null;
    const text = await res.text();
    if (text) {
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = text;
      }
    }

    if (!res.ok) {
      const errorMessage =
        (typeof parsed === "object" &&
          parsed &&
          "message" in parsed &&
          typeof (parsed as Record<string, unknown>).message === "string" &&
          ((parsed as Record<string, unknown>).message as string)) ||
        `HTTP ${res.status}`;
      return { ok: false, status: res.status, data: null, errorMessage };
    }

    return { ok: true, status: res.status, data: parsed as T, errorMessage: null };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      data: null,
      errorMessage: err instanceof Error ? err.message : String(err),
    };
  }
}
