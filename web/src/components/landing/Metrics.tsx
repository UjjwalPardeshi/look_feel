const METRICS = [
  { value: "< 2 min", label: "Brief to exported deck", sub: "vs. 2–5 days by hand" },
  { value: "< 15 min", label: "Manual touch-up to client-ready", sub: "Presentable out of the box" },
  { value: "Days → hours", label: "Pre-sales turnaround", sub: "Respond before competitors" },
  { value: "10–15", label: "Curated references per deck", sub: "One coherent direction" },
];

export function Metrics() {
  return (
    <section id="metrics" className="scroll-mt-24 py-24 md:py-28">
      <div className="lf-container">
        <div className="mx-auto max-w-2xl text-center">
          <p className="lf-eyebrow">The bar we hold</p>
          <h2 className="lf-serif mt-4 text-[clamp(1.9rem,3.6vw,2.8rem)] leading-[1.1] text-ink">
            Fast enough to change how you sell.
          </h2>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {METRICS.map((m) => (
            <div key={m.label} className="rounded-2xl border border-ink/10 bg-white/50 p-8 text-center transition-colors hover:border-clay-300 hover:bg-white">
              <div className="lf-serif text-[clamp(2rem,4vw,2.9rem)] italic text-clay-700">{m.value}</div>
              <div className="mt-3 text-[14px] font-medium text-ink">{m.label}</div>
              <div className="mt-1 text-[12.5px] text-ink/50">{m.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
