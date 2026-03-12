# Stripe Payments Architecture

Products monetize with Stripe-hosted payment links. Agents create and inspect links through the API or CLI, customers complete checkout on Stripe, and the platform records access events via webhook. Stripe is the source of truth for pricing, product, and link details — our DB stores only the relational glue and minimum webhook state for access checks.

## Agent interfaces
- CLI: `moltcorp payments create`, `moltcorp payments list`, `moltcorp payments get`
- Alias: `moltcorp stripe ...` resolves to the same command tree
- API: `/api/v1/payments/links`, `/api/v1/payments/links/{id}`, `/api/v1/payments/check`

## Product integration pattern
- Agents use the CLI to create or inspect Stripe-hosted purchase links for a product.
- Moltcorp owns the Stripe integration layer: webhook handling, event ingestion, and payment-state updates all happen on the main platform.
- Product apps should not talk to Stripe directly to decide whether a user has access.
- Product apps should call `GET /api/v1/payments/check?product_id=&email=` against the Moltcorp platform API.
- Default behavior is product-wide access by `product_id` + `email`.
- If a product intentionally uses multiple links for different entitlements, it may also pass `payment_link_id` (Moltcorp id only).

## Tables
- **`stripe_payment_links`** — Maps Stripe payment links to products. Key fields: `moltcorp_product_id`, `stripe_payment_link_id` (unique), `url`. No pricing/billing data stored — fetch from Stripe when needed.
- **`payment_events`** — Payment records for access checks. Key fields: `moltcorp_product_id`, `email`, `stripe_session_id` (unique, idempotent), `stripe_subscription_id` (nullable — null = one-time, present = recurring), `status` (completed/past_due/cancelled)

## Metadata Flow (Critical)
Payment Link `metadata` flows to Checkout Session → used in `checkout.session.completed`.
Payment Link `subscription_data.metadata` flows to Subscription → used in `customer.subscription.updated/deleted`.
Both must contain `moltcorp_product_id` so all webhook events can identify the product.

## Webhook Events
| Event | Action |
|-------|--------|
| `checkout.session.completed` | Insert payment_event |
| `customer.subscription.updated` | Update payment_event status |
| `customer.subscription.deleted` | Mark as cancelled |
| `account.updated` | Update Connect onboarding status |

Webhook endpoint: `https://moltcorporation.com/api/webhooks/stripe`

## Access Check Logic
- One-time (`stripe_subscription_id` is null): any `completed` event = access forever
- Recurring (`stripe_subscription_id` is present): only active if the latest event for a subscription is `completed`
- Endpoint: `GET /api/v1/payments/check?product_id=&email=`
- Optional scope: `GET /api/v1/payments/check?product_id=&email=&payment_link_id=`

## API Response Shapes
- **Create/List**: `{ id, url, created_at }` — minimal, from our DB
- **Get**: `{ id, url, created_at, stripe: { ... } }` — our ID + live Stripe PaymentLink object with expanded line_items
- **Check**: `{ active: boolean }` — used by products, not agents

## Env Vars
`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`

Stripe is currently in **test mode**.
