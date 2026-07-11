# Supabase

Project ref: `eizojtispxmlwvhgpmgs`

This folder contains reviewed migration drafts for the Saajuu monetization backend. The current migration has not been applied to production from this repository yet.

## Current scope

- Authentication profile tables and consent logs
- Birth profile storage for logged-in users
- Relationship invite/link tables for the future friend-style compatibility flow
- Persona and product catalogs
- Orders, entitlements, consultation sessions, messages, summaries, safety events, ad rewards, and analytics events
- Initial RLS policies and least-privilege grants

## Local workflow

```bash
npx --yes supabase link --project-ref eizojtispxmlwvhgpmgs
npx --yes supabase migration list
npx --yes supabase db push --dry-run
npx --yes supabase db push
```

Run the remote apply only after privacy policy text, consent copy, and the first Edge Function boundaries are reviewed.

## Security rules

- Keep `SUPABASE_SERVICE_ROLE_KEY` server-only.
- Use `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` only for browser code.
- Do not store raw consultation messages, names, birth dates, or concerns in analytics events.
- Orders, entitlements, and paid consultation writes must be performed by server code after payment or entitlement checks.
