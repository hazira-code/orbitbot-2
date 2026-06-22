/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  X, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  Sparkles, 
  LogIn, 
  UserPlus,
  Shield,
  Loader2,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { UserProfile } from "../types";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: UserProfile, importedSessions?: any[]) => void;
}

export default function AuthModal({ isOpen, onClose, onAuthSuccess }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [tier, setTier] = useState<"Free Member" | "Pro" | "SaaS Admin">("Free Member");
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!username.trim() || !password.trim()) {
      setErrorMsg("Please fill in both the username and password fields.");
      return;
    }

    if (isSignUp && !name.trim()) {
      setErrorMsg("Please provide your display name.");
      return;
    }

    setLoading(true);

    try {
      const endpoint = isSignUp ? "/api/auth/register" : "/api/auth/login";
      const payload = isSignUp 
        ? { username, password, name, tier }
        : { username, password };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Authentication request failed.");
      }

      if (isSignUp) {
        setSuccessMsg("Registration successful! Initiating login session...");
        setTimeout(() => {
          onAuthSuccess(data.user, []);
          resetForm();
          onClose();
        }, 1200);
      } else {
        // Logged in successfully
        onAuthSuccess(data.user, data.sessions || []);
        resetForm();
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || "A verification error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setUsername("");
    setPassword("");
    setName("");
    setTier("Free Member");
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleQuickLogin = async (usr: string, psw: string) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: usr, password: psw })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      onAuthSuccess(data.user, data.sessions || []);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col justify-between overflow-hidden">
        
        {/* Stellar Background Accent Radial Light */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-72 bg-violet-600/10 blur-[80px] pointer-events-none rounded-full" />
        
        {/* Header bar */}
        <div className="relative flex justify-between items-center mb-6 z-10">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-violet-950/60 text-violet-400 border border-violet-800/40 rounded-lg">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 font-sans">
                {isSignUp ? "Create Celestial Account" : "Access Orbit Portal"}
              </h2>
              <p className="text-[10px] text-slate-400 font-medium font-sans">
                {isSignUp ? "Connect parameters to begin sync" : "Enter credentials for terminal access"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800/50 cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form panel */}
        <form onSubmit={handleSubmit} className="relative space-y-4 z-10">
          
          {/* Banner notification panels */}
          {errorMsg && (
            <div className="p-3 bg-rose-950/30 border border-rose-900/50 rounded-xl flex items-start gap-2 text-xs font-medium text-rose-300 antialiased animate-pulse">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-950/30 border border-emerald-905/40 rounded-xl flex items-start gap-2 text-xs font-medium text-emerald-300 antialiased">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5 animate-bounce" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Registration Extra Display name */}
          {isSignUp && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                Full Display Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="e.g. Commander Shepard"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-950/50 hover:bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:ring-1 focus:ring-violet-500 placeholder-slate-600 transition-colors"
                  required
                />
              </div>
            </div>
          )}

          {/* Username */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
              Username Handle
            </label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="e.g. admin or orbitseeker"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-950/50 hover:bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:ring-1 focus:ring-violet-500 placeholder-slate-600 transition-colors"
                autoComplete="username"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
              Portal Key Code (Password)
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-10 py-2 text-xs bg-slate-950/50 hover:bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:ring-1 focus:ring-violet-500 placeholder-slate-600 transition-colors"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Registration Specific Membership selection list */}
          {isSignUp && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                Assigned Membership Tier
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["Free Member", "Pro", "SaaS Admin"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTier(t)}
                    className={`py-1.5 rounded-xl text-[10px] font-bold transition-all border cursor-pointer ${
                      tier === t
                        ? "bg-violet-950/40 text-violet-300 border-violet-500/50 shadow-md shadow-violet-950/30"
                        : "bg-slate-950/20 text-slate-400 border-slate-800/40 hover:bg-slate-950/50 hover:text-slate-300"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Submit action */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-violet-500/10 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isSignUp ? (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Initialize Register Sync</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Secure Portal Verification</span>
              </>
            )}
          </button>
        </form>

        {/* Change form state trigger */}
        <div className="relative mt-5 text-center text-xs z-10">
          <span className="text-slate-500 font-sans">
            {isSignUp ? "Already have an activated account?" : "Need a verified personal node?"}{" "}
          </span>
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setErrorMsg(null);
            }}
            className="text-violet-400 hover:text-violet-300 font-bold hover:underline cursor-pointer"
          >
            {isSignUp ? "Verify credentials" : "Create standard personal account"}
          </button>
        </div>

        {/* Quick test parameters widgets (Pre-built demo buttons) */}
        {!isSignUp && (
          <div className="relative mt-5 pt-4 border-t border-slate-800/60 z-10">
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono text-slate-500 block mb-2 text-center">
              🎛️ Terminal Quick-Login Profiles (Demo and Verification)
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin("admin", "password123")}
                className="p-2 text-left bg-slate-950/30 hover:bg-violet-950/20 hover:border-violet-800/40 border border-slate-850 rounded-xl transition-all group cursor-pointer"
              >
                <div className="text-[10px] font-extrabold text-violet-400 group-hover:text-violet-300">
                  SaaS Admin Profile
                </div>
                <div className="text-[8px] text-slate-500 mt-0.5 truncate leading-none">
                  User: admin / psw: password123
                </div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin("orbitseeker", "orbit99")}
                className="p-2 text-left bg-slate-950/30 hover:bg-cyan-950/20 hover:border-cyan-800/40 border border-slate-850 rounded-xl transition-all group cursor-pointer"
              >
                <div className="text-[10px] font-extrabold text-cyan-400 group-hover:text-cyan-300">
                  Pro Seeker Profile
                </div>
                <div className="text-[8px] text-slate-500 mt-0.5 truncate leading-none">
                  User: orbitseeker / psw: orbit99
                </div>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
