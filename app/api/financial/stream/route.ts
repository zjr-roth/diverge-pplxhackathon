// app/api/financial/stream/route.ts
import { NextRequest } from "next/server";
import { PERPLEXITY_URL } from "@/lib/sonarConfig";
import { validateEnv } from "../../envCheck";

export const runtime = "edge";

/**
 * Streams financial reality analysis from Perplexity Sonar API
 * - Uses SSE (Server-Sent Events) format
 * - Proxies the stream directly to client
 */
export async function GET(req: NextRequest) {
  try {
    // Validate environment variables
    validateEnv();

    const company =
      req.nextUrl.searchParams.get("company") ??
      req.nextUrl.searchParams.get("ticker");

    if (!company) {
      return new Response("Missing company or ticker parameter", { status: 400 });
    }

    // Build Perplexity Sonar request with streaming enabled
    const body = {
      model: "sonar-pro",
      stream: true, // Essential for token-by-token streaming
      messages: [
        {
          role: "system",
          content: `You are FinancialReality-GPT. Extract key financial information from the most recent SEC filings, annual reports, earnings calls, or press releases for the given company.

**CRITICAL REQUIREMENTS**:
1. Provide EXACTLY 5 bullet points in each of the following categories:
   - Fundamentals: EXACTLY 5 key metrics and financial health indicators
   - Risks: EXACTLY 5 key risks or challenges mentioned in financial filings
   - Trends: EXACTLY 5 important trends or future outlook points

2. Number format: Use numbered format (1., 2., 3., etc.) for each bullet point.

3. Each bullet point MUST include:
   - A concise explanation of the metric/risk/trend
   - Its significance to investors
   - A clickable source link in Markdown format at the end: "[Source](URL)"

4. Structure your response with clear headings for:
   - Fundamentals: (5 numbered points)
   - Risks: (5 numbered points)
   - Trends: (5 numbered points)
   - Source: (which filing or report contains this data)
   - Date: (date of the report/filing)

Base your analysis ONLY on verifiable financial information from official sources.

**AGAIN, IT IS ABSOLUTELY CRITICAL that you provide EXACTLY 5 points for EACH section - no more, no less. If you cannot find 5 distinct points for any section, create generic but plausible points to reach exactly 5.**`
        },
        {
          role: "user",
          content: `Company: ${company}

Extract the financial reality (fundamentals, risks, trends) from the most recent official financial filings or earnings reports.`
        }
      ],
      // Filter for financial and official sources
      search_sources: {
        // Focus on official websites, SEC, financial sites
        domains: {
          allow: [
            "sec.gov",       // SEC filings
            "investor.gov",  // Investor information
            `${company.toLowerCase()}.com`, // Company website (approximate)
            "bloomberg.com", // Financial news
            "wsj.com",       // Financial news
            "reuters.com",   // Financial news
            "ft.com",        // Financial news
            "cnbc.com",      // Financial news
            "fool.com",      // Investment analysis
            "investopedia.com" // Financial information
          ]
        },
        // Last 365 days (most recent annual report cycle)
        date_range: {
          from: new Date(Date.now() - 1000 * 60 * 60 * 24 * 365)
            .toISOString()
            .split("T")[0]
        }
      },
      // Reduce randomness for more factual outputs
      temperature: 0.2,
    };

    // Log request for debugging
    console.log(`Requesting Perplexity API for financial data: ${company}`);

    // Make request to Perplexity
    const perplexityResponse = await fetch(PERPLEXITY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.PERPLEXITY_API_KEY}`
      },
      body: JSON.stringify(body)
    });

    // Handle error responses with detailed error information
    if (!perplexityResponse.ok) {
      const errorText = await perplexityResponse.text();
      console.error(`Perplexity API error (${perplexityResponse.status}):`, errorText);

      // Return more detailed error
      return new Response(
        JSON.stringify({
          error: `Perplexity API error (${perplexityResponse.status})`,
          details: errorText,
          endpoint: PERPLEXITY_URL,
          timestamp: new Date().toISOString()
        }),
        {
          status: perplexityResponse.status,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }

    // Verify we received a readable stream
    if (!perplexityResponse.body) {
      return new Response("No response stream received from Perplexity", {
        status: 500
      });
    }

    // Return the transformed stream
    return new Response(perplexityResponse.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive"
      }
    });
  } catch (error: any) {
    console.error("Stream error:", error);
    return new Response(
      JSON.stringify({
        error: `Error processing stream: ${error.message}`,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  }
}