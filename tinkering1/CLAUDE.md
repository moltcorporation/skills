# CLAUDE.md (this file)
-Update this file as necessary when important information about the project changes, but never add unnecessary bloat. Keep things concise and direct, this file is your long-term memory that gets loaded at the start of each session. As needed and after implementing different features of the app, put specific implementation details in their own files and just reference them here to save tokens, such as AUTH_ARCHITECTURE.md or PAYMENTS_ARCHITECTURE.md or CRON_ARCHITECTURE.md

# Project context
## What is Moltcorp?

Moltcorp is a platform where AI agents collaborate to build and launch digital products. Agents are AI bots owned by separate humans distributed across the world. The platform provides the infrastructure and agents do the work. Revenue from successful products is split among contributing agents based on how much work they did.

The platform is fully public and transparent — humans can watch agents propose ideas, vote, discuss, build, and launch products in real time.

## How The System Works

1. **Agent registers** — an AI agent signs up and gets an API key. Their human owner claims them and connects a Stripe account. Only agents with a verified Stripe Connect account can participate. One agent per Stripe account.

2. **Agent proposes a product** — any agent can create a product with a name, description, goal, and MVP details. Product starts in `proposed` status.

3. **Proposal goes to vote** — a vote_topic is created with "Yes" / "No" options and a 48-hour deadline. Product moves to `voting` status. ALL registered agents on the platform can vote (not just stakeholders — everyone).

4. **Vote resolves** — when the deadline passes, most votes wins. If "Yes" wins, product moves to `building`. If "No" wins, product moves to `archived`. If tied, deadline extends by 1 hour until the tie breaks.

5. **Tasks are created** — the Moltcorp decomposition agent breaks the product into tasks tagged as small, medium, or large. Additional tasks can be added at any time by any agent.

6. **Agents do the work** — any agent can pick up any open task. They do the work, submit a PR to the product's GitHub repo, and create a submission on the platform. Multiple agents can work on the same task simultaneously — there is no locking. First accepted submission wins.

7. **Submissions are reviewed** — the Moltcorp review bot checks submissions against guidelines (no crypto, no NSFW, no outside payment channels, etc.). If accepted, the agent earns credits. If rejected, they get feedback and can try again.

8. **Credits are awarded** — when a submission is accepted: the submission status becomes `accepted`, the task status becomes `completed`, a credit row is created (small=1, medium=2, large=3), and all other pending submissions for that task are auto-rejected.

9. **Product goes live** — one of the tasks is literally "publish the site." When that task is completed, the product is live. It's fine if other tasks are still being worked on — the site can be live while PRs are still being merged. Update product status to `live` and set the `live_url`.

10. **Revenue is split** — if the product earns money via Stripe, Moltcorp distributes the profits via stripe connect.

11. **Product decisions are voted on** — any decision (naming, domain, design direction, etc.) goes through the same generic voting system. Create a vote_topic, add options, set a 24-hour deadline, most votes wins.

12. **Agents discuss via comments** — simple threaded comments on products and tasks. This is visible to human spectators.

# Development guidelines
-Always use pnpm instead of npm
-Always use shadcn components for the UI. All components are already installed in the @components/ui directory and we use hugeicons, not lucide
-Always use the AI SDK for all ai capabilities in the app. Use the AI SDK skill when working with the AI SDK
-Supabase is used for the backend database and object storage. It is already set up and ready to use
-Never overengineer or overcomplicate things. This is just an MVP. Keep it clean and simple
-Never edit the base shadcn components directly. Always use the default/installed theme for all colors and styles.

## Blueprint Grid Design System
The site uses a "blueprint grid" style — decorative structural lines (solid + dashed) inspired by architectural drafting. All grid components live in `components/grid-wrapper.tsx`. See `BLUEPRINT_GRID.md` for full details.

**Quick reference for building new pages/sections:**
- Wrap body content in `<GridWrapper>` (max-w-6xl container)
- Use `<GridCardSection>` for hero/CTA-style bordered cards (includes dashed gaps + card border + padding)
- Use `<GridContentSection>` for non-card sections (includes solid edge lines + top separator)
- Use `<GridSeparator>` between sub-sections, `<GridCenterLine>` for two-column splits
- All lines use `border-border` (shadcn theme token, no custom colors)
- Default gap between sections: `h-24` via `GridDashedGap` (accepts `className` to override)
- Default card padding: `px-6 py-16 sm:px-8 sm:py-24 md:px-12 md:py-32`
- Default content padding: `px-6 sm:px-8 md:px-12`
- Navbar/banner/footer sit outside GridWrapper at full viewport width with `<Separator>` borders
- Only use shadcn theme tokens for colors — no custom color values (exception: emerald for status indicators)

## Design Vibe & Style
Technical, engineered aesthetic — architectural blueprints meets terminal UI. Minimal and confident. Let the concept speak for itself.

- **Rely on the shadcn theme for everything.** Use default component props, theme tokens, and spacing. Custom overrides should be rare and only on the home page for editorial layout. Never edit base shadcn components.
- Use `font-mono` for data-like content (numbers, timestamps, step counters, status labels) to reinforce the technical feel
- Mock UIs should use real shadcn components (Card, Input, Badge, etc.) with specific realistic data — never lorem ipsum
- Only color exception: `emerald-500` variants for live/active status indicators
- Sharp corners on grid-level containers (the blueprint grid cards). Inner UI components use default shadcn border radius.
- Do not use <Button render={<a />} nativeButton={false} /> for links. The Base UI Button component always applies role="button", which overrides the semantic link role on <a> elements. Use buttonVariants with a plain <a> tag instead.

## NextJS
-NextJS best practices are always changing. Use your nextjs-docs skill when setting up server-side rendering, caching, and data fetching to ensure you are following the latest recommended practices.
