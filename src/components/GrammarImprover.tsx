import React, { useState } from "react";
import { Sparkles, Check, Copy, Undo, ChevronRight, HelpCircle, BadgeInfo, Star } from "lucide-react";
import { GrammarResult, UsageRecord } from "../types";

interface GrammarImproverProps {
  onAddLog: (record: UsageRecord) => void;
  userId: string;
  customKey?: string;
  onSetStatus: (msg: string | null) => void;
}

const SAMPLE_TEXTS = [
  {
    title: "Weak Business Email",
    text: "i works as a dev ops engineer since five years ago in small startup company. i am writing to you because i want ask about job opening, is there any open vacancy for senior devops role? please let me know asap because i want apply.",
    tone: "professional",
  },
  {
    title: "Cluttered Technical Draft",
    text: "So basically like, the system works by querying the database stuff but it has a very bad latency issue due to lack of indexing which makes it super slow. We should probably add an index so that we make it go fast.",
    tone: "professional",
  },
];

export default function GrammarImprover({ onAddLog, userId, customKey, onSetStatus }: GrammarImproverProps) {
  const [text, setText] = useState<string>(SAMPLE_TEXTS[0].text);
  const [tone, setTone] = useState<string>("professional");

  const [result, setResult] = useState<GrammarResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<{ durationMs: number; tokensUsed: number } | null>(null);

  const handleRun = async () => {
    if (!text.trim()) return;

    setLoading(true);
    setError(null);
    onSetStatus("Executing Grammar Improver gateway model...");

    try {
      const res = await fetch("/api/toolkit/improve-grammar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          tone,
          userId,
          customKey,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Grammar improver failed.");
      }

      setResult(data.data);
      if (data.metrics) {
        setMetrics({
          durationMs: data.metrics.durationMs,
          tokensUsed: data.metrics.tokensUsed,
        });

        onAddLog({
          id: `log-${Math.random().toString(36).substr(2, 9)}`,
          userId,
          timestamp: data.metrics.timestamp,
          tool: "Grammar Improver",
          prompt: text,
          status: "success",
          durationMs: data.metrics.durationMs,
          tokensUsed: data.metrics.tokensUsed,
          estimatedCost: Number((data.metrics.tokensUsed * 0.00000045).toFixed(6)),
        });
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to analyze grammar.");
      onAddLog({
        id: `log-${Math.random().toString(36).substr(2, 9)}`,
        userId,
        timestamp: new Date().toISOString(),
        tool: "Grammar Improver",
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
    if (!result?.polishedText) return;
    navigator.clipboard.writeText(result.polishedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
      {/* Editor Panel */}
      <div className="lg:col-span-5 flex flex-col space-y-4">
        <div className="glass-panel p-5 rounded-2xl shadow-xl flex-1 flex flex-col space-y-4 border border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800/80 pb-3 gap-2">
            <h2 className="text-xs font-bold font-mono tracking-wider uppercase text-slate-400 flex items-center gap-1.5">
              <Undo className="w-4 h-4 text-pink-500" /> Spelling & Structure
            </h2>

            {/* Quick Drafts */}
            <div className="flex items-center gap-1.5 self-start">
              <span className="text-[10px] font-mono text-slate-500">Drafts:</span>
              {SAMPLE_TEXTS.map((draft, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setText(draft.text);
                    setResult(null);
                    setMetrics(null);
                  }}
                  className="px-2 py-0.5 bg-pink-550/10 border border-pink-500/25 text-pink-300 hover:bg-pink-500/20 font-mono text-[9px] rounded font-bold transition cursor-pointer outline-none"
                >
                  Draft {i + 1}
                </button>
              ))}
            </div>
          </div>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type your sentences or drafts with grammar, spelling, or styling bugs..."
            className="w-full flex-1 min-h-[220px] p-3 text-xs bg-slate-950/85 border border-slate-850 rounded-xl outline-none text-slate-200 focus:border-pink-500 font-sans leading-relaxed"
          />

          <div className="space-y-2">
            <label className="text-[10px] font-bold font-mono tracking-wider uppercase text-slate-400 block">
              Tone Calibration Alignment
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {[
                { id: "professional", label: "Professional" },
                { id: "casual", label: "Casual" },
                { id: "academic", label: "Academic" },
                { id: "creative", label: "Creative" },
                { id: "assertive", label: "Assertive" },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTone(t.id)}
                  className={`py-1.5 px-1 rounded-lg font-mono text-[9px] font-bold border transition duration-150 outline-none cursor-pointer ${
                    tone === t.id
                      ? "bg-pink-500 text-white border-pink-500 shadow-md shadow-pink-500/10"
                      : "bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-900 hover:text-slate-200"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center border-t border-slate-800/80 pt-3.5">
            <span className="text-[10px] font-mono text-slate-500">
              Payload size: <strong className="text-slate-450">{text.length} properties</strong>
            </span>
            <button
              onClick={handleRun}
              disabled={loading || !text.trim()}
              className="bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-450 hover:to-rose-550 text-white font-mono text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-1.5 disabled:opacity-50 select-none cursor-pointer outline-none transition shadow-md shadow-pink-500/10"
            >
              <Sparkles className="w-3.5 h-3.5" /> {loading ? "Polishing..." : "Correct & Optimize"}
            </button>
          </div>
        </div>
      </div>

      {/* Side-by-Side Comparison Output */}
      <div className="lg:col-span-7 flex flex-col">
        <div className="glass-panel p-5 rounded-2xl shadow-xl flex-1 flex flex-col min-h-[460px] border border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
            <h3 className="text-xs font-bold font-mono tracking-wider uppercase text-slate-400 flex items-center gap-1">
              <Star className="w-4 h-4 text-pink-400" /> Comparison & Changes Analysis
            </h3>

            {metrics && (
              <span className="text-[9px] font-mono text-slate-405 bg-slate-950/80 border border-slate-850 px-2 py-0.5 rounded">
                Latency: {metrics.durationMs}ms
              </span>
            )}
          </div>

          {error && (
            <div className="bg-rose-950/30 border border-rose-900/60 text-rose-450 text-xs rounded-xl p-3.5 mb-4">
              <strong className="block font-bold">Error Polishing Text</strong>
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-500">
              <div className="w-8 h-8 border-3 border-pink-500/20 border-t-pink-500 rounded-full animate-spin mb-3.5" />
              <p className="text-xs font-mono">Comparing variables and executing stylistic restructuring...</p>
            </div>
          ) : result ? (
            <div className="space-y-4 flex-1 flex flex-col">
              {/* Dual-Pane Readout displays */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Original side */}
                <div className="bg-rose-950/15 rounded-xl p-3.5 border border-rose-905/30 self-stretch">
                  <span className="text-[9px] font-bold font-mono tracking-wider text-rose-400 uppercase block mb-1.5">
                    Detected Original (Input)
                  </span>
                  <p className="text-[11px] leading-relaxed text-slate-400 line-through whitespace-pre-wrap">{text}</p>
                </div>

                {/* Polished side */}
                <div className="bg-emerald-950/15 rounded-xl p-3.5 border border-emerald-905/30 self-stretch flex flex-col">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[9px] font-bold font-mono tracking-wider text-emerald-400 uppercase">
                      Polished Result
                    </span>
                    <button
                      onClick={handleCopy}
                      className="p-1 px-2 border border-emerald-500/35 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 rounded text-[9px] font-mono flex items-center gap-1 transition-all outline-none cursor-pointer"
                    >
                      {copied ? <Check className="w-3" /> : <Copy className="w-3" />}
                      {copied ? "Copied" : "Copy Result"}
                    </button>
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-205 font-medium whitespace-pre-wrap flex-1">{result.polishedText}</p>
                </div>
              </div>

              {/* Badges metrics displays */}
              <div className="grid grid-cols-2 gap-4 bg-slate-950/50 border border-slate-850 rounded-xl p-3 text-center">
                <div>
                  <span className="text-[9px] font-mono text-slate-500 block uppercase tracking-wider mb-0.5">Readability Index</span>
                  <span className="text-xs font-sans text-white font-bold">{result.readabilityScore}</span>
                </div>
                <div>
                  <span className="text-[9px] font-mono text-slate-500 block uppercase tracking-wider mb-0.5 font-bold">Detected Tone</span>
                  <span className="text-xs font-sans text-cyan-400 font-bold uppercase">{result.toneAnalysis}</span>
                </div>
              </div>

              {/* Changes analysis grid rows */}
              <div className="space-y-2.5 flex-1 overflow-auto max-h-[220px]">
                <h4 className="text-[10px] uppercase font-mono text-slate-450 tracking-wider font-semibold">
                  Corrections Trace Log ({result.changes ? result.changes.length : 0})
                </h4>
                {(!result.changes || result.changes.length === 0) ? (
                  <p className="text-[11px] text-slate-500 italic p-4 bg-slate-950/40 rounded-xl text-center font-mono border border-slate-850">
                    No explicit corrections recommended, tone successfully aligned!
                  </p>
                ) : (
                  <div className="space-y-2">
                    {result.changes.map((item, index) => {
                      let flagColor = "bg-slate-900 text-slate-400 border-slate-800";
                      if (item.type === "Grammar") flagColor = "bg-rose-950/50 text-rose-405 border border-rose-900/40";
                      if (item.type === "Vocabulary") flagColor = "bg-indigo-950/50 text-indigo-405 border border-indigo-900/40";
                      if (item.type === "Punctuation") flagColor = "bg-amber-950/50 text-amber-405 border border-amber-900/40";
                      if (item.type === "Tone" || item.type === "Style") flagColor = "bg-cyan-950/50 text-cyan-405 border border-cyan-900/40";

                      return (
                        <div key={index} className="border border-slate-850 hover:border-slate-800 bg-slate-950/40 p-3 rounded-xl flex items-start gap-2.5 transition duration-150">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-mono uppercase font-bold shrink-0 mt-0.5 ${flagColor}`}>
                            {item.type}
                          </span>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-[11px] font-mono flex-wrap">
                              <span className="text-rose-400 line-through">{item.original || "..."}</span>
                              <ChevronRight className="w-3 h-3 text-slate-500 shrink-0" />
                              <span className="text-emerald-400 font-bold">{item.improved || "..."}</span>
                            </div>
                            <p className="text-[10px] text-slate-400 leading-relaxed font-sans">{item.explanation}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-xl p-12 text-slate-500 bg-slate-950/20">
              <ChevronRight className="w-8 h-8 text-slate-600 transform rotate-90 mb-2" />
              <p className="text-xs text-slate-400 font-sans">No sentences executed in comparison dashboard.</p>
              <p className="text-[10px] text-slate-550 mt-1 font-mono">Press &quot;Correct &amp; Optimize&quot; to prompt corrections.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
