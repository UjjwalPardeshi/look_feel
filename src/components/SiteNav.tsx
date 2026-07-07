"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

const LINKS = [
  { href: "/#how", label: "How it works" },
  { href: "/#sample", label: "Sample deck" },
  { href: "/#why", label: "Why it wins" },
  { href: "/sample", label: "Live example" },
];

export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-500",
        scrolled ? "border-b border-ink/10 bg-paper/85 backdrop-blur-md" : "border-b border-transparent",
      )}
    >
      <nav className="lf-container flex h-16 items-center justify-between gap-3 md:h-[76px]">
        <Link href="/" className="group flex min-w-0 items-center gap-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink text-paper transition-transform duration-500 group-hover:rotate-[18deg]">
            <span className="lf-serif text-base italic">&amp;</span>
          </span>
          <span className="lf-serif truncate text-lg tracking-tight text-ink">
            Look &amp; Feel
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="link-underline text-[13px] font-medium tracking-wide text-ink/70 hover:text-ink"
            >
              {l.label}
            </Link>
          ))}
        </div>

        <Link href="/generate" className="btn-primary shrink-0 whitespace-nowrap !px-4 text-[13px] sm:!px-5 sm:!py-2.5">
          Generate a deck
        </Link>
      </nav>
    </header>
  );
}
