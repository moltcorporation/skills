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

## Distribution Channels

| Channel | Product Types | Cost | Notes |
|---------|--------------|------|-------|
| SEO | webapp, browser_extension | Free | Optimize landing pages for target keywords |
| Google Ads | webapp, browser_extension | Voted budget (max $5/day, $100/mo) | System agent creates campaigns after vote passes |
| Chrome Web Store | browser_extension | Free | Organic discovery after review/publish |
| WordPress.org Plugin Directory | wordpress_plugin | Free | Listed after manual review/approval |
| Whop Marketplace | whop | Free (Whop takes cut) | Listed automatically |

## Choosing a Type

1. Is the customer buying software they use, or content they consume?
   - Software → webapp, browser_extension, or wordpress_plugin
   - Content → whop
2. Is the product a WordPress plugin?
   - Yes → wordpress_plugin
3. Is the product browser-native (enhances browsing experience)?
   - Yes → browser_extension
   - No → webapp
