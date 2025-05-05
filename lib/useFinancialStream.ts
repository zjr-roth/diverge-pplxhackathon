// lib/useFinancialStream.ts
import { useEffect, useState } from "react";

// Define types for the parsed response
interface StreamChunk {
  id?: string;
  object?: string;
  created?: number;
  model?: string;
  choices?: Array<{
    index?: number;
    delta?: { content?: string };
    finish_reason?: string | null;
  }>;
}

// Interface for structured financial data
export interface StreamedFinancialData {
  fundamentals: string[];
  risks: string[];
  trends: string[];
  source: string;
  date: string;
  rawContent: string; // Store raw content for parsing/processing
}

/**
 * Custom hook to stream financial reality data
 * Parses the content into appropriate categories as it arrives
 *
 * @param company Company name or ticker symbol
 * @returns Object with streaming state and structured content
 */
export function useFinancialStream(company: string | null) {
  const [rawContent, setRawContent] = useState<string>("");
  const [parsedData, setParsedData] = useState<StreamedFinancialData>({
    fundamentals: [],
    risks: [],
    trends: [],
    source: "",
    date: "",
    rawContent: ""
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDone, setIsDone] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Parse the accumulated content into structured data
  useEffect(() => {
    if (!rawContent) return;

    try {
      // This is a simplified parser that extracts sections based on common patterns
      // You may need to adjust this based on the actual output format from Perplexity

      // Initialize default data structure
      const data: StreamedFinancialData = {
        fundamentals: [],
        risks: [],
        trends: [],
        source: "",
        date: "",
        rawContent
      };

      // Helper function to extract bullet points with links
      const extractBulletPoints = (text: string, sectionName: string): string[] => {
        // Look for section headers like "Fundamentals:", "Risks:", "Trends:"
        const sectionRegex = new RegExp(`${sectionName}[:\\s]+(.*?)(?=\\b(?:Fundamentals|Risks|Trends|Source):|$)`, 'is');
        const section = text.match(sectionRegex)?.[1]?.trim();

        if (!section) return [];

        // Extract bullet points (numbered or with actual bullets)
        const bulletPoints: string[] = [];
        const lines = section.split(/\n/).map(line => line.trim());

        for (const line of lines) {
          // Skip empty lines
          if (!line) continue;

          // Remove bullet markers or numbers
          const cleanLine = line.replace(/^[•\-\d\.\)]+\s*/, '').trim();
          if (cleanLine) {
            bulletPoints.push(cleanLine);
          }
        }

        return bulletPoints;
      };

      // Extract sections
      data.fundamentals = extractBulletPoints(rawContent, "Fundamentals");
      data.risks = extractBulletPoints(rawContent, "Risks");
      data.trends = extractBulletPoints(rawContent, "Trends");

      // Extract source and date if available
      const sourceMatch = rawContent.match(/Source[:\\s]+([^\n]+)/i);
      const dateMatch = rawContent.match(/Date[:\\s]+([^\n]+)/i);

      if (sourceMatch?.[1]) {
        data.source = sourceMatch[1].trim();
      }

      if (dateMatch?.[1]) {
        data.date = dateMatch[1].trim();
      } else {
        // Default to current date if not found
        data.date = new Date().toISOString().split('T')[0];
      }

      // Normalize to exactly 5 items per section
      // Use the first 5 items if we have more than 5, or pad with empty strings if we have fewer
      const normalizeToFive = (items: string[]): string[] => {
        // If we already have exactly 5 items, return as is
        if (items.length === 5) return items;

        // If we have more than 5, take the first 5
        if (items.length > 5) return items.slice(0, 5);

        // If we have fewer than 5, pad with empty strings
        const result = [...items];
        while (result.length < 5) {
          result.push("");
        }
        return result;
      };

      // Apply normalization to all sections
      data.fundamentals = normalizeToFive(data.fundamentals);
      data.risks = normalizeToFive(data.risks);
      data.trends = normalizeToFive(data.trends);

      // Update parsed data
      setParsedData(data);
    } catch (err) {
      console.error("Error parsing financial data stream:", err);
    }
  }, [rawContent]);

  // Stream processing
  useEffect(() => {
    // Reset state when company changes
    if (!company) return;

    setRawContent("");
    setIsLoading(true);
    setIsDone(false);
    setError(null);
    setParsedData({
      fundamentals: [],
      risks: [],
      trends: [],
      source: "",
      date: "",
      rawContent: ""
    });

    const controller = new AbortController();
    const { signal } = controller;

    // Define a function to process the EventSource events
    const processStream = async () => {
      try {
        const encodedCompany = encodeURIComponent(company);
        const response = await fetch(
          `/api/financial/stream?company=${encodedCompany}`,
          { signal }
        );

        // Handle HTTP error responses
        if (!response.ok) {
          let errorMessage = `HTTP error ${response.status}`;

          // Try to parse error details if available
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorData.details || errorMessage;
            console.error("API Error:", errorData);
          } catch (e) {
            // Fallback to text if not JSON
            const errorText = await response.text();
            errorMessage = errorText || errorMessage;
          }

          throw new Error(errorMessage);
        }

        // Ensure we have a readable stream
        if (!response.body) {
          throw new Error("Response has no body stream");
        }

        // Setup stream reader and text decoder
        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";

        // Read stream chunks
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            setIsDone(true);
            setIsLoading(false);
            break;
          }

          // Decode chunk and add to buffer
          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;

          // Process all complete SSE lines in buffer
          const lines = buffer.split("\n");

          // Keep last (potentially incomplete) line in buffer
          buffer = lines.pop() || "";

          // Process each complete line
          for (const line of lines) {
            // Skip empty lines or non-data lines
            if (!line.trim() || !line.startsWith("data:")) continue;

            // Extract the data portion
            const data = line.slice(5).trim();
            if (data === "[DONE]") {
              setIsDone(true);
              setIsLoading(false);
              continue;
            }

            try {
              // Parse the JSON data
              const parsed = JSON.parse(data) as StreamChunk;

              // Check if we have content in the delta
              if (parsed.choices?.[0]?.delta?.content) {
                const newContent = parsed.choices[0].delta.content;
                setRawContent(prev => prev + newContent);
              }

              // Check if stream is finished
              if (parsed.choices?.[0]?.finish_reason) {
                setIsDone(true);
                setIsLoading(false);
              }
            } catch (e) {
              console.warn("Failed to parse stream chunk:", data, e);
            }
          }
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("Stream error:", err);
          setError(err.message);
        }
        setIsLoading(false);
        setIsDone(true);
      }
    };

    // Start processing the stream
    processStream();

    // Cleanup: abort fetch on component unmount or company change
    return () => {
      controller.abort();
    };
  }, [company]);

  return {
    financialData: parsedData,
    rawContent,
    isLoading,
    isDone,
    error
  };
}