// lib/sonar.ts
import { PERPLEXITY_URL } from "./sonarConfig";
import type {
  SonarRequest,
  NarrativeAnalysis,
  SonarResponse,
  Message
} from "@/types/perplexity";

/**
 * Gets the media narrative for a company using Perplexity's Sonar API
 * @param company The ticker symbol or company name
 * @param points Number of narrative points to request (3-5 recommended)
 * @returns Narrative analysis with bullet points
 */
export async function fetchNarrative(
  company: string,
  points = 5
): Promise<NarrativeAnalysis> {
  if (!process.env.PERPLEXITY_API_KEY) {
    throw new Error("Missing PERPLEXITY_API_KEY environment variable");
  }

  // Configure messages for narrative generation
  const messages: Message[] = [
    {
      role: "system",
      content:
        "You are NarrativeCheck-GPT. Extract 3-5 concise bullet-point narratives that describe how the media is currently portraying the company. Focus on factual reporting rather than opinions. Do not add analysis or financial data."
    },
    {
      role: "user",
      content: `Company: ${company}\nReturn ${points} bullet points about recent media coverage.`
    }
  ];

  // Build request body for Sonar API
  const requestBody: SonarRequest = {
    model: "sonar-pro", // High-recall search model
    messages,
    // Search across diverse sources for a full picture
    search_sources: {
      types: ["news", "blog", "youtube", "twitter"],
      date_range: {
        // Last 30 days of coverage
        from: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30)
          .toISOString()
          .split("T")[0]
      }
    },
    // Use JSON format for reliable parsing
    response_format: {
      type: "json_object",
      schema: {
        type: "object",
        properties: {
          narratives: {
            type: "array",
            items: { type: "string" },
            minItems: 3,
            maxItems: 5
          }
        },
        required: ["narratives"]
      }
    },
    // Optional: Slightly reduce randomness for more factual outputs
    temperature: 0.3,
  };

  try {
    // Make request to Perplexity API
    const response = await fetch(PERPLEXITY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`
      },
      body: JSON.stringify(requestBody)
    });

    // Handle error responses
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Sonar API error:", errorText);
      throw new Error(`Narrative fetch failed (${response.status})`);
    }

    // Parse the response
    const result = await response.json() as SonarResponse;

    // Ensure we have a valid response
    if (!result.choices?.length || !result.choices[0]?.message?.content) {
      throw new Error("Invalid or empty response from Perplexity API");
    }

    // Parse and extract the narratives from the JSON response
    try {
      const parsedContent = JSON.parse(result.choices[0].message.content) as {
        narratives: string[];
      };

      return {
        company,
        narratives: parsedContent.narratives.filter(Boolean)
      };
    } catch (parseError) {
      console.error("Failed to parse JSON response:", parseError);

      // Fallback: If JSON parsing fails, try to extract content directly
      const content = result.choices[0].message.content;
      const lines = content
        .split(/\r?\n/)
        .map(line => line.replace(/^[-•*]\s*/, "").trim())
        .filter(line => line.length > 0);

      return { company, narratives: lines };
    }
  } catch (error: any) {
    console.error("Error fetching narrative:", error);
    throw new Error(`Failed to get narrative: ${error.message}`);
  }
}