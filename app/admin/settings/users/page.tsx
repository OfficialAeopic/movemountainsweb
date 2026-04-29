// PROMPT 19 - Settings: Users tab.
// Admin/staff team management. Invite via Supabase auth admin API (service role required).
// Graceful degrade: when SUPABASE_SERVICE_ROLE_KEY is missing, the invite form renders
// disabled with a clear message and the page still renders the existing role list.

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { inviteUser, updateUserRole } from "../actions";

type Search = Promise<{ saved?: string; error?: string }>;

interface UserRow {
  user_id: string;
  email: string | null;
  role: "admin" | "staff" | "vendor" | null;
  last_sign_in_at: string | null;
  created_at: string | null;
}

export default async function UsersTab({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams;
  const supabase = await createClient();

  // The user_roles table is RLS-protected. Pull the role rows the current admin can see.
  const { data: roleRows } = await supabase
    .from("user_roles")
    .select("user_id, role, created_at")
    .order("created_at", { ascending: true });

  // Hydrate emails via the auth admin API when the service role key is present.
  // When it isn't, the role list still renders with a fallback "user_id" label.
  const serviceRoleAvailable = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  const users: UserRow[] = [];

  if (serviceRoleAvailable) {
    try {
      const admin = createAdminClient();
      const { data: page } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
      const byId = new Map((page?.users ?? []).map((u) => [u.id, u] as const));
      for (const r of roleRows ?? []) {
        const u = byId.get((r as any).user_id);
        users.push({
          user_id: (r as any).user_id,
          email: u?.email ?? null,
          role: (r as any).role,
          last_sign_in_at: u?.last_sign_in_at ?? null,
          created_at: (r as any).created_at
        });
      }
    } catch (err) {
      // If the admin call blows up (network, key invalid), fall through to id-only list.
      for (const r of roleRows ?? []) {
        users.push({
          user_id: (r as any).user_id,
          email: null,
          role: (r as any).role,
          last_sign_in_at: null,
          created_at: (r as any).created_at
        });
      }
    }
  } else {
    for (const r of roleRows ?? []) {
      users.push({
        user_id: (r as any).user_id,
        email: null,
        role: (r as any).role,
        last_sign_in_at: null,
        created_at: (r as any).created_at
      });
    }
  }

  return (
    <div className="space-y-4">
      {sp.saved ? <Banner tone="ok">Users updated.</Banner> : null}
      {sp.error ? <Banner tone="err">{decodeURIComponent(sp.error)}</Banner> : null}

      {!serviceRoleAvailable ? (
        <Banner tone="warn">
          SUPABASE_SERVICE_ROLE_KEY is not configured. User emails and the invite form are
          disabled. Set the key in <code>.env.local</code> to manage the team from this UI.
        </Banner>
      ) : null}

      <section className="bg-card border rounded-lg p-6 space-y-3">
        <header>
          <h2 className="text-lg font-semibold">Team</h2>
          <p className="text-xs text-muted-foreground">
            Roles drive RLS. Admin sees and writes everything. Staff has limited write. Vendor is
            scoped to the future portal.
          </p>
        </header>

        <div className="border rounded-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/30">
              <tr>
                <th className="text-left text-xs font-medium uppercase px-3 py-2">Email</th>
                <th className="text-left text-xs font-medium uppercase px-3 py-2">Role</th>
                <th className="text-left text-xs font-medium uppercase px-3 py-2">Last sign-in</th>
                <th />
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map((u) => (
                <tr key={u.user_id} className="hover:bg-muted/30 align-top">
                  <td className="px-3 py-2 text-sm">
                    {u.email ?? <span className="text-muted-foreground font-mono text-xs">{u.user_id.slice(0, 8)}...</span>}
                  </td>
                  <td className="px-3 py-2 text-sm">
                    <form action={updateUserRole} className="flex items-center gap-2">
                      <input type="hidden" name="user_id" value={u.user_id} />
                      <select
                        name="role"
                        defaultValue={u.role ?? "staff"}
                        className="text-sm border rounded-md px-2 py-1 bg-card"
                      >
                        <option value="admin">admin</option>
                        <option value="staff">staff</option>
                        <option value="vendor">vendor</option>
                      </select>
                      <button
                        type="submit"
                        className="text-xs px-2 py-1 rounded-md border bg-card hover:bg-accent"
                      >
                        Save
                      </button>
                    </form>
                  </td>
                  <td className="px-3 py-2 text-sm text-muted-foreground">
                    {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleString() : "-"}
                  </td>
                  <td />
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-xs text-muted-foreground">
                    No team members yet. Invite the first admin below.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="bg-card border rounded-lg p-6 space-y-3">
        <h3 className="font-semibold">Invite new user</h3>
        <p className="text-xs text-muted-foreground">
          Sends a Supabase auth invitation email. The user sets their password on first sign-in.
        </p>
        <form action={inviteUser} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium uppercase text-muted-foreground">Email</label>
            <input
              type="email"
              name="email"
              required
              disabled={!serviceRoleAvailable}
              placeholder="staff@movemountainsmarket.com"
              className="w-full text-sm border rounded-md px-2 py-1.5 mt-1 disabled:bg-muted/30"
            />
          </div>
          <div>
            <label className="block text-xs font-medium uppercase text-muted-foreground">Role</label>
            <select
              name="role"
              defaultValue="staff"
              disabled={!serviceRoleAvailable}
              className="w-full text-sm border rounded-md px-2 py-1.5 mt-1 bg-card disabled:bg-muted/30"
            >
              <option value="admin">admin</option>
              <option value="staff">staff</option>
            </select>
          </div>
          <div className="sm:col-span-3">
            <button
              type="submit"
              disabled={!serviceRoleAvailable}
              className="text-sm py-2 px-4 rounded-md bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send invite
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function Banner({ tone, children }: { tone: "ok" | "err" | "warn"; children: React.ReactNode }) {
  const cls =
    tone === "ok"
      ? "border-emerald-300 bg-emerald-50 text-emerald-900"
      : tone === "warn"
        ? "border-amber-300 bg-amber-50 text-amber-900"
        : "border-rose-300 bg-rose-50 text-rose-900";
  return <div className={"border rounded-md p-3 text-sm " + cls}>{children}</div>;
}
