import React, { useState, useEffect } from "react";
import { 
  Terminal, BarChart3, Edit3, Type, Sliders, FileSpreadsheet, FileQuestion, 
  HelpCircle, Settings as SettingsIcon, Menu, X, Clock, Wifi, Server, Sparkles, UserCheck,
  Key, BookOpen, History, ShieldCheck, Home, Archive, Layers, Folder, MessageSquare, Search, LogOut, RefreshCw
} from "lucide-react";
import { ActiveTab, UsageRecord, UserProfile } from "./types";

import Dashboard from "./components/Dashboard";
import TextGenerator from "./components/TextGenerator";
import Summarizer from "./components/Summarizer";
import GrammarImprover from "./components/GrammarImprover";
import CodeExplainer from "./components/CodeExplainer";
import PdfQa from "./components/PdfQa";
import ImageGenerator from "./components/ImageGenerator";
import Settings from "./components/Settings";
import SavedSessions from "./components/SavedSessions";

import LandingPage from "./components/LandingPage";
import ApiKeys from "./components/ApiKeys";
import ApiDocs from "./components/ApiDocs";
import UsageHistory from "./components/UsageHistory";
import AdminPanel from "./components/AdminPanel";
import AuthPage from "./components/AuthPage";

import PromptStudio from "./components/PromptStudio";
import KnowledgeBases from "./components/KnowledgeBases";
import WorkflowBuilder from "./components/WorkflowBuilder";
import Workspaces from "./components/Workspaces";
import Agents from "./components/Agents";
import FloatingAssistant from "./components/FloatingAssistant";
import { PrivacyPolicyModal, TermsAndConditionsModal, CookieNoticeModal } from "./components/LegalModals";
import { CookieConsentManager } from "./components/CookieConsentManager";

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("landing");
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isCookiesOpen, setIsCookiesOpen] = useState(false);

  // User Profile state (with persistent backup in localStorage)
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem("toolkit_user_profile");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return {
      id: "guest",
      email: "developer@aistudio-toolkit.internal",
      apiKey: "tk_proj_live_default_99ef1a",
      createdAt: new Date().toISOString(),
    };
  });

  const userId = user?.id || "guest";

  // Global history logs
  const [history, setHistory] = useState<UsageRecord[]>([]);

  // Active workspace state parameter
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(() => {
    return localStorage.getItem("toolkit_active_workspace_id") || "ws-default";
  });

  const handleSetActiveWorkspaceId = (id: string | null) => {
    setActiveWorkspaceId(id);
    if (id) {
      localStorage.setItem("toolkit_active_workspace_id", id);
    } else {
      localStorage.removeItem("toolkit_active_workspace_id");
    }
  };

  // Preloaded data for RAG Q&A transitions
  const [qaPreloadedSnippet, setQaPreloadedSnippet] = useState<string>("");
  const [qaPreloadedFilename, setQaPreloadedFilename] = useState<string>("");

  // Global Search state properties
  const [globalSearch, setGlobalSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  
  // Dynamic collections for instant search indexes
  const [searchPrompts, setSearchPrompts] = useState<any[]>([]);
  const [searchKbs, setSearchKbs] = useState<any[]>([]);
  const [searchFlows, setSearchFlows] = useState<any[]>([]);
  const [searchAgents, setSearchAgents] = useState<any[]>([]);
  const [searchSessions, setSearchSessions] = useState<any[]>([]);

  // Periodically refresh items for instant indexing on query
  useEffect(() => {
    const handleCopilotNavigate = (e: any) => {
      if (e.detail) {
        setActiveTab(e.detail as ActiveTab);
        if (window.innerWidth < 768) setSidebarOpen(false);
      }
    };
    
    window.addEventListener("copilot_navigate", handleCopilotNavigate);
    return () => window.removeEventListener("copilot_navigate", handleCopilotNavigate);
  }, []);

  useEffect(() => {
    if (!globalSearch.trim()) return;
    
    // Fetch parallel indexing logs for accuracy!
    Promise.all([
      fetch(`/api/prompts/${userId}`).then(r => r.json()).catch(() => ({})),
      fetch(`/api/knowledge-bases/${userId}`).then(r => r.json()).catch(() => ({})),
      fetch(`/api/workflows/${userId}`).then(r => r.json()).catch(() => ({})),
      fetch(`/api/agents/${userId}`).then(r => r.json()).catch(() => ({})),
      fetch(`/api/sessions/${userId}`).then(r => r.json()).catch(() => ({})),
    ]).then(([promptsData, kbsData, flowsData, agentsData, sessionsData]) => {
      setSearchPrompts(promptsData.promptTemplates || []);
      setSearchKbs(kbsData.knowledgeBases || []);
      setSearchFlows(flowsData.workflows || []);
      setSearchAgents(agentsData.agents || []);
      setSearchSessions(sessionsData.savedSessions || []);
    });
  }, [globalSearch, userId]);

  const getFilteredSearchResults = () => {
    const q = globalSearch.toLowerCase().trim();
    if (!q) return [];

    const results: any[] = [];

    // 1. Core Platform Pages / Tools
    const coreTools = [
      { tab: "text-gen", name: "Text Generator Sandbox", type: "Core Utility" },
      { tab: "summarize", name: "Document Summarizer", type: "Core Utility" },
      { tab: "grammar", name: "Grammar Core Polisher", type: "Core Utility" },
      { tab: "explainer", name: "Code Explainer Review", type: "Core Utility" },
      { tab: "pdf-qa", name: "PDF Research Explorer", type: "Core Utility" },
      { tab: "image-gen", name: "Vector SVG Compiler", type: "Core Utility" },
      { tab: "prompts", name: "Prompt Studio Library", type: "SaaS Engine" },
      { tab: "knowledge-bases", name: "Semantic Document KBs", type: "SaaS Engine" },
      { tab: "workflows", name: "Visual Pipeline Builder", type: "SaaS Engine" },
      { tab: "agents", name: "Custom GPT Agents", type: "SaaS Engine" },
      { tab: "workspaces", name: "Workspace Context Manager", type: "SaaS Engine" },
    ];

    coreTools.forEach(t => {
      if (t.name.toLowerCase().includes(q)) {
        results.push({
          title: t.name,
          subtitle: t.type,
          type: "Page",
          targetTab: t.tab
        });
      }
    });

    searchPrompts.forEach(p => {
      if (p.title.toLowerCase().includes(q) || p.content.toLowerCase().includes(q)) {
        results.push({
          title: p.title,
          subtitle: `Template • ${p.category}`,
          type: "Prompt",
          targetTab: "prompts",
          payload: p
        });
      }
    });

    searchKbs.forEach(k => {
      if (k.name.toLowerCase().includes(q) || (k.description && k.description.toLowerCase().includes(q))) {
        results.push({
          title: k.name,
          subtitle: `Knowledge Base Cluster • ${k.documents?.length || 0} doc(s)`,
          type: "Knowledge Base",
          targetTab: "knowledge-bases",
          payload: k
        });
      }
    });

    searchFlows.forEach(w => {
      if (w.name.toLowerCase().includes(q)) {
        results.push({
          title: w.name,
          subtitle: `Visual Platform Pipeline • ${w.nodes?.length || 0} stages`,
          type: "Workflow",
          targetTab: "workflows",
          payload: w
        });
      }
    });

    searchAgents.forEach(a => {
      if (a.name.toLowerCase().includes(q) || a.instructions.toLowerCase().includes(q)) {
        results.push({
          title: a.name,
          subtitle: `Deployed Persona • ${a.avatarEmoji || "🤖"} ${a.model}`,
          type: "Agent",
          targetTab: "agents",
          payload: a
        });
      }
    });

    searchSessions.forEach(s => {
      if (s.title.toLowerCase().includes(q) || (s.prompt && s.prompt.toLowerCase().includes(q))) {
        results.push({
          title: s.title,
          subtitle: `Saved Session • Tool: ${s.tool}`,
          type: "Session",
          targetTab: "sessions",
          payload: s
        });
      }
    });

    return results.slice(0, 8); // Limit display size
  };

  const filteredResults = getFilteredSearchResults();

  // Clock state matching environment local time
  const [time, setTime] = useState<Date>(() => new Date());

  // Sync clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Load audit history logs upon mounting or user identity swap
  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        const res = await fetch(`/api/user/usage/${userId}`);
        if (!res.ok) throw new Error("Faulty status from server.");
        const data = await res.json();
        
        if (active) {
          // If server memory restarted, merge with local client backup logs to safeguard statistics, otherwise keep server
          const localSaved = localStorage.getItem(`toolkit_history_backup_${userId}`);
          let merged = data.history || [];
          if (localSaved) {
            try {
              const parsedLocal = JSON.parse(localSaved);
              if (Array.isArray(parsedLocal)) {
                // Merge unique logs
                parsedLocal.forEach((localRec: UsageRecord) => {
                  if (!merged.some((serverRec: UsageRecord) => serverRec.id === localRec.id)) {
                    merged.push(localRec);
                  }
                });
              }
            } catch {
              // Ignore parse errors
            }
          }
          // Sort newly completed traces first
          merged.sort((a: UsageRecord, b: UsageRecord) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          setHistory(merged);
          
          if (data.user) {
            setUser(data.user);
            localStorage.setItem("toolkit_user_profile", JSON.stringify(data.user));
          }
        }
      } catch (err) {
        console.error("Unable to load metrics history stream:", err);
      }
    }

    loadData();

    return () => {
      active = false;
    };
  }, [userId]);

  // Handle backup serialization in browser
  const handleAddNewRecord = (newRec: UsageRecord) => {
    setHistory((prev) => {
      const updated = [newRec, ...prev];
      localStorage.setItem(`toolkit_history_backup_${userId}`, JSON.stringify(updated));
      return updated;
    });
  };

  // Perform authenticating login profile swap
  const handleUserLogin = async (emailInput: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailInput }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login attempt failed.");
      }

      setUser(data.user);
      localStorage.setItem("toolkit_user_profile", JSON.stringify(data.user));
      setActiveTab("dashboard");
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  // Update personalized credentials key proxy
  const handleUpdateGeminiKey = async (newKey: string) => {
    if (!user) return;
    try {
      const res = await fetch("/api/user/update-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, customGeminiKey: newKey }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Credentials setup failed.");
      }

      setUser(data.user);
      localStorage.setItem("toolkit_user_profile", JSON.stringify(data.user));
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  // Clear current history
  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem(`toolkit_history_backup_${userId}`);
  };

  // Backup and Sync metrics history
  const handleSyncHistory = async () => {
    try {
      const res = await fetch("/api/user/sync-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records: history }),
      });
      if (!res.ok) throw new Error("Sync failed.");
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("toolkit_user_profile");
    setUser({
      id: "guest",
      email: "developer@aistudio-toolkit.internal",
      apiKey: "tk_proj_live_default_99ef1a",
      createdAt: new Date().toISOString(),
    });
    setActiveTab("landing");
    setStatusMessage("Security session logged out successfully.");
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const isGuest = !user || user.id === "guest" || user.email === "developer@aistudio-toolkit.internal";

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 flex flex-col font-sans selection:bg-cyan-500 selection:text-white relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(56,189,248,0.06)_0%,transparent_60%)] pointer-events-none z-0"></div>

      {/* Dynamic AST Loader status bar (fixed ticker) */}
      {statusMessage && (
        <div className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-xs py-1.5 px-4 text-center font-mono flex items-center justify-center gap-2 tracking-wide animate-pulse shadow-sm z-50 relative">
          <Sparkles className="w-4 h-4 text-cyan-300 animate-spin" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Main Structural Framework Flex Layout */}
      <div className="flex-1 flex flex-col md:flex-row relative z-10">
        
        {/* Navigation Sidebar Drawer */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
        )}
        <aside className={`bg-[#0a0f1e] border-r border-slate-800 flex flex-col transition-transform duration-300 z-40 shrink-0 fixed inset-y-0 left-0 md:relative md:w-64 w-72 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0 md:w-0 md:border-r-0 md:overflow-hidden"
        }`}>
          
          {/* Logo and Branding header */}
          <div className="p-6 border-b border-slate-800/80 flex justify-between items-center bg-[#070b16]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-lg shadow-lg shadow-cyan-500/20 flex items-center justify-center text-white">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
              </div>
              <div>
                <span className="font-bold tracking-tight text-white text-base">NEURALVOID</span>
                <span className="text-[8px] font-mono tracking-widest text-[#22d3ee] block mt-1 leading-none uppercase">API CORE PROCESS</span>
              </div>
            </div>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="md:hidden text-slate-400 hover:text-white p-1.5 hover:bg-slate-800/50 rounded-lg outline-none"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick profile info card */}
          {isGuest ? (
            <button 
              onClick={() => {
                setActiveTab("auth");
                if (window.innerWidth < 768) setSidebarOpen(false);
              }}
              className="p-4 mx-4 my-3 bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-cyan-555/20 rounded-xl outline-none text-left cursor-pointer transition-all duration-150 relative group block shrink-0"
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-gradient-to-br from-slate-600 to-slate-800 border border-white/10 rounded-full flex items-center justify-center text-[10px] font-mono font-bold text-white leading-none group-hover:scale-105 transition-transform shrink-0">
                  G
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[8px] leading-none text-slate-500 font-mono uppercase tracking-wider group-hover:text-cyan-400 transition-colors">AUTHENTICATE DEVID</div>
                  <div className="text-[11px] font-mono font-semibold text-slate-350 mt-1 truncate">Guest Sandbox</div>
                </div>
              </div>
            </button>
          ) : (
            <div className="mx-4 my-3 bg-white/[0.03] border border-white/5 rounded-xl p-3 flex flex-col gap-2.5 shrink-0">
              <button 
                onClick={() => {
                  setActiveTab("auth");
                  if (window.innerWidth < 768) setSidebarOpen(false);
                }}
                className="w-full flex items-center gap-2 outline-none text-left cursor-pointer transition-all duration-150 relative group"
              >
                <div className="w-7 h-7 bg-gradient-to-br from-cyan-500 to-blue-600 border border-white/10 rounded-full flex items-center justify-center text-[10px] font-mono font-bold text-white leading-none group-hover:scale-105 transition-transform shrink-0">
                  ID
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[8px] leading-none text-cyan-400 font-mono uppercase tracking-wider">ACTIVE DEVID SESSION</div>
                  <div className="text-[11px] font-mono font-semibold text-slate-350 mt-1 truncate" title={user?.email}>{user?.email}</div>
                </div>
              </button>
              <div className="flex items-center gap-1.5 mt-1">
                <button 
                  onClick={handleLogout}
                  className="flex-1 py-1.5 px-2 bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 hover:border-red-500/30 rounded-lg text-slate-400 hover:text-white transition-all text-[10px] font-mono flex items-center justify-center gap-1 cursor-pointer outline-none"
                  title="Terminate Session"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
                <button 
                  onClick={() => {
                    handleLogout();
                    setActiveTab("auth");
                    if (window.innerWidth < 768) setSidebarOpen(false);
                  }}
                  className="flex-1 py-1.5 px-2 bg-slate-800/40 hover:bg-slate-700/50 border border-slate-700/50 hover:border-cyan-500/30 rounded-lg text-slate-400 hover:text-white transition-all text-[10px] font-mono flex items-center justify-center gap-1 cursor-pointer outline-none"
                  title="Switch Account"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Switch</span>
                </button>
              </div>
            </div>
          )}

          {/* Nav Items */}
          <nav className="p-4 flex-1 space-y-4 overflow-y-auto">
            {/* Onboarding Welcome */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold font-mono tracking-wider text-slate-550 uppercase px-3 block mb-1">Onboarding</span>
              
              <button
                onClick={() => {
                  setActiveTab("landing");
                  if (window.innerWidth < 768) setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold font-sans border transition-all duration-200 outline-none select-none cursor-pointer ${
                  activeTab === "landing"
                    ? "bg-slate-850/60 text-white border-cyan-500/30 shadow-md shadow-cyan-500/5"
                    : "bg-transparent text-slate-400 border-transparent hover:bg-slate-800/30 hover:text-white"
                }`}
              >
                <Home className="w-4 h-4 shrink-0 text-cyan-400" />
                <span>Welcome Launchpad</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab("auth");
                  if (window.innerWidth < 768) setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold font-sans border transition-all duration-200 outline-none select-none cursor-pointer ${
                  activeTab === "auth"
                    ? "bg-slate-850/60 text-white border-cyan-500/30 shadow-md shadow-cyan-500/5"
                    : "bg-transparent text-slate-400 border-transparent hover:bg-slate-800/30 hover:text-white"
                }`}
              >
                <UserCheck className="w-4 h-4 shrink-0 text-cyan-400" />
                <span>Secure Profile Gate</span>
              </button>
            </div>

            {/* Gateways Section */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold font-mono tracking-wider text-slate-555 uppercase px-3 block mb-1">Gateways</span>
              <button
                onClick={() => {
                  setActiveTab("dashboard");
                  if (window.innerWidth < 768) setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold font-sans border transition-all duration-200 outline-none select-none cursor-pointer ${
                  activeTab === "dashboard"
                    ? "bg-slate-850/60 text-white border-cyan-500/30 shadow-md shadow-cyan-500/5"
                    : "bg-transparent text-slate-400 border-transparent hover:bg-slate-800/30 hover:text-white"
                }`}
              >
                <BarChart3 className="w-4 h-4 shrink-0 text-cyan-400" />
                <span>Developer Dashboard</span>
              </button>
            </div>

            {/* Playgrounds Section */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold font-mono tracking-wider text-slate-555 uppercase px-3 block mb-1">Interactive play</span>
              {[
                { id: "text-gen", label: "Text Generator Sandbox", icon: Sliders, color: "text-indigo-400" },
                { id: "summarize", label: "Document Summarizer", icon: FileSpreadsheet, color: "text-blue-400" },
                { id: "grammar", label: "Grammar Core polisher", icon: Edit3, color: "text-pink-400" },
                { id: "explainer", label: "Code Explainer Review", icon: Terminal, color: "text-emerald-400" },
                { id: "pdf-qa", label: "PDF Research Explorer", icon: FileQuestion, color: "text-amber-400" },
                { id: "image-gen", label: "Vector SVG Art Compiler", icon: Type, color: "text-purple-400" },
                { id: "sessions", label: "Locked AI Session Vault", icon: Archive, color: "text-cyan-400" },
              ].map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id as any);
                      if (window.innerWidth < 768) setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold font-sans border transition-all duration-200 outline-none select-none cursor-pointer ${
                      active 
                        ? "bg-slate-850/60 text-white border-cyan-500/30 shadow-md shadow-cyan-500/5" 
                        : "bg-transparent text-slate-400 border-transparent hover:bg-slate-800/30 hover:text-white"
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${item.color}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* SaaS Engines Section */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold font-mono tracking-wider text-slate-555 uppercase px-3 block mb-1">SaaS Engines</span>
              {[
                { id: "prompts", label: "Prompt Studio Library", icon: Sparkles, color: "text-cyan-400" },
                { id: "knowledge-bases", label: "Semantic Document KBs", icon: BookOpen, color: "text-emerald-400" },
                { id: "workflows", label: "Visual Pipeline Builder", icon: Layers, color: "text-indigo-400" },
                { id: "workspaces", label: "Workspaces Contexts", icon: Folder, color: "text-indigo-400" },
                { id: "agents", label: "Autonomous GPT Agents", icon: MessageSquare, color: "text-cyan-400" },
              ].map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id as any);
                      if (window.innerWidth < 768) setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold font-sans border transition-all duration-200 outline-none select-none cursor-pointer ${
                      active 
                        ? "bg-slate-850/60 text-white border-cyan-500/30 shadow-md shadow-cyan-500/5" 
                        : "bg-transparent text-slate-400 border-transparent hover:bg-slate-800/30 hover:text-white"
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${item.color}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Credentials & Credentials Section */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold font-mono tracking-wider text-slate-555 uppercase px-3 block mb-1">API & Audits</span>
              {[
                { id: "api-keys", label: "API Keys Manager", icon: Key, color: "text-cyan-400" },
                { id: "api-docs", label: "Interactive API Specs", icon: BookOpen, color: "text-indigo-400" },
                { id: "usage", label: "Audit Call Logs", icon: History, color: "text-pink-400" },
              ].map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id as any);
                      if (window.innerWidth < 768) setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold font-sans border transition-all duration-200 outline-none select-none cursor-pointer ${
                      active 
                        ? "bg-slate-850/60 text-white border-cyan-500/30 shadow-md shadow-cyan-500/5" 
                        : "bg-transparent text-slate-400 border-transparent hover:bg-slate-800/30 hover:text-white"
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${item.color}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Admin Section */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold font-mono tracking-wider text-slate-555 uppercase px-3 block mb-1">Administration</span>
              <button
                onClick={() => {
                  setActiveTab("admin");
                  if (window.innerWidth < 768) setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold font-sans border transition-all duration-200 outline-none select-none cursor-pointer ${
                  activeTab === "admin"
                    ? "bg-slate-850/60 text-white border-red-500/25 shadow-md shadow-red-500/5"
                    : "bg-transparent text-slate-400 border-transparent hover:bg-slate-800/30 hover:text-white"
                }`}
              >
                <ShieldCheck className="w-4 h-4 shrink-0 text-red-400 animate-pulse" />
                <span>Admin SLA Panel</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab("settings");
                  if (window.innerWidth < 768) setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold font-sans border transition-all duration-200 outline-none select-none cursor-pointer ${
                  activeTab === "settings"
                    ? "bg-slate-850/60 text-white border-cyan-500/25 shadow-md shadow-cyan-500/5"
                    : "bg-transparent text-slate-400 border-transparent hover:bg-slate-800/30 hover:text-white"
                }`}
              >
                <SettingsIcon className="w-4 h-4 shrink-0 text-slate-400" />
                <span>Platform Settings</span>
              </button>
            </div>
          </nav>

          {/* Premium Billing Tracker from Design */}
          <div className="p-4 border-t border-slate-850 bg-[#080d19]">
            <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/20">
              <p className="text-[10px] text-blue-400 font-bold uppercase tracking-wider mb-1.5">Plan Status</p>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-white font-semibold text-xs leading-none">Pro Dev</p>
                  <span className="text-[9px] text-slate-500 block mt-1 leading-none">Renews Oct 24</span>
                </div>
                <div className="text-right">
                  <span className="text-blue-400 font-mono text-xs font-bold">82%</span>
                </div>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1 mt-2.5">
                <div className="bg-blue-500 h-1 rounded-full" style={{ width: "82%" }}></div>
              </div>
            </div>
          </div>

          {/* Footer branding */}
          <div className="p-4 pt-1 bg-[#070b14] border-t border-slate-850/50 text-[9px] font-mono text-slate-600 hidden md:block">
            AI_TOOLKIT_SERIES v2.0.4<br />
            BUILD_GATEWAY_NODE::ACTIVE
          </div>
        </aside>

        {/* Outer body main wrapper */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          
          {/* Main Top Header bar */}
          <header className="bg-[#0a0f1e]/85 backdrop-blur-md border-b border-slate-800/60 p-4 h-16 flex items-center justify-between sticky top-0 z-30">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-1.5 hover:bg-slate-800/80 text-slate-400 hover:text-white rounded-lg outline-none cursor-pointer transition-colors"
                title="Toggle Workspace Sidebar"
              >
                <Menu className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium">Workspace</span>
                <span className="text-slate-700 text-[10px] font-mono">/</span>
                <span className="text-xs font-semibold text-white tracking-wide">
                  {activeTab === "landing" && "Welcome Hub"}
                  {activeTab === "dashboard" && "Developer Dashboard"}
                  {activeTab === "text-gen" && "Text Generator"}
                  {activeTab === "summarize" && "API Summarizer"}
                  {activeTab === "grammar" && "Grammar Fixer"}
                  {activeTab === "explainer" && "Code Explainer"}
                  {activeTab === "pdf-qa" && "PDF Q&A"}
                  {activeTab === "image-gen" && "Image Gen"}
                  {activeTab === "sessions" && "AI Session Vault"}
                  {activeTab === "api-keys" && "API Credentials"}
                  {activeTab === "api-docs" && "API Documentation"}
                  {activeTab === "usage" && "Audit Call Logs"}
                  {activeTab === "admin" && "Admin SLA command"}
                  {activeTab === "settings" && "Platform Settings"}
                  {activeTab === "prompts" && "Prompt Engineering Studio"}
                  {activeTab === "knowledge-bases" && "Knowledge Base Clusters"}
                  {activeTab === "workflows" && "Visual AI Workflows"}
                  {activeTab === "workspaces" && "Workspace Context Engine"}
                  {activeTab === "agents" && "Custom AI Personas"}
                </span>
                <span className="hidden sm:inline-flex items-center gap-1.5 bg-cyan-950/80 border border-cyan-800 px-2 py-0.5 rounded-full text-[9px] font-mono text-cyan-400 font-bold uppercase tracking-wider leading-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                  ONLINE_SLA
                </span>
              </div>
            </div>

            {/* Global Search Bar Context */}
            <div className="hidden md:block relative max-w-xs xl:max-w-sm w-full mx-4">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={globalSearch}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setTimeout(() => setSearchFocused(false), 200)} // Delay overlay closure so click registers
                  onChange={e => setGlobalSearch(e.target.value)}
                  placeholder="Universal search (binary, prompt, agent)..."
                  className="w-full bg-[#040815]/80 placeholder-slate-600 px-9 py-1.5 rounded-lg border border-slate-800 text-xs text-white outline-none focus:border-cyan-500/80 focus:bg-[#040815] transition-all"
                />
                {globalSearch && (
                  <button
                    onClick={() => setGlobalSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-550 hover:text-white text-[10px] bg-[#0a0f1e] px-1 py-0.5 rounded outline-none font-mono border border-slate-800"
                  >
                    clear
                  </button>
                )}
              </div>

              {/* Dynamic search results container */}
              {searchFocused && globalSearch.trim() && (
                <div id="universal_search_dropdown" className="absolute top-10 left-0 right-0 bg-[#090d1a] border border-slate-800 rounded-xl shadow-2xl p-2 z-50 max-h-[360px] overflow-y-auto space-y-1.5 scrollbar-thin">
                  <div className="text-[9px] font-mono font-bold text-slate-500 px-2 py-1 uppercase tracking-wider">
                    {filteredResults.length === 0 ? "No records match search term" : "Platform Indexes Matched"}
                  </div>
                  
                  {filteredResults.map((res, i) => (
                    <button
                      key={i}
                      onMouseDown={() => {
                        // Switch active context tab
                        setActiveTab(res.targetTab);
                        setGlobalSearch("");
                        // Optionally trigger preset states in child views!
                        if (res.payload) {
                          // Save item to localStorage so the child component can auto-select it upon loading!
                          localStorage.setItem(`toolkit_autoselect_${res.targetTab}`, res.payload.id);
                        }
                      }}
                      className="w-full text-left p-2 hover:bg-slate-850 rounded-lg flex items-center justify-between gap-2.5 transition-colors cursor-pointer outline-none group"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-205 group-hover:text-cyan-400 transition-colors truncate">
                          {res.title}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate mt-0.5">
                          {res.subtitle}
                        </p>
                      </div>
                      <span className="text-[8px] font-mono px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded uppercase font-bold text-slate-400 shrink-0">
                        {res.type}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Status Bar Widgets */}
            <div className="flex items-center gap-3">
              {/* API Status Badge */}
              <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-[10px] font-mono text-slate-400">
                <Wifi className="w-3 h-3 text-emerald-500" />
                <span>API Gateway Latency:</span>
                <span className="font-semibold text-slate-250">14ms</span>
              </div>

              {/* Dev Network status */}
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-[10px] font-mono text-slate-400">
                <Server className="w-3 h-3 text-indigo-500" />
                <span>Node:</span>
                <span className="font-semibold text-slate-250 uppercase">US-EAST-1</span>
              </div>

              {/* Time display indicator */}
              <div className="flex items-center gap-2.5 px-3 bg-[#080c16] py-1.5 rounded-lg border border-slate-800/80 shrink-0 shadow-inner">
                <Clock className="w-3.5 h-3.5 text-cyan-500/70 shrink-0" />
                <div className="flex flex-col">
                  <span className="font-mono font-bold text-[11px] leading-tight text-slate-200">{time.toLocaleTimeString([], { hour12: false })}</span>
                  <span className="text-[8px] font-mono text-slate-500 leading-none uppercase">{Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'}</span>
                </div>
              </div>
            </div>
          </header>

          {/* Primary View content shell */}
          <main className="flex-1 p-5 md:p-8 max-w-7xl mx-auto w-full relative z-10">
            {activeTab === "landing" && (
              <LandingPage 
                onNavigate={(tab) => {
                  setActiveTab(tab);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                onQuickLogin={() => {
                  setActiveTab("auth");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                userEmail={user?.email}
              />
            )}

            {activeTab === "auth" && (
              <AuthPage 
                onAuthSuccess={(authenticatedUser) => {
                  setUser(authenticatedUser);
                  localStorage.setItem("toolkit_user_profile", JSON.stringify(authenticatedUser));
                  setActiveTab("dashboard");
                  setStatusMessage(`Security node verified: ${authenticatedUser.email}`);
                  setTimeout(() => setStatusMessage(null), 4000);
                }}
                onNavigate={(tab) => {
                  setActiveTab(tab);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                currentEmail={user?.email !== "developer@aistudio-toolkit.internal" ? user?.email : ""}
              />
            )}

            {activeTab === "dashboard" && (
              <Dashboard 
                history={history} 
                user={user} 
                onNavigate={(tab) => {
                  setActiveTab(tab);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }} 
              />
            )}
            
            {activeTab === "text-gen" && (
              <TextGenerator 
                onAddLog={handleAddNewRecord} 
                userId={userId} 
                customKey={user?.customGeminiKey}
                onSetStatus={setStatusMessage}
              />
            )}

            {activeTab === "summarize" && (
              <Summarizer 
                onAddLog={handleAddNewRecord} 
                userId={userId} 
                customKey={user?.customGeminiKey}
                onSetStatus={setStatusMessage}
              />
            )}

            {activeTab === "grammar" && (
              <GrammarImprover 
                onAddLog={handleAddNewRecord} 
                userId={userId} 
                customKey={user?.customGeminiKey}
                onSetStatus={setStatusMessage}
              />
            )}

            {activeTab === "explainer" && (
              <CodeExplainer 
                onAddLog={handleAddNewRecord} 
                userId={userId} 
                customKey={user?.customGeminiKey}
                onSetStatus={setStatusMessage}
              />
            )}

            {activeTab === "pdf-qa" && (
              <PdfQa 
                onAddLog={handleAddNewRecord} 
                userId={userId} 
                customKey={user?.customGeminiKey}
                onSetStatus={setStatusMessage}
                initialText={qaPreloadedSnippet}
                initialFilename={qaPreloadedFilename}
              />
            )}

            {activeTab === "image-gen" && (
              <ImageGenerator 
                onAddLog={handleAddNewRecord} 
                userId={userId} 
                customKey={user?.customGeminiKey}
                onSetStatus={setStatusMessage}
              />
            )}

            {activeTab === "sessions" && (
              <SavedSessions 
                user={user}
                onLoadSession={(session) => {
                  const mapTab = session.tool === "Text Generator" ? "text-gen" :
                                 session.tool === "Summarizer" ? "summarize" :
                                 session.tool === "Grammar Improver" ? "grammar" :
                                 session.tool === "Code Explainer" ? "explainer" :
                                 session.tool === "PDF Q&A" ? "pdf-qa" :
                                 session.tool === "Image Generator" ? "image-gen" : "dashboard";
                  setActiveTab(mapTab as any);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              />
            )}

            {activeTab === "api-keys" && (
              <ApiKeys 
                userId={userId}
              />
            )}

            {activeTab === "api-docs" && (
              <ApiDocs 
                user={user}
                onLoggedRequest={handleAddNewRecord}
              />
            )}

            {activeTab === "usage" && (
              <UsageHistory 
                history={history}
                onSetStatus={setStatusMessage}
                onClearHistory={handleClearHistory}
              />
            )}

            {activeTab === "admin" && (
              <AdminPanel 
                history={history}
              />
            )}

            {activeTab === "prompts" && (
              <PromptStudio 
                user={user}
                onAddLog={handleAddNewRecord}
                onSetStatus={setStatusMessage}
              />
            )}

            {activeTab === "knowledge-bases" && (
              <KnowledgeBases 
                user={user}
                onNavigateToQA={(snippet, docName) => {
                  setQaPreloadedSnippet(snippet);
                  setQaPreloadedFilename(docName);
                  setActiveTab("pdf-qa");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                onSetStatus={setStatusMessage}
              />
            )}

            {activeTab === "workflows" && (
              <WorkflowBuilder 
                user={user}
                onAddLog={handleAddNewRecord}
                onSetStatus={setStatusMessage}
              />
            )}

            {activeTab === "workspaces" && (
              <Workspaces 
                user={user}
                activeWorkspaceId={activeWorkspaceId}
                onSelectWorkspace={handleSetActiveWorkspaceId}
                onSetStatus={setStatusMessage}
              />
            )}

            {activeTab === "agents" && (
              <Agents 
                user={user}
                onAddLog={handleAddNewRecord}
                onSetStatus={setStatusMessage}
                activeWorkspaceId={activeWorkspaceId}
              />
            )}

            {activeTab === "settings" && (
              <Settings 
                user={user} 
                onLogin={handleUserLogin} 
                onUpdateGeminiKey={handleUpdateGeminiKey}
                onClearHistory={handleClearHistory}
                onSyncHistory={handleSyncHistory}
                historyCount={history.length}
                onLogout={handleLogout}
              />
            )}
          </main>
          
          <footer className="p-8 border-t border-slate-800 text-center text-slate-500 text-xs">
            <div className="mb-4 font-bold text-slate-300">NeuralVoid</div>
            <div className="flex flex-wrap justify-center gap-4">
              <button onClick={() => setIsPrivacyOpen(true)} className="hover:text-white">Privacy Policy</button>
              <button onClick={() => setIsTermsOpen(true)} className="hover:text-white">Terms & Conditions</button>
              <button onClick={() => setIsCookiesOpen(true)} className="hover:text-white">Cookie Notice</button>
              <a href="mailto:support@neuralvoid.com" className="hover:text-white">Contact</a>
              <span className="text-slate-700">|</span>
              <span>Status: Operational</span>
              <span className="text-slate-700">|</span>
              <span>Version 1.0.0</span>
            </div>
          </footer>

        </div>
        
        {/* Floating AI Assistant */}
        {activeTab !== "landing" && activeTab !== "auth" && (
          <FloatingAssistant currentTab={activeTab} user={user} />
        )}

        <PrivacyPolicyModal isOpen={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} />
        <TermsAndConditionsModal isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />
        <CookieNoticeModal isOpen={isCookiesOpen} onClose={() => setIsCookiesOpen(false)} />
        <CookieConsentManager />
      </div>
    </div>
  );
}
