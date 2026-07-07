"use client";

import { Check, Minus, Plus } from "lucide-react";
import type { Brief, SelectedSpace } from "@/lib/types";
import { SPACE_TYPES } from "@/lib/spaces";
import { cn } from "@/lib/cn";

export function SpacesStep({
  brief,
  onChange,
}: {
  brief: Brief;
  onChange: (patch: Partial<Brief>) => void;
}) {
  const selected = new Map(brief.spaces.map((s) => [s.spaceId, s.quantity]));

  const setSpaces = (next: SelectedSpace[]) => onChange({ spaces: next });

  const toggle = (id: string, defaultQty: number) => {
    if (selected.has(id)) {
      setSpaces(brief.spaces.filter((s) => s.spaceId !== id));
    } else {
      setSpaces([...brief.spaces, { spaceId: id, quantity: defaultQty }]);
    }
  };

  const setQty = (id: string, qty: number) => {
    const q = Math.max(1, Math.min(qty, 8));
    setSpaces(brief.spaces.map((s) => (s.spaceId === id ? { ...s, quantity: q } : s)));
  };

  const totalSlides = brief.spaces.reduce((n, s) => n + Math.max(1, Math.min(s.quantity, 8)), 0);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="max-w-lg text-[14px] text-ink/55">
          Select the spaces in this project and set how many of each. The deck is
          built around exactly these rooms — one or two reference pages per space.
        </p>
        <div className="rounded-full bg-clay-50 px-4 py-2 text-[13px] font-medium text-clay-700 ring-1 ring-clay-200">
          {brief.spaces.length} space types · {totalSlides + 4} slides
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {SPACE_TYPES.map((space) => {
          const isOn = selected.has(space.id);
          const qty = selected.get(space.id) ?? space.defaultQty;
          return (
            <div
              key={space.id}
              className={cn(
                "rounded-2xl border p-5 transition-all duration-300",
                isOn ? "border-clay-500 bg-white ring-1 ring-clay-400" : "border-ink/12 bg-white/50",
              )}
            >
              <button type="button" onClick={() => toggle(space.id, space.defaultQty)} className="flex w-full items-start gap-3 text-left">
                <span
                  className={cn(
                    "mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md border transition-colors",
                    isOn ? "border-clay-600 bg-clay-600 text-white" : "border-ink/25 bg-white",
                  )}
                >
                  {isOn && <Check className="h-4 w-4" />}
                </span>
                <span className="flex-1">
                  <span className="block text-[15px] font-semibold text-ink">{space.label}</span>
                  <span className="mt-0.5 block text-[12.5px] text-ink/50">{space.summary}</span>
                </span>
              </button>

              {isOn && (
                <div className="mt-4 flex items-center justify-between border-t border-ink/10 pt-3">
                  <span className="text-[12px] uppercase tracking-[0.12em] text-ink/45">Quantity</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setQty(space.id, qty - 1)}
                      disabled={qty <= 1}
                      className="grid h-8 w-8 place-items-center rounded-lg border border-ink/15 text-ink/70 transition-colors hover:border-ink/35 disabled:opacity-30"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-8 text-center text-[15px] font-semibold tabular-nums text-ink">{qty}</span>
                    <button
                      type="button"
                      onClick={() => setQty(space.id, qty + 1)}
                      disabled={qty >= 8}
                      className="grid h-8 w-8 place-items-center rounded-lg border border-ink/15 text-ink/70 transition-colors hover:border-ink/35 disabled:opacity-30"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
