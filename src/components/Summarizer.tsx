import React, { useState } from "react";
import { List, FileText, Check, Copy, RefreshCw, AlignLeft, Info, HelpCircle } from "lucide-react";
import { SummarizeConfig, UsageRecord } from "../types";

interface SummarizerProps {
  onAddLog: (record: UsageRecord) => void;
  userId: string;
  customKey?: string;
  onSetStatus: (msg: string | null) => void;
}

const TEMPLATES = [
  {
    title: "Vite Build Tool definition",
    text: "Vite is a modern frontend build tool that is incredibly fast. It consists of two major parts: a dev server that serves source files over native ES modules, with rich built-in features and fast Hot Module Replacement (HMR), and a build command that bundles code with Rollup, pre-configured to output highly optimized static assets for production. Vite is opinionated and comes with sensible defaults out of the box, but is also highly extensible via its Plugin API and JavaScript API with full typing support. Traditional bundlers like Webpack, Rollup, or Parcel must crawl and build your entire application before it can be served, which leads to slow startups. Vite solves this by leverage browser native ESM support and dynamic code spitting, rendering immediate page loads.",
  },
  {
    title: "REST Architecture Overview",
    text: "REST (Representational State Transfer) is an architectural style for providing standards between computer systems on the web, making it easier for systems to communicate with one another. REST-conforming systems, often called RESTful systems, are characterized by how they are stateless and separate the concerns of client and server. Client-side applications dispatch standardized HTTP requests (GET, POST, PUT, DELETE) containing URIs targeting resources. A REST API server receives these queries securely, processes queries or performs persistence mutations, and returns machine-readable payloads, most commonly in JSON format. Because resource URIs act as uniform locators, independent modules can interface elegantly without complex RPC plumbing.",
  },
];

export default function Summarizer({ onAddLog, userId, customKey, onSetStatus }: SummarizerProps) {
  const [text, setText] = useState<string>(TEMPLATES[0].text);
  const [style, setStyle] = useState<SummarizeConfig["style"]>("bullets");
  const [length, setLength] = useState<SummarizeConfig["length"]>("medium");

  const [summary, setSummary] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [metrics, setMetrics] = useState<{ durationMs: number; tokensUsed: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRun = async () => {
    if (!text.trim()) return;

    setLoading(true);
    setError(null);
    onSetStatus("Executing Summarizer gateway model...");

    try {
      const res = await fetch("/api/toolkit/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          style,
          length,
          userId,
          customKey,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Summarization gateway returned an error status.");
      }

      setSummary(data.summary);
      if (data.metrics) {
        setMetrics({
          durationMs: data.metrics.durationMs,
          tokensUsed: data.metrics.tokensUsed,
        });

        onAddLog({
          id: `log-${Math.random().toString(36).substr(2, 9)}`,
          userId,
          timestamp: data.metrics.timestamp,
          tool: "Summarizer",
          prompt: text,
          status: "success",
          durationMs: data.metrics.durationMs,
          tokensUsed: data.metrics.tokensUsed,
          estimatedCost: Number((data.metrics.tokensUsed * 0.00000045).toFixed(6)),
        });
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Summarization engine failed to process text.");
      onAddLog({
        id: `log-${Math.random().toString(36).substr(2, 9)}`,
        userId,
        timestamp: new Date().toISOString(),
        tool: "Summarizer",
        prompt: text,
        status: "error",
        durationMs: 0,
        tokensUsed: 0,
        estimatedCost: 0,
      });
    } finally {
      setLoading(false);
      onSetStatus(null);
    }
  };

  const handleCopy = () => {
    if (!summary) return;
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const loadTemplate = (selectedText: string) => {
    setText(selectedText);
    setSummary("");
    setMetrics(null);
    setError(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
      {/* Content Input and Style selection controls */}
      <div className="lg:col-span-6 flex flex-col space-y-4">
        <div className="glass-panel p-5 rounded-2xl shadow-xl space-y-4 flex-1 flex flex-col border border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800/80 pb-3 gap-2">
            <h2 className="text-xs font-bold font-mono tracking-wider uppercase text-slate-400 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-blue-400" /> SOURCE DOCUMENTATION
            </h2>
            {/* Quick Templates select */}
            <div className="flex items-center gap-1.5 self-start">
              <span className="text-[10px] font-mono text-slate-500">Sample:</span>
              {TEMPLATES.map((tpl, i) => (
                <button
                  key={i}
                  onClick={() => loadTemplate(tpl.text)}
                  className="px-2.5 py-1 bg-blue-500/10 border border-blue-500/25 text-blue-300 hover:bg-blue-500/20 font-mono text-[9px] rounded-lg font-semibold transition cursor-pointer outline-none"
                >
                  TPL {i + 1}
                </button>
              ))}
            </div>
          </div>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste raw documentation text or essay segments here (supports high length loads)..."
            className="w-full flex-1 min-h-[280px] p-3 text-xs bg-slate-950/85 border border-slate-850 rounded-xl outline-none text-slate-200 focus:border-blue-500 font-sans leading-relaxed resize-y"
          />

          {/* Quick controls section */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="space-y-1">
              <label className="text-[10px] font-bold font-mono tracking-wider uppercase text-slate-400 block">
                Summary Style
              </label>
              <select
                value={style}
                onChange={(e: any) => setStyle(e.target.value)}
                className="w-full bg-slate-950/80 text-slate-300 border border-slate-800 rounded-xl p-2.5 text-xs font-sans outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="bullets" className="bg-slate-900">Structured Bullet Points</option>
                <option value="executive-summary" className="bg-slate-900">Executive Summary Outline</option>
                <option value="compact-one-liner" className="bg-slate-900">Compact Developer One-liner</option>
                <option value="paragraph" className="bg-slate-900">Cohesive Paragraph block</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold font-mono tracking-wider uppercase text-slate-400 block">
                Target Length
              </label>
              <select
                value={length}
                onChange={(e: any) => setLength(e.target.value)}
                className="w-full bg-slate-950/80 text-slate-300 border border-slate-800 rounded-xl p-2.5 text-xs font-sans outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="short" className="bg-slate-900">Brief / Tight</option>
                <option value="medium" className="bg-slate-900">Standard Balanced</option>
                <option value="long" className="bg-slate-900">Comprehensive Analysis</option>
              </select>
            </div>
          </div>

          <div className="flex justify-between items-center border-t border-slate-800/80 pt-3 mt-1">
            <span className="text-[10px] font-mono text-slate-500">
              Payload size: <strong className="text-slate-450">{text.length} properties</strong>
            </span>
            <button
              onClick={handleRun}
              disabled={loading || !text.trim()}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-450 hover:to-indigo-550 text-white font-mono text-xs font-semibold px-5 py-2.5 rounded-xl flex items-center gap-1.5 disabled:opacity-50 select-none cursor-pointer outline-none transition shadow-md shadow-blue-500/10"
            >
              <AlignLeft className="w-3.5 h-3.5" /> {loading ? "Analyzing..." : "Squeeze Text"}
            </button>
          </div>
        </div>
      </div>

      {/* Structured Output Dashboard */}
      <div className="lg:col-span-6 flex flex-col">
        <div className="glass-panel p-5 rounded-2xl shadow-xl border border-slate-800 flex-1 flex flex-col min-h-[440px]">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
            <h3 className="text-xs font-bold font-mono tracking-wider uppercase text-slate-400 flex items-center gap-1">
              <List className="w-4 h-4 text-blue-400" /> Grounded Summary Output
            </h3>

            <div className="flex items-center gap-2">
              {metrics && (
                <span className="text-[9px] font-mono text-slate-400 bg-slate-950/80 border border-slate-850 px-2 py-0.5 rounded">
                  Latency: {metrics.durationMs}ms
                </span>
              )}
              {summary && (
                <button
                  onClick={handleCopy}
                  className="p-1.5 border border-slate-800 bg-slate-950/70 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-white flex items-center gap-1 text-[10px] font-mono outline-none cursor-pointer transition-all"
                  title="Copy summarized text"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copied" : "Copy Output"}
                </button>
              )}
            </div>
          </div>

          {error && (
            <div className="bg-rose-950/30 border border-rose-900/60 rounded-xl p-4 flex gap-3 text-rose-400 text-xs mb-4">
              <strong className="block font-semibold uppercase tracking-wider">Summarizer Gateway Error</strong>
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-500">
              <div className="w-8 h-8 border-3 border-blue-500/20 border-t-blue-450 rounded-full animate-spin mb-3.5" />
              <p className="text-xs font-mono">Injecting style guidelines and crunching doc contents...</p>
            </div>
          ) : summary ? (
            <div className="flex-1 overflow-auto bg-slate-950/90 rounded-xl p-4.5 border border-slate-900 text-xs font-sans text-slate-300 leading-relaxed space-y-3 prose max-w-none select-text">
              {summary.split("\n").map((line, idx) => {
                const trimmed = line.trim();
                if (trimmed.startsWith("#")) {
                  return <h4 key={idx} className="font-bold text-white border-b border-slate-800 pb-1 mt-2">{trimmed.replace(/#/g, "").trim()}</h4>;
                }
                if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
                  return <li key={idx} className="list-disc ml-4 text-slate-350">{trimmed.slice(1).trim()}</li>;
                }
                return <p key={idx} className="text-slate-300 mb-1 leading-relaxed">{line}</p>;
              })}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-xl p-12 text-slate-500 bg-slate-950/25">
              <RefreshCw className="w-8 h-8 text-slate-600 mb-2.5 animate-pulse" />
              <p className="text-xs text-slate-400 font-sans font-medium">Awaiting source code document execution.</p>
              <p className="text-[10px] text-slate-500 mt-1 font-mono">Click &quot;Squeeze Text&quot; to prompt model compression.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
