// app/api/narrative/route.ts - Non-streaming version
import { NextRequest } from "next/server";
import { PERPLEXITY_URL } from "@/lib/sonarConfig";
import { validateEnv } from "../envCheck";
import { redditClient } from "@/lib/redditClient";

export const runtime = "nodejs";

/**
 * Enhanced narrative route that feeds ALL Reddit data to Perplexity for analysis
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

    let narrativeBullets: string[] = [];
    let sources: string[] = [];
    let sourceNote = '';

    try {
      // Step 1: Collect ALL Reddit posts
      console.log(`Gathering Reddit data for ${company}`);
      const redditData = await redditClient.gatherCompanyData(company);

      // Combine all posts - let Perplexity determine sentiment
      const allPosts = [
        ...redditData.bullishPosts,
        ...redditData.bearishPosts,
        ...redditData.neutralPosts
      ];

      if (allPosts.length === 0) {
        throw new Error("No Reddit posts found");
      }

      console.log(`Collected ${allPosts.length} Reddit posts for analysis`);

      // Get unique subreddits for metadata
      const uniqueSubreddits = new Set(allPosts.map(p => p.subreddit));

      // Step 2: Send ALL posts to Perplexity for analysis
      const perplexityBody = {
        model: "sonar-pro",
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
• [Theme 1]: Specific detail with numbers (e.g., "Revenue discussions highlight 15% QoQ growth, $2.3B quarterly revenue")
• [Theme 2]: Specific detail with metrics (e.g., "Product expansion into AI generating $50M ARR, 2M users in 3 months")
• Bulls focus on: [specific positive with evidence] (e.g., "38% operating margins, $5B cash position, authorized $1B buyback")
• Bears highlight: [specific concern with data] (e.g., "Customer churn up from 5% to 8%, competitor gaining 10% market share")

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

Focus on specific numbers and concrete details from the posts, not generic observations.`
          }
        ],
        temperature: 0.3,
        max_tokens: 1500
      };

      const perplexityResponse = await fetch(PERPLEXITY_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.PERPLEXITY_API_KEY}`
        },
        body: JSON.stringify(perplexityBody)
      });

      if (perplexityResponse.ok) {
        const perplexityData = await perplexityResponse.json();
        const content = perplexityData.choices?.[0]?.message?.content || '';

        // Extract bullets from response
        narrativeBullets = content
          .split('\n')
          .filter((line: string) => line.trim().startsWith('•'))
          .slice(0, 5);

        // Use actual Reddit sources
        sources = allPosts
          .sort((a, b) => (b.score + b.num_comments) - (a.score + a.num_comments))
          .slice(0, 10)
          .map(p => p.permalink);

        sourceNote = `\n\nBased on comprehensive analysis of ${allPosts.length} Reddit posts across ${uniqueSubreddits.size} investing subreddits over the past 90 days.`;
      }

    } catch (error) {
      console.error('Reddit collection or analysis error:', error);

      // Fallback to Perplexity search
      const fallbackBody = {
        model: "sonar-pro",
        messages: [
          {
            role: "system",
            content: `Search Reddit for ${company} sentiment and provide detailed analysis with specific metrics and numbers.`
          },
          {
            role: "user",
            content: `Analyze Reddit sentiment for ${company} over the past 90 days. Extract specific metrics, growth rates, and business details being discussed. Provide 5 detailed bullet points with concrete data.`
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

      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json();
        const content = fallbackData.choices?.[0]?.message?.content || '';

        narrativeBullets = content
          .split('\n')
          .filter((line: string) => line.trim().startsWith('•'))
          .slice(0, 5);

        sourceNote = '\n\nSynthesized from Reddit discussions across investing communities.';
      }
    }

    // Final fallback
    if (narrativeBullets.length === 0) {
      narrativeBullets = [
        `• Limited Reddit discussion found for ${company} in recent 90 days`,
        `• Low discussion volume may indicate limited retail investor interest`,
        `• Consider checking alternative ticker symbols or variations`,
        `• Some companies may be discussed using nicknames or abbreviations`,
        `• International stocks may have limited coverage in English subreddits`
      ];
      sourceNote = '\n\nNote: Insufficient data for comprehensive sentiment analysis.';
    }

    // Format response
    let responseText = `Reddit Investor Sentiment Analysis: ${company}

${narrativeBullets.join('\n\n')}${sourceNote}`;

    // Headers
    const responseHeaders: HeadersInit = {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Company": company,
      "X-Data-Source": "reddit-perplexity-synthesis",
      "X-Analysis-Date": new Date().toISOString()
    };

    if (sources.length > 0) {
      responseHeaders["X-Sources"] = JSON.stringify(sources);
    }

    return new Response(responseText, { headers: responseHeaders });

  } catch (error: any) {
    console.error("Narrative route error:", error);
    return new Response(
      JSON.stringify({
        error: `Error generating narrative: ${error.message}`,
        timestamp: new Date().toISOString(),
        company: company
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}