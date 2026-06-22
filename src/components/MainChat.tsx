/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { 
  Send, 
  Mic, 
  MicOff, 
  Paperclip, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Code2, 
  Laptop, 
  FileText, 
  GraduationCap, 
  HelpCircle,
  AlertCircle,
  X,
  FileCheck,
  Check,
  Copy
} from "lucide-react";
import { ChatSession, Message } from "../types";
import { SUGGESTED_PROMPTS } from "../data";
import MarkdownRenderer from "./MarkdownRenderer";

interface MainChatProps {
  session: ChatSession | null;
  onSendMessage: (text: string, attachment?: any) => void;
  isLoading: boolean;
  onSelectPrompt: (promptText: string) => void;
  isAutoplayTtsEnabled: boolean;
}

export default function MainChat({ session, onSendMessage, isLoading, onSelectPrompt, isAutoplayTtsEnabled }: MainChatProps) {
  const [inputText, setInputText] = useState("");
  const [isSpeakingId, setIsSpeakingId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Attachment simulated states
  const [attachment, setAttachment] = useState<{ name: string; type: string; size: string; content?: string } | null>(null);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [attachmentError, setAttachmentError] = useState("");

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastSpokenIdRef = useRef<string | null>(null);

  // Automatically scroll messages to bottom on update
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [session?.messages, isLoading]);

  // Clean speech synthesis on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  // Text-To-Speech Autoplay Trigger
  useEffect(() => {
    if (!isAutoplayTtsEnabled || !session || !session.messages || session.messages.length === 0) {
      return;
    }
    const lastMsg = session.messages[session.messages.length - 1];
    if (lastMsg.role === "assistant" && lastMsg.mode !== "offline-fallback") {
      // Safeguard: only play if it hasn't been spoken yet and is very fresh (under 15s)
      const diffMs = Date.now() - new Date(lastMsg.timestamp).getTime();
      if (lastSpokenIdRef.current !== lastMsg.id && diffMs < 15000) {
        lastSpokenIdRef.current = lastMsg.id;
        handleToggleSpeak(lastMsg);
      }
    }
  }, [session?.messages, isAutoplayTtsEnabled]);

  // Web Speech API: Speech-to-Text (STT) setup
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event: any) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setInputText(prev => prev + (prev.endsWith(" ") || prev === "" ? "" : " ") + transcript);
      };

      recognition.onerror = (e: any) => {
        console.error("Speech Recognition error:", e);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Your browser does not support Web Speech recognition. Try switching to Google Chrome or Microsoft Edge.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Web Speech Synthesis: Text-to-Speech (TTS) handler
  const handleToggleSpeak = (msg: Message) => {
    if (isSpeakingId === msg.id) {
      window.speechSynthesis.cancel();
      setIsSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel(); // cancel existing speaker
    const cleanTextToSpeak = msg.content
      .replace(/```[\s\S]*?```/g, "[Code snippet omitted]") // skip raw codes in TTS for comfort
      .replace(/[#*`_-]/g, ""); // strip markdown formatting

    const utterance = new SpeechSynthesisUtterance(cleanTextToSpeak);
    utterance.lang = "en-US";
    
    // Choose a premium sounding voice if available
    const voices = window.speechSynthesis.getVoices();
    const premiumVoice = voices.find(v => v.name.includes("Google") || v.name.includes("Natural"));
    if (premiumVoice) utterance.voice = premiumVoice;

    utterance.onend = () => {
      setIsSpeakingId(null);
    };

    utterance.onerror = () => {
      setIsSpeakingId(null);
    };

    setIsSpeakingId(msg.id);
    window.speechSynthesis.speak(utterance);
  };

  const handleCopyMessage = (msg: Message) => {
    navigator.clipboard.writeText(msg.content);
    setCopiedId(msg.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && !attachment) return;

    onSendMessage(inputText.trim(), attachment || undefined);
    setInputText("");
    setAttachment(null);
    
    // Auto turn off speech recognition if transmitting
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  // Simulate file upload attachments safely
  const handleFileAttachClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setAttachmentError("Selected file is too large (max limit is 2MB)");
      setTimeout(() => setAttachmentError(""), 4000);
      return;
    }

    setUploadingAttachment(true);
    setAttachmentError("");

    // Simulate short network latency upload
    setTimeout(() => {
      const reader = new FileReader();
      reader.onload = () => {
        setAttachment({
          name: file.name,
          type: file.type || "text/plain",
          size: `${(file.size / 1024).toFixed(1)} KB`,
          content: typeof reader.result === "string" ? reader.result : undefined
        });
        setUploadingAttachment(false);
      };
      
      // Attempt reading textual inputs
      if (file.type.startsWith("text/") || file.name.endsWith(".txt") || file.name.endsWith(".js") || file.name.endsWith(".py") || file.name.endsWith(".json") || file.name.endsWith(".html") || file.name.endsWith(".css") || file.name.endsWith(".ts")) {
        reader.readAsText(file);
      } else {
        reader.readAsDataURL(file); // base64 representation fallback
      }
    }, 1200);
  };

  // Handle icon selection based on suggested prompt category
  const renderPromptIcon = (iconName: string) => {
    switch (iconName) {
      case "Code2": return <Code2 className="w-5 h-5 text-indigo-500" />;
      case "Laptop": return <Laptop className="w-5 h-5 text-violet-500" />;
      case "FileText": return <FileText className="w-5 h-5 text-blue-500" />;
      case "GraduationCap": return <GraduationCap className="w-5 h-5 text-purple-500" />;
      case "HelpCircle": default: return <HelpCircle className="w-5 h-5 text-cyan-500" />;
    }
  };

  return (
    <div className="flex-grow flex flex-col h-full justify-between bg-white/20 dark:bg-[#0F172A]/20 backdrop-blur-md transition-colors duration-300 relative overflow-hidden">
      
      {/* 🌐 Translucent Navigation Header */}
      <header className="h-16 border-b border-slate-200/40 dark:border-white/5 flex items-center justify-between px-6 md:px-8 z-10 bg-white/30 dark:bg-white/5 backdrop-blur-sm flex-shrink-0">
        <div className="flex items-center gap-3.5 text-xs text-slate-500 dark:text-slate-400 font-medium select-none">
          <span className="hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer">Dashboard</span>
          <span className="opacity-60">/</span>
          <span className="text-slate-800 dark:text-white font-semibold">Conversational Assistant</span>
        </div>
        <div className="flex items-center gap-4 select-none">
          <div className="flex gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold leading-none">Connection</p>
              <p className="text-xs font-bold text-cyan-500 dark:text-cyan-400 leading-normal">Active</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold leading-none">Intelligence</p>
              <p className="text-xs font-bold text-violet-600 dark:text-violet-400 leading-normal">v1.2 Pro</p>
            </div>
          </div>
        </div>
      </header>

      {/* Messages Window Scrollpane */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-4 py-6 md:px-8 space-y-6 scrollbar-thin dark:scrollbar-thumb-slate-800"
      >
        {!session || session.messages.length === 0 ? (
          /* ✨ OrbitBot Premium Greetings Empty State Screen */
          <div className="max-w-3xl mx-auto h-full flex flex-col items-center justify-center text-center space-y-8 select-none">
            
            {/* Pulsing orbital rings centerpiece icon */}
            <div className="relative w-28 h-28 flex items-center justify-center">
              {/* Outer halo */}
              <div className="absolute inset-0 border border-violet-500/15 dark:border-violet-400/20 rounded-full animate-pulse"></div>
              {/* Spinning orbit dashed ring */}
              <div className="absolute w-24 h-24 border-2 border-dashed border-violet-500/40 dark:border-violet-400/30 rounded-full animate-spin [animation-duration:15s]"></div>
              {/* Core violet glow orb */}
              <div className="w-14 h-14 bg-gradient-to-br from-violet-600 to-cyan-500 rounded-full flex items-center justify-center shadow-2xl shadow-violet-500/50">
                <Sparkles className="w-6 h-6 text-white animate-pulse" />
              </div>
            </div>

            <div className="space-y-2.5">
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 dark:from-white dark:to-slate-400">
                Welcome to OrbitBot AI
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto font-medium leading-relaxed">
                &ldquo;Your Intelligent AI Companion Beyond Conversation&rdquo;
                <span className="block text-xs text-slate-400 dark:text-slate-500 font-normal italic mt-1">
                  Integrating swift cloud logic with server-side Gemini 3.5 knowledge.
                </span>
              </p>
            </div>

            {/* Smart Suggested Prompts grid layout */}
            <div className="w-full max-w-2xl space-y-3.5">
              <div className="text-[10px] uppercase font-bold tracking-widest text-slate-400 font-mono text-left">
                Suggested Starters
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SUGGESTED_PROMPTS.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => onSelectPrompt(item.prompt)}
                    className="p-5 rounded-2xl border border-slate-200/50 dark:border-white/10 bg-white/30 dark:bg-white/5 backdrop-blur-md hover:bg-white/40 dark:hover:bg-white/10 hover:border-violet-500/50 dark:hover:border-purple-500/50 transition-all text-left cursor-pointer group hover:-translate-y-0.5 duration-200 shadow-sm"
                  >
                    <div className="flex items-center gap-2.5 mb-1.5">
                      {renderPromptIcon(item.icon)}
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                        {item.title}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold truncate">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Actual Message Lists thread */
          <div className="max-w-3.5xl mx-auto space-y-6">
            
            {/* Header info badge depicting properties */}
            <div className="flex justify-center select-none">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/30 dark:bg-black/40 text-slate-600 dark:text-slate-400 border border-slate-250/40 dark:border-white/10 rounded-full text-[10px] font-mono leading-none backdrop-blur-sm">
                <Sparkles className="w-3 h-3 text-violet-500" />
                ACTIVE ENGINE PROTOCOL: GEMINI 3.5 FLASH • STATS ACTIVE
              </span>
            </div>

            {session.messages.map((msg) => {
              const isUser = msg.role === "user";

              return (
                <div 
                  key={msg.id} 
                  className={`flex gap-4 ${isUser ? "justify-end" : "justify-start"}`}
                >
                  {/* Left Avatar for Assistant */}
                  {!isUser && (
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-violet-500/10 flex-shrink-0 relative overflow-hidden select-none">
                      <div className="absolute ring-2 ring-white/10 rounded-full w-6 h-6 flex items-center justify-center bg-violet-950/20">
                        <Sparkles className="w-3.5 h-3.5 text-white animate-pulse" />
                      </div>
                    </div>
                  )}

                  {/* Message Bubble box */}
                  <div className={`max-w-[82%] p-5 rounded-2xl border flex flex-col justify-between shadow-sm relative backdrop-blur-sm ${
                    isUser
                      ? "bg-white/70 dark:bg-white/15 border-slate-200/50 dark:border-white/10 text-slate-800 dark:text-slate-100 rounded-tr-none"
                      : "bg-white/45 dark:bg-white/5 border-slate-200/45 dark:border-white/10 rounded-tl-none text-slate-800 dark:text-slate-200"
                  }`}>
                    {/* Render attachment details if attached by user */}
                    {msg.attachment && (
                      <div className="mb-3 p-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex items-center gap-2 text-xs select-none">
                        <FileCheck className="w-4 h-4 text-emerald-500" />
                        <div className="truncate">
                          <span className="font-bold text-slate-800 dark:text-slate-200 block truncate">{msg.attachment.name}</span>
                          <span className="text-[10px] text-slate-400 block">{msg.attachment.size} • {msg.attachment.type}</span>
                        </div>
                      </div>
                    )}

                    {/* Rendering textual content utilizing high-quality Markdown */}
                    <MarkdownRenderer content={msg.content} />

                    {/* Meta actions bar panel for message */}
                    <div className="mt-4 flex items-center justify-between border-t border-slate-200/50 dark:border-slate-800/55 pt-3 text-[10px] text-slate-400 dark:text-slate-500 select-none">
                      <div className="flex items-center gap-2">
                        <span>{msg.timestamp.split("T")?.[1]?.slice(0, 5) || "Now"}</span>
                        
                        {/* Display response tag */}
                        {!isUser && msg.mode && (
                          <span className={`px-2 py-0.5 rounded-md text-[9px] uppercase font-mono border ${
                            msg.mode === "generative-ai" 
                              ? "bg-violet-100/40 text-violet-600 dark:bg-violet-950/30 dark:text-violet-400 border-violet-200/40 dark:border-violet-900/60"
                              : msg.mode === "rule-based"
                              ? "bg-cyan-100/40 text-cyan-600 dark:bg-cyan-950/30 dark:text-cyan-400 border-cyan-200/40 dark:border-cyan-900/60"
                              : "bg-amber-100/40 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400 border-amber-200/40 dark:border-amber-900/60"
                          }`}>
                            {msg.mode}
                          </span>
                        )}
                      </div>

                      {/* Utility buttons panel */}
                      <div className="flex items-center gap-2">
                        {/* Copy button */}
                        <button
                          type="button"
                          onClick={() => handleCopyMessage(msg)}
                          className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-md transition-all cursor-pointer"
                          title="Copy message contents"
                        >
                          {copiedId === msg.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {/* Speaker Audio Reader toggle */}
                        {!isUser && (
                          <button
                            type="button"
                            onClick={() => handleToggleSpeak(msg)}
                            className={`p-1 rounded-md transition-all cursor-pointer ${
                              isSpeakingId === msg.id
                                ? "text-violet-600 bg-violet-100/60 dark:bg-violet-950/30 dark:text-violet-400"
                                : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900"
                            }`}
                            title={isSpeakingId === msg.id ? "Pause vocal synth reader" : "Read message aloud"}
                          >
                            {isSpeakingId === msg.id ? (
                              <VolumeX className="w-3.5 h-3.5 animate-bounce" />
                            ) : (
                              <Volume2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Avatar for User */}
                  {isUser && (
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-slate-600 to-slate-700 text-white flex items-center justify-center font-bold text-xs shadow-md shadow-slate-500/10 flex-shrink-0 select-none">
                      U
                    </div>
                  )}
                </div>
              );
            })}

            {/* Glowing skeletal loading indicator */}
            {isLoading && (
              <div className="flex gap-4 items-start justify-start">
                <div className="w-9 h-9 rounded-xl bg-violet-600 text-white flex items-center justify-center flex-shrink-0 animate-pulse">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="max-w-[500px] p-5 rounded-2xl bg-slate-50 border border-slate-200 dark:bg-slate-950/30 dark:border-slate-800 space-y-2.5 rounded-tl-none shadow-sm flex-1">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-violet-500 animate-bounce [animation-delay:0.1s]"></span>
                    <span className="w-2 h-2 rounded-full bg-violet-500 animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-2 h-2 rounded-full bg-violet-500 animate-bounce [animation-delay:0.3s]"></span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono tracking-wider italic">
                    OrbitBot is executing hybrid search routing...
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input controller panel */}
      <div className="p-4 md:p-6 border-t border-slate-200/40 dark:border-white/5 bg-white/10 dark:bg-black/10 backdrop-blur-md select-none flex-shrink-0">
        <form onSubmit={handleSend} className="max-w-3.5xl mx-auto space-y-2.5">
          
          {/* Active indicator warnings or notifications */}
          {attachmentError && (
            <div className="p-2.5 bg-red-100/90 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
              <AlertCircle className="w-4 h-4" />
              <span>{attachmentError}</span>
            </div>
          )}

          {/* Active file attachments queue */}
          {attachment && (
            <div className="p-2 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/40 dark:border-emerald-800/40 rounded-xl flex items-center justify-between gap-3 text-xs text-emerald-800 dark:text-emerald-400 pl-3">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-500 animate-pulse" />
                <span className="font-semibold truncate max-w-[200px]" title={attachment.name}>{attachment.name}</span>
                <span className="text-[10px] text-slate-400">({attachment.size})</span>
              </div>
              <button 
                type="button" 
                onClick={() => setAttachment(null)}
                className="p-1 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 rounded text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Glowing Equalizer waveforms when dictation is recording */}
          {isListening && (
            <div className="flex items-center gap-2 px-4 py-2 bg-violet-50/20 dark:bg-violet-950/20 border border-violet-100/30 dark:border-violet-900/30 rounded-xl justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex gap-1 items-end h-3.5">
                  <span className="w-1 h-2 bg-violet-500 rounded-full animate-pulse [animation-duration:0.6s]"></span>
                  <span className="w-1 h-3.5 bg-violet-500 rounded-full animate-pulse [animation-duration:0.8s] [animation-delay:0.1s]"></span>
                  <span className="w-1 h-2.5 bg-violet-500 rounded-full animate-pulse [animation-duration:0.5s] [animation-delay:0.2s]"></span>
                  <span className="w-1 h-4 bg-violet-500 rounded-full animate-pulse [animation-duration:0.9s] [animation-delay:0.3s]"></span>
                </div>
                <span className="text-xs text-violet-600 dark:text-violet-400 font-bold animate-pulse font-mono uppercase tracking-wide">
                  Listening to voice patterns... Speak clearly
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  if(recognitionRef.current) recognitionRef.current.stop();
                  setIsListening(false);
                }}
                className="text-[10px] text-violet-600 dark:text-violet-400 underline font-semibold"
              >
                Mute mic
              </button>
            </div>
          )}

          {/* Large composite input core */}
          <div className="relative flex items-end gap-2.5 bg-white/70 dark:bg-slate-950/40 backdrop-blur-2xl border border-slate-300/40 dark:border-white/10 rounded-2xl px-4 py-3 shadow-md focus-within:ring-1 focus-within:ring-violet-500 focus-within:border-violet-500 transition-all">
            
            {/* hidden system input */}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange}
              className="hidden" 
              accept=".txt,.js,.py,.json,.css,.html,.ts,.docx,.pdf"
            />

            {/* Document attachment selector */}
            <button
              type="button"
              onClick={handleFileAttachClick}
              disabled={uploadingAttachment}
              className={`p-1.5 rounded-lg border border-slate-250/50 dark:border-white/5 hover:bg-white/20 dark:hover:bg-white/5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer ${
                uploadingAttachment ? "animate-pulse brightness-50" : ""
              }`}
              title="Attach context document (max 2MB)"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Textarea */}
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value.slice(0, 1000))}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
              placeholder="Query OrbitBot AI or say hello..."
              rows={1}
              className="flex-1 max-h-[140px] resize-none border-none p-0 focus:outline-none focus:ring-0 text-sm bg-transparent text-slate-800 dark:text-slate-100 placeholder-slate-400 select-text font-medium min-h-[24px]"
            />

            {/* Character indicator & voice tools */}
            <div className="flex items-center gap-2">
              {/* Character counting */}
              <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 font-semibold select-none pr-1">
                {inputText.length}/1000
              </span>

              {/* Speech recognition dictation */}
              <button
                type="button"
                onClick={toggleListening}
                className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                  isListening
                    ? "bg-red-500 text-white border-red-500 hover:bg-red-600 animate-pulse shadow-md shadow-red-500/20"
                    : "bg-white/15 dark:bg-white/5 text-slate-500 dark:text-slate-400 border-slate-200/50 dark:border-white/5 hover:bg-white/25 dark:hover:bg-white/10"
                }`}
                title={isListening ? "Stop speech-to-text" : "Talk via Web Speech SDK"}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              {/* Submit transmission */}
              <button
                type="submit"
                disabled={(!inputText.trim() && !attachment) || isLoading}
                className={`p-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center ${
                  (inputText.trim() || attachment) && !isLoading
                    ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700 shadow-md shadow-violet-500/10 active:scale-95"
                    : "bg-slate-100 dark:bg-slate-850 text-slate-300 dark:text-slate-600 border border-transparent cursor-not-allowed"
                }`}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

          </div>
          
          <div className="text-[10px] text-center text-slate-400 dark:text-slate-500 tracking-wide font-medium">
            OrbitBot is utilizing secure sandboxed connections. All inputs are filtered via strict rule modules.
          </div>

        </form>
      </div>

    </div>
  );
}
