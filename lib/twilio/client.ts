import twilio, { Twilio } from "twilio";

// Server-only Twilio client. Lazily initialized so a missing env var does not
// crash the boot. Returns null if env is incomplete; callers must handle null.

let cached: Twilio | null | undefined;

export function getTwilioClient(): Twilio | null {
  if (cached !== undefined) return cached;

  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;

  if (!sid || !token) {
    console.warn(
      "[twilio] TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN missing. SMS features disabled, returning stubs."
    );
    cached = null;
    return cached;
  }

  cached = twilio(sid, token);
  return cached;
}

export function getTwilioPhoneNumber(): string | null {
  const num = process.env.TWILIO_PHONE_NUMBER;
  if (!num) {
    console.warn("[twilio] TWILIO_PHONE_NUMBER missing. From-number unavailable.");
    return null;
  }
  return num;
}

export function isTwilioConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_PHONE_NUMBER
  );
}
