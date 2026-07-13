"use client";

import { useEffect, useMemo, useState } from "react";
import {
  FolderOpen,
  Loader2,
  RefreshCw,
  Trash2,
  Database,
  Sparkles,
  Upload,
} from "lucide-react";
import Link from "next/link";
import type { LibraryImage, LibrarySource } from "@/lib/library/types";
import { fetchLibrary, deleteFromLibrary } from "@/lib/library/client";
import { SPACE_TYPES } from "@/lib/spaces";
import { STYLE_BY_ID } from "@/lib/styles";
import { SmartImage } from "@/components/SmartImage";
import { cn } from "@/lib/cn";

type Status = "loading" | "ready" | "unconfigured" | "error";

const CATEGORY_LABELS = new Map(SPACE_TYPES.map((s) => [s.category, s.label]));

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export function LibraryBrowser() {
  const [status, setStatus] = useState<Status>("loading");
  const [images, setImages] = useState<LibraryImage[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<LibrarySource | "all">("all");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function load() {
    setStatus("loading");
    const res = await fetchLibrary(10000);
    if (!res.configured) {
      setStatus("unconfigured");
      return;
    }
    setImages(res.images);
    setStatus("ready");
  }

  useEffect(() => {
    void load();
  }, []);

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const im of images) counts.set(im.category, (counts.get(im.category) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [images]);

  const filtered = useMemo(
    () =>
      images.filter(
        (im) =>
          (categoryFilter === "all" || im.category === categoryFilter) &&
          (sourceFilter === "all" || im.source === sourceFilter),
      ),
    [images, categoryFilter, sourceFilter],
  );

  const totalBytes = useMemo(() => images.reduce((n, im) => n + im.size, 0), [images]);
  const uploadedCount = useMemo(() => images.filter((i) => i.source === "uploaded").length, [images]);

  async function handleDelete(im: LibraryImage) {
    if (deleting) return;
    if (!window.confirm("Remove this reference from the library? Decks that already use it keep working until you regenerate them.")) return;
    setDeleteError(null);
    setDeleting(im.pathname);
    try {
      let token = window.localStorage.getItem("lf-library-token") ?? undefined;
      let result = await deleteFromLibrary(im.url, token);
      if (result === "unauthorized") {
        // The store is protected with LIBRARY_ADMIN_TOKEN — ask once and retry.
        const entered = window.prompt("This library is protected. Enter the admin token to delete:");
        if (entered) {
          token = entered.trim();
          result = await deleteFromLibrary(im.url, token);
          if (result === "ok") window.localStorage.setItem("lf-library-token", token);
        }
      }
      if (result === "ok") {
        setImages((list) => list.filter((x) => x.pathname !== im.pathname));
      } else if (result === "unauthorized") {
        setDeleteError("Delete not authorised — the admin token is missing or wrong.");
      } else {
        setDeleteError("Couldn't delete that reference — please try again.");
      }
    } finally {
      setDeleting(null);
    }
  }

  if (status === "loading") {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 text-ink/55">
        <Loader2 className="h-7 w-7 animate-spin text-clay-600" />
        <span className="text-[14px]">Opening the library…</span>
      </div>
    );
  }

  if (status === "unconfigured") {
    return (
      <div className="mx-auto max-w-xl rounded-3xl border border-ink/10 bg-white/60 p-10 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-clay-100 text-clay-700">
          <Database className="h-6 w-6" />
        </span>
        <h2 className="lf-serif mt-6 text-2xl text-ink">Storage not connected yet</h2>
        <p className="mt-3 text-[14.5px] leading-relaxed text-ink/60">
          The shared library stores every generated and uploaded reference in Vercel
          Blob so your whole team reuses them across clients. One-time setup:
        </p>
        <ol className="mx-auto mt-5 max-w-md list-decimal space-y-2 pl-6 text-left text-[14px] text-ink/70">
          <li>In your Vercel dashboard open <strong>Storage → Create Database → Blob</strong>.</li>
          <li>Connect the new store to the <strong>look-and-feel</strong> project.</li>
          <li>Redeploy — the <code className="rounded bg-sand px-1.5 py-0.5 text-[12.5px]">BLOB_READ_WRITE_TOKEN</code> env var is added automatically.</li>
        </ol>
        <p className="mt-5 text-[13px] text-ink/50">
          Until then, decks still generate normally from the built-in reference pool.
        </p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex min-h-[30vh] flex-col items-center justify-center gap-4">
        <p className="text-[14.5px] text-ink/60">Couldn&rsquo;t load the library.</p>
        <button onClick={() => void load()} className="btn-ghost">
          <RefreshCw className="h-4 w-4" /> Try again
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={<FolderOpen className="h-5 w-5" />}
          value={String(images.length)}
          label="references ready to reuse"
          sub={`${formatBytes(totalBytes)} stored`}
        />
        <StatCard
          icon={<Sparkles className="h-5 w-5" />}
          value={String(images.length - uploadedCount)}
          label="from generated decks"
          sub="every reuse skips a generation"
        />
        <StatCard
          icon={<Upload className="h-5 w-5" />}
          value={String(uploadedCount)}
          label="designer uploads"
          sub="added via the swap flow"
        />
      </div>

      {/* Filters */}
      <div className="mt-10 flex flex-wrap items-center gap-2">
        <FilterChip active={categoryFilter === "all"} onClick={() => setCategoryFilter("all")}>
          All spaces · {images.length}
        </FilterChip>
        {categories.map(([cat, count]) => (
          <FilterChip key={cat} active={categoryFilter === cat} onClick={() => setCategoryFilter(cat)}>
            {CATEGORY_LABELS.get(cat as never) ?? cat} · {count}
          </FilterChip>
        ))}
        <span className="mx-2 hidden h-5 w-px bg-ink/15 sm:block" />
        {(["all", "generated", "uploaded"] as const).map((s) => (
          <FilterChip key={s} active={sourceFilter === s} onClick={() => setSourceFilter(s)} subtle>
            {s === "all" ? "Any source" : s === "generated" ? "Generated" : "Uploaded"}
          </FilterChip>
        ))}
      </div>

      {deleteError && (
        <p className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-[13px] text-red-800 ring-1 ring-red-200">
          {deleteError}
        </p>
      )}

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((im) => {
            const style = STYLE_BY_ID.get(im.styleId);
            return (
              <figure
                key={im.pathname}
                className="group overflow-hidden rounded-2xl bg-white ring-1 ring-ink/10 transition-shadow hover:shadow-[0_18px_44px_-24px_rgba(28,26,23,0.45)]"
              >
                <div className="relative" style={{ aspectRatio: "4 / 3" }}>
                  <SmartImage src={im.url} alt={`${im.category} reference`} />
                  <button
                    onClick={() => void handleDelete(im)}
                    disabled={deleting !== null}
                    title="Remove from library"
                    className="absolute right-2.5 top-2.5 grid h-8 w-8 place-items-center rounded-full bg-ink/70 text-white opacity-100 backdrop-blur transition-all hover:bg-red-700 disabled:opacity-40 md:opacity-0 md:group-hover:opacity-100"
                  >
                    {deleting === im.pathname ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
                <figcaption className="flex items-center justify-between gap-2 px-3.5 py-2.5">
                  <span className="truncate text-[12px] font-medium text-ink">
                    {CATEGORY_LABELS.get(im.category) ?? im.category}
                  </span>
                  <span className="shrink-0 text-[10.5px] uppercase tracking-[0.12em] text-ink/45">
                    {style ? style.name.split(" ")[0] : im.styleId} · {im.source === "uploaded" ? "upload" : "gen"}
                  </span>
                </figcaption>
              </figure>
            );
          })}
        </div>
      ) : (
        <div className="mt-8 flex flex-col items-center gap-3 rounded-3xl bg-sand/70 px-8 py-16 text-center">
          <FolderOpen className="h-7 w-7 text-ink/35" />
          <p className="max-w-md text-[14.5px] text-ink/60">
            {images.length === 0
              ? "The library is empty — generate your first deck and every reference lands here automatically."
              : "Nothing matches these filters."}
          </p>
          {images.length === 0 && (
            <Link href="/generate" className="btn-primary mt-2">
              Generate a deck
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  value,
  label,
  sub,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  sub: string;
}) {
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-ink/10 bg-white/60 p-5">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-clay-100 text-clay-700">
        {icon}
      </span>
      <div className="min-w-0">
        <div className="lf-serif text-2xl italic text-ink">{value}</div>
        <div className="text-[13px] font-medium text-ink/75">{label}</div>
        <div className="text-[12px] text-ink/45">{sub}</div>
      </div>
    </div>
  );
}

function FilterChip({
  active,
  subtle,
  onClick,
  children,
}: {
  active: boolean;
  subtle?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full px-3.5 py-1.5 text-[12.5px] font-medium transition-colors",
        active
          ? "bg-ink text-paper"
          : subtle
            ? "bg-transparent text-ink/50 ring-1 ring-ink/15 hover:text-ink"
            : "bg-white text-ink/65 ring-1 ring-ink/12 hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}
