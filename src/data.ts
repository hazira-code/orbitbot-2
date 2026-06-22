/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ChatSession } from "./types";

export const SUGGESTED_PROMPTS = [
  {
    id: "python",
    title: "Explain Python",
    description: "decorators & arguments",
    prompt: "Can you explain Python decorators in simple words and provide an elegant example?",
    icon: "Code2"
  },
  {
    id: "generator",
    title: "Generate React Code",
    description: "gradient picker module",
    prompt: "Write a complete, inline React component for a multi-color gradient generator using Tailwind CSS.",
    icon: "Laptop"
  },
  {
    id: "summary",
    title: "Summarize Gemini",
    description: "features and architecture",
    prompt: "Summarize the primary benefits and architecture of Gemini 3.5 Flash compared to old versions.",
    icon: "FileText"
  },
  {
    id: "study",
    title: "Create Study Cards",
    description: "for machine learning basics",
    prompt: "Generate a set of 4 concise study cards explaining Weights, Biases, Gradient Descent, and Backpropagation.",
    icon: "GraduationCap"
  },
  {
    id: "tech",
    title: "CSR vs SSR",
    description: "performance pros & cons",
    prompt: "Explain the absolute performance difference between Client-Side Rendering and Server-Side Rendering including loading graphs.",
    icon: "HelpCircle"
  }
];

export const INITIAL_CHATS: ChatSession[] = [
  {
    id: "welcome-orbit",
    title: "Getting Started with OrbitBot",
    createdAt: "2026-06-21T14:30:00Z",
    temperature: 0.7,
    systemPrompt: "You are OrbitBot, an elegant cosmic AI companion designed to provide fast, informative, and visual help.",
    messages: [
      {
        id: "msg-1",
        role: "user",
        content: "Hello! Tell me about yourself.",
        timestamp: "2026-06-21T14:30:05Z"
      },
      {
        id: "msg-2",
        role: "assistant",
        content: "Welcome to **OrbitBot**! 🚀\n\nI am your premium AI coding and reasoning companion. I feature a hybrid response core that blends micro-instant rule parameters with standard server-side deep learning powered by Google's Gemini API.\n\n### What makes me different:\n- **Full Space Aesthetics**: Translucent glass-morphic surfaces, stellar light emissions, and premium dark gradients.\n- **Voice AI**: Dictate inputs easily using human speech recognition. I can also play responses back beautifully with speaker voice synthesis!\n- **Real-Time Analytics**: Open the analytics drawer to view total words, queries, and active sessions.\n\nTry sending me a coding question or use the suggested prompts!",
        timestamp: "2026-06-21T14:31:00Z",
        mode: "rule-based",
        tokensCount: 154
      }
    ]
  },
  {
    id: "quantum-basics",
    title: "Quantum Computing Simplified",
    createdAt: "2026-06-21T16:15:00Z",
    temperature: 0.85,
    systemPrompt: "You are an expert quantum physicist specializing in simplifying complex subatomic concepts for normal people.",
    messages: [
      {
        id: "msg-q1",
        role: "user",
        content: "What is quantum superposition in 1 sentence?",
        timestamp: "2026-06-21T16:15:10Z"
      },
      {
        id: "msg-q2",
        role: "assistant",
        content: "Quantum superposition is the physical ability of a subatomic particle (like an electron) to exist in multiple potential configurations or states simultaneously, until a measurement forces it to snap into a single, concrete reality, much like a spinning coin is both heads and tails until caught.",
        timestamp: "2026-06-21T16:16:15Z",
        mode: "generative-ai",
        tokensCount: 78
      }
    ]
  }
];
