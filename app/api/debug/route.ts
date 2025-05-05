// app/api/debug/route.ts
import { NextResponse } from "next/server";
import { PERPLEXITY_URL } from "@/lib/sonarConfig";

export const runtime = "edge";

export async function GET() {
  try {
    // Check if API key is present
    const apiKey = process.env.PERPLEXITY_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          apiKey: "missing",
          url: PERPLEXITY_URL,
          error: "API key is not configured in environment variables",
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }

    // Return basic debug info (without exposing the full API key)
    return NextResponse.json({
      apiKey: "valid",
      url: PERPLEXITY_URL,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    return NextResponse.json(
      {
        apiKey: "error",
        url: PERPLEXITY_URL,
        error: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}