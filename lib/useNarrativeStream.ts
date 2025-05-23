// lib/useNarrativeStream.ts
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

// Structure for a bullet point with source link
export interface NarrativeBullet {
  text: string;    // The main narrative text
  source?: {
    url: string;   // The URL to the source
    title: string; // Optional title for the link
  };
  raw: string;     // The raw bullet point text with markdown
}

/**
 * Custom hook to stream narrative analysis for a company/ticker
 * Incrementally builds up the response and parses in bullet points with sources
 *
 * @param company Company name or ticker symbol
 * @returns Object with streaming state and content
 */
export function useNarrativeStream(company: string | null) {
  const [rawContent, setRawContent] = useState<string>("");
  const [bullets, setBullets] = useState<NarrativeBullet[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDone, setIsDone] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Parse the accumulated content into bullet points
  useEffect(() => {
    if (!rawContent) return;

    try {
      // Split into bullet points (looking for common bullet markers)
      const lines = rawContent
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(line => line.length > 0);

      const extractedBullets: NarrativeBullet[] = [];

      for (const line of lines) {
        // Remove bullet markers or numbers from the beginning of the line
        const cleanLine = line.replace(/^[-•*\d.\s)]+\s*/, '').trim();
        if (!cleanLine) continue;

        // Look for Markdown-style links: [Title](URL)
        const linkMatch = cleanLine.match(/\[([^\]]+)\]\(([^)]+)\)/);

        if (linkMatch) {
          // Extract the text before the link
          const textBeforeLink = cleanLine.substring(0, linkMatch.index).trim();

          // Create a bullet with source
          extractedBullets.push({
            text: textBeforeLink || cleanLine, // Use the whole text if no clear separation
            source: {
              title: linkMatch[1],
              url: linkMatch[2]
            },
            raw: cleanLine
          });
        } else {
          // No source link found, keep as is
          extractedBullets.push({
            text: cleanLine,
            raw: cleanLine
          });
        }
      }

      // Update bullets, limiting to exactly 5
      // If we have more than 5, take the first 5
      // If we have less than 5, pad with empty placeholders until streaming completes
      const limitedBullets = extractedBullets.slice(0, 5);

      // Don't pad with placeholders if we're still loading
      if (isDone && limitedBullets.length < 5) {
        while (limitedBullets.length < 5) {
          limitedBullets.push({
            text: "Information not available",
            raw: "Information not available"
          });
        }
      }

      setBullets(limitedBullets);
    } catch (err) {
      console.error("Error parsing narrative bullets:", err);
    }
  }, [rawContent, isDone]);

  useEffect(() => {
    // Reset state when company changes
    if (!company) return;

    setRawContent("");
    setBullets([]);
    setIsLoading(true);
    setIsDone(false);
    setError(null);

    const controller = new AbortController();
    const { signal } = controller;

    // Define a function to process the EventSource events
    const processStream = async () => {
      try {
        const encodedCompany = encodeURIComponent(company);
        const response = await fetch(
          `/api/narrative/stream?company=${encodedCompany}`,
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
    bulletPoints: bullets,
    rawContent,
    isLoading,
    isDone,
    error
  };
}