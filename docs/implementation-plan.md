# SSU Australia marketplace implementation plan

## Current audit — 15 August 2026

- The current project is a static HTML/CSS/JavaScript public site deployed through Cloudflare Pages.
- There is no application framework, package manager configuration, database, authentication, server-side API, payment integration or build pipeline.
- The public application form currently creates a pre-filled email. It is not a persisted application workflow and will be replaced in Phase 2.
- `dashboard.js` contains old mock kitchens, ratings, orders and reviews. It is not connected to the public site and must not be used as production data.
- The public SSU visual identity, News pages, legal pages and SEO files are retained as the design/content base for the application.

## Agreed V1 payment model

- Each approved kitchen is the merchant of record for the food it sells.
- SSU Australia is the marketplace/platform.
- One kitchen per order.
- Stripe Connect direct charges on the connected kitchen account.
- SSU takes an application fee equal to the admin-configurable platform percentage of food sales. Default: 10%.
- Pickup and pilot delivery are free. Delivery is not part of the application-fee calculation.
- Stripe test mode is used until production credentials are intentionally configured.

## Target architecture

- **Frontend:** React + TypeScript + Vite, preserving the existing SSU public design and static URLs where practical.
- **Hosting:** Cloudflare Pages for the web application.
- **Application data, authentication and files:** Supabase PostgreSQL, Auth and Storage.
- **Sensitive server operations:** Supabase Edge Functions for payment, webhook, notification and privileged workflow operations. Browser code never receives Stripe secret keys or Supabase service-role keys.
- **Payments:** Stripe Connect direct charges and hosted/embedded connected-account onboarding.
- **Email:** Transactional email provider selected and configured before production launch.

## Delivery order

### Phase 1 — foundation

1. Create the React/TypeScript application without removing the working public site until parity is reached.
2. Add environment configuration and documented local development setup.
3. Create the Supabase schema, migrations, roles and Row Level Security policies.
4. Implement authentication, profile creation and protected app routing.
5. Establish the initial Admin account bootstrap process.

### Phase 2 — Founding Kitchen applications and onboarding

1. Replace the email application flow with a persistent application record and secure photo upload.
2. Add application review, status history and admin actions.
3. Add founder onboarding and admin-configurable compliance requirements.
4. Keep compliance documents in private storage and access them only through authorised roles.

### Phase 3 — kitchens, menus and scheduling

1. Create kitchen profile, status, Founding Kitchen number and public visibility rules.
2. Create menu, availability, stock and allergen models.
3. Enforce exactly one active SSU Signature Meal using the admin-configurable global price.
4. Create schedule, pickup and pilot delivery settings.

### Phase 4 — customer marketplace and checkout

1. Public discovery and kitchen pages only show LIVE kitchens.
2. Create customer accounts, favourites, addresses and one-kitchen cart.
3. Add server-side stock, delivery-zone and ordering-window validation.
4. Create Stripe Connect direct-charge checkout in test mode.

### Phase 5 — operations

1. Add kitchen order management, customer order tracking and status history.
2. Add admin order/refund/delivery controls.
3. Add mobile-first driver assignment and delivery workflow.
4. Add email and in-app notifications.

### Phase 6 — launch hardening

1. Add reviews, audit history, operational analytics and error logging.
2. Test role isolation, payment webhooks, overselling, refunds and mobile flows.
3. Complete production checklist, operational runbook and credential setup.

## First real end-to-end milestone

Kitchen #001 applies, is approved, completes compliance and Stripe onboarding, publishes a $17 SSU Signature Meal, accepts a test order, receives a direct Stripe charge less the SSU application fee, and completes a free local delivery.

## Explicitly not in V1

- Multi-kitchen cart
- Third-party courier APIs
- Paid delivery fees
- Automatically generated logos
- Seed or fake public kitchens, orders, reviews or sales
