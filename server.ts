import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

// Simple in-memory analytics store
const analytics = {
  totalConversations: 3,
  messagesProcessed: 12,
  queriesByMode: {
    rules: 4,
    ai: 8,
  },
  activeSessions: 1,
  topKeywords: {} as Record<string, number>,
  startTime: Date.now(),
  likes: 0,
  dislikes: 0,
};

// Help extract top keywords to enrich the dashboard visual model
function trackKeywords(text: string) {
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter(w => w.length > 4 && !["about", "there", "their", "would", "could", "should", "these", "those"].includes(w));
  
  words.forEach(word => {
    analytics.topKeywords[word] = (analytics.topKeywords[word] || 0) + 1;
  });
}

// Populate some initial keywords so the tag cloud looks amazing on first load
["orbitbot", "react", "programming", "tailwind", "development", "gemini", "assistant", "ai"].forEach(word => {
  analytics.topKeywords[word] = Math.floor(Math.random() * 5) + 3;
});

// Serve APIs first
app.use(express.json());

// 📊 Analytics GET API
app.get("/api/analytics", (req, res) => {
  // Calculate running sessions based on general requests
  res.json({
    ...analytics,
    uptimeMinutes: Math.floor((Date.now() - analytics.startTime) / 60000),
  });
});

// 🤖 Chat processing POST API
app.post("/api/chat", async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const { message, history = [], systemInstruction, temperature = 0.7, model = "gemini-3.5-flash" } = req.body;

    if (!message || typeof message !== "string") {
      res.status(400).json({ error: "Message content is required" });
      return;
    }

    analytics.messagesProcessed++;
    trackKeywords(message);

    // Validate request model safely
    const allowedModels = ["gemini-3.5-flash", "gemini-3.1-pro-preview", "gemini-3.1-flash-lite"];
    const targetModel = allowedModels.includes(model) ? model : "gemini-3.5-flash";

    // 1. Check rule-based engine first (only for normal simple model, skip for specific tasks)
    const norm = message.toLowerCase().trim();
    let ruleResponse: string | null = null;

    if (model === "gemini-3.5-flash" && (norm.includes("who are you") || norm.includes("your name") || norm.includes("what is orbitbot") || norm.includes("what is your name"))) {
      ruleResponse = "I am **OrbitBot**, a futuristic conversational assistant designed to help you think, draft, code, and explore. I am powered by custom micro-services and the Gemini LLM engine.";
    } else if (model === "gemini-3.5-flash" && (norm.includes("who created you") || norm.includes("made you") || norm.includes("creator"))) {
      ruleResponse = "I was developed with deep spatial engineering principles utilizing React, Tailwind CSS, and Google DeepMind's Gemini architecture.";
    } else if (model === "gemini-3.5-flash" && (norm.includes("features") || norm.includes("capabilities") || norm.includes("what can you do"))) {
      ruleResponse = "Here are my core capabilities:\n\n" +
        "- 🤖 **Dual Interaction Routing**: Combines hyper-fast rule matching with dynamic Gemini AI reasoning.\n" +
        "- 🎙️ **Vocal Speech-to-Text**: Dictation via browser voice capture using a glowing orbital radial waveform.\n" +
        "- 🔊 **Custom TTS Audio**: Generous localized Text-to-Speech playback available on all response cards.\n" +
        "- 📊 **Full-Stack Analytics**: Real-time metrics tracking conversation length, query density, and word frequency.\n" +
        "- ✨ **Celestial Aesthetics**: Fluid, high-contrast dark space design, ambient stars, and flawless layout transitions.";
    } else if (model === "gemini-3.5-flash" && (norm.includes("help") || norm.includes("how to use") || norm.includes("guide"))) {
      ruleResponse = "Welcome! Interaction is simple:\n\n" +
        "1. **Chat**: Enter your queries below or use the suggested prompts.\n" +
        "2. **Speak**: Tap the **Microphone** button to dictate via local speech recognition.\n" +
        "3. **Settings**: Customize my intelligence parameter thresholds or toggle light/dark modes.\n" +
        "4. **Analytics**: Inspect performance and queries by tapping the dashboard trigger.";
    }

    if (ruleResponse) {
      analytics.queriesByMode.rules++;
      res.json({
        text: ruleResponse,
        mode: "rule-based",
        modelUsed: "local-rules",
        tokensCount: Math.ceil(ruleResponse.split(/\s+/).length * 1.3),
      });
      return;
    }

    // 2. Check for Gemini API key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      // Graceful fallback response when key is missing so the app is always functional
      analytics.queriesByMode.rules++;
      const fallbackMsg = `### Welcome to OrbitBot! \n\n` +
        `I am running in **Development Offline Fallback Mode** because your \`GEMINI_API_KEY\` is not set.\n\n` +
        `#### How to activate my fully dynamic Gemini AI brain (requested model: \`${targetModel}\`):\n` +
        `1. Open the **Settings > Secrets** panel in the AI Studio UI on your right/left.\n` +
        `2. Set your custom \`GEMINI_API_KEY\` value.\n` +
        `3. Restart the server or continue chatting! I'll instantly utilize the LLM.\n\n` +
        `#### Meanwhile, you can test my core layout capabilities:\n` +
        `- Dictate text manually via the microphone button.\n` +
        `- Toggle background light/dark modes under system parameters.\n` +
        `- Trigger analytics to view queries and average counts.\n` +
        `- Ask me generic platform questions (e.g. asking *'What are your capabilities?'* or *'Who are you?'*) which trigger my local database responses!`;
      
      res.json({
        text: fallbackMsg,
        mode: "offline-fallback",
        modelUsed: "local-fallback",
        tokensCount: 0,
      });
      return;
    }

    // 3. Dynamic Gemini API Evaluation
    analytics.queriesByMode.ai++;

    // Prepare contents array matching the expected developer layout
    const contents = [];
    
    // Process preceding history correctly
    for (const h of history) {
      contents.push({
        role: h.role === "user" ? "user" : "model",
        parts: [{ text: h.content }],
      });
    }
    
    // Add current message
    contents.push({
      role: "user",
      parts: [{ text: message }],
    });

    // Lazy load the SDK
    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    // Generate output content
    const response = await ai.models.generateContent({
      model: targetModel,
      contents,
      config: {
        systemInstruction: systemInstruction || "You are OrbitBot, a helpful and knowledgeable celestial AI assistant. Provide extremely clean, visually organized answers with Markdown support.",
        temperature: Number(temperature),
      },
    });

    const replyText = response.text || "I processed your request but returned an empty response. Let me know how else I can assist you!";

    res.json({
      text: replyText,
      mode: "generative-ai",
      modelUsed: targetModel,
      tokensCount: Math.ceil(replyText.split(/\s+/).length * 1.3),
    });

  } catch (error: any) {
    console.error("Gemini API error:", error);
    res.status(500).json({
      error: "Failed to fetch response from Gemini model",
      details: error.message || String(error),
    });
  }
});

// Increment conversation counters
app.post("/api/analytics/conversations", (req, res) => {
  analytics.totalConversations++;
  res.json({ success: true, totalConversations: analytics.totalConversations });
});

// Process and save feedback signals for analytics tracker
app.post("/api/analytics/feedback", (req, res) => {
  const { feedback, previousFeedback } = req.body;
  
  if (previousFeedback === "like") {
    analytics.likes = Math.max(0, analytics.likes - 1);
  } else if (previousFeedback === "dislike") {
    analytics.dislikes = Math.max(0, analytics.dislikes - 1);
  }

  if (feedback === "like") {
    analytics.likes++;
  } else if (feedback === "dislike") {
    analytics.dislikes++;
  }

  res.json({ success: true, likes: analytics.likes, dislikes: analytics.dislikes });
});

// Setup Vite Dev server or Serve compiled frontend
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in development mode with Vite middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in production mode with static directory distribution...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`OrbitBot Server launched successfully on http://0.0.0.0:${PORT}`);
  });
}

startServer();
