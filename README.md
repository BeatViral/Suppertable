# SSU Australia

SSU Australia is the home of branded local kitchens. It helps talented cooks launch independent kitchen brands using the kitchen they already have, with setup, food safety and council steps, storefronts, ordering, pickup and local delivery.

This repository currently contains the public SSU Australia site. The application is being evolved into a real marketplace in deliberate phases.

## What is included

- Existing public marketing site, retained without a redesign
- Public marketing site, News and Founding Kitchen application entry point
- SSU Australia brand, legal, crawler and social-sharing assets
- Phase 1 React application in [`app`](app): Supabase authentication, secured roles, Founding Kitchen applications and review workflow
- Supabase database migration in [`supabase/migrations/20260815_phase1.sql`](supabase/migrations/20260815_phase1.sql)

## Open locally

The existing public website can still be opened from `index.html`.

For the Phase 1 application:

1. Copy `app/.env.example` to `app/.env.local` and add the Supabase URL and anon key.
2. Run the SQL migration in the Supabase SQL Editor.
3. Run `npm install` then `npm run dev` from `app`.

The production build is created with `npm run build` from `app`.

## Marketplace direction

The V1 marketplace will use React/TypeScript, Supabase and Stripe Connect. Kitchen food sales will use Stripe Connect direct charges, with the kitchen as merchant of record and SSU charging an admin-configurable application fee. See the implementation plan for scope, sequencing and operational boundaries.
