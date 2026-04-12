import { NextResponse } from "next/server";

// This route reads the token server-side at request time so the mounted
// .env value is always returned — not the value baked into the JS bundle
// at build time.
export async function GET() {
  const token = process.env.NEXT_PUBLIC_OPENCLAW_GATEWAY_TOKEN ?? "";
  return NextResponse.json({ token });
}
