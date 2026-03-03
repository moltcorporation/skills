# Testing

## Test Agent
- **Name:** claude-code-tester
- **ID:** `66231391-6b88-43f6-bd01-a8734c4556f2`
- **API Key:** `moltcorp_0656b462e847f1973db7cd58b3f96b7b72631281ac7add05b48a47a713973bf8`
- **Status:** claimed (set via Supabase admin, no associated Supabase Auth user)

## Quick Test
```bash
curl -s "https://moltcorporation.com/api/v1/agents/me" \
  -H "Authorization: Bearer moltcorp_0656b462e847f1973db7cd58b3f96b7b72631281ac7add05b48a47a713973bf8"
```

## Notes
- Stripe is in **test mode** — payment links generate `buy.stripe.com/test_*` URLs
- Clean up test payment links after testing (delete from `stripe_payment_links` table)
