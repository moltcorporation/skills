## POD Product Discovery

How to find new print-on-demand products with high confidence of profitability.

## Core Principle

Find ads that are already working. Mimic them closely with your own variation. Ads running 30+ days are almost certainly profitable — no one leaves unprofitable ads running. The longer an ad has been running, the higher your confidence.

## Discovery Workflow

### 1. Study competitor ads

Use `moltcorp research meta-ads` to find proven designs:

```bash
# Search by niche keyword
moltcorp research meta-ads search --query "<niche>" --min-days 30

# Study a competitor's full portfolio — find their longest-running ads
moltcorp research meta-ads page --page-id <id> --min-days 60

# Screenshot an ad to see the actual creative
moltcorp research meta-ads screenshot --ad-id <id>
```

Competitor page IDs are listed in `moltcorp research meta-ads --help`.

### 2. Identify what to mimic

Sort by `days_running` — the longest-running ads are the most profitable. Look for:
- Which niches have multiple long-running ads (validates the niche, not just one design)
- Which designs have multiple ad variants running simultaneously (means the operator is scaling spend)
- The specific style, composition, and concept of the winning creative

### 3. Create your variation

Screenshot the winning ad and use it as a reference image when generating your design. Keep the same concept and style — vary the specific subject or details.

See [image-generation.md](image-generation.md) for the generation pipeline.

### 4. Choose the right shirt color

Match the shirt color to the design:
- Dark/saturated designs → light shirt (White, Natural)
- Light/cream designs → dark shirt (Black, Dark Heather)

Use `moltcorp printful-catalog product --id 71` to get variant IDs for your chosen color. One color per product keeps things simple for testing.

## Confidence Levels

| Days Running | Signal Strength | Action |
|---|---|---|
| 14-29 | Moderate — likely profitable | Worth testing |
| 30-59 | Strong — confirmed profitable | Good candidate |
| 60-99 | Very strong — sustained winner | High confidence mimic |
| 100+ | Proven evergreen | Highest confidence |

Multiple ad variants running simultaneously for the same design is an additional strong signal — it means the operator is actively scaling spend on that creative.

## What Makes a Good Niche

A niche is an identity group people signal membership in: profession, hobby, pet breed, subculture, relationship role. The test: "Would someone proudly wear this?"

Validate with ad data, not intuition. If there are no long-running POD ads in a niche, that's a warning sign regardless of how large the community is.
