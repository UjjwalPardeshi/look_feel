import { PenLine, LayoutGrid, Presentation } from "lucide-react";
import { imageUrl, MARKETING } from "@/lib/imagery";
import { SmartImage } from "@/components/SmartImage";

const STEPS = [
  {
    n: "01",
    icon: PenLine,
    title: "Input the brief",
    body: "Style direction, brand colours, budget tier, industry, and any client-specific notes. One short form sets the whole direction.",
    tags: ["Style", "Brand colours", "Budget", "Industry"],
    image: MARKETING.process,
  },
  {
    n: "02",
    icon: LayoutGrid,
    title: "Define the spaces",
    body: "Select the project's spaces from a checklist with quantities — reception, meeting rooms, cabins, cafeteria. The deck is built around the rooms that actually exist.",
    tags: ["Reception", "Meeting × 2", "Cabins", "Cafeteria"],
    image: MARKETING.workstation,
  },
  {
    n: "03",
    icon: Presentation,
    title: "Generate the deck",
    body: "A structured, space-by-space look & feel — cover, design narrative, mood board, and curated references per space — exported to PPTX and PDF, ready to present or lightly edit.",
    tags: ["Cover", "Concept", "Space by space", "PPTX + PDF"],
    image: MARKETING.boardroom,
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-24 bg-sand/60 py-24 md:py-32">
      <div className="lf-container">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-xl">
            <p className="lf-eyebrow">How it works</p>
            <h2 className="lf-serif mt-4 text-[clamp(2rem,4vw,3.1rem)] leading-[1.08] text-ink">
              Three steps. <span className="italic text-clay-700">One coherent deck.</span>
            </h2>
          </div>
          <p className="max-w-sm text-[15px] leading-relaxed text-ink/60">
            A simple flow designed for pre-sales — no CAD parsing, no 3D, no
            waiting on whoever&rsquo;s free in the studio.
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="overflow-hidden rounded-2xl border border-ink/10 bg-white">
              <div className="relative h-44 w-full">
                <SmartImage src={imageUrl(s.image, 800, 500)} alt={s.title} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <span className="lf-serif absolute left-5 top-4 text-4xl italic text-white/90">{s.n}</span>
              </div>
              <div className="p-7">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-clay-100 text-clay-700">
                  <s.icon className="h-5 w-5" />
                </span>
                <h3 className="lf-serif mt-5 text-2xl text-ink">{s.title}</h3>
                <p className="mt-3 text-[14.5px] leading-relaxed text-ink/60">{s.body}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {s.tags.map((t) => (
                    <span key={t} className="rounded-full bg-clay-50 px-3 py-1 text-[11px] font-medium tracking-wide text-clay-700 ring-1 ring-clay-200">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
