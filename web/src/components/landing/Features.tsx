import { LayoutGrid, Palette, Wand2, Building2, Replace, FileDown } from "lucide-react";

const FEATURES = [
  {
    icon: LayoutGrid,
    title: "Space-aware, not generic",
    body: "The deck is structured around the project's actual rooms — 2 meeting rooms, a board room, reception — not a random wall of images.",
  },
  {
    icon: Palette,
    title: "One coherent direction",
    body: "Every space shares one palette, one material story, and one lighting mood — so the deck reads as a single design vision.",
  },
  {
    icon: Wand2,
    title: "AI-ready imagery",
    body: "A pluggable image engine generates on-brief references per space — no Pinterest scraping, no copyright exposure at scale.",
  },
  {
    icon: Building2,
    title: "Personalised to the brand",
    body: "Feed in brand colours and industry and the direction adapts — the client sees themselves in the deck, not a template.",
  },
  {
    icon: Replace,
    title: "Editable in seconds",
    body: "Regenerate any single image or swap in your own reference before export. The designer stays in control.",
  },
  {
    icon: FileDown,
    title: "Export to PPTX & PDF",
    body: "Download a real, editable PowerPoint or a polished PDF — ready to present, or to fine-tune in under 15 minutes.",
  },
];

export function Features() {
  return (
    <section className="bg-ink py-24 text-paper md:py-32">
      <div className="lf-container">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-clay-400">Why it wins</p>
          <h2 className="lf-serif mt-4 text-[clamp(2rem,4vw,3.1rem)] leading-[1.08] text-paper">
            Built for pre-sales, <span className="italic text-clay-300">not for show.</span>
          </h2>
          <p className="mt-6 text-[16px] leading-relaxed text-paper/60">
            Generic AI image tools give you attractive but unstructured, brand-blind
            results. Traditional 3D is far too slow and expensive to deploy before a
            project is confirmed. This sits precisely in between.
          </p>
        </div>

        <div className="mt-14 grid gap-px overflow-hidden rounded-2xl bg-paper/10 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="group bg-ink p-8 transition-colors duration-500 hover:bg-[#26221d]">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-paper/5 text-clay-300 ring-1 ring-paper/10 transition-colors group-hover:bg-clay-500 group-hover:text-white">
                <f.icon className="h-5 w-5" />
              </span>
              <h3 className="lf-serif mt-5 text-xl text-paper">{f.title}</h3>
              <p className="mt-3 text-[14px] leading-relaxed text-paper/55">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
