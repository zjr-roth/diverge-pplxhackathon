// lib/useNarrativeStream.ts
import { useEffect, useState } from "react";

// Tiny SSE parser for the OpenAI‑compatible stream
function parse(text: string): string[] {
  return text
    .split("\n")
    .filter((l) => l.startsWith("data:"))
    .map((l) => l.replace(/^data:\s*/, "").trim())
    .filter((l) => l && l !== "[DONE]");
}

/**
 * Stream the narrative bullets incrementally.
 *
 * Returns {chunks, done, error}
 */
export function useNarrativeStream(company: string | null) {
  const [chunks, setChunks] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<null | string>(null);

  useEffect(() => {
    if (!company) return;
    setChunks([]);
    setDone(false);
    setError(null);

    const controller = new AbortController();

    (async () => {
      try {
        const res = await fetch(
          `/api/narrative/stream?company=${encodeURIComponent(company)}`,
          { signal: controller.signal }
        );
        if (!res.ok) throw new Error(await res.text());

        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done: doneReading, value } = await reader.read();
          if (doneReading) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = parse(buffer);
          if (lines.length) {
            setChunks((prev) => [...prev, ...lines]);
            buffer = ""; // reset once consumed
          }
        }
        setDone(true);
      } catch (err: any) {
        if (err.name !== "AbortError") setError(err.message);
      }
    })();

    return () => controller.abort();
  }, [company]);

  return { chunks, done, error };
}
