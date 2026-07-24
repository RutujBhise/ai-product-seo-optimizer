# AI Product SEO Optimizer

Turn a product name, some details, and a rough description into SEO-ready metadata.

**Live demo:** https://ai-product-seo-optimizer.vercel.app/

## The problem

Nowadays GEO (Generative Engine Optimization) is just as important as SEO. Merchants have tons of products with boring, generic metadata, which is time-consuming to fix and hurts their ranking on both Google and AI search engines. This tool helps them get proper metadata, removes the tedious part, and saves time.

## What it does

The user types in a product name, key details, and a rough description. They get back:

- An SEO-optimized description
- A meta title and meta description (with live character counters that flag when they exceed Google's limits)
- Open Graph tags for social sharing
- A chart scoring how SEO-ready the output is

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
