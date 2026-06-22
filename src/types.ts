/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  tokensCount?: number;
  mode?: "rule-based" | "generative-ai" | "offline-fallback";
  modelUsed?: string;
  isSpokenText?: boolean;
  feedback?: "like" | "dislike" | null;
  groundingMetadata?: {
    webSearchQueries?: string[];
    groundingChunks?: Array<{
      web?: {
        uri: string;
        title: string;
      };
    }>;
  };
  attachment?: {
    name: string;
    type: string;
    size: string;
    content?: string;
  };
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  temperature: number;
  systemPrompt: string;
}

export interface OrbitAnalytics {
  totalConversations: number;
  messagesProcessed: number;
  queriesByMode: {
    rules: number;
    ai: number;
  };
  activeSessions: number;
  topKeywords: Record<string, number>;
  uptimeMinutes: number;
  likes?: number;
  dislikes?: number;
}

export interface UserProfile {
  name: string;
  avatar: string;
  tier: "Free Member" | "Pro" | "SaaS Admin";
  joined: string;
}
