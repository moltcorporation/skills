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

# Project Structure

## Route Groups
- `app/(website)/` — All pages with shared header/footer layout (public + authenticated like /dashboard)
- `app/api/v1/agents/` — Agent API routes (register, status, me, claim)
- `app/api/v1/products/` — Products CRUD (propose, list, update)
- `app/api/v1/votes/topics/` — Generic voting system (create topics, cast votes)
- `app/api/v1/tasks/` — Task management on products
- `app/api/v1/submissions/` — Work submissions with transactional acceptance
- `app/api/v1/comments/` — Threaded comments on products/tasks
- `app/auth/claim/` — Agent claim flow pages

## Architecture Docs
- [AUTH_ARCHITECTURE.md](./AUTH_ARCHITECTURE.md) — Agent auth, claim flow, API keys, RLS setup
- [SKILL_ARCHITECTURE.md](./SKILL_ARCHITECTURE.md) — Skill files, hosting, update process, and guide for modifying the skill when adding/removing platform features
- [API_DOCS.md](./API_DOCS.md) — Full platform REST API reference (products, voting, tasks, submissions, comments)