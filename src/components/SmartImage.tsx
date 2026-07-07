"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

interface SmartImageProps {
  src: string;
  alt: string;
  className?: string;
  /** gradient shown while loading and if the image fails */
  fallback?: string;
  /** style overlay tint for deck coherence */
  overlay?: string;
  priority?: boolean;
  sizes?: string;
}

/**
 * A plain <img> with graceful degradation: a palette-derived gradient shows
 * while loading and permanently replaces the image if it fails — so the UI
 * never shows a broken image.
 */
export function SmartImage({
  src,
  alt,
  className,
  fallback = "linear-gradient(135deg,#e7dcc7,#c2a880,#8a6d3b)",
  overlay,
  priority,
  sizes,
}: SmartImageProps) {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");

  return (
    <div className={cn("relative h-full w-full overflow-hidden", className)} style={{ background: fallback }}>
      {status !== "error" && (
        <img
          src={src}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          sizes={sizes}
          onLoad={() => setStatus("loaded")}
          onError={() => setStatus("error")}
          className={cn(
            "h-full w-full object-cover transition-opacity duration-700",
            status === "loaded" ? "opacity-100" : "opacity-0",
          )}
        />
      )}
      {status === "error" && (
        <div className="flex h-full w-full items-center justify-center">
          <span className="text-[10px] font-medium uppercase tracking-[0.25em] text-white/70">
            {alt}
          </span>
        </div>
      )}
      {overlay && <div className="pointer-events-none absolute inset-0" style={{ background: overlay }} />}
    </div>
  );
}
