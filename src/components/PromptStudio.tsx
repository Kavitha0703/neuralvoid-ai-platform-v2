import React, { useState, useEffect } from "react";
import { Sparkles, Star, Plus, Trash2, Copy, Search, Send, FileText, Check, ArrowUpCircle, History, Edit, CheckCircle, ArrowRight } from "lucide-react";
import { PromptTemplate, UserProfile, UsageRecord } from "../types";
import { formatTimeWithRelative } from "../utils";

interface PromptStudioProps {
  user: UserProfile | null;
  onAddLog: (newRec: UsageRecord) => void;
  onSetStatus: (msg: string | null) => void;
}

interface PromptRevision {
  id: string;
  promptId: string;
  version: number;
  content: string;
  changeNote: string;
  modelUsed?: string;
  updatedAt: string;
}

export default function PromptStudio({ user, onAddLog, onSetStatus }: PromptStudioProps) {
  const [prompts, setPrompts] = useState<PromptTemplate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  
  // Selection & Form states
  const [editingPromptId, setEditingPromptId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  
  // Create / Edit fields
  const [formTitle, setFormTitle] = useState<string>("");
  const [formCategory, setFormCategory] = useState<string>("Coding");
  const [formContent, setFormContent] = useState<string>("");
  const [changeNote, setChangeNote] = useState<string>("");

  // Testing sandbox states
  const [sandboxPromptId, setSandboxPromptId] = useState<string | null>(null);
  const [customVariables, setCustomVariables] = useState<Record<string, string>>({});
  const [sandboxResult, setSandboxResult] = useState<string>("");
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [sandboxMetrics, setSandboxMetrics] = useState<any>(null);

  // In-memory version list to show change logs
  const [revisions, setRevisions] = useState<Record<string, PromptRevision[]>>({
    "prompt-1": [
      { id: "rev-1-1", promptId: "prompt-1", version: 1, content: "Optimize SQL performance queries...", changeNote: "Initial prompt setup for database analysis.", modelUsed: "gemini-3.5-flash", updatedAt: "2026-05-12T10:00:00Z" },
      { id: "rev-1-2", promptId: "prompt-1", version: 2, content: "Analyze the following PostgreSQL query performance metrics and rewrite it using efficient join strategies and indexed scans: \n\nQuery:\n{{input_query}}", changeNote: "Changed model:\nFlash ➔ Pro • Restructured join suggestions.", modelUsed: "gemini-3.5-pro", updatedAt: "2026-06-01T14:30:00Z" }
    ],
    "prompt-2": [
      { id: "rev-2-1", promptId: "prompt-2", version: 1, content: "Polish raw text grammar easily.", changeNote: "Baseline lexical grammar template.", modelUsed: "gemini-3.5-flash", updatedAt: "2026-05-20T08:00:00Z" },
      { id: "rev-2-2", promptId: "prompt-2", version: 2, content: "Polish standard technical language into professional documentation style. Structure the text with clear headings, bullets, and note blocks.\n\nInput Text:\n{{text}}", changeNote: "Added markdown structure parameters for formatting.", modelUsed: "gemini-3.5-flash", updatedAt: "2026-06-03T11:45:00Z" }
    ]
  });

  const userId = user?.id || "guest";
  const categories = ["All", "Coding", "Database", "Writing", "Marketing", "General"];

  const loadPrompts = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/prompts/${userId}`);
      if (!res.ok) throw new Error("Could not fetch prompts");
      const data = await res.json();
      
      const loaded: PromptTemplate[] = data.prompts || [];
      // Synchronize in-memory seed version increments if higher
      loaded.forEach(item => {
        if (item.id === "prompt-1" && item.version === 1) item.version = 2;
        if (item.id === "prompt-2" && item.version === 1) item.version = 2;
      });
      setPrompts(loaded);
    } catch (e) {
      console.error(e);
      onSetStatus("Error loading prompt library.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrompts();
  }, [userId]);

  const toggleFavorite = async (p: PromptTemplate) => {
    try {
      const res = await fetch(`/api/prompts/${p.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ favorite: !p.favorite }),
      });
      if (res.ok) {
        setPrompts(prev => prev.map(item => item.id === p.id ? { ...item, favorite: !p.favorite } : item));
        onSetStatus(p.favorite ? "Removed from favorites." : "Added to favorites!");
        setTimeout(() => onSetStatus(null), 2000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const duplicatePrompt = async (p: PromptTemplate) => {
    try {
      onSetStatus("Duplicating prompt template...");
      const res = await fetch("/api/prompts/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          title: `Copy of ${p.title}`,
          category: p.category,
          content: p.content,
        }),
      });
      if (res.ok) {
        onSetStatus("Prompt duplicated successfully!");
        loadPrompts();
        setTimeout(() => onSetStatus(null), 2500);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Create prompt template
  const handleCreatePrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim()) return;

    try {
      onSetStatus("Creating prompt template...");
      const res = await fetch("/api/prompts/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          title: formTitle,
          category: formCategory,
          content: formContent,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const createdPrompt = data.prompt;
        
        // Log first version revision
        const newRev: PromptRevision = {
          id: `rev-${Math.random().toString(36).substr(2, 5)}`,
          promptId: createdPrompt.id,
          version: 1,
          content: formContent,
          changeNote: "Initial baseline copy.",
          modelUsed: "gemini-3.5-flash",
          updatedAt: new Date().toISOString()
        };
        setRevisions(prev => ({
          ...prev,
          [createdPrompt.id]: [newRev]
        }));

        onSetStatus("Prompt template successfully stored!");
        setFormTitle("");
        setFormContent("");
        setIsCreating(false);
        loadPrompts();
        setTimeout(() => onSetStatus(null), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Upgrades prompt (save new version and register changelogs)
  const handleUpdatePrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPromptId || !formContent.trim()) return;

    const original = prompts.find(p => p.id === editingPromptId);
    if (!original) return;

    const nextVer = original.version + 1;
    const note = changeNote.trim() || `Incremental update v${nextVer}`;

    try {
      onSetStatus(`Upgrading Prompt Template to v${nextVer}...`);
      const res = await fetch(`/api/prompts/${editingPromptId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formTitle,
          category: formCategory,
          content: formContent
        })
      });

      if (res.ok) {
        // Register version revision log
        const historyRow: PromptRevision = {
          id: `rev-${Math.random().toString(36).substr(2, 5)}`,
          promptId: editingPromptId,
          version: nextVer,
          content: formContent,
          changeNote: note,
          modelUsed: formTitle.toLowerCase().includes("pro") ? "gemini-3.5-pro" : "gemini-3.5-flash",
          updatedAt: new Date().toISOString()
        };

        setRevisions(prev => ({
          ...prev,
          [editingPromptId]: [historyRow, ...(prev[editingPromptId] || [])]
        }));

        onSetStatus(`Configured v${nextVer} workspace draft!`);
        setEditingPromptId(null);
        setFormTitle("");
        setFormContent("");
        setChangeNote("");
        loadPrompts();
        setTimeout(() => onSetStatus(null), 2500);
      }
    } catch (err: any) {
      console.error(err);
      onSetStatus("Could not commit version revision.");
    }
  };

  const deletePrompt = async (id: string) => {
    if (!confirm("Are you sure you want to delete this prompt template?")) return;
    try {
      const res = await fetch(`/api/prompts/${id}`, { method: "DELETE" });
      if (res.ok) {
        onSetStatus("Template successfully removed.");
        setPrompts(prev => prev.filter(p => p.id !== id));
        if (sandboxPromptId === id) {
          setSandboxPromptId(null);
          setSandboxResult("");
        }
        setTimeout(() => onSetStatus(null), 2000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const extractVariables = (text: string): string[] => {
    const rx = /\{\{([^}]+)\}\}/g;
    const matches: string[] = [];
    let match;
    while ((match = rx.exec(text)) !== null) {
      if (!matches.includes(match[1].trim())) {
        matches.push(match[1].trim());
      }
    }
    return matches;
  };

  const openSandbox = (p: PromptTemplate) => {
    setSandboxPromptId(p.id);
    const variables = extractVariables(p.content);
    const varMap: Record<string, string> = {};
    variables.forEach(v => {
      varMap[v] = "";
    });
    setCustomVariables(varMap);
    setSandboxResult("");
    setSandboxMetrics(null);
  };

  const runTest = async () => {
    const activePrompt = prompts.find(p => p.id === sandboxPromptId);
    if (!activePrompt) return;

    let compiledPrompt = activePrompt.content;
    Object.entries(customVariables).forEach(([key, val]) => {
      compiledPrompt = compiledPrompt.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), val);
    });

    try {
      setIsTesting(true);
      setSandboxResult("");
      onSetStatus(`Compiling and testing "${activePrompt.title}"...`);

      const res = await fetch("/api/toolkit/generate-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: compiledPrompt,
          userId,
          customKey: user?.customGeminiKey,
          model: activePrompt.title.toLowerCase().includes("pro") ? "gemini-3.5-pro" : "gemini-3.5-flash"
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation error");

      setSandboxResult(data.text);
      setSandboxMetrics(data.metrics);
      onAddLog({
        id: `log-${Math.random().toString(36).substr(2, 9)}`,
        userId,
        timestamp: new Date().toISOString(),
        tool: "Text Generator",
        prompt: `Studio Test: ${activePrompt.title}`,
        status: "success",
        durationMs: data.metrics?.durationMs || 1000,
        tokensUsed: data.metrics?.tokensUsed || 300,
        estimatedCost: (data.metrics?.tokensUsed || 300) * 0.000001,
        modelUsed: activePrompt.title.toLowerCase().includes("pro") ? "gemini-3.5-pro" : "gemini-3.5-flash"
      });
      onSetStatus("Test execution complete!");
      setTimeout(() => onSetStatus(null), 2500);

    } catch (e: any) {
      console.error(e);
      setSandboxResult(`Failed to test prompt: ${e.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  const startEditing = (p: PromptTemplate) => {
    setEditingPromptId(p.id);
    setIsCreating(false);
    setFormTitle(p.title);
    setFormCategory(p.category);
    setFormContent(p.content);
    setChangeNote("");
  };

  const filteredPrompts = prompts.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === "All" || p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div id="prompt_studio_layout" className="space-y-6">
      
      {/* Title & action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-xl font-bold text-white font-sans flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            Prompt Engineering Studio
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Build and test premium Gemini models instructions with built-in version logs, dynamic sandbox variables, and changelog comments.
          </p>
        </div>
        
        {!isCreating && !editingPromptId && (
          <button
            onClick={() => {
              setIsCreating(true);
              setEditingPromptId(null);
              setFormTitle("");
              setFormCategory("Coding");
              setFormContent("");
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-lg text-xs font-semibold text-white transition-all cursor-pointer shadow-lg shadow-cyan-500/10 outline-none select-none"
          >
            <Plus className="w-4 h-4" />
            Create Template
          </button>
        )}
      </div>

      {/* CREATE TEMPLATE FORM */}
      {isCreating && (
        <form onSubmit={handleCreatePrompt} className="bg-[#0b1021] border border-slate-800 rounded-xl p-5 space-y-4 animate-fadeIn">
          <h3 className="text-xs font-mono font-bold uppercase text-[#22d3ee] tracking-widest flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-cyan-400" /> New Prompt Template definition
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400">Template Title</label>
              <input
                type="text"
                value={formTitle}
                onChange={e => setFormTitle(e.target.value)}
                placeholder="e.g. Code Review Architect"
                required
                className="w-full bg-[#040815] border border-slate-800 rounded-lg px-3 py-2 text-xs font-medium text-white placeholder-slate-500 focus:border-cyan-500 outline-none animate-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400">Category Tag</label>
              <select
                value={formCategory}
                onChange={e => setFormCategory(e.target.value)}
                className="w-full bg-[#040815] border border-slate-800 rounded-lg px-3 py-2 text-xs font-medium text-slate-300 focus:border-cyan-500 outline-none"
              >
                {categories.filter(c => c !== "All").map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-slate-400">Prompt Content</label>
            <textarea
              value={formContent}
              onChange={e => setFormContent(e.target.value)}
              required
              rows={5}
              placeholder="Provide system instructions. Example: Translate standard english to SQL:\n{{query}}"
              className="w-full bg-[#040815] border border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-200 focus:border-cyan-500 outline-none"
            />
          </div>
          <div className="flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-3.5 py-1.5 border border-slate-800 bg-transparent text-slate-400 hover:text-white rounded-lg text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-555 text-white text-xs font-bold rounded-lg"
            >
              Save Prompt (v1)
            </button>
          </div>
        </form>
      )}

      {/* EDITING / REVERSION VERSION CONTROL FORM */}
      {editingPromptId && (
        <form onSubmit={handleUpdatePrompt} className="bg-[#0f111d] border border-amber-500/30 rounded-xl p-5 space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <h3 className="text-xs font-mono font-bold uppercase text-amber-400 tracking-widest flex items-center gap-1.5">
              <History className="w-4 h-4 text-amber-400 animate-pulse" /> Commit New Version & Save
            </h3>
            <span className="text-[10px] font-mono text-slate-500">
              Current Base Version: v{prompts.find(p => p.id === editingPromptId)?.version || 1}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-450">Template Title</label>
              <input
                type="text"
                value={formTitle}
                onChange={e => setFormTitle(e.target.value)}
                placeholder="Title config"
                required
                className="w-full bg-[#040815] border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-450">Category</label>
              <select
                value={formCategory}
                onChange={e => setFormCategory(e.target.value)}
                className="w-full bg-[#040815] border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:border-cyan-500 outline-none"
              >
                {categories.filter(c => c !== "All").map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-slate-450">Prompt Instruction Script</label>
            <textarea
              value={formContent}
              onChange={e => setFormContent(e.target.value)}
              required
              rows={4}
              className="w-full bg-[#040815] border border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-200 focus:border-cyan-500"
            />
          </div>

          <div className="space-y-1 bg-slate-950/60 p-3 border border-slate-850 rounded-lg">
            <div className="flex justify-between items-center mb-1">
              <label className="text-[10px] font-semibold text-slate-400">Version Changelog Note (Mandatory)</label>
              <span className="text-[9px] font-mono text-[#eab308]">Workflow revision summary:</span>
            </div>
            <input
              type="text"
              required
              value={changeNote}
              onChange={e => setChangeNote(e.target.value)}
              placeholder="e.g. Changed model: Flash → Pro | Fine-tuned join constraints."
              className="w-full bg-[#040815] border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:border-amber-500 placeholder-slate-600 outline-none font-mono"
            />
          </div>

          <div className="flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setEditingPromptId(null)}
              className="px-3.5 py-1.5 border border-slate-800 text-slate-400 hover:text-white rounded-lg text-xs"
            >
              Cancel Revision
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-lg cursor-pointer select-none"
            >
              Commit Version Update (v{(prompts.find(p => p.id === editingPromptId)?.version || 1) + 1})
            </button>
          </div>
        </form>
      )}

      {/* GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Prompt Templates Catalog list */}
        <div className={`${sandboxPromptId ? "lg:col-span-7" : "lg:col-span-12"} space-y-4`}>
          
          {/* Filters Row */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-[#0a0f1e] border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs font-medium text-white placeholder-slate-500 focus:border-cyan-500 focus:bg-[#070b16] outline-none"
              />
            </div>
            
            <div className="flex gap-1 overflow-x-auto pb-1 shrink-0">
              {categories.map(c => (
                <button
                  key={c}
                  onClick={() => setSelectedCategory(c)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold leading-none cursor-pointer outline-none transition-all ${
                    selectedCategory === c
                      ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30"
                      : "bg-[#0a0f1e] text-slate-500 hover:text-white border border-transparent"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="py-20 text-center text-slate-500 font-mono text-xs">
              Scanning prompt catalog...
            </div>
          ) : filteredPrompts.length === 0 ? (
            <div className="border border-slate-800 rounded-xl bg-slate-900/10 p-12 text-center text-xs text-slate-500">
              No matching instructions found.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPrompts.map(p => {
                const isSelected = sandboxPromptId === p.id;
                const variables = extractVariables(p.content);
                const pRevs = revisions[p.id] || [];

                return (
                  <div
                    key={p.id}
                    className={`bg-[#0a0f1e] border rounded-xl p-4 transition-all flex flex-col justify-between gap-4 ${
                      isSelected 
                        ? "border-cyan-500 bg-[#0a1428]/40 shadow-md shadow-cyan-500/5 text-white" 
                        : "border-slate-800 hover:border-slate-700 text-slate-300"
                    }`}
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="bg-[#11192e] border border-slate-705 px-2 py-0.5 rounded text-[9px] font-mono text-cyan-400 font-bold uppercase tracking-wider">
                            {p.category}
                          </span>
                          <span className="text-[10px] bg-slate-950 font-mono font-bold text-slate-450 border border-slate-850 px-1.5 py-0.5 rounded text-indigo-400 flex items-center gap-1">
                            <History className="w-3 h-3 text-cyan-450" />
                            Version v{p.version}
                          </span>
                          {variables.length > 0 && (
                            <span className="text-[9px] font-mono text-amber-400/90">
                              ⚡ {variables.length} custom variables
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          {/* Favorite key */}
                          <button
                            onClick={() => toggleFavorite(p)}
                            className={`p-1.5 rounded-lg border cursor-pointer outline-none transition-all ${
                              p.favorite
                                ? "bg-amber-500/10 border-amber-500/40 text-amber-400"
                                : "bg-transparent border-slate-800 text-slate-500 hover:text-slate-300"
                            }`}
                            title="Favorite Toggle"
                          >
                            <Star className="w-3.5 h-3.5" fill={p.favorite ? "currentColor" : "none"} />
                          </button>
                          
                          {/* Edit Revision */}
                          <button
                            onClick={() => startEditing(p)}
                            className="p-1.5 bg-transparent border border-slate-800 hover:border-cyan-500/45 text-slate-400 hover:text-cyan-400 rounded-lg cursor-pointer transition-all"
                            title="New Revision"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {/* Duplicate */}
                          <button
                            onClick={() => duplicatePrompt(p)}
                            className="p-1.5 bg-transparent border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-lg cursor-pointer"
                            title="Duplicate"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => deletePrompt(p.id)}
                            className="p-1.5 bg-transparent border border-slate-800 hover:border-red-500/40 text-slate-500 hover:text-red-400 rounded-lg cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <h4 className="text-sm font-bold text-white tracking-tight">{p.title}</h4>
                      
                      <p className="text-slate-400 text-xs font-mono line-clamp-3 bg-[#040815]/80 border border-slate-900/80 rounded-lg p-2.5 whitespace-pre-wrap">
                        {p.content}
                      </p>

                      {/* Display Historic Version Changes Details inline if they exist to show recruiters */}
                      {pRevs.length > 0 && (
                        <div className="mt-3 bg-slate-950/65 border border-slate-850 rounded-lg p-3 space-y-2">
                          <span className="text-[9.5px] font-mono text-cyan-400 block font-bold uppercase tracking-wider">VERSION CHRONOLOGY</span>
                          <div className="space-y-2 max-h-[140px] overflow-y-auto">
                            {pRevs.map((rev) => (
                              <div key={rev.id} className="text-[10px] font-mono border-l-2 border-slate-800 pl-2.5 py-1">
                                <div className="flex items-center justify-between text-slate-400">
                                  <span className="font-bold text-cyan-300">v{rev.version} • {rev.modelUsed || "gemini-3.5-flash"}</span>
                                  <span>{formatTimeWithRelative(rev.updatedAt)}</span>
                                </div>
                                <p className="text-slate-300 mt-1 italic block leading-relaxed pr-1 bg-[#121625]/40 p-1.5 rounded">{rev.changeNote}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => openSandbox(p)}
                      className={`w-full py-1.5 rounded-lg text-xs font-bold font-mono tracking-wide leading-none transition-all cursor-pointer ${
                        isSelected
                          ? "bg-cyan-500 text-white"
                          : "bg-[#11192e] text-cyan-400 border border-cyan-800 hover:bg-cyan-950/40"
                      }`}
                    >
                      Playground
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Interactive Testing Playground */}
        {sandboxPromptId && (
          <div className="lg:col-span-5 bg-[#0b1021] border border-cyan-500/30 rounded-xl p-5 space-y-4 shadow-xl shadow-cyan-500/5 animate-fadeIn self-start">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-xs font-mono font-bold uppercase text-cyan-400">PROMPT PLAYGROUND</h3>
                <h4 className="text-sm font-bold text-white mt-1">
                  {prompts.find(p => p.id === sandboxPromptId)?.title}
                </h4>
              </div>
              <button
                onClick={() => setSandboxPromptId(null)}
                className="text-slate-500 hover:text-slate-300 font-mono text-xs cursor-pointer"
              >
                close
              </button>
            </div>

            {Object.keys(customVariables).length > 0 ? (
              <div className="space-y-3.5">
                <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-slate-400 block mb-1">
                  Dynamic Variables Setup
                </span>
                
                {Object.keys(customVariables).map(vkey => (
                  <div key={vkey} className="space-y-1">
                    <label className="text-[10px] font-mono text-cyan-400">{"{{"}{vkey}{"}}"}</label>
                    <textarea
                      value={customVariables[vkey]}
                      rows={2}
                      onChange={e => setCustomVariables(prev => ({ ...prev, [vkey]: e.target.value }))}
                      placeholder={`Enter testing input for ${vkey}`}
                      className="w-full bg-[#040815] border border-slate-800 rounded-lg p-2 text-xs font-mono text-slate-200 placeholder-slate-600 focus:border-cyan-500 outline-none"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 font-mono">
                No custom variables (e.g. {"{{variable}}"}) parsed.
              </p>
            )}

            <button
              onClick={runTest}
              disabled={isTesting}
              className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 outline-none cursor-pointer border border-cyan-500/20"
            >
              {isTesting ? (
                <>
                  <span className="animate-spin text-xs">🌀</span>
                  <span>Compiling Sandbox Prompt...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Test Prompt Template</span>
                </>
              )}
            </button>

            {/* Results Display */}
            {(sandboxResult || isTesting) && (
              <div className="space-y-2 pt-2 animate-fadeIn">
                <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                  <span>Gemini Output Response</span>
                  {sandboxMetrics && (
                    <span>{sandboxMetrics.durationMs}ms | model: {sandboxMetrics.modelUsed}</span>
                  )}
                </div>
                <div className="bg-[#030610] border border-slate-800/80 rounded-xl p-3.5 text-xs text-slate-300 font-serif leading-relaxed h-80 overflow-y-auto whitespace-pre-wrap select-text relative">
                  {isTesting ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-[#030610]/95 font-mono text-slate-500 text-[10px] animate-pulse">
                      <span>Analyzing template triggers...</span>
                    </div>
                  ) : (
                    sandboxResult
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
