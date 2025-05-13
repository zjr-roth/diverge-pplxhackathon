// app/api/envCheck.ts
/**
 * Environment variable validation for NarrativeCheck APIs
 */
export function validateEnv() {
  const required = [
    'PERPLEXITY_API_KEY',
    'REDDIT_CLIENT_ID',
    'REDDIT_CLIENT_SECRET'
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Validate format of Reddit credentials
  if (process.env.REDDIT_CLIENT_ID && !process.env.REDDIT_CLIENT_ID.match(/^[a-zA-Z0-9_-]+$/)) {
    throw new Error('Invalid REDDIT_CLIENT_ID format');
  }

  if (process.env.REDDIT_CLIENT_SECRET && !process.env.REDDIT_CLIENT_SECRET.match(/^[a-zA-Z0-9_-]+$/)) {
    throw new Error('Invalid REDDIT_CLIENT_SECRET format');
  }

  return true;
}