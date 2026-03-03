# Blueprint Grid Design System

## What is it?
A "blueprint grid" (also called "structural grid" or "wireframe grid") layout pattern. Decorative lines — solid and dashed — create a visual scaffolding that connects sections and gives the page an engineered, technical feel. Common in modern SaaS/tech landing pages (Profound, Linear, Vercel).

## Solid vs Dashed — the rule
- **Solid lines** = structure. Borders of cards, section dividers, outer edge rails, column dividers, full-width separators (navbar, banner, footer).
- **Dashed lines** = connection/transition. Short segments that bridge between structural elements — e.g. the vertical gap between a full-width border and a card below.

Think of it as: solid lines define boundaries, dashed lines are the "stitching" that connects them.

## Page layout hierarchy
```
Full viewport width
├── Navbar              → full-width, solid Separator underneath
├── AnnouncementBanner  → full-width, solid Separator underneath
├── GridWrapper (max-w-6xl px-6)  → just the container, no lines
│   ├── GridCardSection (hero)    → dashed gap, solid card, dashed gap
│   ├── GridContentSection        → edge lines + top separator + content
│   └── GridCardSection (CTA)     → dashed gap, solid card, dashed gap
└── Footer              → full-width, solid Separator on top
```

## Section composables (prefer these)
| Component | Use for | What it provides |
|-----------|---------|------------------|
| `GridCardSection` | Hero, CTA, any full-width card | Dashed gaps (top + bottom) + solid bordered card with `px-8 sm:px-12 py-24 sm:py-32` padding. Override gap height via `gapTopClassName` / `gapBottomClassName`. Override card padding via `className`. |
| `GridContentSection` | Features, text blocks, any non-card section | Solid edge lines + top separator. Content goes as children — add your own `px-8 sm:px-12` padding to inner divs. |

## Low-level primitives (in `components/grid-wrapper.tsx`)
| Component | What it does |
|-----------|-------------|
| `GridWrapper` | `max-w-6xl px-6` container. Sections go inside. No lines. |
| `GridEdgeLines` | Solid vertical lines on left+right edges. Place in a `relative` parent. |
| `GridDashedEdgeLines` | Dashed vertical lines on left+right. For connector gaps. |
| `GridDashedGap` | Standard connector gap — `h-24` default with dashed edge lines. Accepts `className` to override height. |
| `GridSeparator` | Horizontal solid line + connector dots at edges. `showCenter` adds a center dot. |
| `GridDashedLine` | Horizontal dashed line, no dots. |
| `GridCenterLine` | Solid vertical center divider for two-column layouts. |

## Spacing standards
- **Dashed connector gap:** `h-24` (96px) default via `GridDashedGap`. Single source of truth for vertical rhythm.
- **Card internal padding:** `px-8 sm:px-12 py-24 sm:py-32` (built into `GridCardSection`).
- **Section content padding:** `px-8 sm:px-12` on inner content divs within `GridContentSection`.

## Key details
- All card borders use sharp corners (no `rounded-*`) to match the grid aesthetic
- Border color: `border-border` everywhere — matches the shadcn Separator's `bg-border`. No custom opacity values.
- Connector dots: `size-1.5 rounded-full bg-border` — built into `GridSeparator`.
- Max width: `max-w-6xl` across GridWrapper and Navbar.
