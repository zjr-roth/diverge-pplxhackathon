// lib/sonarConfig.ts
/**
 * Base endpoint for Perplexity’s Sonar/Chat API.
 * If Perplexity ever changes hostnames you can override
 * with an env var without touching code.
 */
export const PERPLEXITY_URL =
  process.env.PERPLEXITY_BASE_URL ??
  "https://api.perplexity.ai/chat/completions";
