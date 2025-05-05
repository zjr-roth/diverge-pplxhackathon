// app/api/envCheck.ts
/**
 * Validates that all required environment variables are set
 * Use this at the top of API routes to avoid runtime errors
 */
export function validateEnv() {
    // Required environment variables
    const requiredEnvVars = [
      "PERPLEXITY_API_KEY",
    ];

    // Check each required variable
    const missingVars = requiredEnvVars.filter(
      (envVar) => !process.env[envVar]
    );

    // If any variables are missing, throw error
    if (missingVars.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missingVars.join(", ")}. ` +
        `Make sure to create a .env.local file with these variables.`
      );
    }

    return true;
  }