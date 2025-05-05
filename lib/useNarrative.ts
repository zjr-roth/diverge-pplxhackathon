// lib/useNarrative.ts
import useSWR from "swr";

/**
 * Hook that fetches the media‑narrative bullets for a company.
 * Returns { data, error, isLoading } just like React Query.
 *
 * @param company  Ticker or company name (e.g. "TSLA" or "Tesla")
 */
export function useNarrative(company: string) {
  const { data, error, isLoading } = useSWR(
    company ? `/api/narrative?company=${encodeURIComponent(company)}` : null,
    (url: string) => fetch(url).then((r) => r.json())
  );

  return { data, error, isLoading };
}
