// Test env helpers. Tests rely on stub-mode behavior of the integrations:
// no Twilio creds means sendSms returns a stub success without HTTP, no
// Resend key means sendEmail returns a stub success, no SignatureAPI key
// means createContract returns a stub envelope. This file removes any
// accidental real creds inherited from the host shell.

const STRIP_KEYS = [
  "TWILIO_ACCOUNT_SID",
  "TWILIO_AUTH_TOKEN",
  "TWILIO_PHONE_NUMBER",
  "RESEND_API_KEY",
  "RESEND_FROM_EMAIL",
  "SIGNATURE_API_KEY",
  "SIGNATURE_API_WEBHOOK_SECRET",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
];

export function isolateEnv(): void {
  for (const k of STRIP_KEYS) delete process.env[k];
}

export function setCronSecret(value: string = "test-secret"): void {
  process.env.CRON_SECRET = value;
}
