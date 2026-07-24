"use client"; // This page uses React state and event handlers, so it must run on the client.

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import PageNav from "./_components/PageNav";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Shape of a successful response from POST /api/optimize.
 * Mirrors the `OptimizeResponse` interface in the API route so the client and
 * server agree on the contract.
 */
interface OptimizeResult {
  optimizedDescription: string;
  metaTitle: string;
  metaDescription: string;
  openGraph: {
    ogTitle: string;
    ogDescription: string;
  };
}

/** Allowed brand tones. The API validates against this same set. */
const TONES = ["Professional", "Playful", "Luxury", "Technical"] as const;
type Tone = (typeof TONES)[number];

/** One bar in the SEO Readiness chart: a labeled 0–100 score plus its detail. */
interface ScoreDatum {
  dimension: string; // x-axis label
  score: number; // 0–100 readiness score
  detail: string; // human-readable explanation shown in the tooltip
}

// ---------------------------------------------------------------------------
// Client-side SEO scoring
// ---------------------------------------------------------------------------

/**
 * Score a length against an ideal [min, max] window, degrading gracefully as it
 * drifts outside the window. Returns a clamped 0–100 value.
 */
function lengthScore(len: number, min: number, max: number): number {
  if (len === 0) return 0;
  if (len >= min && len <= max) return 100; // inside the ideal window
  if (len < min) return Math.max(0, Math.round((len / min) * 100)); // too short
  return Math.max(0, Math.round(100 - (len - max) * 3)); // too long: -3 pts/char over
}

/**
 * Fraction of the product name's significant words (length > 2) that appear in
 * the generated copy, as a 0–100 score. This is a rough "did the AI actually
 * use my keywords" heuristic, computed entirely on the client.
 */
function keywordScore(productName: string, haystack: string): number {
  const words = productName
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 2);
  if (words.length === 0) return 0;
  const lowerHaystack = haystack.toLowerCase();
  const hits = words.filter((w) => lowerHaystack.includes(w)).length;
  return Math.round((hits / words.length) * 100);
}

/**
 * Turn a raw result + the product name into the three chart dimensions.
 */
function computeScores(
  result: OptimizeResult,
  productName: string,
): ScoreDatum[] {
  const titleLen = result.metaTitle.length;
  const descLen = result.metaDescription.length;
  // Combine all generated copy so a keyword counts if it lands anywhere.
  const combinedCopy = [
    result.optimizedDescription,
    result.metaTitle,
    result.metaDescription,
    result.openGraph.ogTitle,
    result.openGraph.ogDescription,
  ].join(" ");

  return [
    {
      dimension: "Meta Title",
      score: lengthScore(titleLen, 30, 60),
      detail: `${titleLen} chars (ideal 30–60)`,
    },
    {
      dimension: "Meta Description",
      score: lengthScore(descLen, 70, 160),
      detail: `${descLen} chars (ideal 70–160)`,
    },
    {
      dimension: "Keyword Presence",
      score: keywordScore(productName, combinedCopy),
      detail: "Product-name terms found in the copy",
    },
  ];
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function Home() {
  // --- Form field state ---------------------------------------------------
  const [productName, setProductName] = useState("");
  const [details, setDetails] = useState("");
  const [rawDescription, setRawDescription] = useState("");
  // Brand tone drives the style of the generated copy. Defaults to Professional.
  const [tone, setTone] = useState<Tone>("Professional");

  // --- Request lifecycle state -------------------------------------------
  const [loading, setLoading] = useState(false); // true while the request is in flight
  const [error, setError] = useState<string | null>(null); // user-facing error message
  const [result, setResult] = useState<OptimizeResult | null>(null); // successful payload

  // Remember the product name that produced the current result, so the chart's
  // keyword score reflects the submitted value even if the field is later edited.
  const [scoredName, setScoredName] = useState("");

  /**
   * Submit handler: POSTs the form data as JSON to /api/optimize, then stores
   * either the result or an error message in state. (Unchanged API flow.)
   */
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); // don't let the browser do a full-page form submit

    // Reset any previous outcome before starting a new request.
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productName, details, rawDescription, tone }),
      });

      // The API returns JSON for both success and error cases.
      const data = await response.json();

      // A non-2xx status means the server reported a problem; surface its message.
      if (!response.ok) {
        throw new Error(data?.error ?? "Something went wrong. Please try again.");
      }

      setResult(data as OptimizeResult);
      setScoredName(productName);
    } catch (err) {
      // Covers network failures as well as the thrown error above.
      setError(err instanceof Error ? err.message : "Unexpected error.");
    } finally {
      setLoading(false); // always clear the loading flag, success or failure
    }
  }

  // Disable the button when a request is running or any field is empty.
  const canSubmit =
    !loading &&
    productName.trim() !== "" &&
    details.trim() !== "" &&
    rawDescription.trim() !== "";

  // Recompute chart scores only when the result (or its product name) changes.
  const scores = useMemo(
    () => (result ? computeScores(result, scoredName) : []),
    [result, scoredName],
  );

  return (
    <div className="min-h-full bg-zinc-50 dark:bg-zinc-950">
      <main className="mx-auto w-full max-w-3xl px-6 py-16">
        {/* Nav between Optimizer and GEO Checker */}
        <PageNav />

        {/* --- Header ------------------------------------------------------ */}
        <header className="mb-12 text-center">
          <span className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            AI-powered · Gemini
          </span>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Product SEO Optimizer
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-lg text-zinc-600 dark:text-zinc-400">
            Turn rough product notes into search-ready copy, meta tags, and
            Open Graph data in one click.
          </p>
        </header>

        {/* --- Input form -------------------------------------------------- */}
        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
        >
          {/* Product name */}
          <div>
            <label
              htmlFor="productName"
              className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Product name
            </label>
            <input
              id="productName"
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="e.g. Stainless Steel Insulated Water Bottle"
              className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            />
          </div>

          {/* Key details */}
          <div>
            <label
              htmlFor="details"
              className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Key details
            </label>
            <textarea
              id="details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={3}
              placeholder="Materials, dimensions, standout features, target audience…"
              className="w-full resize-y rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            />
          </div>

          {/* Raw description */}
          <div>
            <label
              htmlFor="rawDescription"
              className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Raw description
            </label>
            <textarea
              id="rawDescription"
              value={rawDescription}
              onChange={(e) => setRawDescription(e.target.value)}
              rows={5}
              placeholder="Paste your existing or draft product description here…"
              className="w-full resize-y rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            />
          </div>

          {/* Brand tone selector — changes the style of the generated copy. */}
          <div>
            <label
              htmlFor="tone"
              className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Brand tone
            </label>
            <select
              id="tone"
              value={tone}
              onChange={(e) => setTone(e.target.value as Tone)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 sm:w-56"
            >
              {TONES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Submit button — shows a spinner + label while the request runs */}
          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 px-5 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300 sm:w-auto"
          >
            {loading && <Spinner />}
            {loading ? "Optimizing…" : "Optimize"}
          </button>
        </form>

        {/* --- Error message ---------------------------------------------- */}
        {error && (
          <div
            role="alert"
            className="mt-8 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300"
          >
            {error}
          </div>
        )}

        {/* --- Loading skeleton ------------------------------------------- */}
        {loading && (
          <section className="mt-10 space-y-4" aria-hidden="true">
            <SkeletonCard lines={4} />
            <SkeletonCard lines={1} />
            <SkeletonCard lines={2} />
          </section>
        )}

        {/* --- Results ---------------------------------------------------- */}
        {result && !loading && (
          <section className="mt-10 space-y-6">
            <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              Results
            </h2>

            {/* SEO Readiness chart, computed from the returned content. */}
            <SeoReadinessChart scores={scores} />

            {/* Each card labels one piece of the AI output. */}
            <ResultCard
              title="Optimized Description"
              copyText={result.optimizedDescription}
            >
              {/* whitespace-pre-line keeps the model's paragraph breaks. */}
              <p className="whitespace-pre-line leading-relaxed">
                {result.optimizedDescription}
              </p>
            </ResultCard>

            <ResultCard title="Meta Title" copyText={result.metaTitle}>
              <p>{result.metaTitle}</p>
              {/* Counter turns red once the title exceeds the 60-char SEO limit. */}
              <CharCounter length={result.metaTitle.length} limit={60} />
            </ResultCard>

            <ResultCard
              title="Meta Description"
              copyText={result.metaDescription}
            >
              <p>{result.metaDescription}</p>
              {/* Counter turns red once the description exceeds the 160-char limit. */}
              <CharCounter length={result.metaDescription.length} limit={160} />
            </ResultCard>

            <ResultCard title="Open Graph">
              {/* Two OG fields, each with its own Copy button. */}
              <dl className="space-y-3">
                <div>
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                      og:title
                    </dt>
                    <CopyButton text={result.openGraph.ogTitle} />
                  </div>
                  <dd className="mt-0.5">{result.openGraph.ogTitle}</dd>
                </div>
                <div>
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                      og:description
                    </dt>
                    <CopyButton text={result.openGraph.ogDescription} />
                  </div>
                  <dd className="mt-0.5">{result.openGraph.ogDescription}</dd>
                </div>
              </dl>
            </ResultCard>
          </section>
        )}
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SEO Readiness chart
// ---------------------------------------------------------------------------

/**
 * A single-series bar chart scoring the generated content on a few simple SEO
 * dimensions. One measure (a 0–100 score) across labeled categories, so it uses
 * one hue and no legend — the card title names the series. Colors come from CSS
 * variables (see globals.css) so light/dark swap automatically.
 */
function SeoReadinessChart({ scores }: { scores: ScoreDatum[] }) {
  return (
    <div className="seo-chart rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        SEO Readiness
      </h3>

      {/* ResponsiveContainer needs a sized parent, so we give it a fixed height. */}
      <div className="mt-4 h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={scores}
            margin={{ top: 8, right: 8, bottom: 0, left: -16 }}
            barCategoryGap="35%" // keeps a clear surface gap between bars
          >
            {/* Recessive horizontal-only grid. */}
            <CartesianGrid
              vertical={false}
              stroke="var(--chart-grid)"
              strokeDasharray="3 3"
            />
            <XAxis
              dataKey="dimension"
              tick={{ fill: "var(--chart-axis)", fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: "var(--chart-grid)" }}
            />
            <YAxis
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              tick={{ fill: "var(--chart-axis)", fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              width={40}
            />
            <Tooltip
              cursor={{ fill: "var(--chart-grid)", opacity: 0.3 }}
              content={<ScoreTooltip />}
            />
            {/* 4px rounded data-end on top of each bar, anchored to the baseline. */}
            <Bar dataKey="score" radius={[4, 4, 0, 0]} maxBarSize={72}>
              {scores.map((entry) => (
                <Cell key={entry.dimension} fill="var(--chart-series)" />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Caption: make clear these are client-side heuristics, not the model's own claim. */}
      <p className="mt-3 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
        Scores (0–100) are computed on your device from the generated content —
        meta-tag lengths against SEO best practices and how well your product
        name appears in the copy. They&apos;re a quick sanity check, not a
        guarantee of ranking.
      </p>
    </div>
  );
}

/**
 * Custom tooltip so the hover card reads correctly in both light and dark mode
 * (the default Recharts tooltip is hard-coded to a white background).
 */
function ScoreTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: ScoreDatum }>;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const datum = payload[0].payload;
  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs shadow-md dark:border-zinc-700 dark:bg-zinc-900">
      <p className="font-medium text-zinc-900 dark:text-zinc-100">
        {datum.dimension}
      </p>
      <p className="mt-0.5 text-zinc-600 dark:text-zinc-400">
        Score: {datum.score}/100
      </p>
      <p className="text-zinc-500 dark:text-zinc-500">{datum.detail}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Presentational helpers
// ---------------------------------------------------------------------------

/** Small inline loading spinner used inside the submit button. */
function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

/**
 * A skeleton placeholder card shown while the request is in flight, so the
 * layout doesn't jump when results arrive.
 */
function SkeletonCard({ lines }: { lines: number }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-4 h-3 w-32 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
      <div className="space-y-2.5">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="h-3 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800"
            // Vary the width slightly so it reads as text, not blocks.
            style={{ width: `${90 - i * 8}%` }}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * A labeled card used to display one section of the results.
 * Kept as a local component so all result cards share consistent styling.
 * When `copyText` is provided, a Copy button appears in the card header.
 */
function ResultCard({
  title,
  copyText,
  children,
}: {
  title: string;
  copyText?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-3 flex items-center justify-between gap-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          {title}
        </h3>
        {copyText !== undefined && <CopyButton text={copyText} />}
      </div>
      <div className="text-zinc-800 dark:text-zinc-200">{children}</div>
    </div>
  );
}

/**
 * A small button that copies `text` to the clipboard via the Clipboard API and
 * briefly shows "Copied!" feedback for ~2 seconds. Each instance owns its state.
 */
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      // Revert the label back to "Copy" after ~2 seconds.
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard writes can be rejected (permissions / insecure context);
      // fail quietly rather than crashing the UI.
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex shrink-0 items-center rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-600 shadow-sm transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

/**
 * Character counter rendered as "current / limit". Green when within the limit,
 * red once the length exceeds it.
 */
function CharCounter({ length, limit }: { length: number; limit: number }) {
  const over = length > limit;
  return (
    <p
      className={`mt-2 text-xs font-medium tabular-nums ${
        over
          ? "text-red-600 dark:text-red-400"
          : "text-green-700 dark:text-green-500"
      }`}
    >
      {length} / {limit}
    </p>
  );
}
