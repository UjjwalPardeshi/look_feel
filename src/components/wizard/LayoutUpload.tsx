"use client";

import { useRef, useState } from "react";
import { FileUp, Loader2, ScanSearch, X, Check, AlertTriangle } from "lucide-react";
import type { Brief } from "@/lib/types";
import { extractLayoutText } from "@/lib/layout/extract";
import { detectSpacesFromText, type LayoutDetection } from "@/lib/layout/detect";
import { cn } from "@/lib/cn";

type State =
  | { kind: "idle" }
  | { kind: "working"; label: string }
  | { kind: "done"; fileName: string; detection: LayoutDetection; method: string }
  | { kind: "error"; message: string };

interface LayoutUploadProps {
  brief: Brief;
  onChange: (patch: Partial<Brief>) => void;
}

/**
 * "Upload your layout" — reads a floor plan (PDF or image), detects the spaces
 * on it, and pre-selects the checklist below with quantities. The designer can
 * still adjust everything afterwards; the plan never leaves the browser.
 */
export function LayoutUpload({ brief, onChange }: LayoutUploadProps) {
  const [state, setState] = useState<State>({ kind: "idle" });
  const [dragOver, setDragOver] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (state.kind === "working") return;
    setState({ kind: "working", label: "Opening the plan" });
    try {
      const extracted = await extractLayoutText(file, (label) =>
        setState({ kind: "working", label }),
      );
      setState({ kind: "working", label: "Detecting spaces" });
      const detection = detectSpacesFromText(extracted.text);
      if (detection.selections.length === 0) {
        setState({
          kind: "error",
          message:
            extracted.method === "ocr"
              ? "Couldn't recognise any room labels on that plan — try a sharper export, or pick the spaces manually below."
              : "No room labels found in that file — pick the spaces manually below.",
        });
        return;
      }
      // Apply to the brief: detected spaces replace the checklist selection,
      // and the sheet title fills the project name if it's still empty.
      onChange({
        spaces: detection.selections,
        ...(brief.projectName.trim() === "" && detection.planTitle
          ? { projectName: detection.planTitle }
          : {}),
      });
      setState({
        kind: "done",
        fileName: file.name,
        detection,
        method: extracted.method === "pdf-text" ? "plan text" : "OCR",
      });
    } catch (err) {
      setState({
        kind: "error",
        message: err instanceof Error ? err.message : "Couldn't read that file — please try another export.",
      });
    }
  }

  function onInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) void handleFile(file);
  }

  const working = state.kind === "working";

  return (
    <div className="mb-8">
      <input
        ref={input}
        type="file"
        accept="application/pdf,image/png,image/jpeg,image/webp,.pdf,.png,.jpg,.jpeg,.webp"
        className="hidden"
        onChange={onInput}
        data-testid="layout-file-input"
      />

      {state.kind !== "done" && (
        <button
          type="button"
          onClick={() => !working && input.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const file = e.dataTransfer.files?.[0];
            if (file && !working) void handleFile(file);
          }}
          className={cn(
            "flex w-full flex-col items-center gap-2 rounded-2xl border border-dashed px-6 py-7 text-center transition-all sm:flex-row sm:gap-5 sm:text-left",
            dragOver
              ? "border-clay-500 bg-clay-50"
              : "border-ink/20 bg-white/50 hover:border-clay-500 hover:bg-white",
            working && "cursor-wait opacity-90",
          )}
        >
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-clay-100 text-clay-700">
            {working ? <Loader2 className="h-5 w-5 animate-spin" /> : <ScanSearch className="h-5 w-5" />}
          </span>
          <span className="flex-1">
            <span className="block text-[15px] font-semibold text-ink">
              {working ? `${state.label}…` : "Have a layout? Upload it"}
            </span>
            <span className="mt-0.5 block text-[13px] text-ink/55">
              {working
                ? "Reading the plan and detecting its spaces"
                : "PDF or image of the floor plan — spaces below get selected automatically. CAD-exported PDFs read exactly; images work best at high resolution. Files never leave your browser."}
            </span>
          </span>
          {!working && (
            <span className="btn-ghost pointer-events-none !px-4 !py-2 text-[13px]">
              <FileUp className="h-4 w-4" /> Choose file
            </span>
          )}
        </button>
      )}

      {state.kind === "error" && (
        <p className="mt-3 flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-[13px] text-red-800 ring-1 ring-red-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {state.message}
        </p>
      )}

      {state.kind === "done" && (
        <div className="rounded-2xl border border-clay-300 bg-clay-50/60 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-clay-600 text-white">
                <Check className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[14.5px] font-semibold text-ink">
                  {state.detection.planTitle ?? "Layout"} read from {state.fileName}
                </p>
                <p className="text-[12.5px] text-ink/55">
                  Detected via {state.method} — applied to the checklist below, adjust freely.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setState({ kind: "idle" })}
              className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-3 py-1.5 text-[12px] font-medium text-ink/60 transition-colors hover:border-ink/35 hover:text-ink"
            >
              <X className="h-3.5 w-3.5" /> Use another layout
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {state.detection.evidence.map((e) => (
              <span
                key={e.spaceId}
                className="rounded-full bg-white px-3 py-1.5 text-[12px] font-medium text-ink ring-1 ring-clay-300"
              >
                {e.label} ×{e.quantity}
                {e.detail && <span className="text-ink/50"> · {e.detail}</span>}
              </span>
            ))}
          </div>

          {state.detection.infrastructure.length > 0 && (
            <p className="mt-3 text-[12px] leading-relaxed text-ink/50">
              Also on the plan (not deck material):{" "}
              {state.detection.infrastructure.join(" · ")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
