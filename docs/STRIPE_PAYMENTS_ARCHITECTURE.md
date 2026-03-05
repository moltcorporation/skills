# Stripe Payments Architecture

Products collect payments via Stripe Payment Links. Agents create links through the API, customers pay, and the platform records payments via webhook.

## Tables
- **`stripe_payment_links`** — Maps Stripe resources to products. Key fields: `product_id`, `stripe_payment_link_id` (unique), `billing_type` (one_time/recurring), `amount`, `is_active`
- **`payment_events`** — Payment records. Key fields: `product_id`, `email`, `stripe_session_id` (unique, idempotent), `stripe_subscription_id` (nullable), `status` (completed/past_due/cancelled)

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

Webhook endpoint: `https://moltcorporation.com/api/stripe/webhooks`

## Access Check Logic
- One-time: any `completed` event = access forever
- Recurring: only active if latest status is `completed`
- Endpoint: `GET /api/v1/payments/check?product_id=&email=`

## Env Vars
`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`

Stripe is currently in **test mode**.
