import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  Clock, Terminal, FileText, Sparkles, Trash2, ArrowUpRight, Copy, Search, 
  ExternalLink, Filter, Code2, Sliders, Check, Archive, BookOpen
} from "lucide-react";
import { SavedSession, UserProfile } from "../types";
import { formatTimeWithRelative } from "../utils";

interface SavedSessionsProps {
  user: UserProfile | null;
  onLoadSession: (session: SavedSession) => void;
}

export default function SavedSessions({ user, onLoadSession }: SavedSessionsProps) {
  const [sessions, setSessions] = useState<SavedSession[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedTool, setSelectedTool] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const userId = user?.id || "guest";

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/sessions/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      }
    } catch (err) {
      console.error("Failed to load saved sessions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [userId]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to permanently delete this saved AI session?")) return;

    try {
      const res = await fetch(`/api/sessions/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setSessions(prev => prev.filter(s => s.id !== id));
        if (expandedId === id) setExpandedId(null);
      }
    } catch (err) {
      console.error("Error deleting session:", err);
    }
  };

  const handleCopyText = (text: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  // Filter sessions
  const filteredSessions = sessions.filter(s => {
    const matchesSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.prompt.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTool = selectedTool === "all" || s.tool === selectedTool;
    return matchesSearch && matchesTool;
  });

  const getToolColor = (tool: string) => {
    switch (tool) {
      case "Text Generator": return "text-indigo-400 bg-indigo-500/10 border-indigo-500/20";
      case "Summarizer": return "text-blue-400 bg-blue-500/10 border-blue-500/20";
      case "Grammar Improver": return "text-pink-400 bg-pink-500/10 border-pink-500/20";
      case "Code Explainer": return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
      case "PDF Q&A": return "text-amber-400 bg-amber-500/10 border-amber-500/20";
      case "Image Generator": return "text-purple-400 bg-purple-500/10 border-purple-500/20";
      default: return "text-slate-400 bg-slate-500/10 border-slate-500/20";
    }
  };

  const parseOrRenderResponse = (response: string) => {
    try {
      const parsed = JSON.parse(response);
      if (parsed.polishedText) {
        return (
          <div className="space-y-2">
            <p className="text-cyan-400 font-mono text-[10px] font-bold uppercase tracking-wider">Polished Result:</p>
            <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl font-sans text-slate-300 text-xs">
              {parsed.polishedText}
            </div>
            {parsed.changes && parsed.changes.length > 0 && (
              <div className="space-y-1 mt-2.5">
                <p className="text-xs font-semibold text-slate-400">Modifications List:</p>
                {parsed.changes.slice(0, 3).map((c: any, idx: number) => (
                  <div key={idx} className="text-[10px] bg-slate-900 border border-slate-800 p-2 rounded-lg font-mono flex flex-col gap-1">
                    <span className="text-red-400 line-through">Original: "{c.original}"</span>
                    <span className="text-emerald-400">Corrected: "{c.improved}"</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      }
      if (parsed.explanation) {
        return (
          <div className="space-y-2">
            <p className="text-cyan-400 font-mono text-[10px] font-bold uppercase tracking-wider">Code Insight Explanation:</p>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">{parsed.explanation}</p>
            {parsed.optimizedCode && (
              <div className="mt-2 text-left">
                <span className="text-[10px] font-bold text-slate-500 font-mono block mb-1">REFACTOR CODE:</span>
                <pre className="p-2 bg-slate-950 border border-slate-800 rounded font-mono text-xxs text-emerald-400 overflow-x-auto max-h-40">
                  {parsed.optimizedCode}
                </pre>
              </div>
            )}
          </div>
        );
      }
      if (parsed.summary) {
        return (
          <div className="space-y-1 text-left">
            <p className="text-cyan-400 font-mono text-[10px] font-bold uppercase tracking-wider">Document Summary:</p>
            <div className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto font-sans p-2 bg-slate-950/60 rounded">
              {parsed.summary}
            </div>
          </div>
        );
      }
      return <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">{JSON.stringify(parsed, null, 2)}</p>;
    } catch {
      return (
        <div className="space-y-1 text-left">
          <p className="text-cyan-400 font-mono text-[10px] font-bold uppercase tracking-wider">Raw Text Value:</p>
          <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed font-mono bg-slate-950 p-2.5 rounded-xl border border-slate-900 overflow-y-auto max-h-56 select-text">{response}</p>
        </div>
      );
    }
  };

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <Archive className="w-5 h-5 text-cyan-400" /> Locked AI Session Vault
          </h2>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            Retrieve, review, and synchronize previous playground queries and outputs securely archived in database records.
          </p>
        </div>
        
        {/* Statistics count indicator */}
        <div className="flex items-center gap-2.5 font-mono text-xxs text-slate-500 bg-slate-950/60 border border-slate-850 px-3.5 py-1.5 rounded-full select-none w-fit">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>SaaS SESSION ACTIVE REPLICA:</span>
          <span className="text-cyan-400 font-bold">{sessions.length} RECORDED</span>
        </div>
      </div>

      {/* Query Filters dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950/50 p-4 rounded-2xl border border-slate-850">
        <div className="relative sm:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search saved session names, keywords, or prompts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9.5 pr-4 py-2 text-xs text-white outline-none focus:border-cyan-500 transition font-sans"
          />
        </div>

        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <select
            value={selectedTool}
            onChange={(e) => setSelectedTool(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-8 py-2 text-xs text-white outline-none focus:border-cyan-500 appearance-none transition cursor-pointer font-sans"
          >
            <option value="all">🔍 Show All Tools</option>
            <option value="Text Generator">Text Generator</option>
            <option value="Summarizer">Summarizer</option>
            <option value="Grammar Improver">Grammar Core</option>
            <option value="Code Explainer">Code Explainer</option>
            <option value="PDF Q&A">PDF Research Q&A</option>
            <option value="Image Generator">SVG Compiler</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-20 space-y-3 bg-[#0a0f1d]/30 border border-slate-900 rounded-3xl">
          <div className="w-8 h-8 rounded-full border-2 border-t-cyan-400 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
          <span className="text-slate-500 text-xs font-mono">LOADING SEEDED WORKBOOK DATA...</span>
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-20 text-center space-y-4 bg-[#0a0f1d]/30 border border-slate-900 rounded-3xl">
          <div className="w-12 h-12 rounded-2xl bg-slate-950/80 border border-slate-850 flex items-center justify-center text-slate-500">
            <BookOpen className="w-5 h-5 text-slate-500" />
          </div>
          <div className="space-y-1">
            <p className="text-white text-xs font-semibold">No Saved Sessions Match Query</p>
            <p className="text-slate-500 text-xxs max-w-sm mx-auto leading-relaxed">
              Complete any generation in standard sandboxes, then click "Lock in Session Archive" to safely persist the full prompt, config, and output to this panel.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5">
          {filteredSessions.map((session) => {
            const isExpanded = expandedId === session.id;
            return (
              <div
                key={session.id}
                onClick={() => setExpandedId(isExpanded ? null : session.id)}
                className={`text-left bg-slate-950/40 rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden leading-normal flex flex-col ${
                  isExpanded 
                    ? "border-cyan-500/25 bg-[#090f1d]/40 shadow-lg shadow-cyan-500/5 ring-1 ring-cyan-500/10" 
                    : "border-slate-850 hover:border-slate-700/80 hover:bg-[#070b14]/50"
                }`}
              >
                
                {/* Session Card Info Line */}
                <div className="p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 select-none-all">
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 text-xxs font-mono rounded px-2 py-0.5 border shrink-0 font-bold uppercase select-none ${getToolColor(session.tool)}`}>
                      {session.tool.replace("Sandbox", "").replace("Core", "").trim()}
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-white leading-normal truncate max-w-md sm:max-w-xl">
                        {session.title}
                      </h4>
                      <p className="text-xxs text-slate-400 font-sans tracking-wide flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        Executed {formatTimeWithRelative(session.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:ml-auto">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onLoadSession(session);
                      }}
                      title="Load this data directly back into playground workspace"
                      className="px-2.5 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 font-mono text-[10px] font-bold rounded-lg border border-cyan-500/15 flex items-center gap-1 outline-none transition cursor-pointer"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" /> Reload playground
                    </button>

                    <button
                      onClick={(e) => handleDelete(session.id, e)}
                      title="Delete saved archive permanently"
                      className="p-1.5 bg-transparent hover:bg-red-500/10 text-slate-500 hover:text-red-400 border border-transparent hover:border-red-500/15 rounded-lg outline-none transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Prompt block preview snippet */}
                <div className="px-4.5 py-2.5 bg-slate-950/80 border-t border-b border-slate-900 flex justify-between items-center text-left">
                  <div className="font-mono text-[10.5px] text-slate-300 truncate max-w-sm sm:max-w-xl">
                    <span className="text-slate-500 font-bold">QS:</span> "{session.prompt}"
                  </div>
                  <span className="text-[9px] text-cyan-400 font-mono font-bold shrink-0">
                    {isExpanded ? "[ COLLAPSE INSIGHTS - ]" : "[ EXPAND LOGS + ]"}
                  </span>
                </div>

                {/* Expanded full outputs view */}
                {isExpanded && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    className="p-4.5 bg-slate-955/65 border-t border-slate-900 space-y-4"
                  >
                    
                    {/* Source Query Block */}
                    <div className="space-y-1 text-left">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-wider">FULL INPUT PROMPT:</span>
                        <button
                          type="button"
                          onClick={(e) => handleCopyText(session.prompt, `pr-${session.id}`, e)}
                          className="text-slate-500 hover:text-white transition flex items-center gap-1 font-mono text-[9px]"
                        >
                          {copiedId === `pr-${session.id}` ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" /> Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" /> Copy Prompt
                            </>
                          )}
                        </button>
                      </div>
                      <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-850 font-mono text-xs text-slate-300 leading-relaxed select-text whitespace-pre-wrap">
                        {session.prompt}
                      </div>
                    </div>

                    {/* Output values container */}
                    <div className="space-y-1.5 text-left border-t border-slate-900/65 pt-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-wider">SECURE RESPONSE PAYLOAD:</span>
                        <button
                          type="button"
                          onClick={(e) => handleCopyText(session.response, `resp-${session.id}`, e)}
                          className="text-slate-500 hover:text-white transition flex items-center gap-1 font-mono text-[9px]"
                        >
                          {copiedId === `resp-${session.id}` ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" /> Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" /> Copy Payload
                            </>
                          )}
                        </button>
                      </div>
                      <div className="space-y-1 border-l-2 border-slate-800 pl-3 leading-normal">
                        {parseOrRenderResponse(session.response)}
                      </div>
                    </div>

                  </motion.div>
                )}

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
