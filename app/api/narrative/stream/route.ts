// app/api/narrative/stream/route.ts - Enhanced two-stage pipeline
import { NextRequest } from "next/server";
import { PERPLEXITY_URL } from "@/lib/sonarConfig";
import { validateEnv } from "../../envCheck";
import { redditClient } from "@/lib/redditClient";

export const runtime = "nodejs";

/**
 * Enhanced streaming route that collects ALL Reddit data then uses Perplexity for analysis
 */
export async function GET(req: NextRequest) {
  let company: string | null = null;

  try {
    validateEnv();

    company =
      req.nextUrl.searchParams.get("company") ??
      req.nextUrl.searchParams.get("ticker");

    if (!company) {
      return new Response("Missing company or ticker parameter", { status: 400 });
    }

    // Step 1: Collect ALL Reddit posts
    console.log(`Gathering Reddit data for ${company}`);

    try {
      const redditData = await redditClient.gatherCompanyData(company);

      // Combine all posts - let Perplexity do the sentiment analysis
      const allPosts = [
        ...redditData.bullishPosts,
        ...redditData.bearishPosts,
        ...redditData.neutralPosts
      ];

      if (allPosts.length === 0) {
        throw new Error("No Reddit posts found");
      }

      console.log(`Collected ${allPosts.length} Reddit posts for analysis`);

      // Step 2: Send ALL posts to Perplexity for comprehensive analysis (matching non-streaming route)
      const perplexityBody = {
        model: "sonar-pro",
        stream: true,
        messages: [
          {
            role: "system",
            content: `You are analyzing raw Reddit data for ${company}. Your task is to:

1. ANALYZE sentiment for each post (bullish/bearish/neutral)
2. CALCULATE overall sentiment percentages
3. EXTRACT specific metrics, numbers, and key details
4. IDENTIFY major themes and discussions
5. SYNTHESIZE into 5 detailed bullet points

REQUIRED OUTPUT FORMAT:
• Overall sentiment: X% bullish, Y% bearish, Z% neutral based on [total posts analyzed]
• [Main theme with specific data]: Detailed explanation with multiple specific metrics and numbers from posts (aim for 3-4 sentences with concrete data points)
• [Secondary theme]: Comprehensive coverage of another major discussion topic with specific examples and metrics from posts (aim for 3-4 sentences)
• Bulls focus on: [specific positives] with evidence from posts, including exact metrics, percentages, and quotes from high-engagement posts
• Bears highlight: [specific concerns] with data from posts, including exact numbers, declines, and specific issues raised in discussions

IMPORTANT:
- Extract EXACT numbers, percentages, and metrics from posts
- Include post engagement (upvotes/comments) for significant topics
- Identify specific business details mentioned (acquisitions, products, financials)
- Quote notable posts with high engagement
- Every metric must come from the actual Reddit data provided`
          },
          {
            role: "user",
            content: `Analyze these ${allPosts.length} Reddit posts about ${company} from the past 90 days:

${allPosts.map((post, index) => `
POST ${index + 1}:
Title: ${post.title}
Subreddit: r/${post.subreddit}
Engagement: ${post.score} upvotes, ${post.num_comments} comments
Date: ${new Date(post.created_utc * 1000).toISOString().split('T')[0]}
Content: ${post.selftext.slice(0, 1000)}${post.selftext.length > 1000 ? '...' : ''}
URL: ${post.url}
---`).join('\n')}

Based on ALL these posts:
1. Determine sentiment for each post
2. Calculate overall sentiment breakdown
3. Extract ALL specific metrics mentioned (revenue %, growth rates, valuations, etc.)
4. Identify key business developments discussed
5. Create 5 comprehensive bullet points that capture the complete sentiment picture

Each bullet point should be detailed and contain multiple data points from the posts. Include specific numbers, percentages, company names, analyst targets, and engagement metrics. Make each bullet comprehensive enough to tell a complete story.

Focus on specific numbers and concrete details from the posts, not generic observations.`
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      };

      console.log(`Sending ${allPosts.length} posts to Perplexity for analysis`);

      const perplexityResponse = await fetch(PERPLEXITY_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.PERPLEXITY_API_KEY}`
        },
        body: JSON.stringify(perplexityBody)
      });

      if (!perplexityResponse.ok) {
        throw new Error(`Perplexity error: ${perplexityResponse.status}`);
      }

      if (!perplexityResponse.body) {
        throw new Error("No response stream received");
      }

      // Stream the Perplexity analysis with metadata (matching non-streaming route)
      const transformStream = new TransformStream({
        transform(chunk, controller) {
          controller.enqueue(chunk);
        },
        flush(controller) {
          const encoder = new TextEncoder();

          // Add the source note at the end (matching the non-streaming route)
          const uniqueSubreddits = [...new Set(allPosts.map(p => p.subreddit))];
          const sourceNote = `\n\ndata: {"choices":[{"delta":{"content":"\\n\\nBased on comprehensive analysis of ${allPosts.length} Reddit posts across ${uniqueSubreddits.length} investing subreddits over the past 90 days."}}]}\n\n`;
          controller.enqueue(encoder.encode(sourceNote));

          const doneSignal = `data: [DONE]\n\n`;
          controller.enqueue(encoder.encode(doneSignal));
        }
      });

      return new Response(
        perplexityResponse.body.pipeThrough(transformStream),
        {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
            "X-Data-Source": "reddit-perplexity-synthesis",
            "X-Total-Posts": allPosts.length.toString(),
            "X-Company": company
          }
        }
      );

    } catch (redditError) {
      console.error('Reddit collection error:', redditError);

      // Fallback to Perplexity search if Reddit fails
      const fallbackBody = {
        model: "sonar-pro",
        stream: true,
        messages: [
          {
            role: "system",
            content: `Search Reddit for ${company} sentiment and analyze:
1. Overall sentiment percentages
2. Key metrics and numbers discussed
3. Major themes with specific details
4. Business developments mentioned
5. Create 5 detailed bullet points with concrete data`
          },
          {
            role: "user",
            content: `Analyze Reddit sentiment for ${company} over the past 90 days. Extract specific metrics, growth rates, and business details being discussed. Focus on concrete numbers and facts.`
          }
        ],
        search_domain_filter: {
          include_domains: ["reddit.com"]
        },
        search_context_size: "high",
        temperature: 0.3,
        search_recency_filter: "quarter"
      };

      const fallbackResponse = await fetch(PERPLEXITY_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.PERPLEXITY_API_KEY}`
        },
        body: JSON.stringify(fallbackBody)
      });

      if (!fallbackResponse.ok || !fallbackResponse.body) {
        throw new Error("Fallback search failed");
      }

      return new Response(fallbackResponse.body, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "X-Data-Source": "perplexity-search-fallback",
          "X-Company": company
        }
      });
    }

  } catch (error: any) {
    console.error("Stream error:", error);

    // Error stream
    const encoder = new TextEncoder();
    const errorStream = new ReadableStream({
      start(controller) {
        const errorData = `data: {"choices":[{"delta":{"content":"Error analyzing Reddit sentiment for ${company}: ${error.message}\\n\\nPlease try again or check individual subreddit discussions."}}]}\n\n`;
        controller.enqueue(encoder.encode(errorData));
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      }
    });

    return new Response(errorStream, {
      status: 500,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "X-Error": "true"
      }
    });
  }
}