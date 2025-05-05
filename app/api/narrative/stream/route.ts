// app/api/narrative/stream/route.ts
import { NextRequest } from "next/server";
import { PERPLEXITY_URL } from "@/lib/sonarConfig";
import { validateEnv } from "../../envCheck";

export const runtime = "edge";

/**
 * Streams narrative analysis from Perplexity Sonar API
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
          content:
            "Extract 3-5 concise bullet-point narratives about how the media currently portrays this company."
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

    // Log request for debugging
    console.log(`Requesting Perplexity API with company: ${company}`);

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

    // Create a new TransformStream to handle the SSE format
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    // Process the Perplexity stream
    (async () => {
      try {
        if (!perplexityResponse.body) {
          throw new Error("Response body is null");
        }
        const reader = perplexityResponse.body.getReader();

        // Read chunks from Perplexity API
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            // Signal end of stream
            await writer.write(encoder.encode("data: [DONE]\n\n"));
            await writer.close();
            break;
          }

          // Decode the chunk and forward it properly formatted
          const text = decoder.decode(value, { stream: true });

          // Write each line with proper SSE format
          if (text) {
            await writer.write(encoder.encode(text));
          }
        }
      } catch (error) {
        console.error("Error processing stream:", error);
        writer.close();
      }
    })();

    // Return the transformed stream
    return new Response(readable, {
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