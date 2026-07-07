"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export const SLIDE_W = 1000;
export const SLIDE_H = 562.5;

/**
 * Renders slide content on a fixed 1000×562.5 canvas and scales it to fit the
 * container, so every slide is laid out identically to the exported PPTX/PDF
 * regardless of viewport width.
 */
export function ScaledSlide({
  children,
  className,
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const update = () => setScale(el.clientWidth / SLIDE_W);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={wrap}
      id={id}
      className={cn("deck-slide rounded-xl shadow-[0_20px_60px_-24px_rgba(28,26,23,0.35)] ring-1 ring-ink/10", className)}
    >
      <div
        style={{
          width: SLIDE_W,
          height: SLIDE_H,
          transform: `scale(${scale || 0.0001})`,
          transformOrigin: "top left",
          opacity: scale ? 1 : 0,
        }}
      >
        {children}
      </div>
    </div>
  );
}
