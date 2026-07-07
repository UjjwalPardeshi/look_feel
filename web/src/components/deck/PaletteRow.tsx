import type { Swatch } from "@/lib/types";

export function PaletteRow({
  palette,
  size = 30,
  gap = 14,
  labels = false,
}: {
  palette: Swatch[];
  size?: number;
  gap?: number;
  labels?: boolean;
}) {
  return (
    <div className="flex items-start" style={{ gap }}>
      {palette.map((s, i) => (
        <div key={`${s.hex}-${i}`} className="flex flex-col items-center" style={{ gap: 6 }}>
          <span
            className="rounded-full ring-1 ring-black/5"
            style={{
              width: size,
              height: size,
              background: s.hex,
              boxShadow: "0 1px 2px rgba(0,0,0,0.12), inset 0 0 0 1.5px rgba(255,255,255,0.85)",
            }}
          />
          {labels && (
            <span className="text-[9px] uppercase tracking-[0.12em] text-ink/50" style={{ maxWidth: size + 24 }}>
              {s.name}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
