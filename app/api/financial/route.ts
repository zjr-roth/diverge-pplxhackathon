// app/api/financial/route.ts
import { NextRequest, NextResponse } from "next/server";
import { fetchFinancialReality } from "../../../lib/sonarFinancial";
import { validateEnv } from "../envCheck";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  try {
    // Validate environment variables are set
    validateEnv();

    const { searchParams } = req.nextUrl;
    const company = searchParams.get("company") ?? searchParams.get("ticker");

    if (!company) {
      return NextResponse.json(
        { error: "Query param ?company= or ?ticker= is required" },
        { status: 400 }
      );
    }

    try {
      const data = await fetchFinancialReality(company.toUpperCase());

      // Cache for 1 day as financial data doesn't change that frequently
      return new NextResponse(JSON.stringify(data), {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "s-maxage=86400, stale-while-revalidate=3600"
        }
      });
    } catch (e: any) {
      console.error("Financial API error:", e);
      return NextResponse.json(
        {
          error: e.message,
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  } catch (e: any) {
    // Handle env validation errors
    return NextResponse.json(
      { error: e.message },
      { status: 500 }
    );
  }
}