import { NextRequest } from "next/server";

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8000";

export async function GET(
  _req: NextRequest,
  { params }: { params: { jobId: string } }
) {
  const backendRes = await fetch(`${BACKEND}/pipeline/${params.jobId}/stream`, {
    headers: { Accept: "text/event-stream" },
    // @ts-ignore — Node fetch supports this
    duplex: "half",
  });

  return new Response(backendRes.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    },
  });
}
