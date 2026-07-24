# AI Product SEO Optimizer

Turn a product name, some details, and a rough description into SEO-ready metadata.

**Live demo:** https://ai-product-seo-optimizer.vercel.app/

## The problem

Nowadays GEO (Generative Engine Optimization) is just as important as SEO. Merchants have tons of products with boring, generic metadata, which is time-consuming to fix and hurts their ranking on both Google and AI search engines. This tool helps them get proper metadata, removes the tedious part, and saves time.

## What it does

The app has two tools:

### 1. SEO Optimizer

The user types in a product name, key details, and a rough description. They get back:

- An SEO-optimized description
- A meta title and meta description (with live character counters that flag when they exceed Google's limits)
- Open Graph tags for social sharing
- A tone selector to match the copy to the brand's voice
- A chart scoring how SEO-ready the output is

### 2. GEO Readiness Checker

The user pastes in their product page content and gets back:

- An overall GEO readiness score (0–100) — how likely AI answer engines like ChatGPT, Perplexity, and Google AI Overviews are to surface and cite it
- A checklist of GEO factors, each marked pass/fail with a short explanation: clear product naming, question-and-answer phrasing, factual specificity, scannable formatting, comparison context, and semantic clarity for AI parsing

## Example

_Illustrative — actual output will vary._

**SEO Optimizer**

Input:

- **Product name:** Stainless Steel Insulated Water Bottle
- **Key details:** 750ml, double-walled, keeps drinks cold 24h / hot 12h, BPA-free
- **Rough description:** a metal water bottle that keeps your drink cold

Output:

- **Meta title:** `Insulated Steel Water Bottle 750ml — 24h Cold` (47 / 60)
- **Meta description:** `Double-walled stainless steel bottle keeps drinks cold 24h, hot 12h. BPA-free and leak-proof, 750ml — built for daily use.` (121 / 160)
- Plus an optimized description, Open Graph tags, and an SEO-readiness chart scoring meta-tag lengths and keyword presence.

**GEO Readiness Checker**

Paste a product page and get an overall score plus a factor checklist, e.g.:

- **Overall GEO readiness: 72 / 100**
- ✅ Clear product naming — the product is named consistently throughout
- ✅ Factual specificity — includes concrete specs and numbers
- ❌ Question-and-answer phrasing — no Q&A or FAQ-style content
- ❌ Comparison context — doesn't compare against alternatives

## Built with

- Next.js and React (App Router)
- TypeScript
- The Google Gemini API for AI generation
- Recharts for the SEO-readiness chart
- Tailwind CSS for styling
- Deployed on Vercel

## Design decisions

- **Tone selector** — each product and business is different and needs a different voice (a luxury product shouldn't sound like a technical one). Inspired by how CataSEO offers multiple brand tones.
- **Character counters** — Google cuts off meta titles around 60 characters and descriptions around 160, so the counters turn red when text runs over and the user knows it'll display properly in search.

## What's next

Right now it optimizes one product at a time. Next steps would be:

- Connecting directly to a store like BigCommerce or Shopify to pull the whole catalog
- Batch-optimizing many products at once
- A review-and-approve workflow
- Pulling competitor keyword data (via Moz) so the AI writes to outrank competitors

## Note

Built with AI-assisted development (Claude Code); the architecture and product decisions are my own.
