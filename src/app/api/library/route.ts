import { NextRequest, NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "node:crypto";
import { del, list, put } from "@vercel/blob";
import { SPACE_TYPES } from "@/lib/spaces";
import { STYLE_DIRECTIONS } from "@/lib/styles";
import {
  buildPathname,
  extForMime,
  parsePathname,
  LIBRARY_PREFIX,
  LIBRARY_SOURCES,
  type IngestItem,
  type LibraryImage,
  type LibrarySource,
} from "@/lib/library/types";
import type { SpaceCategory } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_ITEMS_PER_REQUEST = 100;
const MAX_UPLOAD_BYTES = 6 * 1024 * 1024;
const FETCH_CONCURRENCY = 6;
const LIST_PAGE_LIMIT = 1000;
const LIST_MAX_PAGES = 10;

// Remote images may only be ingested from these hosts (SSRF guard).
const ALLOWED_SOURCE_HOSTS = ["images.unsplash.com"];
const BLOB_HOST_SUFFIX = ".public.blob.vercel-storage.com";

const VALID_CATEGORIES = new Set(SPACE_TYPES.map((s) => s.category));
const VALID_STYLES = new Set(STYLE_DIRECTIONS.map((s) => s.id));

function configured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function hash16(input: string | Buffer): string {
  return createHash("sha256").update(input).digest("hex").slice(0, 16);
}

/**
 * Normalise an Unsplash URL to one canonical rendition so the same photo used
 * at different sizes (hero vs thumbnail) dedupes to a single stored asset.
 */
function canonicalSourceUrl(raw: string): string | undefined {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return undefined;
  }
  if (u.protocol !== "https:") return undefined;
  if (!ALLOWED_SOURCE_HOSTS.includes(u.hostname)) return undefined;
  return `${u.origin}${u.pathname}?auto=format&fit=crop&w=1400&h=950&q=75`;
}

function toLibraryImage(blob: {
  url: string;
  pathname: string;
  size: number;
  uploadedAt: Date | string;
}): LibraryImage | undefined {
  const meta = parsePathname(blob.pathname);
  if (!meta) return undefined;
  if (!VALID_CATEGORIES.has(meta.category)) return undefined;
  return {
    url: blob.url,
    pathname: blob.pathname,
    category: meta.category,
    styleId: meta.styleId,
    source: meta.source,
    hash: meta.hash,
    uploadedAt: new Date(blob.uploadedAt).toISOString(),
    size: blob.size,
  };
}

async function listAll(): Promise<LibraryImage[]> {
  const images: LibraryImage[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < LIST_MAX_PAGES; page++) {
    const res = await list({ prefix: LIBRARY_PREFIX, limit: LIST_PAGE_LIMIT, cursor });
    for (const blob of res.blobs) {
      const img = toLibraryImage(blob);
      if (img) images.push(img);
    }
    if (!res.hasMore || !res.cursor) break;
    cursor = res.cursor;
  }
  // Newest first — matters for the browse UI.
  images.sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
  return images;
}

// ---- GET: list the library ----

export async function GET() {
  if (!configured()) {
    return NextResponse.json({ configured: false, images: [] });
  }
  try {
    const images = await listAll();
    return NextResponse.json({ configured: true, images });
  } catch (err) {
    console.error("library list failed:", err);
    return NextResponse.json(
      { configured: true, images: [], error: "Failed to list library" },
      { status: 500 },
    );
  }
}

// ---- POST: ingest images (remote URLs or uploaded data URLs) ----

interface PreparedItem {
  pathname: string;
  category: SpaceCategory;
  styleId: string;
  source: LibrarySource;
  hash: string;
  contentType: string;
  /** fetch lazily so deduped items never download */
  getBody: () => Promise<Buffer>;
}

function validateCommon(item: IngestItem): string | undefined {
  if (!VALID_CATEGORIES.has(item.category)) return `unknown category "${item.category}"`;
  if (!VALID_STYLES.has(item.styleId)) return `unknown style "${item.styleId}"`;
  if (!LIBRARY_SOURCES.includes(item.source)) return `unknown source "${item.source}"`;
  if (!item.url && !item.dataUrl) return "one of url/dataUrl is required";
  if (item.url && item.dataUrl) return "provide only one of url/dataUrl";
  return undefined;
}

function prepareUrlItem(item: IngestItem): PreparedItem | undefined {
  const canonical = canonicalSourceUrl(item.url ?? "");
  if (!canonical) return undefined;
  const hash = hash16(canonical);
  return {
    pathname: buildPathname(item.category, item.styleId, item.source, hash, "jpg"),
    category: item.category,
    styleId: item.styleId,
    source: item.source,
    hash,
    contentType: "image/jpeg",
    getBody: async () => {
      const res = await fetch(canonical);
      if (!res.ok) throw new Error(`source fetch ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.byteLength > MAX_UPLOAD_BYTES) throw new Error("source image too large");
      return buf;
    },
  };
}

function prepareDataUrlItem(item: IngestItem): PreparedItem | undefined {
  const m = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(item.dataUrl ?? "");
  if (!m) return undefined;
  const contentType = m[1];
  const ext = extForMime(contentType);
  if (!ext) return undefined;
  // Base64 length check before decode (4 chars ≈ 3 bytes).
  if (m[2].length > (MAX_UPLOAD_BYTES / 3) * 4) return undefined;
  const body = Buffer.from(m[2], "base64");
  if (body.byteLength === 0 || body.byteLength > MAX_UPLOAD_BYTES) return undefined;
  const hash = hash16(body);
  return {
    pathname: buildPathname(item.category, item.styleId, item.source, hash, ext),
    category: item.category,
    styleId: item.styleId,
    source: item.source,
    hash,
    contentType,
    getBody: async () => body,
  };
}

export async function POST(request: NextRequest) {
  if (!configured()) {
    return NextResponse.json({ configured: false, added: [], existing: [] });
  }

  let body: { items?: IngestItem[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const items = Array.isArray(body.items) ? body.items.slice(0, MAX_ITEMS_PER_REQUEST) : [];
  if (items.length === 0) {
    return NextResponse.json({ error: "items[] is required" }, { status: 400 });
  }

  // Validate + prepare; reject the request on structural errors, silently skip
  // items whose source host is not allow-listed.
  const prepared: PreparedItem[] = [];
  for (const item of items) {
    const err = validateCommon(item);
    if (err) return NextResponse.json({ error: err }, { status: 400 });
    const p = item.url ? prepareUrlItem(item) : prepareDataUrlItem(item);
    if (p) prepared.push(p);
  }

  // Dedup within the request…
  const byPath = new Map<string, PreparedItem>();
  for (const p of prepared) if (!byPath.has(p.pathname)) byPath.set(p.pathname, p);
  // …and against the store.
  const existingImages = await listAll();
  const existingByPath = new Map(existingImages.map((i) => [i.pathname, i]));

  const toStore = [...byPath.values()].filter((p) => !existingByPath.has(p.pathname));
  const existing = [...byPath.keys()]
    .map((path) => existingByPath.get(path))
    .filter((i): i is LibraryImage => Boolean(i));

  const added: LibraryImage[] = [];
  const failures: string[] = [];
  let cursor = 0;
  async function worker() {
    while (cursor < toStore.length) {
      const p = toStore[cursor++];
      try {
        const data = await p.getBody();
        const blob = await put(p.pathname, data, {
          access: "public",
          contentType: p.contentType,
          addRandomSuffix: false,
          allowOverwrite: true,
        });
        added.push({
          url: blob.url,
          pathname: blob.pathname,
          category: p.category,
          styleId: p.styleId,
          source: p.source,
          hash: p.hash,
          uploadedAt: new Date().toISOString(),
          size: data.byteLength,
        });
      } catch (err) {
        console.error(`library ingest failed for ${p.pathname}:`, err);
        failures.push(p.pathname);
      }
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(FETCH_CONCURRENCY, toStore.length) }, worker),
  );

  return NextResponse.json({
    configured: true,
    added,
    existing,
    ...(failures.length > 0 ? { failed: failures.length } : {}),
  });
}

// ---- DELETE: remove one image ----

function adminTokenMatches(provided: string | null, expected: string): boolean {
  if (!provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function DELETE(request: NextRequest) {
  if (!configured()) {
    return NextResponse.json({ configured: false, ok: false });
  }
  // Optional protection for the destructive endpoint: when LIBRARY_ADMIN_TOKEN
  // is set, deletes require the matching x-library-token header. Unset keeps
  // the zero-config internal-tool behaviour.
  const adminToken = process.env.LIBRARY_ADMIN_TOKEN;
  if (adminToken && !adminTokenMatches(request.headers.get("x-library-token"), adminToken)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let body: { url?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  let u: URL;
  try {
    u = new URL(body.url ?? "");
  } catch {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }
  // Only our own blob store, only library files.
  if (!u.hostname.endsWith(BLOB_HOST_SUFFIX) || !u.pathname.slice(1).startsWith(LIBRARY_PREFIX)) {
    return NextResponse.json({ error: "Not a library asset" }, { status: 400 });
  }
  try {
    await del(body.url as string);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("library delete failed:", err);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
