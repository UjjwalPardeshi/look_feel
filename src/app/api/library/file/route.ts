import { NextRequest, NextResponse } from "next/server";
import { get } from "@vercel/blob";
import { LIBRARY_PREFIX, parsePathname } from "@/lib/library/types";

export const dynamic = "force-dynamic";

function blobToken(): string | undefined {
  const direct = process.env.BLOB_READ_WRITE_TOKEN;
  if (direct) return direct;
  for (const [key, value] of Object.entries(process.env)) {
    if (key.endsWith("_READ_WRITE_TOKEN") && value?.startsWith("vercel_blob_rw_")) {
      return value;
    }
  }
  return undefined;
}

/**
 * Streams a library asset out of the *private* Blob store.
 *
 * The store is private, so references are never world-readable — every read is
 * authenticated here with the store credentials. Pathnames are content-addressed
 * (…--{sha256-16}.jpg), so a given path's bytes never change and the response is
 * safe to cache immutably at the edge: only the first request per asset actually
 * hits this function.
 */
export async function GET(request: NextRequest) {
  const pathname = request.nextUrl.searchParams.get("path") ?? "";

  // Hard guard: only well-formed library pathnames, never arbitrary blobs.
  if (!pathname.startsWith(LIBRARY_PREFIX) || !parsePathname(pathname)) {
    return NextResponse.json({ error: "Not a library asset" }, { status: 400 });
  }

  try {
    const result = await get(pathname, { access: "private", token: blobToken() });
    if (!result || result.statusCode !== 200 || !result.stream) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return new NextResponse(result.stream, {
      headers: {
        "content-type": result.blob.contentType || "image/jpeg",
        "cache-control": "public, max-age=31536000, immutable",
      },
    });
  } catch (err) {
    console.error(`library file read failed for ${pathname}:`, err);
    return NextResponse.json({ error: "Read failed" }, { status: 502 });
  }
}
