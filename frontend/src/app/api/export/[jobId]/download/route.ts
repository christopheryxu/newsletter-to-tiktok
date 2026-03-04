import { NextRequest } from "next/server";

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8000";

export async function GET(
  _req: NextRequest,
  { params }: { params: { jobId: string } }
) {
  const res = await fetch(`${BACKEND}/export/${params.jobId}/download`);
  return new Response(res.body, {
    headers: {
      "Content-Type": "video/mp4",
      "Content-Disposition": `attachment; filename="tiktok_${params.jobId.slice(0, 8)}.mp4"`,
    },
  });
}
