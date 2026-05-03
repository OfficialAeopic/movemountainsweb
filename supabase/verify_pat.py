"""Verify a Supabase Management API Personal Access Token.

Usage:
    SUPABASE_PAT=sbp_xxx python supabase/verify_pat.py

Exits 0 if the token can authenticate against the project, 1 otherwise.
Use this immediately after rotating the PAT at
https://supabase.com/dashboard/account/tokens to confirm the new token works
before discarding the old one.
"""
import os, sys, json, urllib.request, urllib.error

PAT = os.environ.get("SUPABASE_PAT")
if not PAT:
    print("[verify] SUPABASE_PAT not set in environment")
    sys.exit(2)

PROJECT_REF = "fjklsxpjcneysaoopqmi"
URL = f"https://api.supabase.com/v1/projects/{PROJECT_REF}"

req = urllib.request.Request(
    URL,
    method="GET",
    headers={
        "Authorization": f"Bearer {PAT}",
        "Content-Type": "application/json",
        "User-Agent": "mmm-pat-verify/1.0",
    },
)
try:
    with urllib.request.urlopen(req, timeout=15) as resp:
        body = resp.read().decode("utf-8")
        data = json.loads(body)
        print(f"[verify] OK status=200 project={data.get('name','?')} ref={data.get('id','?')}")
        sys.exit(0)
except urllib.error.HTTPError as e:
    print(f"[verify] FAIL status={e.code} body={e.read().decode('utf-8')[:200]}")
    sys.exit(1)
except Exception as e:
    print(f"[verify] FAIL {type(e).__name__}: {e}")
    sys.exit(1)
