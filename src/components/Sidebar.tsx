/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Plus, 
  Search, 
  Trash2, 
  Settings, 
  Sun, 
  Moon, 
  MessageSquare, 
  User, 
  Cpu, 
  Database,
  Sliders,
  Check,
  Activity
} from "lucide-react";
import { ChatSession, UserProfile } from "../types";

interface SidebarProps {
  sessions: ChatSession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
  systemPrompt: string;
  onSystemPromptChange: (val: string) => void;
  temperature: number;
  onTemperatureChange: (val: number) => void;
  isDarkMode: boolean;
  onThemeToggle: () => void;
  userProfile: UserProfile;
  onProfileChange: (profile: UserProfile) => void;
  onClearAllHistory: () => void;
  onOpenAnalytics: () => void;
}

export default function Sidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  systemPrompt,
  onSystemPromptChange,
  temperature,
  onTemperatureChange,
  isDarkMode,
  onThemeToggle,
  userProfile,
  onProfileChange,
  onClearAllHistory,
  onOpenAnalytics
}: SidebarProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(userProfile.name);
  const [copiedSettings, setCopiedSettings] = useState(false);

  const filteredSessions = sessions.filter(s => 
    s.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleNameSave = () => {
    onProfileChange({ ...userProfile, name: editedName });
    setIsEditingName(false);
  };

  return (
    <aside className="w-80 h-full border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-col justify-between select-none relative z-10 font-sans transition-colors duration-300">
      
      {/* 🚀 OrbitBot Futuristic Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          {/* Logo element representing futuristic orbital ring & AI core */}
          <div className="relative w-10 h-10 flex items-center justify-center">
            {/* Spinning orbit ring */}
            <div className="absolute inset-0 border-2 border-violet-500/35 dark:border-violet-400/40 border-t-violet-600 dark:border-t-violet-400 rounded-full animate-spin [animation-duration:3s]"></div>
            {/* Inner glow core */}
            <div className="w-5 h-5 bg-gradient-to-tr from-violet-600 to-cyan-400 rounded-full flex items-center justify-center shadow-lg shadow-violet-500/50">
              <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
            </div>
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-1.5 leading-none">
              OrbitBot <span className="text-[10px] bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300 font-mono px-1 py-0.5 rounded uppercase">v1.2</span>
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium tracking-wide">
              Beyond Conversation
            </span>
          </div>
        </div>

        {/* ➕ Create Chat Action */}
        <button
          onClick={onNewChat}
          className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl font-medium text-sm transition-all shadow-md shadow-violet-500/10 cursor-pointer active:scale-95 duration-200"
        >
          <Plus className="w-4 h-4" />
          <span>New Chat</span>
        </button>
      </div>

      {/* 🔍 Search and Conversation Lists */}
      <div className="flex-1 flex flex-col p-3 overflow-hidden min-h-[150px]">
        {/* Search tool */}
        <div className="relative mb-3 flex-shrink-0">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-200/50 dark:bg-slate-900 border border-slate-300/40 dark:border-slate-800/80 rounded-lg text-slate-800 dark:text-slate-200 placeholder-slate-400/80 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-violet-500 font-medium"
          />
        </div>

        {/* List scroll */}
        <div className="flex-1 overflow-y-auto space-y-1.5 scrollbar-thin dark:scrollbar-thumb-slate-800 pr-1">
          <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-2 mb-2 font-mono flex items-center justify-between">
            <span>Conversations ({filteredSessions.length})</span>
            {filteredSessions.length > 0 && (
              <span className="text-[9px] lowercase font-normal opacity-80">(click to open)</span>
            )}
          </div>
          {filteredSessions.length === 0 ? (
            <div className="p-4 text-center rounded-lg border border-dashed border-slate-200 dark:border-slate-800/60 bg-slate-100/30 dark:bg-slate-900/40">
              <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">No chats found matching criteria</p>
            </div>
          ) : (
            filteredSessions.map((session) => {
              const isActive = session.id === activeSessionId;
              const lastMsg = session.messages[session.messages.length - 1];
              const snippet = lastMsg ? lastMsg.content.slice(0, 35) + (lastMsg.content.length > 35 ? "..." : "") : "New Empty Chat";

              return (
                <div
                  key={session.id}
                  onClick={() => onSelectSession(session.id)}
                  className={`group relative flex items-center justify-between p-3 rounded-xl cursor-pointer border transition-all duration-200 ${
                    isActive
                      ? "bg-violet-50/70 dark:bg-violet-950/20 border-violet-100 dark:border-violet-900 shadow-sm"
                      : "bg-transparent border-transparent hover:bg-slate-200/40 dark:hover:bg-slate-900/40 hover:border-slate-200/50 dark:hover:border-slate-905"
                  }`}
                >
                  <div className="flex-1 min-w-0 pr-6 flex items-start gap-2.5">
                    <MessageSquare className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                      isActive ? "text-violet-600 dark:text-violet-400 animate-pulse" : "text-slate-400"
                    }`} />
                    <div className="min-w-0">
                      <div className={`text-xs font-semibold truncate leading-normal transition-colors ${
                        isActive ? "text-violet-800 dark:text-violet-200" : "text-slate-700 dark:text-slate-300"
                      }`}>
                        {session.title}
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5 font-medium leading-none">
                        {snippet}
                      </div>
                    </div>
                  </div>

                  {/* Immediate Delete Trigger */}
                  <button
                    onClick={(e) => onDeleteSession(session.id, e)}
                    className="absolute right-2 p-1.5 text-slate-400 hover:text-red-500 dark:hover:text-red-400 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-red-200 rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-sm shrink-0"
                    title="Delete Conversation"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ⚠️ Extended Settings Panel Drawer */}
      {showSettings && (
        <div className="absolute inset-x-0 bottom-[140px] m-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-2xl z-20 space-y-4 font-sans text-slate-800 dark:text-slate-200 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider font-mono text-slate-400 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-violet-500" />
              Settings & Engines
            </span>
            <button
              onClick={() => setShowSettings(false)}
              className="text-[10px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 hover:text-slate-950 px-2 py-0.5 rounded text-slate-400 font-semibold"
            >
              Hide
            </button>
          </div>

          <div className="space-y-3.5">
            {/* System Instruction */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">System Prompt Instruction</label>
              <textarea
                value={systemPrompt}
                onChange={(e) => onSystemPromptChange(e.target.value)}
                rows={2}
                className="w-full text-xs p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-violet-500 text-slate-800 dark:text-slate-200 font-medium"
                placeholder="Instruct the AI persona..."
              />
            </div>

            {/* Temperature parameter */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                <span>Creativity (Temp)</span>
                <span className="font-mono text-slate-500 dark:text-slate-300 font-bold">{temperature}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={temperature}
                onChange={(e) => onTemperatureChange(parseFloat(e.target.value))}
                className="w-full accent-violet-600 h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none outline-none cursor-pointer"
              />
              <div className="flex justify-between text-[8px] text-slate-400 leading-none">
                <span>Deterministic (0.0)</span>
                <span>Creative (1.0)</span>
              </div>
            </div>

            {/* Clear all history */}
            <button
              onClick={() => {
                if(window.confirm("Are you absolutely sure you want to clear all conversation history from local storage? This cannot be undone.")) {
                  onClearAllHistory();
                  setShowSettings(false);
                }
              }}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 border border-dashed border-red-500/40 text-red-600 dark:text-red-400 hover:bg-red-500/10 text-xs rounded-xl font-medium transition-colors"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Purge Local History</span>
            </button>
          </div>
        </div>
      )}

      {/* ⚙️ Core Utilities and Profiles footer */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-3.5 bg-slate-100/50 dark:bg-slate-950/80">
        
        {/* Quick Menu utilities */}
        <div className="grid grid-cols-3 gap-2">
          {/* Settings activation button */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`flex flex-col items-center justify-center gap-1 py-2 rounded-xl text-[10px] font-medium border transition-all ${
              showSettings 
                ? "bg-violet-100/80 text-violet-700 border-violet-200 dark:bg-violet-950/30 dark:text-violet-300 dark:border-violet-900" 
                : "bg-white text-slate-500 border-slate-200 hover:bg-slate-150/40 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800 dark:hover:bg-slate-800/40"
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Config</span>
          </button>

          {/* Theme toggler */}
          <button
            onClick={onThemeToggle}
            className="flex flex-col items-center justify-center gap-1 py-2 bg-white text-slate-500 border border-slate-200 rounded-xl hover:bg-slate-150/40 text-[10px] font-medium dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800 dark:hover:bg-slate-800/40 transition-colors"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-violet-600" />}
            <span>{isDarkMode ? "Light Mode" : "Dark Mode"}</span>
          </button>

          {/* Analytics open button */}
          <button
            onClick={onOpenAnalytics}
            className="flex flex-col items-center justify-center gap-1 py-2 bg-white text-slate-500 border border-slate-200 rounded-xl hover:bg-slate-150/40 text-[10px] font-medium dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800 dark:hover:bg-slate-800/40 transition-colors"
          >
            <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
            <span>Analytics</span>
          </button>
        </div>

        {/* 👤 Interactive User Profile display */}
        <div className="flex items-center gap-2.5 p-2 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 rounded-xl">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-500 to-indigo-500 text-white flex items-center justify-center text-xs font-bold shadow-sm font-mono flex-shrink-0 animate-pulse [animation-duration:5s]">
            OB
          </div>
          <div className="min-w-0 flex-1">
            {isEditingName ? (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleNameSave()}
                  className="bg-slate-100 dark:bg-slate-800 border-none text-[11px] p-0.5 rounded text-slate-800 dark:text-slate-100 max-w-[100px] outline-none font-semibold focus:ring-1 focus:ring-violet-500 animate-pulse"
                  autoFocus
                />
                <button 
                  onClick={handleNameSave}
                  className="bg-violet-600 hover:bg-violet-700 text-white p-0.5 rounded cursor-pointer"
                >
                  <Check className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div 
                onClick={() => setIsEditingName(true)}
                className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate pr-1 hover:underline cursor-pointer leading-tight flex items-center gap-1"
                title="Click to rename"
              >
                {userProfile.name}
              </div>
            )}
            <div className="text-[9px] text-slate-400 dark:text-slate-500 font-mono font-bold leading-none mt-0.5 uppercase tracking-wider">
              {userProfile.tier}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
