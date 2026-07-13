import type { SpaceCategory } from "../types";

/**
 * The shared reference library. Every image that flows through a deck —
 * generated references and designer uploads — is stored once in Vercel Blob,
 * organised into per-space "folders", and reused for future clients instead of
 * being regenerated. Metadata is encoded in the blob pathname so the store
 * itself is the database:
 *
 *   library/{category}/{styleId}/{source}--{hash}.{ext}
 *   e.g. library/reception/grounded-contemporary/generated--a1b2c3d4e5f60718.jpg
 */

export type LibrarySource = "generated" | "uploaded";

export interface LibraryImage {
  /**
   * Same-origin URL the browser/exporters load the image from. The Blob store
   * is private, so assets are streamed through /api/library/file rather than
   * exposed as public blob URLs. Content-addressed, hence immutably cacheable.
   */
  url: string;
  pathname: string;
  category: SpaceCategory;
  styleId: string;
  source: LibrarySource;
  /** 16-hex content/source hash used for dedup */
  hash: string;
  uploadedAt: string;
  /** bytes */
  size: number;
}

export interface LibraryListResponse {
  configured: boolean;
  images: LibraryImage[];
}

/** One item submitted for ingestion. Exactly one of url / dataUrl is set. */
export interface IngestItem {
  /** remote source image (allow-listed hosts only) */
  url?: string;
  /** user-uploaded image as a data URL */
  dataUrl?: string;
  category: SpaceCategory;
  styleId: string;
  source: LibrarySource;
}

export interface IngestResponse {
  configured: boolean;
  /** images newly stored by this request */
  added: LibraryImage[];
  /** images that already existed (deduped) */
  existing: LibraryImage[];
}

export const LIBRARY_PREFIX = "library/";

/** Same-origin URL that streams a private library asset. */
export function libraryAssetUrl(pathname: string): string {
  return `/api/library/file?path=${encodeURIComponent(pathname)}`;
}

export const LIBRARY_SOURCES: LibrarySource[] = ["generated", "uploaded"];

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function extForMime(mime: string): string | undefined {
  return EXT_BY_MIME[mime];
}

export function mimeForExt(ext: string): string {
  const entry = Object.entries(EXT_BY_MIME).find(([, e]) => e === ext);
  return entry ? entry[0] : "image/jpeg";
}

export function buildPathname(
  category: SpaceCategory,
  styleId: string,
  source: LibrarySource,
  hash: string,
  ext: string,
): string {
  return `${LIBRARY_PREFIX}${category}/${styleId}/${source}--${hash}.${ext}`;
}

/** Parse a blob pathname back into metadata. Returns undefined for foreign files. */
export function parsePathname(
  pathname: string,
): { category: SpaceCategory; styleId: string; source: LibrarySource; hash: string } | undefined {
  if (!pathname.startsWith(LIBRARY_PREFIX)) return undefined;
  const parts = pathname.slice(LIBRARY_PREFIX.length).split("/");
  if (parts.length !== 3) return undefined;
  const [category, styleId, file] = parts;
  const m = /^(generated|uploaded)--([0-9a-f]{16})\.(jpg|png|webp)$/.exec(file);
  if (!m || !category || !styleId) return undefined;
  return {
    category: category as SpaceCategory,
    styleId,
    source: m[1] as LibrarySource,
    hash: m[2],
  };
}
