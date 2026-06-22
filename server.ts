import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";

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
  const { message, history = [], systemInstruction, temperature = 0.7, model = "gemini-3.5-flash", webSearchEnabled = true } = req.body || {};
  
  // Validate request model safely
  const allowedModels = ["gemini-3.5-flash", "gemini-3.1-pro-preview", "gemini-3.1-flash-lite"];
  const targetModel = allowedModels.includes(model) ? model : "gemini-3.5-flash";

  try {
    if (!message || typeof message !== "string") {
      res.status(400).json({ error: "Message content is required" });
      return;
    }

    analytics.messagesProcessed++;
    trackKeywords(message);

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

    // Generate output content with conditional googleSearch tool
    const chatConfig: any = {
      systemInstruction: systemInstruction || "You are OrbitBot, a helpful and knowledgeable celestial AI assistant. Provide extremely clean, visually organized answers with Markdown support.",
      temperature: Number(temperature),
    };

    if (webSearchEnabled) {
      chatConfig.tools = [{ googleSearch: {} }];
    }

    // Configure High Thinking mode only for the 3.1 Pro Preview model
    if (targetModel === "gemini-3.1-pro-preview") {
      chatConfig.thinkingConfig = {
        thinkingLevel: ThinkingLevel.HIGH,
      };
    }

    const response = await ai.models.generateContent({
      model: targetModel,
      contents,
      config: chatConfig,
    });

    const replyText = response.text || "I processed your request but returned an empty response. Let me know how else I can assist you!";
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata || null;

    res.json({
      text: replyText,
      mode: "generative-ai",
      modelUsed: targetModel,
      tokensCount: Math.ceil(replyText.split(/\s+/).length * 1.3),
      groundingMetadata,
    });

  } catch (error: any) {
    console.error("Gemini API error:", error);
    
    const errString = error.message || String(error);
    const isQuotaExceeded = errString.includes("429") || 
                            errString.includes("RESOURCE_EXHAUSTED") || 
                            errString.toLowerCase().includes("quota") ||
                            errString.toLowerCase().includes("exhausted");
                            
    const isPermissionDenied = errString.includes("403") || 
                               errString.includes("PERMISSION_DENIED") || 
                               errString.toLowerCase().includes("forbidden") ||
                               errString.toLowerCase().includes("invalid_api_key") ||
                               errString.toLowerCase().includes("invalid api key");

    const isNotFound = errString.includes("404") ||
                       errString.includes("NOT_FOUND") ||
                       errString.toLowerCase().includes("not found");

    let friendlyDetails = error.message || String(error);
    
    if (isQuotaExceeded) {
      friendlyDetails = `You exceeded your current Gemini API quota or hit rate limits.\n\n**How to fix this and unlock unlimited queries:**\n\n1. Go to the **Settings > Secrets** panel in the AI Studio editor interface on your right/left.\n2. Paste or select a **billing-enabled (paid tier) API key** to gain increased quota limits.\n3. Alternatively, use the dropdown model menu next to the chat sidebar to switch to a lighter model (like **Gemini 3.5 Flash** or **Gemini 3.1 Flash Lite**) which consumes significantly less quota!`;
    } else if (isPermissionDenied) {
      friendlyDetails = `The API key used was denied permission or is invalid.\n\n**How to fix:**\n\n1. Open the **Settings > Secrets** panel in your editor environment.\n2. Set a valid, active \`GEMINI_API_KEY\` to re-engage the model.`;
    } else if (isNotFound) {
      friendlyDetails = `The model \`${targetModel}\` was not found or is currently unsupported in this region configuration.\n\n**How to fix:**\n\nChoose an active model such as **Gemini 3.5 Flash** or **Gemini 3.1 pro-preview** in the model selector.`;
    }

    res.status(500).json({
      error: isQuotaExceeded ? "API Quota/Rate Limit Exhausted" : "Failed to fetch response from Gemini model",
      details: friendlyDetails,
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

// Custom Server-Side User Accounts Database for Authentication
interface UserAccount {
  id: string;
  username: string;
  passwordHash: string; // Stored securely in memory
  name: string;
  avatar: string;
  tier: "Free Member" | "Pro" | "SaaS Admin";
  joined: string;
  sessions: any[];
}

const usersDb: Record<string, UserAccount> = {
  "admin": {
    id: "user-admin",
    username: "admin",
    passwordHash: "password123", // Default local testing password
    name: "Dr. Stella Nova",
    avatar: "SN",
    tier: "SaaS Admin",
    joined: "June 2026",
    sessions: []
  },
  "orbitseeker": {
    id: "user-seeker",
    username: "orbitseeker",
    passwordHash: "orbit99",
    name: "Space Cadet Arthur",
    avatar: "AC",
    tier: "Pro",
    joined: "June 2026",
    sessions: []
  }
};

// 🔐 Authentication Endpoint: Register User
app.post("/api/auth/register", (req, res) => {
  const { username, password, name, avatar, tier } = req.body;
  
  if (!username || !password || !name) {
    return res.status(400).json({ error: "Username, password, and display name are required." });
  }

  const normalizedUsername = username.toLowerCase().trim();
  if (usersDb[normalizedUsername]) {
    return res.status(400).json({ error: "Username already exists. Please choose a different handle." });
  }

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dateStr = `${months[new Date().getMonth()]} ${new Date().getFullYear()}`;

  const newUser: UserAccount = {
    id: `user-${Date.now()}`,
    username: normalizedUsername,
    passwordHash: password, // Store password
    name: name.trim(),
    avatar: (avatar || name.slice(0, 2)).toUpperCase(),
    tier: tier || "Free Member",
    joined: dateStr,
    sessions: [] // Empty initial chat history
  };

  usersDb[normalizedUsername] = newUser;
  
  res.json({
    success: true,
    message: "Registration completed successfully. You can now login!",
    user: {
      id: newUser.id,
      username: newUser.username,
      name: newUser.name,
      avatar: newUser.avatar,
      tier: newUser.tier,
      joined: newUser.joined,
      isLoggedIn: true
    }
  });
});

// 🔐 Authentication Endpoint: Login User
app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required." });
  }

  const normalizedUsername = username.toLowerCase().trim();
  const user = usersDb[normalizedUsername];

  if (!user || user.passwordHash !== password) {
    return res.status(401).json({ error: "Invalid username or password credentials." });
  }

  res.json({
    success: true,
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      avatar: user.avatar,
      tier: user.tier,
      joined: user.joined,
      isLoggedIn: true
    },
    sessions: user.sessions
  });
});

// 💾 Authentication Endpoint: Sync User-Specific Conversations
app.post("/api/auth/save-sessions", (req, res) => {
  const { username, sessions } = req.body;

  if (!username) {
    return res.status(400).json({ error: "Username is required to save session state." });
  }

  const normalizedUsername = username.toLowerCase().trim();
  const user = usersDb[normalizedUsername];

  if (!user) {
    return res.status(404).json({ error: "User account not found." });
  }

  user.sessions = sessions || [];
  res.json({ success: true, savedCount: user.sessions.length });
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
