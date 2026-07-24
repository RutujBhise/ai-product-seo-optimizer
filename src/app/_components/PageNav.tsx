"use client"; // uses usePathname to highlight the active link

import Link from "next/link";
import { usePathname } from "next/navigation";

// The two pages this app switches between. Add a route here to extend the nav.
const LINKS = [
  { href: "/", label: "Optimizer" },
  { href: "/geo-checker", label: "GEO Checker" },
];

/**
 * A small pill toggle shown at the top of both pages, linking Optimizer ↔ GEO
 * Checker. The current route is highlighted. Styled to match the app's existing
 * zinc/dark cards.
 */
export default function PageNav() {
  const pathname = usePathname();

  return (
    <nav className="mb-8 flex justify-center">
      <div className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-white p-1 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        {LINKS.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              // Active link gets the solid "primary" treatment; the rest are muted.
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
