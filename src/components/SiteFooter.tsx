import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-ink/10 bg-sand">
      <div className="lf-container py-16">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <div className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-ink text-paper">
                <span className="lf-serif text-base italic">&amp;</span>
              </span>
              <span className="lf-serif text-lg text-ink">Look &amp; Feel</span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-ink/60">
              Personalised look &amp; feel, delivered in a day. The internal engine
              behind our &ldquo;look &amp; feel in 24 hours&rdquo; service — now
              generating presentation-ready decks in under two minutes.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
            <FooterCol
              title="Product"
              links={[
                { href: "/generate", label: "Generate a deck" },
                { href: "/library", label: "Reference library" },
                { href: "/sample", label: "Sample output" },
                { href: "/#how", label: "How it works" },
              ]}
            />
            <FooterCol
              title="Company"
              links={[
                { href: "/#why", label: "Why it wins" },
                { href: "/#metrics", label: "Results" },
                { href: "/#faq", label: "FAQ" },
              ]}
            />
            <FooterCol
              title="Contact"
              links={[
                { href: "mailto:hello@lookandfeel.studio", label: "hello@lookandfeel.studio" },
                { href: "/generate", label: "Book a pilot" },
              ]}
            />
          </div>
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-3 border-t border-ink/10 pt-6 text-xs text-ink/45 sm:flex-row sm:items-center">
          <span>© {2026} Look &amp; Feel. Presentation-ready design decks.</span>
          <span className="tracking-wide">Designed &amp; built for design-and-build firms.</span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <h4 className="lf-eyebrow">{title}</h4>
      <ul className="mt-4 space-y-2.5">
        {links.map((l) => (
          <li key={l.label}>
            <Link
              href={l.href}
              className="link-underline text-sm text-ink/65 hover:text-ink"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
