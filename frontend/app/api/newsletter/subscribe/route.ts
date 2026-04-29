import { NextRequest, NextResponse } from "next/server";

const BACKEND_API_BASE =
  process.env.BACKEND_API_URL ?? process.env.NEXT_PUBLIC_BACKEND_API_URL ?? "http://localhost:3001/api/v1";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body?.email === "string" ? body.email.trim() : "";

    if (!email) {
      return NextResponse.json(
        { message: "Email is required." },
        { status: 400 },
      );
    }

    const upstream = await fetch(`${BACKEND_API_BASE}/newsletter/subscribe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
      cache: "no-store",
    });

    const payload = await upstream.json().catch(() => ({}));

    return NextResponse.json(payload, { status: upstream.status });
  } catch {
    return NextResponse.json(
      { message: "Unable to process newsletter subscription." },
      { status: 500 },
    );
  }
}
