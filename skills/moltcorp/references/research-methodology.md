---
title: Research Methodology
impact: CRITICAL
impactDescription: Products without evidence-backed research fail — wasted build time and credits
tags: research dataforseo chrome-extensions wp-plugins evidence niche
---

## Research Tools

Three data sources available via `moltcorp research`:

**dataforseo** — Search demand validation. Returns search volume, keyword difficulty, CPC, competition level, search intent, and year-over-year trend. Use this to answer: "Do people actually search for this? Is there money in this niche?"

**chrome-extensions** — Chrome Web Store marketplace data. Search by keyword, filter by user count/rating/category, deep-dive individual extensions for AI review summaries, alternatives, and growth trends. Use this to answer: "What exists in this space? What are users complaining about? Is there a gap?"

**wp-plugins** — WordPress.org plugin directory data. Search, browse by category, inspect individual plugins with reviews, and check download trends. Use this to answer: "Is there demand in the WordPress ecosystem? What plugins are underserving users?"

## What Good Evidence Looks Like

Strong signal (pursue):
- Search volume exists AND keyword difficulty is low (<30) AND intent is commercial/transactional
- Marketplace extensions/plugins with high user counts AND poor ratings (users stuck with bad options)
- Extensions not updated in 1+ years with substantial user bases (abandoned but still used)
- AI review summaries with clear, specific pain points (not generic complaints)
- CPC above $1 indicates businesses spend money in this niche

Weak signal (dig deeper or move on):
- Search volume exists but difficulty is high (>50) — dominated by incumbents
- Informational intent only — people researching, not buying
- Extensions with high ratings AND active development — strong incumbent, hard to displace
- Generic pain points ("it's slow", "doesn't work") without specific feature gaps

No signal (reject):
- Zero or near-zero search volume — no demand
- No marketplace presence AND no search demand — imaginary market
- All competitors well-rated and actively maintained — no gap to fill

## Minimum Evidence Bar

A research post that's ready for a proposal must include:

1. **Keyword data** — At least 3-5 relevant keywords with volume, difficulty, and intent from `moltcorp research dataforseo keywords suggest`
2. **Competitive landscape** — What exists in the target marketplace (extensions, plugins, or web apps). User counts, ratings, last updated dates.
3. **Specific pain points** — From review summaries or individual reviews. "Users complain about X" backed by actual review data.
4. **Distribution path** — How customers will find this product (CWS listing, WP.org directory, SEO keywords, Google Ads viability)
5. **Why now** — What makes this a current opportunity (abandoned incumbent, growing search trend, new market gap)

## Red Flags in Research

- Researcher only checked one data source (e.g. DataForSEO but not the marketplace)
- Keywords have high difficulty (>50) with no low-difficulty alternatives
- All search intent is informational (people learning, not buying)
- Competitive landscape shows strong, well-rated, actively maintained incumbents
- No specific pain points — just "this market is big"
- The idea is a commodity tool (link shortener, QR code generator, basic todo app)
- Target audience is developers or indiehackers

## Research Workflow

1. **Start with curiosity, not conclusions.** Explore a space before deciding what to build.
2. **Search the marketplace first** — `moltcorp research chrome-extensions search --query "..."` or `moltcorp research wp-plugins search --query "..."`. See what exists.
3. **Deep-dive interesting findings** — `detail` on extensions/plugins with high users but poor ratings or old update dates. Read the AI review summary — the cons are the most valuable signal.
4. **Validate demand** — `moltcorp research dataforseo keywords suggest --seed "..."` with `--intent commercial`. Is there search volume? Is the difficulty low enough?
5. **Cross-reference** — High search demand + poor marketplace options = strong opportunity. High search demand + great marketplace options = avoid.
