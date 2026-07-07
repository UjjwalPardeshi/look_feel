"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Upload,
  RotateCcw,
  Loader2,
  Check,
  Pencil,
} from "lucide-react";
import type { Brief, Deck, SpaceSlide } from "@/lib/types";
import { STYLE_DIRECTIONS, getStyle } from "@/lib/styles";
import { defaultSelectedSpaces } from "@/lib/spaces";
import { buildDeck } from "@/lib/deck/build";
import { categoryImageUrls } from "@/lib/imagery";
import { DeckViewer } from "@/components/deck/DeckViewer";
import { ExportBar } from "@/components/deck/ExportBar";
import { PaletteRow } from "@/components/deck/PaletteRow";
import { BriefStep } from "./BriefStep";
import { SpacesStep } from "./SpacesStep";
import { cn } from "@/lib/cn";

type Stage = "brief" | "spaces" | "generating" | "result";

const INITIAL_BRIEF: Brief = {
  clientName: "",
  projectName: "",
  industry: "",
  styleId: STYLE_DIRECTIONS[0].id,
  budgetTier: "signature",
  brandColors: [],
  notes: "",
  spaces: defaultSelectedSpaces(),
};

const STEPS = [
  { id: "brief", n: "1", label: "The brief" },
  { id: "spaces", n: "2", label: "The spaces" },
  { id: "result", n: "3", label: "The deck" },
] as const;

export function Wizard() {
  const [stage, setStage] = useState<Stage>("brief");
  const [brief, setBrief] = useState<Brief>(INITIAL_BRIEF);
  const [deck, setDeck] = useState<Deck | null>(null);
  const [progress, setProgress] = useState({ pct: 0, label: "" });

  const offsets = useRef<Record<number, number>>({});
  const swapIndex = useRef<number | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const patch = (p: Partial<Brief>) => setBrief((b) => ({ ...b, ...p }));

  const goto = (s: Stage) => {
    setStage(s);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ---- generation animation ----
  useEffect(() => {
    if (stage !== "generating") return;
    let cancelled = false;
    const built = buildDeck(brief, new Date());
    const spaceNames = built.slides.filter((s) => s.kind === "space").map((s) => (s as SpaceSlide).name);
    const labels = [
      "Setting the design direction",
      "Building the palette & materials",
      "Curating the mood board",
      ...spaceNames.map((n) => `Curating references · ${n.toLowerCase()}`),
      "Composing the narrative",
      "Assembling your deck",
    ];
    let i = 0;
    const tick = () => {
      if (cancelled) return;
      setProgress({ pct: (i + 1) / labels.length, label: labels[Math.min(i, labels.length - 1)] });
      i++;
      if (i < labels.length) {
        window.setTimeout(tick, 170);
      } else {
        window.setTimeout(() => {
          if (cancelled) return;
          offsets.current = {};
          setDeck(built);
          goto("result");
        }, 260);
      }
    };
    tick();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  // ---- edit loop ----
  function updateHero(index: number, src: string, userProvided: boolean) {
    setDeck((d) => {
      if (!d) return d;
      const slides = d.slides.map((s, i) =>
        i === index && s.kind === "space" ? { ...s, hero: { ...s.hero, src, userProvided } } : s,
      );
      return { ...d, slides };
    });
  }

  function regenerate(slide: SpaceSlide, index: number) {
    if (!deck) return;
    const pool = categoryImageUrls(slide.category, getStyle(deck.meta.styleId));
    if (pool.length === 0) return;
    let off = (offsets.current[index] ?? 0) + 1;
    let next = pool[off % pool.length];
    if (next === slide.hero.src && pool.length > 1) {
      off += 1;
      next = pool[off % pool.length];
    }
    offsets.current[index] = off;
    updateHero(index, next, false);
  }

  function requestSwap(index: number) {
    swapIndex.current = index;
    fileInput.current?.click();
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    const idx = swapIndex.current;
    e.target.value = "";
    if (!file || idx === null) return;
    const reader = new FileReader();
    reader.onload = () => updateHero(idx, reader.result as string, true);
    reader.readAsDataURL(file);
  }

  const activeStepId = stage === "generating" ? "spaces" : stage;

  return (
    <div>
      <input ref={fileInput} type="file" accept="image/*" onChange={onFile} className="hidden" />

      {/* Stepper */}
      {stage !== "result" && (
        <div className="mb-10 flex items-center gap-3">
          {STEPS.map((s, i) => {
            const done = STEPS.findIndex((x) => x.id === activeStepId) > i;
            const active = s.id === activeStepId;
            return (
              <div key={s.id} className="flex items-center gap-3">
                <div className="flex items-center gap-2.5">
                  <span
                    className={cn(
                      "grid h-8 w-8 place-items-center rounded-full text-[13px] font-semibold transition-colors",
                      active ? "bg-ink text-paper" : done ? "bg-clay-500 text-white" : "bg-ink/8 text-ink/40",
                    )}
                  >
                    {done ? <Check className="h-4 w-4" /> : s.n}
                  </span>
                  <span className={cn("text-[13px] font-medium", active ? "text-ink" : "text-ink/40")}>{s.label}</span>
                </div>
                {i < STEPS.length - 1 && <span className="h-px w-8 bg-ink/15 sm:w-14" />}
              </div>
            );
          })}
        </div>
      )}

      {stage === "brief" && (
        <div className="animate-fade-up">
          <BriefStep brief={brief} onChange={patch} />
          <div className="mt-12 flex justify-end">
            <button onClick={() => goto("spaces")} className="btn-primary">
              Next · Define spaces <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {stage === "spaces" && (
        <div className="animate-fade-up">
          <SpacesStep brief={brief} onChange={patch} />
          <div className="mt-12 flex items-center justify-between">
            <button onClick={() => goto("brief")} className="btn-ghost">
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <button onClick={() => goto("generating")} disabled={brief.spaces.length === 0} className="btn-primary">
              Generate the deck <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {stage === "generating" && <GeneratingView progress={progress} />}

      {stage === "result" && deck && (
        <ResultView
          deck={deck}
          onRestart={() => {
            setDeck(null);
            goto("brief");
          }}
          onEdit={() => goto("brief")}
          renderControls={(slide, index) => (
            <div className="absolute right-3 top-3 flex gap-2 opacity-0 transition-opacity duration-300 group-hover/slide:opacity-100">
              <button
                onClick={() => regenerate(slide, index)}
                title="Regenerate this image"
                className="inline-flex items-center gap-1.5 rounded-full bg-ink/85 px-3 py-1.5 text-[11px] font-medium text-paper backdrop-blur transition-colors hover:bg-ink"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Regenerate
              </button>
              <button
                onClick={() => requestSwap(index)}
                title="Upload your own image"
                className="inline-flex items-center gap-1.5 rounded-full bg-paper/90 px-3 py-1.5 text-[11px] font-medium text-ink backdrop-blur transition-colors hover:bg-white"
              >
                <Upload className="h-3.5 w-3.5" /> Swap
              </button>
            </div>
          )}
        />
      )}
    </div>
  );
}

function GeneratingView({ progress }: { progress: { pct: number; label: string } }) {
  return (
    <div className="flex min-h-[52vh] flex-col items-center justify-center text-center">
      <span className="relative grid h-20 w-20 place-items-center">
        <span className="absolute inset-0 animate-ping rounded-full bg-clay-300/40" />
        <span className="grid h-16 w-16 place-items-center rounded-full bg-ink text-paper">
          <Loader2 className="h-7 w-7 animate-spin" />
        </span>
      </span>
      <h2 className="lf-serif mt-8 text-3xl italic text-ink">Generating your look &amp; feel</h2>
      <p className="mt-2 h-5 text-[14px] text-ink/55">{progress.label}…</p>
      <div className="mt-7 h-1.5 w-72 overflow-hidden rounded-full bg-ink/10">
        <div className="h-full rounded-full bg-clay-500 transition-all duration-200" style={{ width: `${Math.round(progress.pct * 100)}%` }} />
      </div>
    </div>
  );
}

function ResultView({
  deck,
  onRestart,
  onEdit,
  renderControls,
}: {
  deck: Deck;
  onRestart: () => void;
  onEdit: () => void;
  renderControls: (slide: SpaceSlide, index: number) => React.ReactNode;
}) {
  const style = getStyle(deck.meta.styleId);
  return (
    <div className="animate-fade-up">
      <div className="mb-10 rounded-3xl border border-ink/10 bg-white/60 p-7 md:p-9">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-clay-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-clay-700 ring-1 ring-clay-200">
              <Check className="h-3.5 w-3.5" /> Deck ready · {deck.slides.length} slides
            </span>
            <h1 className="lf-serif mt-4 text-[clamp(1.8rem,3.6vw,2.9rem)] leading-[1.06] text-ink">
              {deck.meta.project}
            </h1>
            <p className="mt-3 text-[15px] text-ink/60">
              <strong>{style.name}</strong> — {style.tagline.toLowerCase()}. Hover any space to
              regenerate or swap its imagery, then export.
            </p>
            <div className="mt-5">
              <PaletteRow palette={deck.palette} size={28} gap={14} labels />
            </div>
          </div>
          <div className="flex flex-col items-start gap-4">
            <ExportBar deck={deck} />
            <div className="flex gap-2">
              <button onClick={onEdit} className="inline-flex items-center gap-1.5 text-[13px] text-ink/55 hover:text-ink">
                <Pencil className="h-3.5 w-3.5" /> Edit brief
              </button>
              <span className="text-ink/20">·</span>
              <button onClick={onRestart} className="inline-flex items-center gap-1.5 text-[13px] text-ink/55 hover:text-ink">
                <RotateCcw className="h-3.5 w-3.5" /> Start over
              </button>
            </div>
          </div>
        </div>
      </div>

      <DeckViewer deck={deck} renderSpaceControls={renderControls} />
    </div>
  );
}
