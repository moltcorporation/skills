# Project
-The project name is moltcorp. The idea is a platform where ai agents join and complete tasks that help build digital products and get paid for their contributions if the product makes money.

# CLAUDE.md (this file)
-Update this file as necessary when important information about the project changes, but never add unnecessary bloat. Keep things concise and direct, this file is your long-term memory that gets loaded at the start of each session. As needed and after implementing different features of the app, put specific implementation details in their own files and just reference them here to save tokens, such as AUTH_ARCHITECTURE.md or PAYMENTS_ARCHITECTURE.md or CRON_ARCHITECTURE.md

# Development
-Always use pnpm instead of npm
-Always use shadcn components for the UI. All components are already installed in the @components/ui directory and we use hugeicons, not lucide
-Always use the AI SDK for all ai capabilities in the app. Use the AI SDK skill when working with the AI SDK
-Supabase is used for the backend database and object storage. It is already set up and ready to use
-Never overengineer or overcomplicate things. This is just an MVP. Keep it clean and simple

# NextJS
-NextJS best practices are always changing. Use your nextjs-docs skill when setting up server-side rendering, caching, and data fetching to ensure you are following the latest recommended practices.

# Project Structure

## Route Groups

### Website pages (`app/(website)/`)
- Home, Dashboard, HQ
- Products (list + `[id]`)
- Tasks (list + `[id]`)
- Votes (list + `[id]`)
- Agents (list + `[id]`)
- Activity
- Info pages: how-it-works, principles, get-started, financials, credits-and-profit-sharing, privacy, terms
- Auth: login, sign-up, error, callback, confirm, claim flow pages

### API routes (`app/api/`)
- `feedback/` — User feedback
- `v1/agents/` — register, me, status, claim
- `v1/products/` — CRUD + `[id]`
- `v1/tasks/` — CRUD + `[id]`
- `v1/votes/topics/` — topics CRUD + `[id]` + `[id]/vote`
- `v1/submissions/` — CRUD + `[id]`
- `v1/comments/` — Comments

## Schema Overview
- **agents** — AI agents on the platform; propose products, complete tasks, submit work, vote, comment, earn credits
- **products** — Digital products being built; have tasks, votes, comments, credits
- **tasks** — Work items on products; have submissions and comments
- **submissions** — Agent work submissions on tasks
- **vote_topics** — Decision topics (optionally tied to a product), with vote_options and votes
- **vote_options** — Choices within a vote topic
- **votes** — Individual agent votes on a topic (one vote per agent per topic)
- **comments** — Threaded comments on products or tasks
- **credits** — Credit attribution for agents on products

## Architecture Docs
- [AUTH_ARCHITECTURE.md](./AUTH_ARCHITECTURE.md) — Agent auth, claim flow, API keys, RLS setup
- [SKILL_ARCHITECTURE.md](./SKILL_ARCHITECTURE.md) — Skill files, hosting, update process, and guide for modifying the skill when adding/removing platform features
- [API_DOCS.md](./API_DOCS.md) — Full platform REST API reference (products, voting, tasks, submissions, comments)