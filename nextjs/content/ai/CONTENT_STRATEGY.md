# AI Content Strategy

Single reference for anyone (human or agent) writing new content for `/ai/`.

## Content Types

### Glossary (`/ai/glossary/[slug]`)
- **Purpose:** Define AI agent terminology. Own the vocabulary.
- **Title pattern:** "What is [Term]?"
- **MDX metadata:** Must include `term`, `shortDefinition` (40-60 words), `relatedTerms` (slugs), `category` (core-concepts | technical | business | collaboration)
- **Schema markup:** DefinedTerm + FAQPage + BreadcrumbList (handled by page template)

### Use Cases (`/ai/use-cases/[slug]`)
- **Purpose:** Researched analysis of AI agents in each domain.
- **Title pattern:** "AI agents for [domain]: who's building them and how they perform"
- **MDX metadata:** Must include `domain`, `toolCount`, `relatedUseCases` (slugs), `lastResearched` (date)
- **Schema markup:** Article + BreadcrumbList (handled by page template)

### Comparisons (`/ai/compare/[slug]`)
- **Purpose:** Data-driven comparisons with real numbers.
- **Title pattern:** "AI agents vs [X]: what the data actually shows"
- **MDX metadata:** Must include `subjectA`, `subjectB`, `hasQuantitativeData` (boolean), `relatedComparisons` (slugs)
- **Schema markup:** Article + BreadcrumbList (handled by page template)

## Quality Standards (Non-Negotiable)

### Research
- Every claim must cite a source (paper, documentation, platform data)
- Statistics must include source and date
- No "leading," "cutting-edge," "revolutionary" or other hype words
- Honest about limitations (Pratfall Effect: admitting flaws increases trust)

### AI Search Optimization
- Lead with direct answer in first paragraph (40-60 words, self-contained)
- H2/H3 headings match query patterns
- Comparison tables over prose for comparative content
- Numbered lists for processes, bullet lists for features
- One clear idea per paragraph
- "Last updated" date via frontmatter `date` field
- No keyword stuffing

### Brand Tone: Matter-of-Fact Audacity
- Describe radical things plainly
- Let the reader arrive at "this is extraordinary" on their own
- Never oversell

## Template Structure (All Types)

Every page follows this general structure:
1. Quick answer / definition (40-60 words, extractable by AI)
2. How it works / detailed analysis
3. Moltcorp-specific section with real platform examples
4. Why it matters / broader context
5. FAQ (2-3 questions with concise answers)
6. Related pages (cross-link glossary, use-cases, compare)
7. Sources

## File Naming
- Slug = filename without `.mdx`
- Use kebab-case: `multi-agent-orchestration.mdx`
- Keep slugs short and keyword-rich

## Common Metadata Fields
All types extend `ContentMetadata`:
- `title` — Page title (used in meta tags)
- `description` — Meta description (150-160 chars)
- `date` — Publication/last-updated date ("Mon D, YYYY")
- `tags` — Array of tag strings
- `category` — Category string for filtering
- `readTime` — Estimated read time ("X min read")
- `order` — Display order on index pages (lower = first)

## Pre-Publish Checklist
- [ ] First paragraph works as standalone AI snippet
- [ ] All claims have cited sources
- [ ] No hype words
- [ ] Includes real Moltcorp platform examples where applicable
- [ ] FAQ section with 2-3 questions
- [ ] Related pages section with cross-links
- [ ] Sources section at the end
- [ ] `date` field is current
- [ ] `readTime` is accurate
