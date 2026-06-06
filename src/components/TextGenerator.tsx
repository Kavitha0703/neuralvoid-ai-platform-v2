import React, { useState } from "react";
import { Play, Copy, Check, Info, Sparkles, Sliders, RotateCcw, AlertTriangle } from "lucide-react";
import { TextGenConfig, UsageRecord } from "../types";

interface TextGeneratorProps {
  onAddLog: (record: UsageRecord) => void;
  userId: string;
  customKey?: string;
  onSetStatus: (msg: string | null) => void;
}

export default function TextGenerator({ onAddLog, userId, customKey, onSetStatus }: TextGeneratorProps) {
  const [config, setConfig] = useState<TextGenConfig>({
    prompt: "Write a high-performance TypeScript debounce function and explain how the timeout state behaves.",
    systemInstruction: "You are an elite senior technical trainer. Structure responses with crisp paragraphs, bullet lists, and robust inline code declarations.",
    temperature: 0.7,
    topP: 0.9,
  });

  const [output, setOutput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [metrics, setMetrics] = useState<{ durationMs: number; tokensUsed: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Save Workbook Modal States
  const [saveModalOpen, setSaveModalOpen] = useState<boolean>(false);
  const [saveTitle, setSaveTitle] = useState<string>("Workspace Code Query and Explanation Node");
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [saveLoading, setSaveLoading] = useState<boolean>(false);

  const handleRun = async () => {
    if (!config.prompt.trim()) return;

    setLoading(true);
    setError(null);
    onSetStatus("Executing Text Generator gateway model...");

    try {
      const res = await fetch("/api/toolkit/generate-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: config.prompt,
          systemInstruction: config.systemInstruction,
          temperature: config.temperature,
          topP: config.topP,
          userId,
          customKey,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Generation endpoint aborted.");
      }

      setOutput(data.text);
      if (data.metrics) {
        setMetrics({
          durationMs: data.metrics.durationMs,
          tokensUsed: data.metrics.tokensUsed,
        });

        // Trigger parent callback to sync state logs
        onAddLog({
          id: `log-${Math.random().toString(36).substr(2, 9)}`,
          userId,
          timestamp: data.metrics.timestamp,
          tool: "Text Generator",
          prompt: config.prompt,
          status: "success",
          durationMs: data.metrics.durationMs,
          tokensUsed: data.metrics.tokensUsed,
          estimatedCost: Number((data.metrics.tokensUsed * 0.00000045).toFixed(6)),
        });
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected network block occurred.");
      onAddLog({
        id: `log-${Math.random().toString(36).substr(2, 9)}`,
        userId,
        timestamp: new Date().toISOString(),
        tool: "Text Generator",
        prompt: config.prompt,
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
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setConfig({
      prompt: "",
      systemInstruction: "You are a helpful software engineering and AI assistant.",
      temperature: 0.7,
      topP: 0.9,
    });
    setOutput("");
    setMetrics(null);
    setError(null);
  };

  const handleSaveWorkbookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!saveTitle.trim()) return;
    setSaveLoading(true);
    setSaveSuccessMsg(null);
    try {
      const res = await fetch("/api/sessions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          title: saveTitle.trim(),
          tool: "Text Generator",
          prompt: config.prompt,
          response: output,
        })
      });
      if (res.ok) {
        setSaveSuccessMsg("🎉 Workbook session securely compiled and saved in database records!");
        setTimeout(() => {
          setSaveModalOpen(false);
          setSaveSuccessMsg(null);
        }, 2000);
      } else {
        throw new Error("Failed to save workbook session files.");
      }
    } catch (err: any) {
      console.error("Failed saving workspace workbook session to server database config:", err);
      alert(err.message || "An unexpected error occurred while saving the session.");
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
      {/* Parameters Configuration Dashboard Sidebar */}
      <div className="lg:col-span-4 glass-panel p-5 rounded-2xl shadow-xl space-y-6 h-fit border border-slate-800">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <h2 className="text-xs font-bold font-mono tracking-wider uppercase text-slate-400 flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-cyan-400" /> API SHELL CONFIG
          </h2>
          <button
            onClick={handleReset}
            className="text-[10px] text-slate-400 font-mono flex items-center gap-1 hover:text-rose-400 outline-none transition-colors"
            title="Reset Settings"
          >
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
        </div>

        {/* System instruction */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-305 flex items-center gap-1.5">
            System Directive
            <span className="text-[9px] font-mono text-cyan-400/80 px-1.5 py-0.5 bg-slate-950/70 border border-slate-800 rounded">Config.sys</span>
          </label>
          <textarea
            value={config.systemInstruction}
            onChange={(e) => setConfig({ ...config, systemInstruction: e.target.value })}
            placeholder="Guides the agent persona and constraints."
            className="w-full h-24 p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-xs outline-none text-slate-200 focus:border-cyan-500/80 font-sans leading-relaxed transition-colors"
          />
        </div>

        {/* Temperature Parameter */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-semibold text-slate-300">
            <span className="flex items-center gap-1.5">
              Temperature
              <span className="text-[9px] font-mono text-cyan-400/80 px-1.5 py-0.5 bg-slate-950/70 border border-slate-800 rounded">Temp</span>
            </span>
            <span className="font-mono text-cyan-400 text-[11px] font-bold">{config.temperature}</span>
          </div>
          <input
            type="range"
            min="0.0"
            max="2.0"
            step="0.1"
            value={config.temperature}
            onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
            className="w-full accent-cyan-500 cursor-pointer bg-slate-850 h-1.5 rounded-lg"
          />
          <span className="text-[10px] text-slate-500 block font-mono leading-relaxed">
            Low values = precise and analytical. High values = creative/assertive.
          </span>
        </div>

        {/* Top_p Parameter */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-semibold text-slate-300">
            <span className="flex items-center gap-1.5">
              Top-P Sampling
              <span className="text-[9px] font-mono text-cyan-400/80 px-1.5 py-0.5 bg-slate-950/70 border border-slate-800 rounded">Top_P</span>
            </span>
            <span className="font-mono text-indigo-400 text-[11px] font-bold">{config.topP}</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="1.0"
            step="0.05"
            value={config.topP}
            onChange={(e) => setConfig({ ...config, topP: parseFloat(e.target.value) })}
            className="w-full accent-indigo-500 cursor-pointer bg-slate-850 h-1.5 rounded-lg"
          />
          <span className="text-[10px] text-slate-500 block font-mono leading-relaxed">
            Reduces vocabulary range, preserving nucleus consistency.
          </span>
        </div>

        {/* Active Model Indicator */}
        <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-xl flex items-start gap-2.5">
          <Info className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
          <div className="text-[10px] leading-relaxed text-slate-400 font-mono">
            <span className="font-bold text-slate-300 block mb-0.5 uppercase tracking-wider">Gateway Model</span>
            gemini-3.5-flash endpoint
            <span className="block text-[9px] text-slate-500 mt-1 leading-relaxed">Configured for fast programming queries/embeddings.</span>
          </div>
        </div>
      </div>

      {/* Main Interactive Playground Shell */}
      <div className="lg:col-span-8 flex flex-col space-y-5">
        {/* Input Prompter Container */}
        <div className="glass-panel p-5 rounded-2xl shadow-xl space-y-4 border border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
            <h3 className="text-xs font-bold font-mono tracking-wider uppercase text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" /> TARGET PROMPT PAYLOAD
            </h3>
            {metrics && (
              <div className="flex items-center gap-2 text-[10px] font-mono text-slate-450">
                <span className="bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800 text-slate-400">
                  Latency: <strong className="text-cyan-400 font-bold">{metrics.durationMs}ms</strong>
                </span>
                <span className="bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800 text-slate-400">
                  Compute: <strong className="text-cyan-400 font-bold">{metrics.tokensUsed} tokens</strong>
                </span>
              </div>
            )}
          </div>

          <textarea
            value={config.prompt}
            onChange={(e) => setConfig({ ...config, prompt: e.target.value })}
            placeholder="Type your model instructions or questions here..."
            className="w-full h-36 p-3 bg-slate-950/80 border border-slate-850 rounded-xl text-xs outline-none text-slate-200 focus:border-cyan-550 focus:ring-1 focus:ring-cyan-500/20 font-sans leading-relaxed"
          />

          <div className="flex justify-end">
            <button
              onClick={handleRun}
              disabled={loading || !config.prompt.trim()}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-405 hover:to-blue-505 text-white font-mono text-xs font-semibold px-5 py-2.5 rounded-xl flex items-center gap-1.5 disabled:opacity-50 select-none cursor-pointer outline-none transition duration-150 shadow-md shadow-cyan-500/10"
            >
              <Play className="w-3.5 h-3.5" /> {loading ? "Generating..." : "Execute API"}
            </button>
          </div>
        </div>

        {/* Output Panel */}
        <div className="glass-panel p-5 rounded-2xl shadow-xl border border-slate-800 flex-1 min-h-[350px] flex flex-col relative">
          {/* Save Workbook Overlay Modal */}
          {saveModalOpen && (
            <div className="absolute inset-0 z-40 bg-[#090e1b]/98 rounded-2xl p-6 flex flex-col justify-between border-2 border-cyan-500/30 animate-fade-in text-left">
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-800/80">
                  <span className="p-1.5 bg-slate-950 rounded border border-slate-850">🔒</span>
                  <div>
                    <h3 className="text-xs font-bold font-mono tracking-wider uppercase text-cyan-400">
                      SECURE WORKBOOK COMPILATION ARCHIVE
                    </h3>
                    <p className="text-[9px] text-slate-500 font-sans">
                      Saving current stream outputs securely in persistent cloud database records
                    </p>
                  </div>
                </div>

                {saveSuccessMsg ? (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl p-4 leading-relaxed font-sans flex items-center gap-2">
                    <span>{saveSuccessMsg}</span>
                  </div>
                ) : (
                  <form onSubmit={handleSaveWorkbookSubmit} className="space-y-4 pt-1">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider block">
                        Workbook Session Title / Key Name
                      </label>
                      <input
                        type="text"
                        value={saveTitle}
                        onChange={(e) => setSaveTitle(e.target.value)}
                        required
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs outline-none text-white focus:border-cyan-500 font-mono transition"
                        placeholder="e.g. Workspace Code Query Node"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={saveLoading}
                      className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-mono text-xs font-bold rounded-xl hover:from-cyan-455 hover:to-blue-555 transition cursor-pointer outline-none"
                    >
                      {saveLoading ? "Writing logs to Cloud SQL..." : "Confirm Archival Integration"}
                    </button>
                  </form>
                )}
              </div>

              <div className="text-center pt-2">
                <button
                  type="button"
                  disabled={saveLoading}
                  onClick={() => setSaveModalOpen(false)}
                  className="text-xs text-slate-450 hover:text-white underline font-mono outline-none cursor-pointer"
                >
                  Cancel Saving
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-rose-950/30 border border-rose-900/60 rounded-xl p-4 flex gap-3 text-rose-400 text-xs mb-4">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold block uppercase tracking-wider mb-0.5">Execution API Blocked</strong>
                {error}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3.5 mb-4">
            <h3 className="text-xs font-bold font-mono tracking-wider uppercase text-slate-400">
              Gateway Target Output Stream
            </h3>
            {output && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSaveTitle("Workspace Code Query and Explanation Node");
                    setSaveModalOpen(true);
                  }}
                  className="p-1.5 border border-cyan-500/25 bg-cyan-500/10 hover:bg-cyan-500/20 rounded-lg text-cyan-400 hover:text-white flex items-center gap-1.5 text-[10px] font-mono outline-none cursor-pointer transition"
                  title="Save this workflow state in Database"
                >
                  🔒 Lock in Session Archive
                </button>

                <button
                  onClick={handleCopy}
                  className="p-1.5 border border-slate-800 bg-slate-950/70 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-white flex items-center gap-1.5 text-[10px] font-mono outline-none transition-colors"
                  title="Copy full text"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copied" : "Copy Output"}
                </button>
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-500">
              {/* Spinner */}
              <div className="w-8 h-8 border-3 border-cyan-500/20 border-t-cyan-455 rounded-full animate-spin mb-3.5" />
              <p className="text-xs font-mono">Piping payload context variables to Google GenAI server...</p>
            </div>
          ) : output ? (
            <pre className="flex-1 overflow-auto p-4.5 bg-slate-950/90 border border-slate-850 text-slate-200 text-xs rounded-xl font-mono leading-relaxed whitespace-pre-wrap select-text">
              {output}
            </pre>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-xl p-12 text-slate-500 bg-slate-950/20">
              <Sparkles className="w-8 h-8 text-slate-600 mb-2.5 animate-pulse" />
              <p className="text-xs text-slate-400 font-sans">No response stream initiated since sandbox initialization.</p>
              <p className="text-[10px] text-slate-550 mt-1 font-mono">Adjust configurations and hit &quot;Execute API&quot; above.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
