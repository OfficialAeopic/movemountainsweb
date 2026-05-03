"""Rotate the Supabase Management API PAT for Move Mountains.

Why manual: Supabase does not expose PAT create/revoke in their public Management API.
PATs must be created and invalidated at https://supabase.com/dashboard/account/tokens.

This script automates the safe parts:
  1. Verifies the new PAT works
  2. Writes it to .env.local in the right format
  3. Reminds you to revoke the old one in the dashboard

Usage:
  python supabase/rotate_pat.py NEW_PAT_HERE

After running, REVOKE the old token at the dashboard:
  https://supabase.com/dashboard/account/tokens
"""
import os, sys, json, urllib.request, urllib.error, pathlib

if len(sys.argv) < 2:
    print("Usage: python supabase/rotate_pat.py <new_pat>")
    sys.exit(2)

NEW_PAT = sys.argv[1].strip()
if not NEW_PAT.startswith("sbp_"):
    print(f"[error] expected token starting with sbp_, got {NEW_PAT[:8]}")
    sys.exit(2)

PROJECT_REF = "fjklsxpjcneysaoopqmi"
URL = f"https://api.supabase.com/v1/projects/{PROJECT_REF}"

# Step 1: verify new PAT
print("[1/3] Verifying new PAT against Management API...")
req = urllib.request.Request(URL, method="GET", headers={
    "Authorization": f"Bearer {NEW_PAT}",
    "Content-Type": "application/json",
    "User-Agent": "mmm-pat-rotate/1.0",
})
try:
    with urllib.request.urlopen(req, timeout=15) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        print(f"      OK project={data.get('name','?')}")
except urllib.error.HTTPError as e:
    print(f"      FAIL status={e.code}, aborting rotation")
    sys.exit(1)

# Step 2: write to .env.local
env_local_path = pathlib.Path(__file__).parent.parent / ".env.local"
print(f"[2/3] Updating {env_local_path.name}...")
existing = ""
if env_local_path.exists():
    existing = env_local_path.read_text(encoding="utf-8")

if "SUPABASE_PAT=" in existing:
    new_lines = []
    for line in existing.splitlines():
        if line.startswith("SUPABASE_PAT="):
            new_lines.append(f"SUPABASE_PAT={NEW_PAT}")
        else:
            new_lines.append(line)
    env_local_path.write_text("
".join(new_lines) + "
", encoding="utf-8")
    print("      Replaced existing SUPABASE_PAT line")
else:
    with env_local_path.open("a", encoding="utf-8") as f:
        if existing and not existing.endswith("
"):
            f.write("
")
        f.write(f"SUPABASE_PAT={NEW_PAT}
")
    print("      Appended SUPABASE_PAT line")

# Step 3: reminder to revoke
print()
print("[3/3] MANUAL STEP REMAINING")
print("      Go to https://supabase.com/dashboard/account/tokens")
print("      Revoke the OLD token (the one that started with sbp_bb03...eeaed5)")
print("      The new one is now wired and verified.")
print()
print("Done.")
