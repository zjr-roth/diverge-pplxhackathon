// lib/sonarFinancial.ts
import { PERPLEXITY_URL } from "./sonarConfig";
import type {
  SonarRequest,
  SonarResponse,
  Message
} from "@/types/perplexity";

export interface FinancialReality {
  company: string;
  fundamentals: string[];
  risks: string[];
  trends: string[];
  source: string;  // Source of the financial data (10-K, 10-Q, earnings call, etc.)
  date: string;    // Date of the most recent financial filing/data
}

/**
 * Fetches financial reality (fundamentals, risks, trends) for a company
 * using Perplexity Sonar API with filters to focus on official financial sources
 *
 * @param company Company name or ticker symbol to analyze
 * @returns FinancialReality object with financial information
 */
export async function fetchFinancialReality(
  company: string
): Promise<FinancialReality> {
  if (!process.env.PERPLEXITY_API_KEY) {
    throw new Error("Missing PERPLEXITY_API_KEY environment variable");
  }

  // Configure messages for financial data extraction
  const messages: Message[] = [
    {
      role: "system",
      content: `You are FinancialReality-GPT. Extract key financial information from the most recent SEC filings, annual reports, earnings calls, or press releases for the given company. Focus on:

1. Fundamentals: 3-5 key metrics and financial health indicators
2. Risks: 3-5 key risks or challenges mentioned in financial filings
3. Trends: 3-5 important trends or future outlook points

For each data point, include a brief explanation of its significance.
Base your analysis only on verifiable financial information from official sources.
Include information about which filing or report contains this data (10-K, 10-Q, earnings call, etc.) and its date.

Return the data in JSON format with the following structure:
{
  "fundamentals": ["item 1", "item 2", ...],
  "risks": ["risk 1", "risk 2", ...],
  "trends": ["trend 1", "trend 2", ...],
  "source": "filing type (e.g., 10-K Q1 2025)",
  "date": "filing date (e.g., March 15, 2025)"
}`
    },
    {
      role: "user",
      content: `Company: ${company}

Extract the financial reality (fundamentals, risks, trends) from the most recent official financial filings or earnings reports.`
    }
  ];

  // Build request body for Sonar API with filters for financial sources
  const requestBody: SonarRequest = {
    model: "sonar-pro", // High-recall search model
    messages,
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
      throw new Error(`Financial data fetch failed (${response.status})`);
    }

    // Parse the response
    const result = await response.json() as SonarResponse;

    // Ensure we have a valid response
    if (!result.choices?.length || !result.choices[0]?.message?.content) {
      throw new Error("Invalid or empty response from Perplexity API");
    }

    // Parse and extract the financial data from the JSON response
    try {
      const contentStr = result.choices[0].message.content;

      // Try to extract JSON if it's wrapped in backticks
      let jsonStr = contentStr;
      const jsonMatch = contentStr.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch && jsonMatch[1]) {
        jsonStr = jsonMatch[1];
      }

      const financialData = JSON.parse(jsonStr) as Partial<FinancialReality>;

      // Create a default structure if any fields are missing
      const defaultData: FinancialReality = {
        company,
        fundamentals: financialData.fundamentals || ["No fundamental data available"],
        risks: financialData.risks || ["No risk data available"],
        trends: financialData.trends || ["No trend data available"],
        source: financialData.source || "Recent financial data",
        date: financialData.date || new Date().toISOString().split('T')[0]
      };

      return defaultData;
    } catch (parseError) {
      console.error("Failed to parse JSON response:", parseError);

      // Extract content as plain text if JSON parsing fails
      const content = result.choices[0].message.content;

      // Try to extract sections using regex
      const fundamentalsMatch = content.match(/Fundamentals:?([\s\S]*?)(?=Risks:|Trends:|$)/i);
      const risksMatch = content.match(/Risks:?([\s\S]*?)(?=Fundamentals:|Trends:|$)/i);
      const trendsMatch = content.match(/Trends:?([\s\S]*?)(?=Fundamentals:|Risks:|$)/i);

      // Extract bullet points
      const extractBullets = (text?: string): string[] => {
        if (!text) return ["No data available"];
        const bullets = text.split(/\n/).map(line =>
          line.replace(/^[-•*]\s*/, '').trim()
        ).filter(line => line.length > 0);
        return bullets.length > 0 ? bullets : ["No data available"];
      };

      // Build fallback financial data
      const fallbackData: FinancialReality = {
        company,
        fundamentals: extractBullets(fundamentalsMatch?.[1]),
        risks: extractBullets(risksMatch?.[1]),
        trends: extractBullets(trendsMatch?.[1]),
        source: "Data extracted from recent financial reports",
        date: new Date().toISOString().split('T')[0]
      };

      return fallbackData;
    }
  } catch (error: any) {
    console.error("Error fetching financial data:", error);
    throw new Error(`Failed to get financial data: ${error.message}`);
  }
}