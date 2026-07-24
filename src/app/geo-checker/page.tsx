"use client"; // This page uses React state and event handlers, so it must run on the client.

import { useState } from "react";
import PageNav from "../_components/PageNav";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** One row of the GEO checklist. Mirrors the API's `GeoChecklistItem`. */
interface GeoChecklistItem {
  factor: string;
  pass: boolean;
  explanation: string;
}

/**
 * Shape of a successful response from POST /api/geo-check.
 * Mirrors the `GeoCheckResponse` interface in the API route so client and
 * server agree on the contract.
 */
interface GeoCheckResult {
  overallScore: number; // 0–100
  checklist: GeoChecklistItem[];
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function GeoChecker() {
  // --- Form + request lifecycle state ------------------------------------
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false); // true while the request is in flight
  const [error, setError] = useState<string | null>(null); // user-facing error message
  const [result, setResult] = useState<GeoCheckResult | null>(null); // successful payload

  /**
   * Submit handler: POSTs the pasted content as JSON to /api/geo-check, then
   * stores either the result or an error message in state.
   */
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); // don't let the browser do a full-page form submit

    // Reset any previous outcome before starting a new request.
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/geo-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      // The API returns JSON for both success and error cases.
      const data = await response.json();

      // A non-2xx status means the server reported a problem; surface its message.
      if (!response.ok) {
        throw new Error(data?.error ?? "Something went wrong. Please try again.");
      }

      setResult(data as GeoCheckResult);
    } catch (err) {
      // Covers network failures as well as the thrown error above.
      setError(err instanceof Error ? err.message : "Unexpected error.");
    } finally {
      setLoading(false); // always clear the loading flag, success or failure
    }
  }

  // Disable the button while a request runs or the textarea is empty.
  const canSubmit = !loading && content.trim() !== "";

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
            GEO Readiness Checker
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-lg text-zinc-600 dark:text-zinc-400">
            Paste your product page content to see how likely AI answer engines
            like ChatGPT, Perplexity, and Google AI Overviews are to surface and
            cite it.
          </p>
        </header>

        {/* --- Input form -------------------------------------------------- */}
        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div>
            <label
              htmlFor="content"
              className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Product page content
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={10}
              placeholder="Paste the full text of your product page here — title, description, specs, FAQs…"
              className="w-full resize-y rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            />
          </div>

          {/* Submit button — shows a spinner + label while the request runs */}
          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 px-5 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300 sm:w-auto"
          >
            {loading && <Spinner />}
            {loading ? "Analyzing…" : "Analyze"}
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
            <SkeletonCard lines={2} />
            <SkeletonCard lines={5} />
          </section>
        )}

        {/* --- Results ---------------------------------------------------- */}
        {result && !loading && (
          <section className="mt-10 space-y-6">
            {/* Overall score, shown prominently. */}
            <ScoreCard score={result.overallScore} />

            {/* GEO factor checklist. */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                GEO Factors
              </h3>
              <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {result.checklist.map((item, i) => (
                  <li key={i} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                    <StatusIcon pass={item.pass} />
                    <div>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">
                        {item.factor}
                      </p>
                      <p className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-400">
                        {item.explanation}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Presentational helpers
// ---------------------------------------------------------------------------

/**
 * Prominent overall-score card. The number is colored by band: green (strong),
 * amber (needs work), red (weak) — matching the app's existing status colors.
 */
function ScoreCard({ score }: { score: number }) {
  // Pick a color band and a short label for the score.
  const band =
    score >= 80
      ? { color: "text-green-600 dark:text-green-500", label: "Strong" }
      : score >= 50
        ? { color: "text-amber-600 dark:text-amber-500", label: "Needs work" }
        : { color: "text-red-600 dark:text-red-400", label: "Weak" };

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        GEO Readiness Score
      </h3>
      <p className={`mt-2 text-6xl font-semibold tabular-nums ${band.color}`}>
        {score}
        <span className="text-2xl text-zinc-400 dark:text-zinc-500">/100</span>
      </p>
      <p className={`mt-1 text-sm font-medium ${band.color}`}>{band.label}</p>
    </div>
  );
}

/** Green check for pass, red cross for fail — with an accessible label. */
function StatusIcon({ pass }: { pass: boolean }) {
  return (
    <span
      role="img"
      aria-label={pass ? "Pass" : "Fail"}
      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
        pass
          ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400"
          : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"
      }`}
    >
      <svg
        className="h-3 w-3"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        aria-hidden="true"
      >
        {pass ? (
          <path d="M5 10l3 3 7-7" strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round" />
        )}
      </svg>
    </span>
  );
}

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
            style={{ width: `${90 - i * 8}%` }}
          />
        ))}
      </div>
    </div>
  );
}
