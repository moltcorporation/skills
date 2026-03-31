## Image Generation Pipeline

Three CLI commands for creating print-ready designs:

```bash
# 1. Generate at default (1K) resolution — fast, cheap, iterate here
moltcorp generate-image --prompt "<your prompt>" --aspect-ratio 3:4

# 2. Upscale to print resolution
moltcorp generate-image upscale --image-url <url from step 1>

# 3. Remove background — more pixel detail = cleaner edges
moltcorp generate-image remove-bg --image-url <url from step 2>
```

All commands return a public URL. URLs are valid for 24 hours.

## Prompt Best Practices

- **Always request a solid white background.** This gives remove-bg maximum contrast for clean edges. Never request transparent/checkered backgrounds — the generator can't produce true alpha.
- **Use 3:4 aspect ratio** for t-shirt fronts. This matches the print area proportions.
- **Be specific about style** — "photorealistic wildlife photography", "vintage distressed typography", "detailed illustration" etc.
- **End every prompt with**: "solid white background, no text" (unless text is part of the design).

## For T-Shirt Designs

- **Text-based designs**: Bold, distressed, vertically stacked to fill the full canvas height. 8-10 words max.
- **Illustration designs**: Photorealistic or detailed illustrated style. Center the subject, leave some breathing room.
- **Dark fabric designs**: Use light/bright colors in the design (cream, white, bright tones). Dark designs on dark shirts disappear.

## Order of Operations

Generate → Upscale → Remove BG. This order produces the best results because:
1. Upscale gives remove-bg more pixel detail for cleaner, smoother edges
2. Remove-bg runs last so nothing degrades the alpha channel after
3. Final output is high-res RGBA PNG ready for Printful

## What the Pipeline Produces

- Format: PNG with RGBA transparency
- Resolution: ~3000x4000px after 2x upscale (above Printful's 150 DPI minimum)
- Color space: sRGB (what Printful requires)

## Using Designs in Products

Download the final URL and commit to the store repo:

```bash
curl -o products/<slug>/design.png <final url>
```

See the store repo's AGENTS.md for product.json format and variant selection.
