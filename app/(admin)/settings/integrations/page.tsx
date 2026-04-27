// PROMPT 19 - Settings: Integrations status.
// Server-only check that each required env var is present. No values are leaked to the client.
// Renders a green/red indicator and a "Set in .env.local" hint when missing.

interface IntegrationCheck {
  group: string;
  vars: Array<{ key: string; required: boolean; hint?: string }>;
}

const CHECKS: IntegrationCheck[] = [
  {
    group: "Supabase",
    vars: [
      { key: "NEXT_PUBLIC_SUPABASE_URL", required: true },
      { key: "NEXT_PUBLIC_SUPABASE_ANON_KEY", required: true },
      {
        key: "SUPABASE_SERVICE_ROLE_KEY",
        required: true,
        hint: "Required for the user invite flow and any server actions that bypass RLS."
      }
    ]
  },
  {
    group: "Twilio",
    vars: [
      { key: "TWILIO_ACCOUNT_SID", required: true },
      { key: "TWILIO_AUTH_TOKEN", required: true },
      { key: "TWILIO_PHONE_NUMBER", required: true }
    ]
  },
  {
    group: "Resend",
    vars: [{ key: "RESEND_API_KEY", required: true }]
  },
  {
    group: "SignatureAPI",
    vars: [
      { key: "SIGNATURE_API_KEY", required: true },
      {
        key: "SIGNATURE_API_TEMPLATE_EASTON_PARK",
        required: false,
        hint: "Optional. Per-location waiver template id."
      },
      { key: "SIGNATURE_API_TEMPLATE_WHISPER_VALLEY", required: false },
      { key: "SIGNATURE_API_TEMPLATE_GOODNIGHT_RANCH", required: false },
      { key: "SIGNATURE_API_TEMPLATE_WOLF_RANCH", required: false }
    ]
  },
  {
    group: "App",
    vars: [
      {
        key: "NEXT_PUBLIC_APP_URL",
        required: true,
        hint: "Used as the base for invite redirects and webhook URLs."
      }
    ]
  }
];

export default function IntegrationsTab() {
  const checks = CHECKS.map((g) => ({
    group: g.group,
    vars: g.vars.map((v) => ({
      ...v,
      present: !!process.env[v.key]
    }))
  }));

  return (
    <div className="space-y-4">
      <section className="bg-card border rounded-lg p-6 space-y-3">
        <header>
          <h2 className="text-lg font-semibold">Integration status</h2>
          <p className="text-xs text-muted-foreground">
            Reads server environment only. Values are never displayed. Missing required keys block
            the relevant module.
          </p>
        </header>

        <div className="space-y-4">
          {checks.map((g) => {
            const requiredMissing = g.vars.filter((v) => v.required && !v.present);
            const status: "ok" | "missing" | "partial" =
              requiredMissing.length === 0 ? "ok" : "missing";
            return (
              <div key={g.group} className="border rounded-md overflow-hidden">
                <div
                  className={
                    "px-4 py-2 flex items-center justify-between border-b " +
                    (status === "ok" ? "bg-emerald-50" : "bg-rose-50")
                  }
                >
                  <div>
                    <p className="text-sm font-medium">{g.group}</p>
                    <p className="text-xs text-muted-foreground">
                      {status === "ok" ? "Configured" : `${requiredMissing.length} required key(s) missing`}
                    </p>
                  </div>
                  <span
                    className={
                      "inline-block h-3 w-3 rounded-full " +
                      (status === "ok" ? "bg-emerald-500" : "bg-rose-500")
                    }
                    aria-label={status}
                  />
                </div>
                <table className="w-full">
                  <thead className="bg-muted/20">
                    <tr>
                      <th className="text-left text-[11px] font-medium uppercase px-3 py-2">Key</th>
                      <th className="text-left text-[11px] font-medium uppercase px-3 py-2">Status</th>
                      <th className="text-left text-[11px] font-medium uppercase px-3 py-2">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {g.vars.map((v) => (
                      <tr key={v.key}>
                        <td className="px-3 py-2 text-xs font-mono">{v.key}</td>
                        <td className="px-3 py-2 text-xs">
                          {v.present ? (
                            <span className="inline-flex items-center gap-1 text-emerald-800">
                              <span className="h-2 w-2 rounded-full bg-emerald-500" />
                              configured
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-rose-800">
                              <span className="h-2 w-2 rounded-full bg-rose-500" />
                              {v.required ? "missing - set in .env.local" : "optional - not set"}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">{v.hint ?? ""}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-card border rounded-lg p-6 text-xs text-muted-foreground space-y-2">
        <p className="font-medium text-foreground">How to set keys</p>
        <p>
          Edit <code>.env.local</code> in the repo root and restart the dev server. Production values
          live in Vercel project settings under Environment Variables.
        </p>
      </section>
    </div>
  );
}
