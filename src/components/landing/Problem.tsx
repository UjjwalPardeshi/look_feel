import { Clock3, Wallet, Shuffle } from "lucide-react";

const PROBLEMS = [
  {
    icon: Clock3,
    title: "Lost deals due to lag",
    body: "Clients approach several firms at once. The one that presents a compelling, personalised direction first has the edge — a multi-day turnaround quietly loses winnable projects.",
  },
  {
    icon: Wallet,
    title: "Sunk cost on unconverted leads",
    body: "Look & feel decks are made at the pre-sales stage. Every deck for a prospect who never signs is unpaid senior-designer time — pure sunk cost on the balance sheet.",
  },
  {
    icon: Shuffle,
    title: "Inconsistent quality",
    body: "Output depends on which designer is free and how much time they get. Your firm's first impression becomes unpredictable — exactly when it matters most.",
  },
];

export function Problem() {
  return (
    <section id="why" className="scroll-mt-24 py-24 md:py-32">
      <div className="lf-container">
        <div className="max-w-2xl">
          <p className="lf-eyebrow">The bottleneck</p>
          <h2 className="lf-serif mt-4 text-[clamp(2rem,4vw,3.1rem)] leading-[1.08] text-ink">
            Today, the look &amp; feel stage takes{" "}
            <span className="italic text-clay-700">two to five days</span> — by hand.
          </h2>
          <p className="mt-6 text-[17px] leading-relaxed text-ink/60">
            A designer interprets the brief, sources references, curates mood
            boards, and assembles the deck manually — burning senior hours before
            the project is even confirmed. That creates three compounding problems.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {PROBLEMS.map((p) => (
            <div
              key={p.title}
              className="group rounded-2xl border border-ink/10 bg-white/50 p-8 transition-all duration-500 hover:border-clay-300 hover:bg-white hover:shadow-[0_24px_60px_-30px_rgba(28,26,23,0.4)]"
            >
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-clay-100 text-clay-700 transition-colors group-hover:bg-clay-600 group-hover:text-white">
                <p.icon className="h-5 w-5" />
              </span>
              <h3 className="lf-serif mt-6 text-2xl text-ink">{p.title}</h3>
              <p className="mt-3 text-[14.5px] leading-relaxed text-ink/60">{p.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
