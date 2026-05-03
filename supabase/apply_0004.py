"""Apply 0004_intake_gaps.sql via Supabase Management API.
Idempotent: each statement uses IF NOT EXISTS / DROP+CREATE policies.
Run: python apply_0004.py
"""
import os
import sys
import json
import urllib.request

PAT = os.environ.get("SUPABASE_PAT")
if not PAT:
    print("[error] SUPABASE_PAT environment variable required.")
    print("        See README or .env.example for how to set it.")
    sys.exit(2)
PROJECT_REF = "fjklsxpjcneysaoopqmi"
SQL_PATH = os.path.join(os.path.dirname(__file__), "migrations", "0004_intake_gaps.sql")
URL = f"https://api.supabase.com/v1/projects/{PROJECT_REF}/database/query"

def run_query(sql: str):
    body = json.dumps({"query": sql}).encode("utf-8")
    req = urllib.request.Request(
        URL,
        data=body,
        method="POST",
        headers={
            "Authorization": f"Bearer {PAT}",
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (compatible; mmm-migrator)",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            return resp.status, resp.read().decode("utf-8")
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8")

def main():
    with open(SQL_PATH, "r", encoding="utf-8") as f:
        sql = f.read()

    print(f"[apply] sending {len(sql)} chars to {URL}")
    status, body = run_query(sql)
    print(f"[apply] status={status}")
    print(f"[apply] body={body[:500]}")
    if status >= 300:
        sys.exit(1)

    # Verify
    print("\n[verify] counting rows in new tables")
    for stmt in [
        "select count(*) as n from volunteers",
        "select count(*) as n from employment_applications",
        "select column_name from information_schema.columns where table_schema='public' and table_name='musicians' and column_name in ('photo_url','instagram_url','facebook_url','display_on_website','is_active','active') order by column_name",
    ]:
        s, b = run_query(stmt)
        print(f"  -> {stmt}\n     status={s} body={b[:300]}")

if __name__ == "__main__":
    main()
