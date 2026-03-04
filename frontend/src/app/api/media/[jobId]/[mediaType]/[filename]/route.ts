import { NextRequest } from "next/server";

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8000";

export async function GET(
  _req: NextRequest,
  { params }: { params: { jobId: string; mediaType: string; filename: string } }
) {
  const { jobId, mediaType, filename } = params;
  const res = await fetch(`${BACKEND}/media/${jobId}/${mediaType}/${filename}`);
  if (!res.ok) {
    return new Response("Not found", { status: 404 });
  }
  const contentType = res.headers.get("content-type") ?? "application/octet-stream";
  return new Response(res.body, {
    headers: { "Content-Type": contentType },
  });
}
