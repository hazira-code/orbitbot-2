/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { 
  X, 
  MessageSquare, 
  Cpu, 
  Activity, 
  Clock, 
  Zap, 
  TrendingUp, 
  Flame,
  Award 
} from "lucide-react";
import { OrbitAnalytics } from "../types";

interface AnalyticsPanelProps {
  onClose: () => void;
  analyticsData: OrbitAnalytics | null;
}

export default function AnalyticsPanel({ onClose, analyticsData }: AnalyticsPanelProps) {
  const [data, setData] = useState<OrbitAnalytics | null>(analyticsData);
  const [loading, setLoading] = useState(!analyticsData);

  useEffect(() => {
    // Live update analytics metrics from full-stack api
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/analytics");
        if (res.ok) {
          const stats = await res.json();
          setData(stats);
        }
      } catch (err) {
        console.error("Failed to load live server analytics", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 60000); // refresh every minute
    return () => clearInterval(interval);
  }, []);

  const total = data ? data.queriesByMode.rules + data.queriesByMode.ai : 1;
  const rulesPercent = data ? Math.round((data.queriesByMode.rules / total) * 100) : 33;
  const aiPercent = data ? Math.round((data.queriesByMode.ai / total) * 100) : 67;

  // Settle keyword frequencies for visual tag cloud
  const sortedKeywords: [string, number][] = data 
    ? (Object.entries(data.topKeywords) as [string, number][])
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
    : [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm"
      id="analytics-overlay"
      onClick={(e) => {
        if ((e.target as HTMLElement).id === "analytics-overlay") onClose();
      }}
    >
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 180 }}
        className="h-full w-full max-w-xl bg-slate-950/80 backdrop-blur-3xl border-l border-white/10 text-slate-100 p-6 shadow-2xl flex flex-col justify-between overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-950 text-violet-400 rounded-lg">
              <Activity className="w-5 h-5" id="stats-logo-icon" />
            </div>
            <div>
              <h2 className="text-xl font-semibold tracking-tight">OrbitBot AI Console</h2>
              <p className="text-xs text-slate-400">Live system performance & conversation metrics</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Close analytics panel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-slate-400">Syncing telemetry data...</p>
          </div>
        ) : (
          <div className="flex-1 space-y-6">
            {/* Bento Grid Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all"></div>
                <div className="flex items-center justify-between text-blue-400 mb-2">
                  <MessageSquare className="w-5 h-5" />
                  <span className="text-[10px] uppercase font-mono tracking-wider bg-blue-950 text-blue-300 px-1.5 py-0.5 rounded">Active</span>
                </div>
                <div className="text-2xl font-bold tracking-tight text-white">
                  {data?.totalConversations || 0}
                </div>
                <div className="text-xs text-slate-400 font-medium">Total Conversations</div>
              </div>

              <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-16 h-16 bg-violet-500/10 rounded-full blur-2xl group-hover:bg-violet-500/20 transition-all"></div>
                <div className="flex items-center justify-between text-violet-400 mb-2">
                  <Cpu className="w-5 h-5" />
                  <span className="text-[10px] uppercase font-mono tracking-wider bg-violet-950 text-violet-300 px-1.5 py-0.5 rounded">Cumulative</span>
                </div>
                <div className="text-2xl font-bold tracking-tight text-white">
                  {data?.messagesProcessed || 0}
                </div>
                <div className="text-xs text-slate-400 font-medium">Messages Processed</div>
              </div>

              <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>
                <div className="flex items-center justify-between text-emerald-400 mb-2">
                  <Zap className="w-5 h-5" />
                  <span className="text-[10px] uppercase font-mono tracking-wider bg-emerald-950 text-emerald-300 px-1.5 py-0.5 rounded">Live</span>
                </div>
                <div className="text-2xl font-bold tracking-tight text-white">
                  {data?.activeSessions || 1}
                </div>
                <div className="text-xs text-slate-400 font-medium">Connected Sessions</div>
              </div>

              <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all"></div>
                <div className="flex items-center justify-between text-amber-400 mb-2">
                  <Clock className="w-5 h-5" />
                  <span className="text-[10px] uppercase font-mono tracking-wider bg-amber-950 text-amber-300 px-1.5 py-0.5 rounded">Uptime</span>
                </div>
                <div className="text-2xl font-bold tracking-tight text-white">
                  {data?.uptimeMinutes || 0}m
                </div>
                <div className="text-xs text-slate-400 font-medium">Server Session Age</div>
              </div>
            </div>

            {/* Response Type Engine Distribution */}
            <div className="p-5 bg-slate-950/50 border border-slate-800 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-200">Processing Mode Split</h3>
                <span className="text-xs text-slate-400">Rule Engine vs Gemini LLM</span>
              </div>
              <div className="flex h-3 rounded-full overflow-hidden bg-slate-800 mb-4">
                <div 
                  className="bg-cyan-500 transition-all duration-500" 
                  style={{ width: `${rulesPercent}%` }}
                  title={`Rule-based queries: ${rulesPercent}%`}
                ></div>
                <div 
                  className="bg-violet-500 transition-all duration-500" 
                  style={{ width: `${aiPercent}%` }}
                  title={`Gemini LLM queries: ${aiPercent}%`}
                ></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-cyan-500"></div>
                  <div>
                    <div className="text-xs text-slate-400 font-medium">Predefined Rules</div>
                    <div className="text-sm font-bold text-white">{data?.queriesByMode.rules || 0} <span className="text-slate-500 font-normal">({rulesPercent}%)</span></div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-violet-500"></div>
                  <div>
                    <div className="text-xs text-slate-400 font-medium">Gemini GenAI</div>
                    <div className="text-sm font-bold text-white">{data?.queriesByMode.ai || 0} <span className="text-slate-500 font-normal">({aiPercent}%)</span></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Keyword Trends Word Cloud */}
            <div className="p-5 bg-slate-950/50 border border-slate-800 rounded-xl">
              <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-200 mb-3">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>Trending Semantic Tokens</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {sortedKeywords.length === 0 ? (
                  <p className="text-xs text-slate-500">No conversational tokens recorded yet. Start conversing to populate analytics.</p>
                ) : (
                  sortedKeywords.map(([word, freq]) => (
                    <span 
                      key={word}
                      className="text-xs px-2.5 py-1 rounded-full uppercase tracking-wider font-mono font-medium transition-all hover:-translate-y-0.5 duration-200 cursor-default"
                      style={{
                        backgroundColor: freq > 6 ? "rgba(124, 58, 237, 0.2)" : freq > 4 ? "rgba(6, 182, 212, 0.15)" : "rgba(30, 41, 59, 0.6)",
                        color: freq > 6 ? "#c084fc" : freq > 4 ? "#22d3ee" : "#94a3b8",
                        border: freq > 4 ? "1px solid rgba(124, 58, 237, 0.4)" : "1px solid rgba(51, 65, 85, 0.5)",
                      }}
                    >
                      {word} <span className="text-[10px] opacity-60 font-semibold">x{freq}</span>
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Interactive Performance Insights */}
            <div className="p-4 bg-violet-950/30 border border-violet-800/40 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-violet-400 text-sm font-medium">
                <Flame className="w-4 h-4 animate-bounce" />
                <span>Smart Model Insights</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                OrbitBot is performing within normal sub-millisecond network margins. The hybrid response mesh accurately routed <span className="text-white font-medium">{rulesPercent}%</span> of conversations to immediate pre-compiled functions, saving critical LLM computing cost while providing instant satisfaction.
              </p>
            </div>
          </div>
        )}

        {/* Console Footing */}
        <div className="border-t border-slate-800 pt-4 mt-6 text-center">
          <div className="flex items-center justify-center gap-2 text-[10px] font-mono text-slate-500">
            <Award className="w-3 h-3 text-violet-500" />
            <span>ORBIT PROTOCOL VERSION 1.0.4 • SECURE ENCRYPTED PROXY</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
