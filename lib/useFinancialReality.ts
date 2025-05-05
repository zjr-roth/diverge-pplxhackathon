// lib/useFinancialReality.ts
import useSWR from "swr";
import type { FinancialReality } from "./sonarFinancial";

/**
 * Custom hook to fetch financial reality data for a company
 * Uses SWR for data fetching with caching and revalidation
 *
 * @param company Company name or ticker symbol
 * @returns Object with financial data, loading state, and error
 */
export function useFinancialReality(company: string | null) {
  const { data, error, isLoading } = useSWR(
    company ? `/api/financial?company=${encodeURIComponent(company)}` : null,
    async (url: string) => {
      const res = await fetch(url);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `HTTP error ${res.status}`);
      }
      return res.json();
    }
  );

  return {
    financialData: data as FinancialReality | undefined,
    isLoading,
    error: error?.message || null
  };
}