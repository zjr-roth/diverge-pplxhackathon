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

/**
 * Custom hook to stream narrative analysis for a company/ticker
 * Incrementally builds up the response as chunks arrive
 *
 * @param company Company name or ticker symbol
 * @returns Object with streaming state and content
 */
export function useNarrativeStream(company: string | null) {
  const [content, setContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDone, setIsDone] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Reset state when company changes
    if (!company) return;

    setContent("");
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
                setContent(prev => prev + newContent);
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

  return { content, isLoading, isDone, error };
}