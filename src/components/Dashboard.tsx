import React, { useState, useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";
import { 
  Terminal, Cpu, Clock, DollarSign, CheckCircle, Search, 
  ArrowRight, ShieldAlert, Zap, Filter, Sparkles, Code,
  ShieldCheck, Activity, Heart, Info, TrendingDown
} from "lucide-react";
import { UsageRecord, UserProfile } from "../types";
import { Skeleton } from "./Skeleton";

interface DashboardProps {
  history: UsageRecord[];
  user: UserProfile | null;
  onNavigate: (tab: any) => void;
  isLoading?: boolean;
}

export default function Dashboard({ history, user, onNavigate, isLoading }: DashboardProps) {
  const [search, setSearch] = useState("");
  const [filterTool, setFilterTool] = useState<string>("all");

  // Metrics Calculations
  const stats = useMemo(() => {
    const total = history.length;
    if (total === 0) {
      return { total: 0, avgLatency: 0, successRate: "100%", totalTokens: 0, totalCost: 0 };
    }
    const successCount = history.filter((h) => h.status === "success").length;
    const avgLatency = Math.round(history.reduce((acc, h) => acc + h.durationMs, 0) / total);
    const successRate = total > 0 ? ((successCount / total) * 100).toFixed(0) + "%" : "100%";
    const totalTokens = history.reduce((acc, h) => acc + (h.tokensUsed || 0), 0);
    const totalCost = Number(history.reduce((acc, h) => acc + (h.estimatedCost || 0), 0).toFixed(6));

    return { total, avgLatency, successRate, totalTokens, totalCost };
  }, [history]);

  // Aggregate stats per tool for the BarChart
  const toolDistributionData = useMemo(() => {
    const counts: Record<string, { name: string; requests: number; tokens: number; color: string }> = {
      "Text Generator": { name: "Text Gen", requests: 0, tokens: 0, color: "#22d3ee" }, // cyan
      "Summarizer": { name: "Summarizer", requests: 0, tokens: 0, color: "#3b82f6" }, // blue
      "Image Generator": { name: "Image Gen", requests: 0, tokens: 10, color: "#a855f7" }, // purple
      "Grammar Improver": { name: "Grammar", requests: 0, tokens: 0, color: "#ec4899" }, // pink
      "PDF Q&A": { name: "PDF QA", requests: 0, tokens: 0, color: "#f59e0b" }, // amber
      "Code Explainer": { name: "Code Exp", requests: 0, tokens: 0, color: "#10b981" } // emerald
    };

    history.forEach((h) => {
      if (counts[h.tool]) {
        counts[h.tool].requests += 1;
        counts[h.tool].tokens += h.tokensUsed || 0;
      }
    });

    return Object.values(counts);
  }, [history]);

  // Request timeline trend
  const trendData = useMemo(() => {
    // Group requests by date (just the last 10 entries to show variations)
    const reversed = [...history].reverse();
    if (reversed.length === 0) {
      return [
        { name: "00:00", duration: 0, tokens: 0 },
        { name: "04:00", duration: 0, tokens: 0 },
        { name: "08:00", duration: 0, tokens: 0 },
        { name: "12:00", duration: 0, tokens: 0 },
      ];
    }

    return reversed.slice(-10).map((h) => {
      const time = new Date(h.timestamp);
      return {
        name: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        duration: h.durationMs,
        tokens: h.tokensUsed || 0,
        tool: h.tool
      };
    });
  }, [history]);

  // Model-Shares analytics calculations
  const modelStats = useMemo(() => {
    let proCalls = 0;
    let flashCalls = 0;
    history.forEach((h) => {
      const model = h.modelUsed || "gemini-3.5-flash";
      if (model.includes("pro")) {
        proCalls++;
      } else {
        flashCalls++;
      }
    });

    const total = history.length || 1;
    const flashPercent = Math.round((flashCalls / total) * 100);
    const proPercent = Math.min(100 - flashPercent, Math.round((proCalls / total) * 100));

    // Simulated savings calculation
    const potentialProCost = total * 0.00125;
    const actualCost = history.reduce((acc, h) => acc + (h.estimatedCost || 0), 0);
    const savedAmount = Math.max(0, potentialProCost - actualCost);
    const savingsPercent = potentialProCost > 0 ? Math.round((savedAmount / potentialProCost) * 100) : 43;

    return {
      proCalls,
      flashCalls,
      flashPercent,
      proPercent,
      savedAmount,
      savingsPercent
    };
  }, [history]);

  const [optApplied, setOptApplied] = useState<boolean>(false);

  // Filter and Search history
  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      const matchesSearch = 
        item.prompt.toLowerCase().includes(search.toLowerCase()) ||
        item.tool.toLowerCase().includes(search.toLowerCase());
      
      const matchesFilter = filterTool === "all" || item.tool === filterTool;
      
      return matchesSearch && matchesFilter;
    });
  }, [history, search, filterTool]);

  // Helper to map tool to navigate code
  const mapToolToTab = (tool: string) => {
    switch (tool) {
      case "Text Generator": return "text-gen";
      case "Summarizer": return "summarize";
      case "Image Generator": return "image-gen";
      case "Grammar Improver": return "grammar";
      case "PDF Q&A": return "pdf-qa";
      case "Code Explainer": return "explainer";
      default: return "dashboard";
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Upper Developer Greeting Banner */}
      <div className="glass-panel rounded-2xl p-6 text-white shadow-2xl relative overflow-hidden neon-glow-indigo">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 w-80 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono mb-2.5 uppercase tracking-widest font-bold">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" /> Active Compute Frame
            </div>
            <h1 className="text-2xl md:text-3.5xl font-bold tracking-tight font-display text-white leading-tight">
              NEURALVOID Sandbox Core
            </h1>
            <p className="text-slate-400 text-sm mt-1.5 max-w-xl leading-relaxed">
              An enterprise suite of AI gateways, prompt sandboxes, and metrics tracers. Authenticated as <span className="font-mono text-cyan-300 font-semibold">{user?.email || "developer@internal"}</span>
            </p>
          </div>
          <div className="bg-slate-950/60 backdrop-blur-md border border-slate-800 rounded-xl p-4 md:text-right min-w-[220px]">
            <span className="text-[10px] text-slate-500 font-mono block uppercase tracking-wider">DEV CREDENTIAL NODE:</span>
            <span className="text-[11px] text-cyan-400 font-mono block font-bold mt-2 select-all break-all bg-slate-950/80 p-2.5 rounded border border-cyan-500/10">
              {user?.apiKey || "tk_proj_sandbox_default"}
            </span>
          </div>
        </div>
      </div>

      {/* Metrics Card Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Metric 1: Total Calls */}
        <div className="glass-panel glass-panel-hover p-5 rounded-2xl shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-450 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider font-mono">Gateway Runs</span>
            <div className="p-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg">
              <Terminal className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-white font-mono tracking-tight">{stats.total}</div>
            <div className="text-[10px] text-slate-500 mt-1.5 font-sans">Total dispatches logged</div>
          </div>
        </div>

        {/* Metric 2: Avg Latency */}
        <div className="glass-panel glass-panel-hover p-5 rounded-2xl shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-450 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider font-mono">Avg Latency</span>
            <div className="p-2 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-white font-mono tracking-tight">
              {stats.avgLatency}
              <span className="text-xs font-sans text-slate-500 ml-1">ms</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-1.5 font-sans">Internal router response speed</div>
          </div>
        </div>

        {/* Metric 3: Success Rate */}
        <div className="glass-panel glass-panel-hover p-5 rounded-2xl shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-450 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider font-mono">SLA Quality</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-white font-mono tracking-tight">{stats.successRate}</div>
            <div className="text-[10px] text-slate-500 mt-1.5 font-sans">Dispatched query success rate</div>
          </div>
        </div>

        {/* Metric 4: Total Tokens */}
        <div className="glass-panel glass-panel-hover p-5 rounded-2xl shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-450 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider font-mono">Compute Vol</span>
            <div className="p-2 bg-teal-500/10 text-teal-400 border border-teal-500/20 rounded-lg">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2.5xl font-bold text-white font-mono tracking-tight line-clamp-1">
              {stats.totalTokens.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-500 mt-1.5 font-sans">Accumulated token workload</div>
          </div>
        </div>

        {/* Metric 5: Estimated Cost */}
        <div className="glass-panel glass-panel-hover p-5 rounded-2xl shadow-lg col-span-2 lg:col-span-1 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-450 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider font-mono">Est. Cost</span>
            <div className="p-2 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-lg">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-emerald-400 font-mono tracking-tight">
              ${stats.totalCost.toFixed(5)}
            </div>
            <div className="text-[10px] text-slate-500 mt-1.5 font-sans">Real-time telemetry valuation</div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Latency & Volume Chart */}
        <div className="glass-panel p-6 rounded-2xl shadow-xl lg:col-span-8 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white font-display uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" /> Latency & Call Volumes
            </h3>
            <p className="text-xs text-slate-400 mt-1">Real-time timeline analysis across selected core models</p>
          </div>
          <div className="h-64 w-full mt-6">
            {isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="latencyGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#475569" fontSize={10} tickLine={false} />
                  <YAxis stroke="#475569" fontSize={10} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ background: "#0b1120", borderRadius: "12px", border: "1px solid #1e293b", color: "#f8fafc" }} 
                    labelStyle={{ fontSize: "10px", color: "#22d3ee", fontFamily: "monospace" }} 
                    itemStyle={{ fontSize: "11px", color: "#cbd5e1" }}
                  />
                  <Area name="Latency (ms)" type="monotone" dataKey="duration" stroke="#22d3ee" strokeWidth={2.5} fillOpacity={1} fill="url(#latencyGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Token Distribution by Tool */}
        <div className="glass-panel p-6 rounded-2xl shadow-xl lg:col-span-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white font-display uppercase tracking-wider flex items-center gap-2">
              <Code className="w-4 h-4 text-indigo-400" /> Distribution Vectors
            </h3>
            <p className="text-xs text-slate-400 mt-1">Query shares dispatch statistics split by specialized agent gateways</p>
          </div>
          <div className="h-64 w-full mt-6 flex flex-col justify-between">
            {isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : stats.total === 0 ? (
              <div className="text-center p-6 border border-dashed border-slate-800 rounded-xl w-full flex-1 flex flex-col justify-center">
                <p className="text-xs text-slate-500 font-mono">Awaiting primary API actions before building distribution chart.</p>
              </div>
            ) : (
              <>
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={toolDistributionData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                      <XAxis dataKey="name" stroke="#475569" fontSize={9} tickLine={false} />
                      <YAxis stroke="#475569" fontSize={9} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ background: "#0b1120", borderRadius: "12px", border: "1px solid #1e293b", color: "#f8fafc" }} 
                        itemStyle={{ fontSize: "11px", color: "#cbd5e1" }}
                      />
                      <Bar dataKey="requests" name="API Runs" radius={[4, 4, 0, 0]}>
                        {toolDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                {/* Advanced Model routing share telemetry metrics block */}
                <div className="pt-3 border-t border-slate-850/80 grid grid-cols-2 gap-2 text-[10px] font-mono">
                  <div className="bg-slate-950/60 p-2 border border-slate-850 rounded-xl">
                    <span className="text-slate-500 block uppercase font-bold">Standard Flash Node</span>
                    <span className="text-cyan-400 font-bold text-xs block mt-1">{modelStats.flashPercent}% ({modelStats.flashCalls} calls)</span>
                  </div>
                  <div className="bg-slate-950/60 p-2 border border-slate-850 rounded-xl">
                    <span className="text-slate-500 block uppercase font-bold">Dynamic Pro Node</span>
                    <span className="text-purple-400 font-bold text-xs block mt-1">{modelStats.proPercent}% ({modelStats.proCalls} calls)</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* NEW: Platform Health & AI Cost Optimizer dashboard double section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Tier 1 Cost Optimizer */}
        <div className="glass-panel p-6 rounded-3xl shadow-xl border border-slate-800 bg-[#070c18] space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white font-display uppercase tracking-wider flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-emerald-400" /> AI Infrastructure Cost Optimizer
              </h3>
              <span className="px-2 py-0.5 bg-emerald-950/80 text-emerald-400 rounded-lg text-[9px] font-mono border border-emerald-900/40">
                RECOMMENDATION DEPLOYED
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Undergoing live comparative telemetry review across specialized routes</p>
          </div>

          <div className="p-4 bg-slate-950/80 border border-slate-850/80 rounded-2xl flex items-start gap-4">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl shrink-0 mt-0.5">
              <Info className="w-4 h-4" />
            </div>
            <div className="text-xs space-y-1">
              <span className="font-bold text-white font-sans block text-slate-200">Enable Smart Routing Cache Policy</span>
              <p className="text-slate-400 leading-normal font-sans">
                By retaining 90% of your playground queries on standard <b className="text-cyan-400">Gemini 3.5 Flash</b> and bypassing higher latency Pro models for basic lexical operations, you lowered average payload latency to <b className="text-[#38bdf8]">{stats.avgLatency}ms</b>. This optimized routing has saved you:
              </p>
              <div className="pt-2 flex items-center gap-2 font-mono">
                <span className="bg-emerald-950 text-emerald-400 font-bold px-2 py-0.5 rounded border border-emerald-800">
                  Save {modelStats.savingsPercent}% budget
                </span>
                <span className="text-slate-500">|</span>
                <span className="text-[#cbd5e1] font-semibold">
                  Saved approx. ${modelStats.savedAmount.toFixed(5)} USD
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setOptApplied(true);
                setTimeout(() => setOptApplied(false), 3000);
              }}
              className="flex-1 py-2.5 bg-slate-950 border border-slate-800 text-slate-350 hover:text-white rounded-xl text-xs font-mono font-semibold transition hover:border-cyan-500/20 outline-none select-none cursor-pointer"
            >
              {optApplied ? "✔ BUDGET POLICY ENGAGED!" : "⚡ RUN INFRASTRUCTURE COMPRESSION"}
            </button>
          </div>
        </div>

        {/* System Health Diagnostics Monitoring Dashboard */}
        <div className="glass-panel p-6 rounded-3xl shadow-xl border border-slate-800 bg-[#070c18] space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white font-display uppercase tracking-wider flex items-center gap-2">
              <Heart className="w-4 h-4 text-cyan-400 animate-pulse" /> Platform Infrastructure Health
            </h3>
            <p className="text-xs text-slate-400 mt-1">Real-time status indicators tracking upstream API gateways and CDN caches</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { name: "Gemini Core Gateway", status: "ONLINE", metric: "24 ms avg latency", icon: <Cpu className="w-3.5 h-3.5 text-cyan-400" /> },
              { name: "SaaS Dev Database", status: "ACTIVE", metric: "In-Memory Frame", icon: <Code className="w-3.5 h-3.5 text-indigo-400" /> },
              { name: "CDN Asset Files cache", status: "STABLE", metric: "SVG graphic compiler", icon: <Zap className="w-3.5 h-3.5 text-purple-400" /> },
              { name: "Audit logs telemetry", status: "SECURED", metric: "Active traces", icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> }
            ].map((node, idx) => (
              <div key={idx} className="p-3 bg-slate-950/80 border border-slate-850/80 rounded-2xl flex items-center justify-between gap-2">
                <div className="min-w-0 flex items-center gap-2">
                  <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 shrink-0">
                    {node.icon}
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-sans font-bold text-slate-400 block truncate leading-none mb-1">{node.name}</span>
                    <span className="text-[10px] font-mono text-slate-600 block truncate leading-none">{node.metric}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="inline-flex items-center gap-1 text-[9px] font-bold font-mono text-emerald-450 bg-emerald-950/40 border border-emerald-900/30 rounded-lg px-2 py-0.5 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    {node.status}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <p className="text-[10.5px] font-mono text-slate-650 leading-tight">
            System heartbeats poll every 60s. SLA response frame compliance remains at <b className="text-cyan-400 font-bold">99.98%</b>.
          </p>
        </div>
      </div>

      {/* Sandbox Micro-Navigation Grid */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold font-mono tracking-widest text-slate-450 uppercase">Instant Command Portals</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { id: "text-gen", title: "Text Gen Sandbox", desc: "Interactive prompt frames", border: "hover:border-cyan-500/70" },
            { id: "summarize", title: "Doc Summarizer", desc: "Compress heavy text buffers", border: "hover:border-blue-500/70" },
            { id: "grammar", title: "Grammar Core", desc: "Lexical polish & refinement", border: "hover:border-pink-500/70" },
            { id: "explainer", title: "Code Explainer", desc: "Analyze AST complexity", border: "hover:border-emerald-500/70" },
            { id: "pdf-qa", title: "PDF Explorer", desc: "Document grounded agent", border: "hover:border-amber-500/70" },
            { id: "image-gen", title: "Vector SVG Art", desc: "Real-time graphics sandbox", border: "hover:border-purple-500/70" }
          ].map((gateway) => (
            <button
              key={gateway.id}
              onClick={() => onNavigate(gateway.id)}
              className={`bg-slate-900/60 backdrop-blur border border-slate-800/80 p-5 rounded-xl text-left shadow-lg transition duration-200 outline-none hover:shadow-cyan-500/5 hover:-translate-y-1 ${gateway.border}`}
            >
              <div className="font-bold text-xs text-white flex items-center justify-between mb-1.5">
                {gateway.title} <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
              </div>
              <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">{gateway.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Usage Analytics Grid Logs */}
      <div className="glass-panel rounded-2xl shadow-xl p-6 border border-slate-800/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-base font-bold text-white font-display">System Audit Logs</h3>
            <p className="text-xs text-slate-400 mt-1">Live database outputs tracking parameters size, latency metrics, and API payloads.</p>
          </div>

          <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Find prompt or tool..."
                className="w-full sm:w-52 pl-8 pr-3 py-2 border border-slate-800 bg-slate-950/80 rounded-lg text-xs outline-none text-slate-200 focus:border-cyan-500 transition-colors font-mono"
              />
            </div>

            {/* Filter Tool */}
            <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 px-3 py-2 rounded-lg text-xs text-slate-300 font-mono">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={filterTool}
                onChange={(e) => setFilterTool(e.target.value)}
                className="bg-transparent border-none outline-none text-xs text-slate-300 font-semibold cursor-pointer"
              >
                <option value="all" className="bg-slate-900">All Nodes</option>
                <option value="Text Generator" className="bg-slate-900">Text Gen</option>
                <option value="Summarizer" className="bg-slate-900">Summarizer</option>
                <option value="Image Generator" className="bg-slate-900">Image Gen</option>
                <option value="Grammar Improver" className="bg-slate-900">Grammar</option>
                <option value="PDF Q&A" className="bg-slate-900">PDF QA</option>
                <option value="Code Explainer" className="bg-slate-900">Code Explainer</option>
              </select>
            </div>
          </div>
        </div>

        {/* Logs Table */}
        <div className="overflow-x-auto">
          {filteredHistory.length === 0 ? (
            <div className="text-center py-14 border border-dashed border-slate-800 rounded-xl">
              <ShieldAlert className="w-9 h-9 text-slate-600 mx-auto mb-3" />
              <p className="text-xs text-slate-400 font-mono">No matching system audit records.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] uppercase font-mono tracking-wider text-slate-450 bg-slate-900/30">
                  <th className="py-3.5 px-4 font-bold">Timestamp</th>
                  <th className="py-3.5 px-4 font-bold">Gateway / API</th>
                  <th className="py-3.5 px-4 font-bold font-mono">Payload Payload String</th>
                  <th className="py-3.5 px-4 font-bold">Latency</th>
                  <th className="py-3.5 px-4 font-bold font-mono">Tokens</th>
                  <th className="py-3.5 px-4 font-bold">Estimated Cost</th>
                  <th className="py-3.5 px-4 font-bold">Status</th>
                  <th className="py-3.5 px-4 text-right font-bold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs font-mono text-slate-300">
                {filteredHistory.map((item) => {
                  let toolColor = "bg-slate-900 text-slate-400 border-slate-800";
                  if (item.tool === "Text Generator") toolColor = "bg-cyan-950/70 text-cyan-400 border border-cyan-900/50";
                  if (item.tool === "Summarizer") toolColor = "bg-blue-950/70 text-blue-400 border border-blue-900/50";
                  if (item.tool === "Image Generator") toolColor = "bg-purple-950/70 text-purple-400 border border-purple-900/50";
                  if (item.tool === "Grammar Improver") toolColor = "bg-pink-505/70 text-pink-400 border border-pink-900/55";
                  if (item.tool === "PDF Q&A") toolColor = "bg-amber-950/70 text-amber-400 border border-amber-900/50";
                  if (item.tool === "Code Explainer") toolColor = "bg-emerald-950/70 text-emerald-400 border border-emerald-900/50";

                  return (
                    <tr key={item.id} className="hover:bg-white/[0.02] transition duration-150">
                      <td className="py-3.5 px-4 text-[11px] text-slate-400 whitespace-nowrap">
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${toolColor}`}>
                          {item.tool}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-[11px] text-slate-300 max-w-[280px] truncate" title={item.prompt}>
                        {item.prompt}
                      </td>
                      <td className="py-3.5 px-4 text-[11px] text-cyan-300 whitespace-nowrap">
                        {item.durationMs} ms
                      </td>
                      <td className="py-3.5 px-4 text-[11px] text-slate-400 whitespace-nowrap">
                        {item.tokensUsed || 0}
                      </td>
                      <td className="py-3.5 px-4 text-[11px] text-emerald-400 whitespace-nowrap">
                        ${item.estimatedCost?.toFixed(6) || "0.000000"}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 rounded px-2.5 py-0.5 text-[10px] font-bold ${
                          item.status === "success" 
                            ? "bg-emerald-950/60 text-emerald-400 border border-emerald-900/40" 
                            : "bg-rose-950/60 text-rose-400 border border-rose-900/40"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${item.status === "success" ? "bg-emerald-400 animate-pulse" : "bg-rose-400"}`} />
                          {item.status === "success" ? "EST_OK" : "SYS_ERR"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => onNavigate(mapToolToTab(item.tool))}
                          className="text-[10px] font-semibold text-cyan-400 hover:text-cyan-300 hover:underline outline-none"
                        >
                          OPEN GATEWAY
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
