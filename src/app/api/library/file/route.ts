import { NextRequest, NextResponse } from "next/server";
import { LIBRARY_PREFIX } from "@/lib/library/types";

export const dynamic = "force-dynamic";

const BLOB_HOST_SUFFIX = ".public.blob.vercel-storage.com";

/**
 * Same-origin proxy for library assets, used by the PPTX/PDF exporters as a
 * fallback if a direct cross-origin fetch of a blob URL is ever blocked.
 * Restricted to our own blob store's library/ folder (SSRF guard).
 */
export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("url") ?? "";
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }
  if (
    u.protocol !== "https:" ||
    !u.hostname.endsWith(BLOB_HOST_SUFFIX) ||
    !u.pathname.slice(1).startsWith(LIBRARY_PREFIX)
  ) {
    return NextResponse.json({ error: "Not a library asset" }, { status: 400 });
  }
  try {
    const res = await fetch(u.toString());
    if (!res.ok) {
      return NextResponse.json({ error: `Upstream ${res.status}` }, { status: 502 });
    }
    return new NextResponse(res.body, {
      headers: {
        "content-type": res.headers.get("content-type") ?? "image/jpeg",
        "cache-control": "public, max-age=86400",
      },
    });
  } catch (err) {
    console.error("library file proxy failed:", err);
    return NextResponse.json({ error: "Fetch failed" }, { status: 502 });
  }
}
