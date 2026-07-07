"use client";

import { useState } from "react";
import { Download, FileDown, Loader2, Check } from "lucide-react";
import type { Deck } from "@/lib/types";
import { exportPptx } from "@/lib/deck/pptx";
import { exportPdf } from "@/lib/deck/pdf";
import { cn } from "@/lib/cn";

type Job = { kind: "pptx" | "pdf"; label: string; pct: number } | null;

export function ExportBar({ deck, className }: { deck: Deck; className?: string }) {
  const [job, setJob] = useState<Job>(null);
  const [done, setDone] = useState<"pptx" | "pdf" | null>(null);

  async function run(kind: "pptx" | "pdf") {
    if (job) return;
    setDone(null);
    setJob({ kind, label: "Starting", pct: 0 });
    const onProgress = (label: string, pct: number) => setJob({ kind, label, pct });
    try {
      if (kind === "pptx") await exportPptx(deck, onProgress);
      else await exportPdf(deck, onProgress);
      setDone(kind);
      setTimeout(() => setDone(null), 2600);
    } catch (err) {
      console.error(err);
      setJob({ kind, label: "Export failed — please retry", pct: 1 });
      setTimeout(() => setJob(null), 2600);
      return;
    }
    setJob(null);
  }

  const busy = job !== null;

  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-center", className)}>
      <button onClick={() => run("pptx")} disabled={busy} className="btn-primary">
        {job?.kind === "pptx" ? <Loader2 className="h-4 w-4 animate-spin" /> : done === "pptx" ? <Check className="h-4 w-4" /> : <Download className="h-4 w-4" />}
        {job?.kind === "pptx" ? job.label : done === "pptx" ? "Downloaded" : "Download PPTX"}
      </button>
      <button onClick={() => run("pdf")} disabled={busy} className="btn-ghost">
        {job?.kind === "pdf" ? <Loader2 className="h-4 w-4 animate-spin" /> : done === "pdf" ? <Check className="h-4 w-4" /> : <FileDown className="h-4 w-4" />}
        {job?.kind === "pdf" ? job.label : done === "pdf" ? "Downloaded" : "Download PDF"}
      </button>

      {busy && (
        <div className="flex items-center gap-3 sm:ml-2">
          <div className="h-1.5 w-40 overflow-hidden rounded-full bg-ink/10">
            <div
              className="h-full rounded-full bg-clay-500 transition-all duration-300"
              style={{ width: `${Math.round((job?.pct ?? 0) * 100)}%` }}
            />
          </div>
          <span className="text-xs tabular-nums text-ink/50">{Math.round((job?.pct ?? 0) * 100)}%</span>
        </div>
      )}
    </div>
  );
}
