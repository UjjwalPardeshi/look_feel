"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Upload, X, ImageOff } from "lucide-react";
import type { LibraryImage } from "@/lib/library/types";
import type { SpaceCategory } from "@/lib/types";
import { SmartImage } from "@/components/SmartImage";
import { cn } from "@/lib/cn";

interface SwapModalProps {
  open: boolean;
  spaceLabel: string;
  category: SpaceCategory;
  styleId: string;
  /** full library; the modal filters it */
  library: LibraryImage[];
  libraryConfigured: boolean;
  uploading: boolean;
  onPick: (url: string) => void;
  onUploadFile: (file: File) => void;
  onClose: () => void;
}

/**
 * The edit-loop picker: swap a space's hero with a reference from the shared
 * library (same space type, on-style first) or upload a new image — which is
 * itself saved to the library for future reuse.
 */
export function SwapModal({
  open,
  spaceLabel,
  category,
  styleId,
  library,
  libraryConfigured,
  uploading,
  onPick,
  onUploadFile,
  onClose,
}: SwapModalProps) {
  const fileInput = useRef<HTMLInputElement>(null);

  // Same space type; on-style images first so coherent picks are one tap away.
  const candidates = useMemo(() => {
    const ofCategory = library.filter((li) => li.category === category);
    return [
      ...ofCategory.filter((li) => li.styleId === styleId),
      ...ofCategory.filter((li) => li.styleId !== styleId),
    ];
  }, [library, category, styleId]);

  // Keep the latest onClose in a ref so the key listener isn't torn down and
  // re-attached every time the parent re-renders with a new callback identity.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (open) {
      setVisible(true);
      const onKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") onCloseRef.current();
      };
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }
    const t = setTimeout(() => setVisible(false), 200);
    return () => clearTimeout(t);
  }, [open]);

  if (!open && !visible) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[70] flex items-end justify-center bg-ink/50 backdrop-blur-sm transition-opacity duration-200 sm:items-center",
        open ? "opacity-100" : "opacity-0",
      )}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Swap image for ${spaceLabel}`}
    >
      <div
        className="flex max-h-[86vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-paper shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-ink/10 px-6 py-4">
          <div>
            <h3 className="lf-serif text-xl text-ink">Swap image</h3>
            <p className="text-[12.5px] text-ink/55">
              {spaceLabel} · pick from your library or upload a new reference
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="grid h-9 w-9 place-items-center rounded-full border border-ink/15 text-ink/60 transition-colors hover:border-ink/40 hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-6">
          <input
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) onUploadFile(f);
            }}
          />
          <button
            onClick={() => fileInput.current?.click()}
            disabled={uploading}
            className="mb-6 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-ink/25 bg-white/60 px-4 py-4 text-[14px] font-medium text-ink/70 transition-colors hover:border-clay-500 hover:text-ink disabled:opacity-50"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {uploading ? "Saving to library…" : "Upload a new image"}
            {libraryConfigured && !uploading && (
              <span className="text-[12px] font-normal text-ink/45">— saved for reuse</span>
            )}
          </button>

          <p className="lf-eyebrow mb-3">
            From your library · {candidates.length} {candidates.length === 1 ? "reference" : "references"}
          </p>

          {candidates.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {candidates.map((li) => (
                <button
                  key={li.pathname}
                  onClick={() => onPick(li.url)}
                  className="group relative overflow-hidden rounded-xl ring-1 ring-ink/10 transition-all hover:ring-2 hover:ring-clay-500"
                  style={{ aspectRatio: "4 / 3" }}
                >
                  <SmartImage src={li.url} alt={`${li.category} reference`} />
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/70 to-transparent px-2.5 pb-2 pt-6 text-left text-[10px] font-medium uppercase tracking-[0.14em] text-white opacity-0 transition-opacity group-hover:opacity-100">
                    {li.source === "uploaded" ? "Uploaded" : "Generated"}
                    {li.styleId === styleId ? " · on-style" : ""}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 rounded-2xl bg-sand/70 px-6 py-10 text-center">
              <ImageOff className="h-6 w-6 text-ink/35" />
              <p className="text-[14px] text-ink/60">
                {libraryConfigured
                  ? `No ${spaceLabel.toLowerCase()} references in the library yet — they'll appear here as decks are generated.`
                  : "The shared library isn't set up yet, so only uploads are available. Uploads will still swap into this deck."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
