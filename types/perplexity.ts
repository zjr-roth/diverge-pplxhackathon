// types/perplexity.ts
/**
 * Type definitions for Perplexity Sonar API
 * Based on documentation from https://docs.perplexity.ai
 */

// Message roles in chat API
export type MessageRole = "system" | "user" | "assistant";

// Basic chat message structure
export interface Message {
  role: MessageRole;
  content: string;
}

// Search source types supported by Sonar
export type SearchSourceType = "news" | "blog" | "web" | "youtube" | "twitter" | "reddit";

// Date range filter options
export interface DateRange {
  from?: string; // ISO date string format YYYY-MM-DD
  to?: string;   // ISO date string format YYYY-MM-DD
}

// Search sources configuration
export interface SearchSources {
  types?: SearchSourceType[];
  domains?: {
    allow?: string[];
    deny?: string[];
  };
  date_range?: DateRange;
}

// JSON schema for structured response
export interface ResponseSchema {
  type: string;
  properties?: Record<string, any>;
  required?: string[];
}

// Response format configuration
export interface ResponseFormat {
  type: "json_object";
  schema: ResponseSchema;
}

// Sonar API request structure
export interface SonarRequest {
  model: string;  // "sonar-pro", "sonar-reasoning-pro", etc.
  messages: Message[];
  stream?: boolean;
  search_sources?: SearchSources;
  response_format?: ResponseFormat;
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  user?: string;
}

// Stream chunk delta data format
export interface Delta {
  content?: string;
}

// Stream chunk format
export interface StreamChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: Delta;
    finish_reason: null | string;
  }>;
}

// Complete response message
export interface SonarResponseChoice {
  index: number;
  message: Message;
  finish_reason: string;
}

// Full response format (non-streamed)
export interface SonarResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: SonarResponseChoice[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Narrative analysis response specific to our app
export interface NarrativeAnalysis {
  company: string;
  narratives: string[];
}