import { NextResponse } from "next/server";
import ably from "ably/promises"

export async function GET() {
  const token = await new ably.Rest(
    process.env["ABLY_API_KEY"]!
  ).auth.createTokenRequest({
    capability: {
      "*": ["subscribe"]
    }
  })
  return NextResponse.json( token )
}
