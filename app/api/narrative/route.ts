// app/api/narrative/route.ts
import { NextRequest, NextResponse } from "next/server";
import { fetchNarrative } from "@/lib/sonar";

export const runtime = "edge";      // ✅ zero cold‑start in Vercel Edge

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const company = searchParams.get("company") ?? searchParams.get("ticker");

  if (!company) {
    return NextResponse.json(
      { error: "Query param ?company= or ?ticker= is required" },
      { status: 400 }
    );
  }

  try {
    const data = await fetchNarrative(company.toUpperCase());
    // 🗝️ Cache for 12 h to cut API spend; tweak as you like
    return new NextResponse(JSON.stringify(data), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "s-maxage=43200, stale-while-revalidate"
      }
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
