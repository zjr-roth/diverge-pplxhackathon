// lib/sonarConfig.ts
/**
 * Configuration for Perplexity Sonar API
 * Based on Perplexity API documentation
 */

/**
 * Base endpoint for Perplexity's Sonar API.
 * Official URL from Perplexity documentation.
 */
export const PERPLEXITY_URL = process.env.PERPLEXITY_API_URL || "https://api.perplexity.ai/chat/completions";

/**
 * Default model to use for company narrative analysis
 * 'sonar-pro' is recommended for best information retrieval
 */
export const DEFAULT_MODEL = "sonar-pro";

/**
 * Default search source types to include in queries
 */
export const DEFAULT_SOURCE_TYPES = ["news", "blog", "youtube", "twitter"];

/**
 * Default date range for searches (last 30 days)
 */
export const DEFAULT_DATE_RANGE = {
  from: () => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split("T")[0];
  }
};