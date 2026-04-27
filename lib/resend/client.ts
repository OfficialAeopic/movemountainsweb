import { Resend } from "resend";

let cached: Resend | null | undefined;

export function getResendClient(): Resend | null {
  if (cached !== undefined) return cached;

  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn(
      "[resend] RESEND_API_KEY missing. Email features disabled, returning stubs."
    );
    cached = null;
    return cached;
  }
  cached = new Resend(key);
  return cached;
}

export function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export function getDefaultFromAddress(): string {
  return (
    process.env.RESEND_FROM_ADDRESS ??
    "Move Mountains Market <noreply@movemountainsmarket.com>"
  );
}
