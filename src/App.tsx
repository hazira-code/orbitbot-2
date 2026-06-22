/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import MainChat from "./components/MainChat";
import AnalyticsPanel from "./components/AnalyticsPanel";
import AuthModal from "./components/AuthModal";
import { ChatSession, Message, OrbitAnalytics, UserProfile } from "./types";
import { INITIAL_CHATS } from "./data";

export default function App() {
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("orbit_theme");
    return saved ? saved === "dark" : true; // Default to cosmic dark mode
  });

  // User Profile
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem("orbit_profile");
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return {
      name: "Space Explorer",
      avatar: "OB",
      tier: "SaaS Admin",
      joined: "June 2026",
      isLoggedIn: false
    };
  });

  // Conversations sessions state
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const defaultProfile = localStorage.getItem("orbit_profile");
    let username = "";
    if (defaultProfile) {
      try {
        const parsed = JSON.parse(defaultProfile);
        if (parsed.isLoggedIn && parsed.username) {
          username = parsed.username;
        }
      } catch {}
    }

    const key = username ? ("orbit_sessions_" + username) : "orbit_sessions";
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (err) {
        console.error("Failed to parse saved sessions", err);
      }
    }
    return INITIAL_CHATS;
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    const savedActive = localStorage.getItem("orbit_active_id");
    if (savedActive && sessions.some(s => s.id === savedActive)) {
      return savedActive;
    }
    return sessions[0]?.id || "welcome-orbit";
  });

  // Authentication Dialog control
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Global settings parameters
  const [systemPrompt, setSystemPrompt] = useState<string>(() => {
    return localStorage.getItem("orbit_system_prompt") || "You are OrbitBot, an elegant cosmic AI companion designed to provide fast, informative, and visual help.";
  });

  const [temperature, setTemperature] = useState<number>(() => {
    const saved = localStorage.getItem("orbit_temp");
    return saved ? parseFloat(saved) : 0.7;
  });

  const [isAutoplayTtsEnabled, setIsAutoplayTtsEnabled] = useState<boolean>(() => {
    return localStorage.getItem("orbit_autoplay_tts") === "true";
  });

  const [selectedModel, setSelectedModel] = useState<string>(() => {
    return localStorage.getItem("orbit_selected_model") || "gemini-3.5-flash";
  });

  const [webSearchEnabled, setWebSearchEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem("orbit_web_search");
    return saved ? saved === "true" : true;
  });

  const handleWebSearchToggle = (enabled: boolean) => {
    setWebSearchEnabled(enabled);
    localStorage.setItem("orbit_web_search", String(enabled));
  };

  // Loading animation states
  const [isLoading, setIsLoading] = useState(false);

  // Analytics Panel Drawer Toggle
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [cachedAnalytics, setCachedAnalytics] = useState<OrbitAnalytics | null>(null);

  // Sync theme class to root element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("orbit_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("orbit_theme", "light");
    }
  }, [isDarkMode]);

  // Sync state changes to local storage
  useEffect(() => {
    if (userProfile.isLoggedIn && userProfile.username) {
      const userKey = "orbit_sessions_" + userProfile.username;
      localStorage.setItem(userKey, JSON.stringify(sessions));
      
      // Save user history on full-stack server
      fetch("/api/auth/save-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: userProfile.username, sessions })
      }).catch(e => console.warn("Failed to sync sessions to server", e));
    } else {
      localStorage.setItem("orbit_sessions", JSON.stringify(sessions));
    }
  }, [sessions, userProfile.isLoggedIn, userProfile.username]);

  // Auth Modal Handlers
  const handleAuthSuccess = (user: UserProfile, serverSessions?: any[]) => {
    const freshProfile = { ...user, isLoggedIn: true };
    setUserProfile(freshProfile);
    localStorage.setItem("orbit_profile", JSON.stringify(freshProfile));

    // Resolve chats
    let loadedChats = [];
    if (user.username) {
      const userKey = "orbit_sessions_" + user.username;
      const savedObj = localStorage.getItem(userKey);
      if (savedObj) {
        try {
          loadedChats = JSON.parse(savedObj);
        } catch {}
      } else if (serverSessions && serverSessions.length > 0) {
        loadedChats = serverSessions;
      }
    }

    if (loadedChats.length === 0) {
      loadedChats = INITIAL_CHATS;
    }

    setSessions(loadedChats);
    const savedActive = loadedChats[0]?.id || "welcome-orbit";
    setActiveSessionId(savedActive);
    setIsAuthModalOpen(false);
  };

  const handleLogout = () => {
    const guestProfile: UserProfile = {
      name: "Space Explorer",
      avatar: "OB",
      tier: "SaaS Admin",
      joined: "June 2026",
      isLoggedIn: false
    };
    setUserProfile(guestProfile);
    localStorage.setItem("orbit_profile", JSON.stringify(guestProfile));

    // Load generic guest sessions
    const saved = localStorage.getItem("orbit_sessions");
    let guestChats = INITIAL_CHATS;
    if (saved) {
      try {
        guestChats = JSON.parse(saved);
      } catch {}
    }

    setSessions(guestChats);
    setActiveSessionId(guestChats[0]?.id || "welcome-orbit");
  };

  useEffect(() => {
    localStorage.setItem("orbit_active_id", activeSessionId);
  }, [activeSessionId]);

  useEffect(() => {
    localStorage.setItem("orbit_system_prompt", systemPrompt);
  }, [systemPrompt]);

  useEffect(() => {
    localStorage.setItem("orbit_temp", temperature.toString());
  }, [temperature]);

  useEffect(() => {
    localStorage.setItem("orbit_autoplay_tts", isAutoplayTtsEnabled.toString());
  }, [isAutoplayTtsEnabled]);

  useEffect(() => {
    localStorage.setItem("orbit_selected_model", selectedModel);
  }, [selectedModel]);

  useEffect(() => {
    localStorage.setItem("orbit_profile", JSON.stringify(userProfile));
  }, [userProfile]);

  // Retrieve current active session safety
  const activeSession = sessions.find(s => s.id === activeSessionId) || null;

  // Handle Select session trigger
  const handleSelectSession = (id: string) => {
    setActiveSessionId(id);
    // Cancel any speech that is occurring on navigation
    window.speechSynthesis.cancel();
  };

  // Launch fresh new empty conversation session
  const handleNewChat = () => {
    const newId = `session-${Date.now()}`;
    const newSession: ChatSession = {
      id: newId,
      title: `Orbit Chat #${sessions.length + 1}`,
      createdAt: new Date().toISOString(),
      temperature: temperature,
      systemPrompt: systemPrompt,
      messages: []
    };

    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newId);
    window.speechSynthesis.cancel();

    // Trigger full-stack statistic counter on server side asynchronously
    fetch("/api/analytics/conversations", { method: "POST" })
      .catch(e => console.warn("Failed to notify conversation count", e));
  };

  // Delete message session safely from record
  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid selecting the deleted item
    window.speechSynthesis.cancel();

    const updated = sessions.filter(s => s.id !== id);
    setSessions(updated);

    if (activeSessionId === id && updated.length > 0) {
      setActiveSessionId(updated[0].id);
    } else if (updated.length === 0) {
      // Re-create starting chat if empty
      const defaultId = "welcome-orbit";
      const initial: ChatSession = {
        id: defaultId,
        title: "Orbit Chat #1",
        createdAt: new Date().toISOString(),
        temperature: 0.7,
        systemPrompt: "You are OrbitBot.",
        messages: []
      };
      setSessions([initial]);
      setActiveSessionId(defaultId);
    }
  };

  // Dynamic Send Message controller
  const handleSendMessage = async (text: string, attachment?: any, forcedModel?: string) => {
    if (!text && !attachment) return;

    // 1. Construct user message entry
    const userMsg: Message = {
      id: `msg-user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
      attachment: attachment ? {
        name: attachment.name,
        type: attachment.type,
        size: attachment.size,
      } : undefined
    };

    // Update session title on very first text if generic title is active
    let currentSession = activeSession;
    if (!currentSession) {
      handleNewChat();
      return;
    }

    const hadNoMessages = currentSession.messages.length === 0;
    const originalTitle = currentSession.title;
    const isGenericTitle = originalTitle.startsWith("Orbit Chat");

    // Push message to memory array
    const updatedMessages = [...currentSession.messages, userMsg];
    const updatedTitle = (hadNoMessages && isGenericTitle && text) 
      ? text.slice(0, 30) + (text.length > 30 ? "..." : "") 
      : originalTitle;

    const modifiedSession = {
      ...currentSession,
      title: updatedTitle,
      messages: updatedMessages
    };

    setSessions(prev => prev.map(s => s.id === activeSessionId ? modifiedSession : s));
    setIsLoading(true);

    // Prepare full text contents + context to submit to the backend rest server
    // We send context history excluding large attached contents to save bandwidth.
    const cleanHistory = currentSession.messages.map(m => ({
      role: m.role,
      content: m.content
    }));

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: text + (attachment?.content ? `\n\n[USER ATTACHED DISK FILE Context: "${attachment.name}"]: \n${attachment.content}` : ""),
          history: cleanHistory,
          systemInstruction: systemPrompt,
          temperature: temperature,
          model: forcedModel || selectedModel,
          webSearchEnabled: webSearchEnabled
        })
      });

      if (!res.ok) {
        throw new Error(`Server endpoint returned error code ${res.status}`);
      }

      const replyData = await res.json();

      const aiMsg: Message = {
        id: `msg-ai-${Date.now()}`,
        role: "assistant",
        content: replyData.text,
        timestamp: new Date().toISOString(),
        mode: replyData.mode || "generative-ai",
        modelUsed: replyData.modelUsed,
        tokensCount: replyData.tokensCount || 0,
        groundingMetadata: replyData.groundingMetadata
      };

      setSessions(prev => prev.map(s => 
        s.id === activeSessionId 
          ? { ...s, messages: [...updatedMessages, aiMsg] } 
          : s
      ));

    } catch (err: any) {
      console.error(err);
      const errMsg: Message = {
        id: `msg-ai-err-${Date.now()}`,
        role: "assistant",
        content: `⚠️ **Sub-orbital Communication Link Interrupted**\n\nUnable to fetch server-side response from Gemini. Please confirm the server container is stable.\n\n*Error details:* ${err.message || String(err)}`,
        timestamp: new Date().toISOString(),
        mode: "offline-fallback"
      };

      setSessions(prev => prev.map(s => 
        s.id === activeSessionId 
          ? { ...s, messages: [...updatedMessages, errMsg] } 
          : s
      ));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle saving feedback on AI/Rule-based messages
  const handleMessageFeedback = (messageId: string, feedback: "like" | "dislike" | null) => {
    let previousFeedback: "like" | "dislike" | null = null;

    setSessions(prev => prev.map(session => {
      const targetMsg = session.messages.find(m => m.id === messageId);
      if (!targetMsg) return session;

      previousFeedback = targetMsg.feedback || null;

      const updatedMessages = session.messages.map(msg => 
        msg.id === messageId ? { ...msg, feedback } : msg
      );

      return { ...session, messages: updatedMessages };
    }));

    // Post feedback signal change to the full-stack server
    fetch("/api/analytics/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feedback, previousFeedback })
    })
    .catch(e => console.warn("Failed to update feedback on server", e));
  };

  const handleSelectPrompt = (promptText: string) => {
    handleSendMessage(promptText);
  };

  // Complete clean system purging
  const handleClearAllHistory = () => {
    window.speechSynthesis.cancel();
    localStorage.removeItem("orbit_sessions");
    localStorage.removeItem("orbit_active_id");
    
    setSessions(INITIAL_CHATS);
    setActiveSessionId(INITIAL_CHATS[0].id);
  };

  const handleOpenAnalytics = () => {
    setShowAnalytics(true);
  };

  return (
    <div className="flex w-screen h-screen bg-slate-100 dark:bg-[#0F172A] text-slate-850 dark:text-slate-100 overflow-hidden font-sans select-none transition-colors duration-300 relative">
      
      {/* 🌌 Celestial Ambient Glow spheres (Frosted Glass context) */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/10 dark:bg-purple-600/20 rounded-full blur-[100px] md:blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-cyan-500/5 dark:bg-cyan-500/10 rounded-full blur-[100px] md:blur-[120px]" />
      </div>
      {/* 🔮 Left Sidebar controls */}
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        systemPrompt={systemPrompt}
        onSystemPromptChange={setSystemPrompt}
        temperature={temperature}
        onTemperatureChange={setTemperature}
        isAutoplayTtsEnabled={isAutoplayTtsEnabled}
        onAutoplayTtsChange={setIsAutoplayTtsEnabled}
        isDarkMode={isDarkMode}
        onThemeToggle={() => setIsDarkMode(!isDarkMode)}
        userProfile={userProfile}
        onProfileChange={setUserProfile}
        onClearAllHistory={handleClearAllHistory}
        onOpenAnalytics={handleOpenAnalytics}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* 🚀 Central Conversational Stage */}
      <main className="flex-1 h-full min-w-0" id="main-frame-space">
        <MainChat
          session={activeSession}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          onSelectPrompt={handleSelectPrompt}
          isAutoplayTtsEnabled={isAutoplayTtsEnabled}
          selectedModel={selectedModel}
          onSelectedModelChange={setSelectedModel}
          onMessageFeedback={handleMessageFeedback}
          webSearchEnabled={webSearchEnabled}
          onWebSearchToggle={handleWebSearchToggle}
        />
      </main>

      {/* 📊 Interactive Telemetry Drawer Overlay */}
      {showAnalytics && (
        <AnalyticsPanel
          onClose={() => setShowAnalytics(false)}
          analyticsData={cachedAnalytics}
        />
      )}

      {/* 🔐 Modular Authentication Gateway */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

    </div>
  );
}
