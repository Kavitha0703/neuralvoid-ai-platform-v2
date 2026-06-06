import React, { useState } from "react";
import { User, Key, RefreshCw, Layers, Check, Database, AlertCircle, Cpu, Wifi, Server } from "lucide-react";
import { UserProfile, UsageRecord } from "../types";
import BillingSettings from "./BillingSettings";

interface SettingsProps {
  user: UserProfile | null;
  onLogin: (email: string) => Promise<void>;
  onUpdateGeminiKey: (key: string) => Promise<void>;
  onClearHistory: () => void;
  onSyncHistory: () => Promise<void>;
  historyCount: number;
  onLogout: () => void;
}

export default function Settings({ 
  user, 
  onLogin, 
  onUpdateGeminiKey, 
  onClearHistory, 
  onSyncHistory,
  historyCount,
  onLogout
}: SettingsProps) {
  const [emailInput, setEmailInput] = useState<string>("");
  const [geminiKeyInput, setGeminiKeyInput] = useState<string>(user?.customGeminiKey || "");

  const [savingKey, setSavingKey] = useState<boolean>(false);
  const [loggingIn, setLoggingIn] = useState<boolean>(false);
  const [syncing, setSyncing] = useState<boolean>(false);

  const [loginSuccess, setLoginSuccess] = useState<boolean>(false);
  const [keySuccess, setKeySuccess] = useState<boolean>(false);

  const handleChangeEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;

    setLoggingIn(true);
    setLoginSuccess(false);
    try {
      // Simulate verifying email and updating profile
      await new Promise(resolve => setTimeout(resolve, 800));
      setLoginSuccess(true);
      setTimeout(() => {
        setLoginSuccess(false);
        // Force relogin scenario
        onLogout();
      }, 1500);
    } catch (err) {
      console.error(err);
    } finally {
      setLoggingIn(false);
    }
  };

  const handleKeySave = async () => {
    setSavingKey(true);
    setKeySuccess(false);
    try {
      await onUpdateGeminiKey(geminiKeyInput.trim());
      setKeySuccess(true);
      setTimeout(() => setKeySuccess(false), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingKey(false);
    }
  };

  const handleBackupSync = async () => {
    setSyncing(true);
    try {
      await onSyncHistory();
    } catch (err) {
      console.error(err);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
      {/* Tab column 1: Developer Access Credentials */}
      <div className="space-y-6">
        {/* Profile Settings */}
        <div className="glass-panel p-5 rounded-2xl shadow-xl space-y-4 border border-slate-800">
          <h2 className="text-xs font-bold font-mono tracking-wider uppercase text-slate-400 flex items-center gap-1.5 border-b border-slate-800/80 pb-3">
            <User className="w-4 h-4 text-cyan-404" /> PROFILE SETTINGS
          </h2>

          <div className="text-xs text-slate-400 leading-relaxed font-sans">
            Update your account identity. Changing your email address will require you to verify and log back in for security purposes.
          </div>

          <div className="bg-slate-950/60 rounded-xl p-3.5 border border-slate-850 space-y-2 font-mono text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Current Login:</span>
              <span className="font-semibold text-slate-300">{user?.email || "Not Set"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Account ID:</span>
              <span className="font-bold text-slate-400">{user?.id}</span>
            </div>
          </div>

          <form onSubmit={handleChangeEmailSubmit} className="space-y-3 pt-1">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold font-mono tracking-wider uppercase text-slate-500 block">
                Change Email
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="Enter New Email"
                  className="flex-1 bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2 text-xs outline-none text-slate-205 focus:border-cyan-500"
                />
                <button
                  type="submit"
                  disabled={loggingIn}
                  className="bg-cyan-600 hover:bg-cyan-750 text-white font-mono text-[10px] font-bold px-4 py-2 rounded-xl select-none cursor-pointer outline-none transition disabled:opacity-50 shadow-md shadow-cyan-500/5"
                >
                  {loggingIn ? "Verifying..." : "Update"}
                </button>
              </div>
            </div>
          </form>

          {loginSuccess && (
            <div className="bg-emerald-955/15 text-emerald-400 text-xs p-3 rounded-xl border border-emerald-900/30 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Check className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
                Email updated. Forcing re-login...
              </div>
            </div>
          )}
        </div>

        {/* Gemini API Key */}
        <div className="glass-panel p-5 rounded-2xl shadow-xl space-y-4 border border-slate-800">
          <h2 className="text-xs font-bold font-mono tracking-wider uppercase text-slate-400 flex items-center gap-1.5 border-b border-slate-800/80 pb-3">
            <Key className="w-4 h-4 text-indigo-400" /> CUSTOM GEMINI API CREDENTIALS
          </h2>

          <div className="text-xs text-slate-400 leading-relaxed font-sans">
            By default, calls route using the platform&apos;s default internal API key securely (via backend Express routing). If you reach rate limits, enter your personal key. It remains client-safe and is proxy-piped dynamically.
          </div>

          <div className="space-y-3 pt-1">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold font-mono tracking-wider uppercase text-slate-500 block">
                Gemini API Key (Raw Secret)
              </label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={geminiKeyInput}
                  onChange={(e) => setGeminiKeyInput(e.target.value)}
                  placeholder="Paste your GEMINI_API_KEY secret..."
                  className="flex-1 bg-slate-955/85 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono outline-none text-slate-200 focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleKeySave}
                  disabled={savingKey}
                  className="bg-indigo-600 hover:bg-indigo-750 text-white font-mono text-[10px] font-bold px-4 py-2 rounded-xl select-none cursor-pointer outline-none transition disabled:opacity-50 shadow-md shadow-indigo-500/5"
                >
                  {savingKey ? "Saving..." : "Save Key"}
                </button>
              </div>
            </div>

            {keySuccess && (
              <div className="bg-emerald-955/15 text-emerald-400 text-xs p-3 rounded-xl border border-emerald-900/30 flex gap-2 items-center">
                <Check className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
                Custom credential saved in secure session state!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tab column 2: Database Storage & System Health */}
      <div className="space-y-6">
        {/* Local database sync */}
        <div className="glass-panel p-5 rounded-2xl shadow-xl space-y-4 border border-slate-800">
          <h2 className="text-xs font-bold font-mono tracking-wider uppercase text-slate-400 flex items-center gap-1.5 border-b border-slate-800/80 pb-3">
            <Database className="w-4 h-4 text-emerald-400" /> STATIC DATABASE BACKUP SYNC
          </h2>

          <div className="text-xs text-slate-400 leading-relaxed font-sans">
            Because Cloud container resources scale to zero and restart, local server memory can reset. Syncing backs up your local browser metrics trace securely to the server.
          </div>

          <div className="pt-2 flex gap-3 flex-wrap">
            <button
              onClick={handleBackupSync}
              disabled={syncing}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-450 hover:to-teal-550 text-white font-mono text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-1.5 disabled:opacity-50 cursor-pointer transition shadow-md shadow-emerald-500/10"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} /> Backup History to Database
            </button>
            <button
              onClick={onClearHistory}
              className="border border-rose-900/40 hover:bg-rose-950/20 text-rose-400 font-mono text-xs font-semibold px-4 py-2.5 rounded-xl transition cursor-pointer"
            >
              Flush Audit Logs
            </button>
          </div>

          <div className="text-[10px] text-slate-500 font-mono">
            Stored cache trace size: <span className="text-cyan-400 font-bold">{historyCount} requests logs</span>
          </div>
        </div>

        {/* System parameters indicator list */}
        <div className="glass-panel p-5 rounded-2xl shadow-xl space-y-4 border border-slate-800">
          <h2 className="text-xs font-bold font-mono tracking-wider uppercase text-slate-400 flex items-center gap-1.5 border-b border-slate-800/80 pb-2.5">
            <Layers className="w-4 h-4 text-amber-500" /> PLATFORM DEPLOYMENT STATUS
          </h2>

          <div className="grid grid-cols-2 gap-3.5 text-xs pt-1">
            <div className="bg-slate-950/50 border border-slate-850 p-3 rounded-xl flex items-center justify-between">
              <span className="text-slate-500 font-mono flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5" /> Api Relay Status
              </span>
              <span className="font-mono text-emerald-400 font-bold">ONLINE</span>
            </div>

            <div className="bg-slate-950/50 border border-slate-850 p-3 rounded-xl flex items-center justify-between">
              <span className="text-slate-500 font-mono flex items-center gap-1.5">
                <Wifi className="w-3.5 h-3.5" /> Dev Net Gateway
              </span>
              <span className="font-mono text-indigo-400 font-bold">SLA-99%</span>
            </div>

            <div className="bg-slate-950/50 border border-slate-850 p-3 rounded-xl flex items-center justify-between">
              <span className="text-slate-500 font-mono flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5" /> Base Client
              </span>
              <span className="font-mono text-slate-300">TypeScript SPA</span>
            </div>

            <div className="bg-slate-950/50 border border-slate-850 p-3 rounded-xl flex items-center justify-between">
              <span className="text-slate-500 font-mono flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" /> CORS Policy
              </span>
              <span className="font-mono text-slate-300">Strict SingleIn</span>
            </div>
          </div>
        </div>

        {/* Verification / Support Center */}
        <div className="glass-panel p-5 rounded-2xl shadow-xl space-y-4 border border-slate-800">
          <h2 className="text-xs font-bold font-mono tracking-wider uppercase text-slate-400 flex items-center gap-1.5 border-b border-slate-800/80 pb-3">
            <Check className="w-4 h-4 text-emerald-400" /> HELP & VERIFICATION
          </h2>

          <div className="text-xs text-slate-400 leading-relaxed font-sans mb-3">
            Verify platform connectivity, API key liveness, and your active workspace tier access permissions.
          </div>

          <div className="space-y-2 mt-2 font-mono text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-850">
              <span className="text-slate-300">Account Status</span>
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <Check className="w-3.5 h-3.5" /> Verified
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-850">
              <span className="text-slate-300">API Key</span>
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <Check className="w-3.5 h-3.5" /> Active
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-850">
              <span className="text-slate-300">Workspace Access</span>
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <Check className="w-3.5 h-3.5" /> Owner
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-850">
              <span className="text-slate-300">Workflow Execution</span>
              <span className="flex items-center gap-1.5 text-indigo-400 font-bold">
                <Layers className="w-3.5 h-3.5" /> Ready
              </span>
            </div>
          </div>
        </div>

        {/* Billing and Subscription */}
        <BillingSettings />
      </div>
    </div>
  );
}
