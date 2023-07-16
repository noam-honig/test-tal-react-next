import { NextResponse } from "next/server";
import ably from "ably/promises";

export async function GET() {
  const token = await new ably.Rest({
    queryTime: true,
    key: process.env["ABLY_API_KEY"]!,
  }).auth.createTokenRequest({
    capability: {
      "*": ["subscribe", "publish", "presence"],
    },
  });
  return NextResponse.json(token, { headers: { "Cache-Control": "no-store" } });
}
