# MMM CRM Build - Fork Run Status

Branch: feat/crm-build-v1
Fork date: 2026-04-24

## What this fork accomplished

This fork ran the planning and partial-scaffolding pass on the MMM CRM build.

Done:
- Read both spec docs (THERON_BUILD_INSTRUCTIONS.md 943 lines, MMM_CRM_BLUEPRINT_v1.md 1315 lines).
- Created the Next.js 15 directory structure: app/, components/, lib/supabase/, types/, supabase/migrations/, components/ui/, components/admin/.
- Confirmed branch state clean off origin/main, ready for build commits.

NOT done in this fork:
- Actual file content for the package.json, tsconfig.json, next.config.mjs, layout.tsx, schema migration SQL, RLS migration SQL, seed.sql, type definitions, admin sidebar/topbar/login form, dashboard page, Supabase client wrappers, middleware.

Why: the Write tool is not enabled for forks in this environment. Bash heredoc reliably fails on the multi-thousand-line content needed for the schema and supporting files. The parent agent (with Write tool) needs to do the actual file generation in the next session.

## Recommended hand-off to the next session (parent or fork with Write)

1. Check out branch feat/crm-build-v1 in this repo.
2. Generate, in this priority order, the files corresponding to Prompts 1-6 (DB foundation + auth + dashboard skeleton). Schema and RLS are the highest leverage; everything depends on them.
3. Commit at each prompt boundary with messages naming the prompt number.
4. Push to origin/feat/crm-build-v1. Do not merge to main; Sam handles main merges.

## Architectural decisions surfaced by reading the spec

1. Static /site/ directory MUST be preserved untouched. Migrating the static HTML site to Next.js routes is explicitly out of scope for this CRM build. The Next.js app coexists with /site/ at the repo root.
2. (public) route group is a stub during this build. The live website continues to serve from /site/*.html files.
3. Security headers should be baked in from prompt 1 via next.config.mjs. SO29 alignment.
4. user_roles table is the role mechanism (not Supabase custom claims). Helper functions is_admin(), is_staff_or_admin(), current_vendor_id() provide clean RLS expressions.
5. types/database.ts should be hand-rolled initially, replaced later via supabase gen types typescript --local.
6. .env.local must be gitignored. Only .env.example ships.

## TODOs that block runtime end-to-end (post-build setup)

1. Create the Supabase project (cloud or local), run migrations, seed.
2. Populate .env.local with real Supabase, Twilio, Resend, SignatureAPI keys.
3. Create the first admin user in Supabase Auth, then INSERT INTO user_roles for that uid.
4. Validate seed pricing with Amanda before showing to her. Wolf Ranch capacity NULL, Goodnight Ranch property/management entity NULL.
5. Connect Vercel project, set env vars in dashboard, deploy from feat/crm-build-v1 to a preview URL.

## Hours

Fork run: ~0.5 hours of planning work. Estimated 8 to 14 hours remaining for actual code generation across Prompts 1-21.

Verdict: BLOCKED on Write tool availability. Foundation scoped, structure ready, but no production code shipped this run.
