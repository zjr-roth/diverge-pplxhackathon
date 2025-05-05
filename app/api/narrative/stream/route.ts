// app/api/narrative/stream/route.ts
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const company =
    req.nextUrl.searchParams.get("company") ??
    req.nextUrl.searchParams.get("ticker");

  if (!company)
    return new Response("Missing ?company= query param", { status: 400 });

  // --- Build the Perplexity Chat/Sonar request ---------------------------
  const body = {
    model: "sonar-pro",
    stream: true,                       // ⬅️  turn on chunked mode
    messages: [
      {
        role: "system",
        content:
          "Extract 3‑5 concise bullet‑point narratives about how the media currently portrays this company."
      },
      {
        role: "user",
        content: `Company: ${company}\nReturn bullet points only.`
      }
    ],
    search_sources: {
      types: ["news", "blog", "youtube", "twitter"],
      date_range: {
        from: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30)
          .toISOString()
          .split("T")[0]
      }
    }
  };

  const plexRes = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY!}`
    },
    body: JSON.stringify(body)
  });

  if (!plexRes.ok)
    return new Response(await plexRes.text(), { status: plexRes.status });

  // --- Simply pipe Perplexity's SSE stream straight through --------------
  return new Response(plexRes.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      // allow the browser to start painting chunks immediately
      "Transfer-Encoding": "chunked"
    }
  });
}
