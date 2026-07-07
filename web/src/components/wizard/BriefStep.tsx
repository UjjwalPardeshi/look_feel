"use client";

import { Check, Plus, X } from "lucide-react";
import type { Brief, BudgetTier } from "@/lib/types";
import { STYLE_DIRECTIONS, BUDGET_TIERS } from "@/lib/styles";
import { cn } from "@/lib/cn";

const INDUSTRIES = [
  "Corporate office",
  "Technology / Startup",
  "Law / Finance",
  "Healthcare / Clinic",
  "Hospitality",
  "Retail / Showroom",
  "Creative studio",
  "Co-working space",
];

export function BriefStep({
  brief,
  onChange,
}: {
  brief: Brief;
  onChange: (patch: Partial<Brief>) => void;
}) {
  const setColor = (i: number, hex: string) => {
    const next = [...brief.brandColors];
    next[i] = hex;
    onChange({ brandColors: next });
  };
  const addColor = () => {
    if (brief.brandColors.length >= 3) return;
    onChange({ brandColors: [...brief.brandColors, "#8a6d3b"] });
  };
  const removeColor = (i: number) => {
    onChange({ brandColors: brief.brandColors.filter((_, j) => j !== i) });
  };

  return (
    <div className="space-y-12">
      {/* Project basics */}
      <div className="grid gap-6 md:grid-cols-2">
        <Field label="Project name">
          <input
            value={brief.projectName}
            onChange={(e) => onChange({ projectName: e.target.value })}
            placeholder="e.g. Northwind HQ — Workplace Fit-out"
            className={inputCls}
          />
        </Field>
        <Field label="Client name">
          <input
            value={brief.clientName}
            onChange={(e) => onChange({ clientName: e.target.value })}
            placeholder="e.g. Northwind Ventures"
            className={inputCls}
          />
        </Field>
        <Field label="Industry">
          <input
            value={brief.industry}
            onChange={(e) => onChange({ industry: e.target.value })}
            placeholder="e.g. Corporate office"
            list="industries"
            className={inputCls}
          />
          <datalist id="industries">
            {INDUSTRIES.map((i) => (
              <option key={i} value={i} />
            ))}
          </datalist>
        </Field>
        <Field label="Budget tier">
          <div className="flex gap-2">
            {BUDGET_TIERS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => onChange({ budgetTier: t.id as BudgetTier })}
                className={cn(
                  "flex-1 rounded-xl border px-3 py-3 text-left transition-all",
                  brief.budgetTier === t.id
                    ? "border-clay-500 bg-clay-50 ring-1 ring-clay-400"
                    : "border-ink/12 bg-white hover:border-ink/25",
                )}
              >
                <span className="block text-[13px] font-semibold text-ink">{t.label}</span>
                <span className="mt-0.5 block text-[11px] leading-tight text-ink/50">{t.note}</span>
              </button>
            ))}
          </div>
        </Field>
      </div>

      {/* Style direction */}
      <div>
        <h3 className="lf-eyebrow">Design direction</h3>
        <p className="mt-2 text-[14px] text-ink/55">
          Choose the mood. Every space in the deck inherits this palette, materials, and lighting.
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {STYLE_DIRECTIONS.map((s) => {
            const active = brief.styleId === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => onChange({ styleId: s.id })}
                className={cn(
                  "group relative overflow-hidden rounded-2xl border p-5 text-left transition-all duration-300",
                  active
                    ? "border-clay-500 bg-white shadow-[0_18px_50px_-28px_rgba(28,26,23,0.5)] ring-1 ring-clay-400"
                    : "border-ink/12 bg-white/60 hover:border-ink/25 hover:bg-white",
                )}
              >
                {active && (
                  <span className="absolute right-4 top-4 grid h-6 w-6 place-items-center rounded-full bg-clay-600 text-white">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                )}
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-clay-600">{s.axis}</span>
                <h4 className="lf-serif mt-1.5 text-xl text-ink">{s.name}</h4>
                <p className="mt-1 text-[12.5px] leading-snug text-ink/55">{s.tagline}</p>
                <div className="mt-4 flex gap-1.5">
                  {s.palette.map((p) => (
                    <span key={p.hex} className="h-5 w-5 rounded-full ring-1 ring-black/5" style={{ background: p.hex }} />
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Brand colours + notes */}
      <div className="grid gap-6 md:grid-cols-2">
        <Field label="Brand colours (optional)">
          <div className="flex flex-wrap items-center gap-3">
            {brief.brandColors.map((c, i) => (
              <div key={i} className="flex items-center gap-2 rounded-xl border border-ink/12 bg-white p-1.5 pr-2.5">
                <input
                  type="color"
                  value={/^#[0-9a-f]{6}$/i.test(c) ? c : "#8a6d3b"}
                  onChange={(e) => setColor(i, e.target.value)}
                  className="h-8 w-8 cursor-pointer rounded-lg border-0 bg-transparent p-0"
                  aria-label={`Brand colour ${i + 1}`}
                />
                <span className="font-mono text-[12px] uppercase text-ink/60">{c}</span>
                <button type="button" onClick={() => removeColor(i)} className="text-ink/40 hover:text-ink">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            {brief.brandColors.length < 3 && (
              <button
                type="button"
                onClick={addColor}
                className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-ink/25 px-3.5 py-2.5 text-[12.5px] font-medium text-ink/60 hover:border-ink/45 hover:text-ink"
              >
                <Plus className="h-3.5 w-3.5" /> Add colour
              </button>
            )}
          </div>
          <p className="mt-2 text-[12px] text-ink/45">Woven into the deck palette so it feels on-brand.</p>
        </Field>

        <Field label="Notes (optional)">
          <textarea
            value={brief.notes}
            onChange={(e) => onChange({ notes: e.target.value })}
            rows={3}
            placeholder="Anything specific — hospitality-led, lots of greenery, a signature material…"
            className={cn(inputCls, "resize-none")}
          />
        </Field>
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-ink/12 bg-white px-4 py-3 text-[15px] text-ink placeholder:text-ink/35 outline-none transition-colors focus:border-clay-500 focus:ring-1 focus:ring-clay-400";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.14em] text-ink/55">{label}</span>
      {children}
    </label>
  );
}
