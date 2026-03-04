import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8000";

export async function POST(
  _req: NextRequest,
  { params }: { params: { jobId: string } }
) {
  const res = await fetch(`${BACKEND}/export/${params.jobId}`, { method: "POST" });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
