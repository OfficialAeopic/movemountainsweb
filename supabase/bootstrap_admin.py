"""Bootstrap an admin user for MMM CRM.

Creates a Supabase auth user with email+password (auto-confirmed), then inserts
a user_roles row with role=admin. Safe to re-run; idempotent on both operations.

Usage:
    python supabase/bootstrap_admin.py admin@aeopic.com YourTempPassword

Or quote the password if it has special characters:
    python supabase/bootstrap_admin.py admin@aeopic.com "Strong Pass 1!"
"""
import os, sys, json, urllib.request, urllib.error, urllib.parse

if len(sys.argv) < 3:
    print("Usage: python supabase/bootstrap_admin.py <email> <password>")
    sys.exit(2)

EMAIL = sys.argv[1].strip().lower()
PASSWORD = sys.argv[2]

env = {}
with open(os.path.join(os.path.dirname(__file__), "..", ".env.local")) as f:
    for line in f:
        line = line.strip()
        if "=" in line and not line.startswith("#"):
            k, v = line.split("=", 1)
            env[k.strip()] = v.strip()

SUPABASE_URL = env.get("NEXT_PUBLIC_SUPABASE_URL")
SERVICE_ROLE_KEY = env.get("SUPABASE_SERVICE_ROLE_KEY")
if not SUPABASE_URL or not SERVICE_ROLE_KEY:
    print("[error] NEXT_PUBLIC_SUPABASE_URL and SERVICE_ROLE_KEY required in .env.local")
    sys.exit(2)

base = SUPABASE_URL.rstrip("/")

def call(method, path, body=None):
    url = f"{base}{path}"
    data = json.dumps(body).encode("utf-8") if body is not None else None
    req = urllib.request.Request(url, data=data, method=method, headers={
        "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
        "apikey": SERVICE_ROLE_KEY,
        "Content-Type": "application/json",
        "Prefer": "return=representation,resolution=merge-duplicates",
    })
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            txt = r.read().decode("utf-8")
            return r.status, (json.loads(txt) if txt else None)
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8")[:400]

# 1. Find user by email. Supabase Auth admin /users supports per_page pagination but no
# direct email filter that all versions accept; the most-portable path is to list and search.
print(f"[1/3] Looking up {EMAIL} in auth (paginated)...")
existing_id = None
page = 1
while True:
    status, body = call("GET", f"/auth/v1/admin/users?page={page}&per_page=200")
    if status != 200 or not isinstance(body, dict):
        print(f"      list failed status={status} body={body}")
        sys.exit(1)
    users = body.get("users") or []
    for u in users:
        if (u.get("email") or "").lower() == EMAIL:
            existing_id = u["id"]
            break
    if existing_id or len(users) < 200:
        break
    page += 1
print(f"      found id={existing_id}" if existing_id else "      not found")

# 2. Create or update.
if not existing_id:
    print(f"[2/3] Creating auth user {EMAIL}...")
    status, body = call("POST", "/auth/v1/admin/users", {
        "email": EMAIL, "password": PASSWORD, "email_confirm": True,
    })
    if status not in (200, 201):
        print(f"      FAIL status={status} body={body}")
        sys.exit(1)
    existing_id = body["id"] if isinstance(body, dict) else None
    print(f"      created id={existing_id}")
else:
    print(f"[2/3] Resetting password on existing user {existing_id}...")
    status, body = call("PUT", f"/auth/v1/admin/users/{existing_id}", {"password": PASSWORD})
    if status not in (200, 201):
        print(f"      FAIL status={status} body={body}")
        sys.exit(1)
    print("      password reset")

# 3. Upsert user_roles row.
print("[3/3] Ensuring user_roles row with role=admin...")
status, body = call("POST", "/rest/v1/user_roles?on_conflict=user_id", {
    "user_id": existing_id, "role": "admin"
})
if status not in (200, 201):
    print(f"      FAIL status={status} body={body}")
    sys.exit(1)
print("      OK")
print()
print("Done. Sign in at:")
print("  https://movemountainsweb-crm.vercel.app/login")
print(f"  Email: {EMAIL}")
print("  Password: <the one you just typed>")
