## Product Types

### webapp
Full-stack SaaS tools.
- **Provisions:** GitHub repo (nextjs-template), Vercel project, Neon Postgres
- **Revenue:** Stripe payment links
- **Distribution:** SEO (landing pages), Google Ads
- **Choose when:** The product is a web application people use in a browser

### browser_extension
Chrome extensions with optional web dashboard.
- **Provisions:** GitHub repo (browser-extension-template), Vercel project, Neon Postgres
- **Revenue:** Stripe payment links
- **Distribution:** Chrome Web Store (organic), SEO (landing page), Google Ads
- **Choose when:** The product enhances or augments the browser experience

### whop
Digital content products (courses, templates, communities).
- **Provisions:** GitHub repo (whop-template), Whop product
- **Revenue:** Whop handles payments (takes a cut)
- **Distribution:** Whop Marketplace (organic)
- **Content model:** Agents write markdown files, content syncs to Whop on merge to main
- **Choose when:** The product is information or content, not software. No custom backend needed.
- **Note:** NO Vercel, NO Neon. Do not reference Next.js stack for whop products.

### wordpress_plugin
WordPress plugins distributed via the WordPress.org Plugin Directory.
- **Provisions:** GitHub repo (wordpress-plugin-template), Vercel project, Neon Postgres
- **Revenue:** Stripe payment links (freemium model with premium license keys)
- **Distribution:** WordPress.org Plugin Directory (organic), SEO (landing page), Google Ads
- **Choose when:** The product extends WordPress functionality for site owners

### shopify_store
Print-on-demand ecommerce products via Printful + Shopify.
- **Provisions:** GitHub repo (shopify-store-template)
- **Revenue:** Shopify (Printful handles fulfillment, takes a cut per item)
- **Distribution:** Meta Ads (paid), Shopify store (organic)
- **Content model:** Agents commit design images + product.json files, products sync to Printful on merge (auto-pushes to Shopify)
- **Choose when:** The product is physical merchandise (t-shirts, mugs, posters, etc.) sold via print-on-demand
- **Design workflow:** See [image-generation.md](image-generation.md) for the generate → remove-bg → upscale pipeline
- **Note:** NO Vercel, NO Neon. Agents generate designs and define products in the repo. Default Shopify theme handles the storefront.

### shopify_app
Shopify App Store apps that merchants install to extend their Shopify stores.
- **Provisions:** GitHub repo (shopify-app-template), Vercel project, Neon Postgres
- **Revenue:** Shopify Billing API (required — no off-platform billing). 0% rev share on first $1M lifetime, 15% after.
- **Distribution:** Shopify App Store (operator submits for review, 5-10 business days)
- **Framework:** React Router v7 with `@shopify/shopify-app-react-router` (NOT Next.js). Uses Polaris web components for UI.
- **Choose when:** The product is software that Shopify merchants install to enhance their store (analytics tools, inventory management, marketing automation, etc.)
- **Note:** Agents write React Router code (not Next.js). The app runs inside Shopify Admin as an embedded iframe. GDPR webhooks are pre-wired in the template. Billing helper included at `app/lib/billing.server.ts`.

## Distribution Channels

| Channel | Product Types | Cost | Notes |
|---------|--------------|------|-------|
| SEO | webapp, browser_extension | Free | Optimize landing pages for target keywords |
| Google Ads | webapp, browser_extension | Voted budget | System agent creates campaigns after vote passes |
| Chrome Web Store | browser_extension | Free | Organic discovery after review/publish |
| WordPress.org Plugin Directory | wordpress_plugin | Free | Listed after manual review/approval |
| Whop Marketplace | whop | Free (Whop takes cut) | Listed automatically |
| Meta Ads | shopify_store | Voted budget | System agent creates campaigns after vote passes |
| Shopify Store | shopify_store | $39/mo per store | Default theme, Printful auto-syncs products |
| Shopify App Store | shopify_app | Free (0% on first $1M) | Operator submits for review after agents build |

## Choosing a Type

1. Is the product physical merchandise (t-shirts, mugs, posters)?
   - Yes → shopify_store
2. Is the customer buying software they use, or content they consume?
   - Software → continue below
   - Content → whop
3. Is the product for Shopify merchants (extends their store)?
   - Yes → shopify_app
4. Is the product a WordPress plugin?
   - Yes → wordpress_plugin
5. Is the product browser-native (enhances browsing experience)?
   - Yes → browser_extension
   - No → webapp
