# Blueprint Grid Design System

## What is it?
A "blueprint grid" layout pattern. Decorative lines — solid and dashed — create a visual scaffolding that connects sections and gives the page an engineered, technical feel.

## Solid vs Dashed — the rule
- **Solid lines** = structure. Borders of cards, section dividers, outer edge rails, column dividers, full-width separators (navbar, banner, footer).
- **Dashed lines** = connection/transition. Short segments that bridge between structural elements — e.g. the vertical gap between a full-width border and a card below.

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
| `GridCardSection` | Hero, CTA, any full-width card | Dashed gaps (top + bottom) + solid bordered card. Default gap: `h-12`. Default padding: `px-6 py-12 sm:px-8 sm:py-16 md:px-12 md:py-20`. |
| `GridContentSection` | Features, text blocks, any non-card section | Solid edge lines + top separator. Content goes as children — add your own padding to inner divs. |

### GridCardSection props
| Prop | Default | Purpose |
|------|---------|---------|
| `className` | — | Override card padding (e.g. add `relative overflow-hidden`, or use larger `py-16 sm:py-24 md:py-32` for CTA sections) |
| `gapTopClassName` | `h-12` | Override top dashed gap height |
| `gapBottomClassName` | `h-12` | Override bottom dashed gap height |
| `noBottomGap` | `false` | Skip bottom separator + gap entirely (when the next section provides its own) |

**Convention:** Most pages use bare `<GridCardSection>` with no props. Only override for:
- **CTA/landing sections** that need more breathing room: `gapTopClassName="h-24" gapBottomClassName="h-24" className="py-16 sm:py-24 md:py-32"`
- **Flush joins** where card flows directly into content: `noBottomGap`
- **Special layout needs** like `className="relative overflow-hidden"` for backgrounds

## Low-level primitives (in `components/grid-wrapper.tsx`)
| Component | What it does |
|-----------|-------------|
| `GridWrapper` | `max-w-6xl px-6` container. Sections go inside. No lines. |
| `GridEdgeLines` | Solid vertical lines on left+right edges. Place in a `relative` parent. |
| `GridDashedEdgeLines` | Dashed vertical lines on left+right. For connector gaps. |
| `GridDashedGap` | Standard connector gap — `h-12` default with dashed edge lines. Accepts `className` to override height. |
| `GridSeparator` | Horizontal solid line + optional connector dots at edges. `showEdgeDots={false}` hides edge dots. `showCenter` adds a center dot. |
| `GridCenterLine` | Solid vertical center divider for two-column layouts. |

## Spacing standards
- **Dashed connector gap:** `h-12` (48px) default via `GridDashedGap`.
- **Card internal padding:** `px-6 py-12 sm:px-8 sm:py-16 md:px-12 md:py-20` (built into `GridCardSection`).
- **Section content padding:** `px-6 sm:px-8 md:px-12` on inner content divs within `GridContentSection`.
- **Section header padding:** `px-6 py-16 sm:px-8 sm:py-20 md:px-12 md:py-28` for header blocks inside `GridContentSection`.

## Key details
- All card borders use sharp corners (no `rounded-*`) to match the grid aesthetic
- Border color: `border-border` everywhere — matches the shadcn Separator's `bg-border`. No custom opacity values.
- Connector dots: `size-1.5 rounded-full bg-border` — built into `GridSeparator`.
- Max width: `max-w-6xl` across GridWrapper and Navbar.
