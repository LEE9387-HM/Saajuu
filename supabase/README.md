# Supabase

Project ref: `eizojtispxmlwvhgpmgs`

This folder contains the reviewed migrations and Edge Functions for the Saajuu monetization backend. The migrations through v0.5.10.0 have been applied to the linked Supabase project.

## Current scope

- Authentication profile tables and consent logs
- Birth profile storage for logged-in users
- Relationship invite/link tables and the `accept-relationship-invite` Edge Function
- Trial consultation session creation with the `create-consultation-session` Edge Function
- Persona and product catalogs
- Orders, entitlements, consultation sessions, messages, summaries, safety events, ad rewards, and analytics events
- Initial RLS policies and least-privilege grants

## Local workflow

```bash
npx --yes supabase link --project-ref eizojtispxmlwvhgpmgs
npx --yes supabase migration list
npx --yes supabase db push --dry-run
npx --yes supabase db push
npx --yes supabase db advisors --linked --type all --level warn --fail-on none
npx --yes supabase functions deploy accept-relationship-invite --use-api
npx --yes supabase functions deploy create-consultation-session --use-api
```

Run remote schema changes only after privacy policy text, consent copy, and Edge Function boundaries are reviewed.

## Security rules

- Keep `SUPABASE_SERVICE_ROLE_KEY` server-only.
- Use `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` only for browser code.
- Do not store raw consultation messages, names, birth dates, or concerns in analytics events.
- Orders, entitlements, and paid consultation writes must be performed by server code after payment or entitlement checks.
