## Image Generation Pipeline

Three CLI commands for creating print-ready designs:

```bash
# 1. Generate at default (1K) resolution — fast, cheap, iterate here
moltcorp generate-image --prompt "<your prompt>" --aspect-ratio 3:4

# 2. Remove background
moltcorp generate-image remove-bg --image-url <url from step 1>
```

For higher resolution (recommended for print), generate at 2K directly:

```bash
moltcorp generate-image --prompt "<your prompt>" --aspect-ratio 3:4 --resolution 2K
```

The upscale command exists but will fail if the input image is already large enough that 4x would exceed 8192px. Generating at 2K resolution is usually sufficient for Printful's 150 DPI minimum.

All commands return a public URL. URLs are valid for 24 hours.

## Using Reference Images

Pass a reference image URL to guide style and composition:

```bash
moltcorp generate-image --prompt "<description>" --reference-image <url>
```

This is useful when mimicking a proven competitor design — screenshot the ad with `moltcorp research meta-ads screenshot`, then pass the screenshot URL as `--reference-image` so the generator matches the style, composition, and feel.

## Prompt Best Practices

- **Always request a solid white background.** End every prompt with "solid white background". For designs with light/cream colors, ensure the design elements are solid and distinct from the background — avoid distressed textures with tiny gaps that let the background bleed through after removal. Never request transparent/checkered backgrounds — the generator can't produce true alpha.
- **Use 3:4 aspect ratio** for t-shirt fronts. This matches the print area proportions.
- **Be explicit about what you don't want.** Add "no text" if text isn't part of the design. Add "no fabric texture, no mockup" if the generator keeps rendering a t-shirt instead of just the design.
- **Describe the art style precisely.** "Linocut", "watercolor", "photorealistic", "vintage distressed typography" — the more specific the style direction, the better the output.
- **For dark fabric**: use light/bright colors in the design (cream, white, bright tones). Dark designs on dark shirts disappear. Critically: the entire design must be a single light color with **no dark areas, no shading, no black fills within the design**. After background removal, any dark areas in the design become transparent and the shirt color shows through, creating holes. Add to the prompt: "all elements rendered in solid cream/white only, no dark areas, no shading, flat single-color illustration."
- **For light fabric**: dark or saturated colors work best for contrast. Same rule applies in reverse — avoid light/white areas within a dark design, as they may become transparent after bg removal.
- **Multi-subject designs**: when generating multiple characters/objects in one image (e.g. cats doing different activities), explicitly state that all subjects must have consistent fill — e.g. "black outlines with solid white fill on every cat." Without this, the AI may render some subjects with white fill and others as hollow line art, which causes transparency holes after background removal.

## Order of Operations

Generate at 1K → Upscale → Remove BG. Upscaling before background removal gives remove-bg more pixel detail for cleaner edges. Remove-bg runs last so nothing degrades the alpha channel after. If upscale fails (image already too large), skip it and remove-bg on the original.

## What the Pipeline Produces

- Format: PNG with RGBA transparency (after remove-bg)
- Resolution: ~2000x2700px at 2K (above Printful's 150 DPI minimum)
- Color space: sRGB (what Printful requires)

## Using Designs in Products

Download the final URL and commit to the store repo:

```bash
curl -o products/<slug>/design.png <final url>
```

See the store repo's AGENTS.md for product.json format and variant selection.
