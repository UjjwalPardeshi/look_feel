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
  Library,
} from "lucide-react";
import Link from "next/link";
import type { Brief, Deck, SpaceSlide } from "@/lib/types";
import type { LibraryImage } from "@/lib/library/types";
import { STYLE_DIRECTIONS, getStyle } from "@/lib/styles";
import { defaultSelectedSpaces } from "@/lib/spaces";
import { buildDeck } from "@/lib/deck/build";
import { categoryImageUrls } from "@/lib/imagery";
import {
  fetchLibrary,
  ingestDeck,
  uploadToLibrary,
  compressImage,
} from "@/lib/library/client";
import { DeckViewer } from "@/components/deck/DeckViewer";
import { ExportBar } from "@/components/deck/ExportBar";
import { PaletteRow } from "@/components/deck/PaletteRow";
import { BriefStep } from "./BriefStep";
import { SpacesStep } from "./SpacesStep";
import { SwapModal } from "./SwapModal";
import { cn } from "@/lib/cn";

type Stage = "brief" | "spaces" | "generating" | "result";

const INITIAL_BRIEF: Brief = {
  clientName: "",
  projectName: "",
  industry: "",
  styleIds: [STYLE_DIRECTIONS[0].id],
  budgetTier: "signature",
  brandColors: [],
  brandName: "",
  brandLogo: null,
  notes: "",
  spaces: defaultSelectedSpaces(),
};

const STEPS = [
  { id: "brief", n: "1", label: "The brief" },
  { id: "spaces", n: "2", label: "The spaces" },
  { id: "result", n: "3", label: "The deck" },
] as const;

/** How many of the deck's space images were served from the shared library. */
function countLibraryReuse(deck: Deck, library: readonly LibraryImage[]): number {
  const libraryUrls = new Set(library.map((li) => li.url));
  let reused = 0;
  for (const slide of deck.slides) {
    if (slide.kind !== "space") continue;
    for (const im of [slide.hero, ...slide.supporting]) {
      if (libraryUrls.has(im.src)) reused++;
    }
  }
  return reused;
}

export function Wizard() {
  const [stage, setStage] = useState<Stage>("brief");
  const [brief, setBrief] = useState<Brief>(INITIAL_BRIEF);
  const [deck, setDeck] = useState<Deck | null>(null);
  const [progress, setProgress] = useState({ pct: 0, label: "" });

  // Shared reference library (fetched at generation time).
  const [library, setLibrary] = useState<LibraryImage[]>([]);
  const [libraryConfigured, setLibraryConfigured] = useState(false);
  const [libraryStats, setLibraryStats] = useState<{ reused: number; saved: number | null }>({
    reused: 0,
    saved: null,
  });

  const [swapTarget, setSwapTarget] = useState<{ index: number; slide: SpaceSlide } | null>(null);
  const [uploading, setUploading] = useState(false);

  const offsets = useRef<Record<number, number>>({});

  const patch = (p: Partial<Brief>) => setBrief((b) => ({ ...b, ...p }));

  const goto = (s: Stage) => {
    setStage(s);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ---- generation: library first, then build, then ingest for reuse ----
  useEffect(() => {
    if (stage !== "generating") return;
    let cancelled = false;
    const timers: number[] = [];
    const delay = (ms: number) =>
      new Promise<void>((resolve) => {
        timers.push(window.setTimeout(resolve, ms));
      });

    (async () => {
      setProgress({ pct: 0.05, label: "Checking your reference library" });
      const lib = await fetchLibrary();
      if (cancelled) return;
      setLibrary(lib.images);
      setLibraryConfigured(lib.configured);

      const built = buildDeck(brief, new Date(), lib.images);
      const reused = countLibraryReuse(built, lib.images);
      const spaceLabels = built.slides
        .filter((s): s is SpaceSlide => s.kind === "space")
        .map((s) =>
          s.optionLabel
            ? `${s.optionLabel} · ${s.name.toLowerCase()}`
            : `Curating references · ${s.name.toLowerCase()}`,
        );
      const conceptNames = brief.styleIds.map((id) => getStyle(id).name);
      let labels = [
        ...(reused > 0 ? [`Reusing ${reused} references from your library`] : []),
        conceptNames.length > 1
          ? `Composing ${conceptNames.length} concepts — ${conceptNames.join(", ")}`
          : "Setting the design direction",
        "Building the palette & materials",
        "Curating the mood board",
        ...spaceLabels,
        "Composing the narrative",
        "Assembling your deck",
      ];
      // Multi-concept decks can have dozens of slides; keep the animation snappy.
      if (labels.length > 16) {
        const step = labels.length / 16;
        labels = Array.from({ length: 16 }, (_, i) => labels[Math.floor(i * step)]);
      }
      for (let i = 0; i < labels.length; i++) {
        if (cancelled) return;
        setProgress({ pct: (i + 1) / labels.length, label: labels[i] });
        await delay(170);
      }
      if (cancelled) return;

      offsets.current = {};
      setDeck(built);
      setLibraryStats({ reused, saved: null });
      goto("result");

      // Fire-and-forget: bank this deck's references for future reuse.
      ingestDeck(built)
        .then((added) => {
          if (!cancelled) setLibraryStats({ reused, saved: added });
        })
        .catch(() => {
          if (!cancelled) setLibraryStats({ reused, saved: 0 });
        });
    })();

    return () => {
      cancelled = true;
      timers.forEach((t) => window.clearTimeout(t));
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
    const style = getStyle(slide.styleId);
    // Library references first (on-style, same space), then the generator pool.
    const libraryUrls = library
      .filter((li) => li.category === slide.category && li.styleId === slide.styleId)
      .map((li) => li.url);
    const pool = [...new Set([...libraryUrls, ...categoryImageUrls(slide.category, style)])];
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

  async function handleUploadFile(file: File) {
    const target = swapTarget;
    if (!target || !deck) return;
    setUploading(true);
    try {
      let dataUrl: string;
      try {
        dataUrl = await compressImage(file);
      } catch {
        // Canvas couldn't decode the file — fall back to the raw data URL.
        dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error("could not read file"));
          reader.readAsDataURL(file);
        });
      }
      // Store in the shared library; if unconfigured, the local data URL still swaps in.
      const saved = await uploadToLibrary(dataUrl, target.slide.category, target.slide.styleId);
      if (saved) {
        setLibrary((l) => [saved, ...l.filter((x) => x.pathname !== saved.pathname)]);
      }
      updateHero(target.index, saved?.url ?? dataUrl, true);
      setSwapTarget(null);
    } finally {
      setUploading(false);
    }
  }

  const activeStepId = stage === "generating" ? "spaces" : stage;

  return (
    <div>
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
        <>
          <ResultView
            deck={deck}
            libraryConfigured={libraryConfigured}
            libraryStats={libraryStats}
            onRestart={() => {
              setDeck(null);
              goto("brief");
            }}
            onEdit={() => goto("brief")}
            renderControls={(slide, index) => (
              <div className="absolute left-3 top-3 flex gap-2 opacity-100 transition-opacity duration-300 md:opacity-0 md:group-hover/slide:opacity-100">
                <button
                  onClick={() => regenerate(slide, index)}
                  title="Regenerate this image"
                  className="inline-flex items-center gap-1.5 rounded-full bg-ink/85 px-3 py-1.5 text-[11px] font-medium text-paper backdrop-blur transition-colors hover:bg-ink"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Regenerate
                </button>
                <button
                  onClick={() => setSwapTarget({ index, slide })}
                  title="Swap from library or upload"
                  className="inline-flex items-center gap-1.5 rounded-full bg-paper/90 px-3 py-1.5 text-[11px] font-medium text-ink backdrop-blur transition-colors hover:bg-white"
                >
                  <Upload className="h-3.5 w-3.5" /> Swap
                </button>
              </div>
            )}
          />
          <SwapModal
            open={swapTarget !== null}
            spaceLabel={swapTarget ? swapTarget.slide.qualifier ?? swapTarget.slide.name : ""}
            category={swapTarget?.slide.category ?? "workstation"}
            styleId={swapTarget?.slide.styleId ?? deck.meta.styleId}
            library={library}
            libraryConfigured={libraryConfigured}
            uploading={uploading}
            onPick={(url) => {
              if (swapTarget) updateHero(swapTarget.index, url, false);
              setSwapTarget(null);
            }}
            onUploadFile={handleUploadFile}
            onClose={() => {
              if (!uploading) setSwapTarget(null);
            }}
          />
        </>
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

function LibraryNote({
  configured,
  stats,
}: {
  configured: boolean;
  stats: { reused: number; saved: number | null };
}) {
  if (!configured) return null;
  let text: string;
  if (stats.saved === null) {
    text = "Saving this deck's references to your library…";
  } else if (stats.reused > 0 && stats.saved === 0) {
    text = `${stats.reused} references reused from your library — nothing new to generate.`;
  } else if (stats.saved > 0 && stats.reused > 0) {
    text = `${stats.reused} references reused · ${stats.saved} new saved for future decks.`;
  } else if (stats.saved > 0) {
    text = `${stats.saved} references saved to your library for future reuse.`;
  } else {
    text = "This deck's references are in your library.";
  }
  return (
    <Link
      href="/library"
      className="inline-flex items-center gap-2 rounded-full bg-sand px-3.5 py-1.5 text-[12px] font-medium text-ink/70 ring-1 ring-ink/10 transition-colors hover:text-ink"
    >
      <Library className="h-3.5 w-3.5 text-clay-600" />
      {text}
    </Link>
  );
}

function ResultView({
  deck,
  libraryConfigured,
  libraryStats,
  onRestart,
  onEdit,
  renderControls,
}: {
  deck: Deck;
  libraryConfigured: boolean;
  libraryStats: { reused: number; saved: number | null };
  onRestart: () => void;
  onEdit: () => void;
  renderControls: (slide: SpaceSlide, index: number) => React.ReactNode;
}) {
  const style = getStyle(deck.meta.styleId);
  const multi = deck.meta.styleIds.length > 1;
  return (
    <div className="animate-fade-up">
      <div className="mb-10 rounded-3xl border border-ink/10 bg-white/60 p-7 md:p-9">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-clay-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-clay-700 ring-1 ring-clay-200">
              <Check className="h-3.5 w-3.5" /> Deck ready · {deck.slides.length} slides
              {multi ? ` · ${deck.meta.styleIds.length} concepts` : ""}
            </span>
            <h1 className="lf-serif mt-4 text-[clamp(1.8rem,3.6vw,2.9rem)] leading-[1.06] text-ink">
              {deck.meta.project}
            </h1>
            <p className="mt-3 text-[15px] text-ink/60">
              {multi ? (
                <>
                  <strong>{deck.meta.styleName}</strong> — one option per concept, same
                  spaces. Regenerate or swap any space&rsquo;s imagery, then export.
                </>
              ) : (
                <>
                  <strong>{style.name}</strong> — {style.tagline.toLowerCase()}. Regenerate or swap
                  any space&rsquo;s imagery, then export.
                </>
              )}
            </p>
            <div className="mt-5">
              <PaletteRow palette={deck.palette} size={28} gap={14} labels />
            </div>
            <div className="mt-4">
              <LibraryNote configured={libraryConfigured} stats={libraryStats} />
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
