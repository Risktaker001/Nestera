import { NextRequest, NextResponse } from "next/server";

import { env } from "../../../config/env";

const BACKEND_API_BASE = env.backendApiUrl;

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
