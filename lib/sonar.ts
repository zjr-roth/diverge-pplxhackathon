// lib/sonar.ts
import type { ChatCompletionRequestMessage } from "openai-edge";
import { PERPLEXITY_URL } from "../lib/sonarConfig";

export interface SonarResponse {
  company: string;
  narratives: string[];
}

export async function fetchNarrative(
  company: string,
  points = 5
): Promise<SonarResponse> {
  const messages: ChatCompletionRequestMessage[] = [
    {
      role: "system",
      content:
        "You are NarrativeCheck‑GPT. Extract 3‑5 concise bullet‑point narratives that describe how the media is currently portraying the company. Do **not** add analysis or financial data."
    },
    {
      role: "user",
      content: `Company: ${company}\nReturn ${points} bullet points.`
    }
  ];

  const body = {
    model: "sonar-pro",                // high‑recall search model
    messages,
    // Narrow search scope: news, blogs, YouTube, Twitter
    search_sources: {
      types: ["news", "blog", "youtube", "twitter"],
      date_range: {                    // last 30 days
        from: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30)
          .toISOString()
          .split("T")[0]
      }
    },
    // Ask Sonar to deliver bullet‑point JSON to simplify parsing
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
    }
  };

  const res = await fetch(PERPLEXITY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY!}`
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Sonar API error", text);
    throw new Error("Narrative fetch failed");
  }

  const { choices } = (await res.json()) as {
    choices: { message: { content: string } }[];
  };

  const parsed = JSON.parse(choices[0].message.content) as {
    narratives: string[];
  };

  return { company, narratives: parsed.narratives };
}
