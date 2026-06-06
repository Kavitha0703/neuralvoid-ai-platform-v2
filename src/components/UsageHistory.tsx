import React, { useState } from "react";
import { Clock, Search, SlidersHorizontal, ArrowDownWideNarrow, Download, AlertCircle, RefreshCw, Sparkles, Filter } from "lucide-react";
import { UsageRecord } from "../types";
import { formatTimeWithRelative } from "../utils";

interface UsageHistoryProps {
  history: UsageRecord[];
  onSetStatus?: (msg: string | null) => void;
  onClearHistory?: () => void;
}

export default function UsageHistory({ history, onSetStatus, onClearHistory }: UsageHistoryProps) {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [toolFilter, setToolFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const filterRecords = history.filter((rec) => {
    // Search
    const searchMatch = rec.prompt.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        rec.tool.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Tool
    const toolMatch = toolFilter === "ALL" || rec.tool === toolFilter;

    // Status
    const statusMatch = statusFilter === "ALL" || rec.status === statusFilter;

    return searchMatch && toolMatch && statusMatch;
  });

  // Calculate stats based on filtered list
  const totalTokens = filterRecords.reduce((acc, curr) => acc + (curr.tokensUsed || 0), 0);
  const totalCost = filterRecords.reduce((acc, curr) => acc + (curr.estimatedCost || 0), 0);

  const handleExportCSV = () => {
    if (history.length === 0) return;

    // Build the CSV string content
    const headers = ["ID", "Timestamp (UTC)", "Access Gateway Tool", "Prompt Extract", "Status Code", "Response Time (ms)", "Tokens Used", "Allocated Cost ($)"];
    
    const rows = history.map((r) => {
      // Escape prompt double quotes and wrap in quotes to preserve formatting and commas
      const escapedPrompt = r.prompt ? r.prompt.replace(/"/g, '""') : "";
      return [
        r.id,
        r.timestamp,
        r.tool,
        `"${escapedPrompt}"`,
        r.status,
        r.durationMs,
        r.tokensUsed || 0,
        r.estimatedCost || 0
      ];
    });

    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `neuralvoid_usage_audit_${Date.now()}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fade-in relative z-10">
      
      {/* 1. Header with Export trigger */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-3">
        <div>
          <h1 className="text-xl font-bold font-sans tracking-tight text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#22d3ee]" /> Dev Call Logs & Audit Cache
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Analyze, query, filter, and audit active token consumption metrics across all Sandbox pipelines.
          </p>
        </div>

        {history.length > 0 && (
          <button
            onClick={handleExportCSV}
            className="p-2 px-4 border border-cyan-500/25 bg-cyan-500/10 hover:bg-cyan-500/15 text-cyan-300 font-mono text-xs font-bold rounded-xl flex items-center gap-2 outline-none select-none duration-150 cursor-pointer"
          >
            <Download className="w-4 h-4" /> Export to CSV
          </button>
        )}
      </div>

      {/* Stats micro row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel border border-slate-800 p-4 rounded-xl flex flex-col justify-center bg-[#070b14]/50">
          <span className="text-[10px] font-bold font-mono tracking-wider text-slate-500 uppercase block">FILTERED COUNT</span>
          <span className="text-lg font-bold font-mono text-white mt-0.5">{filterRecords.length} calls</span>
        </div>
        <div className="glass-panel border border-slate-800 p-4 rounded-xl flex flex-col justify-center bg-[#070b14]/50">
          <span className="text-[10px] font-bold font-mono tracking-wider text-slate-500 uppercase block">CONSUMED TOKENS</span>
          <span className="text-lg font-bold font-mono text-cyan-400 mt-0.5">{totalTokens.toLocaleString()} tokens</span>
        </div>
        <div className="glass-panel border border-slate-800 p-4 rounded-xl flex flex-col justify-center bg-[#070b14]/50">
          <span className="text-[10px] font-bold font-mono tracking-wider text-slate-500 uppercase block">INVESTMENT VALUATION COST</span>
          <span className="text-lg font-bold font-mono text-emerald-400 mt-0.5">${totalCost.toFixed(6)}</span>
        </div>
      </div>

      {/* 2. Advanced Search & Parameters Filter Bar */}
      <div className="glass-panel border border-slate-800 p-4 rounded-2xl bg-slate-950/20 grid grid-cols-1 md:grid-cols-12 gap-3.5 items-center">
        {/* Search */}
        <div className="md:col-span-5 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search prompt contents or tools..."
            className="w-full bg-slate-955 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs outline-none text-slate-350 focus:border-cyan-500 font-sans"
          />
        </div>

        {/* Filter Tool */}
        <div className="md:col-span-3">
          <select
            value={toolFilter}
            onChange={(e) => setToolFilter(e.target.value)}
            className="w-full bg-slate-955 text-slate-400 border border-slate-800 rounded-xl p-2 px-3 text-xs font-mono outline-none cursor-pointer focus:border-cyan-500"
          >
            <option value="ALL">All Tools Selector</option>
            <option value="Text Generator">Text Generator</option>
            <option value="Summarizer">Summarizer</option>
            <option value="Grammar Improver">Grammar Core</option>
            <option value="Code Explainer">Code Explainer</option>
            <option value="PDF Q&A">PDF Research Explorer</option>
            <option value="Image Generator">Vector SVG Art</option>
          </select>
        </div>

        {/* Filter Status */}
        <div className="md:col-span-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-slate-955 text-slate-400 border border-slate-800 rounded-xl p-2 px-3 text-xs font-mono outline-none cursor-pointer focus:border-cyan-500"
          >
            <option value="ALL">All Status</option>
            <option value="success">Success</option>
            <option value="error">Error</option>
          </select>
        </div>

        {/* Reset Actions */}
        <div className="md:col-span-2 flex justify-end">
          <button
            type="button"
            onClick={() => {
              setSearchTerm("");
              setToolFilter("ALL");
              setStatusFilter("ALL");
            }}
            className="w-full text-center py-2 bg-slate-900 border border-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white font-mono text-[10px] font-bold rounded-xl cursor-pointer transition outline-none"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* 3. Audit Table */}
      <div className="glass-panel border border-slate-800 rounded-2xl shadow-xl overflow-hidden bg-slate-950/10">
        {filterRecords.length === 0 ? (
          <div className="p-12 text-center text-slate-505">
            <AlertCircle className="w-8 h-8 text-slate-700 mx-auto mb-2 animate-pulse" />
            <p className="text-sm font-sans font-semibold text-slate-400">No telemetry logs found matching criteria</p>
            <p className="text-[10px] text-slate-500 mt-1 font-mono">Reset filters or run sandbox compilations to populate telemetry indexes.</p>
          </div>
        ) : (
          <div className="overflow-x-auto bg-[#070b14]">
            <table className="w-full text-left text-xs text-slate-300 hidden md:table">
              <thead className="bg-[#070b14] border-b border-slate-850 text-slate-450 font-mono text-[10px] uppercase tracking-wider">
                <tr>
                  <th className="p-4">Gate Tool</th>
                  <th className="p-4">Timestamp (UTC)</th>
                  <th className="p-4">Run Prompt Request</th>
                  <th className="p-4">SST Status</th>
                  <th className="p-4 text-right">Delay (ms)</th>
                  <th className="p-4 font-mono text-right">Tokens</th>
                  <th className="p-4 text-emerald-400 text-right">Estimated Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850/65">
                {filterRecords.map((r, idx) => (
                  <tr key={r.id || idx} className="hover:bg-slate-900/40 transition">
                    <td className="p-4 font-mono font-bold text-slate-300">{r.tool}</td>
                    <td className="p-4 text-slate-450 font-mono text-[10px]">
                      {formatTimeWithRelative(r.timestamp)}
                    </td>
                    <td className="p-4 max-w-xs font-sans text-xs text-slate-400 truncate" title={r.prompt}>
                      {r.prompt}
                    </td>
                    <td className="p-4 font-mono">
                      <span className={`inline-flex items-center gap-1 text-[9px] uppercase font-bold ${r.status === "success" ? "text-emerald-400" : "text-rose-400"}`}>
                        <span className={`w-1 h-1 rounded-full ${r.status === "success" ? "bg-emerald-400" : "bg-rose-400"}`} />
                        {r.status}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-slate-400 text-right">{r.durationMs}ms</td>
                    <td className="p-4 font-mono text-right font-medium">{r.tokensUsed || 0}</td>
                    <td className="p-4 font-mono text-emerald-400/90 text-right font-bold">
                      ${r.estimatedCost ? r.estimatedCost.toFixed(6) : "0.000000"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile Card View */}
            <div className="md:hidden flex flex-col divide-y divide-slate-850/65">
               {filterRecords.map((r, idx) => (
                  <div key={r.id || idx} className="p-4 bg-slate-950/10 space-y-2">
                     <div className="flex justify-between items-center">
                        <span className="font-mono font-bold text-slate-300">{r.tool}</span>
                        <span className={`inline-flex items-center gap-1 text-[9px] uppercase font-bold ${r.status === "success" ? "text-emerald-400" : "text-rose-400"}`}>
                           <span className={`w-1 h-1 rounded-full ${r.status === "success" ? "bg-emerald-400" : "bg-rose-400"}`} />
                           {r.status}
                        </span>
                     </div>
                     <div className="text-[10px] font-mono text-slate-450">
                        {formatTimeWithRelative(r.timestamp)}
                     </div>
                     <div className="font-sans text-xs text-slate-400 bg-[#0a0f1e] border border-slate-800/50 p-2.5 rounded line-clamp-2">
                        {r.prompt}
                     </div>
                     <div className="flex justify-between items-center pt-2 mt-2 border-t border-slate-850/50 text-[10px] font-mono">
                        <div className="text-slate-400">Delay: <span className="text-slate-300 font-bold">{r.durationMs}ms</span></div>
                        <div className="text-slate-400">Tokens: <span className="text-slate-300 font-bold">{r.tokensUsed || 0}</span></div>
                        <div className="text-emerald-400/90 font-bold">${r.estimatedCost ? r.estimatedCost.toFixed(6) : "0.000000"}</div>
                     </div>
                  </div>
               ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
