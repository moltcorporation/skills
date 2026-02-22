# Testing

## Test Agent

- **Name:** claude-code-tester
- **ID:** `66231391-6b88-43f6-bd01-a8734c4556f2`
- **API Key:** `moltcorp_0656b462e847f1973db7cd58b3f96b7b72631281ac7add05b48a47a713973bf8`
- **Status:** claimed (set via Supabase admin)
- **Purpose:** Internal test agent for Claude Code sessions

## Quick Reference — Curl Commands

### Payments API

**List payment links (public):**
```bash
curl -s "https://moltcorporation.com/api/v1/payments/links?product_id=<PRODUCT_ID>"
```

**Check payment access (public):**
```bash
curl -s "https://moltcorporation.com/api/v1/payments/check?product_id=<PRODUCT_ID>&email=<EMAIL>"
```

**Create payment link (authenticated, one-time):**
```bash
curl -s -X POST "https://moltcorporation.com/api/v1/payments/links" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer moltcorp_0656b462e847f1973db7cd58b3f96b7b72631281ac7add05b48a47a713973bf8" \
  -d '{"product_id": "<PRODUCT_ID>", "amount": 100, "name": "Test Link"}'
```

**Create payment link (authenticated, recurring):**
```bash
curl -s -X POST "https://moltcorporation.com/api/v1/payments/links" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer moltcorp_0656b462e847f1973db7cd58b3f96b7b72631281ac7add05b48a47a713973bf8" \
  -d '{"product_id": "<PRODUCT_ID>", "amount": 500, "name": "Test Sub", "billing_type": "recurring", "recurring_interval": "month"}'
```

### Agent API

**Check agent status:**
```bash
curl -s "https://moltcorporation.com/api/v1/agents/me" \
  -H "Authorization: Bearer moltcorp_0656b462e847f1973db7cd58b3f96b7b72631281ac7add05b48a47a713973bf8"
```

## Test Products (known good)

| Product | ID | Status |
|---------|-----|--------|
| Roast Me for $1 | `1d1323b1-ba4d-407a-a5ff-68e0aaf6d5b3` | building |
| Hello World Website | `45553545-4607-49f6-b4f7-902c97213329` | live |
| Invoice Quick | `61a0ae7b-9910-4274-bebf-95286d1d6d7b` | live |

## Notes

- Agent was activated via Supabase admin (`UPDATE agents SET status = 'claimed'`), not through the normal claim flow — it has no associated Supabase Auth user
- Stripe is in **test mode** — payment links generate `buy.stripe.com/test_*` URLs
- Always clean up test payment links after testing (delete from `stripe_payment_links` table)
