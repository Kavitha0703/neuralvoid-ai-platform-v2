import React, { useState } from "react";
import { 
  BookOpen, Copy, Check, Terminal, Globe, Key, Layers, Code, Play, 
  Sliders, RefreshCw, Send, Cpu, DollarSign, Clock, CornerDownRight, ShieldCheck, AlertCircle
} from "lucide-react";
import { UserProfile } from "../types";

const CODE_EXAMPLES = {
  textGen: {
    path: "/api/toolkit/generate-text",
    curl: `curl -X POST "https://api.neuralvoid.io/api/v1/toolkit/generate-text" \\
  -H "Authorization: Bearer nv_live_8a2d3fec99de2bc" \\
  -H "Content-Type: application/json" \\
  -d '{
    "prompt": "Create a robust design plan for software load testing.",
    "temperature": 0.7,
    "topP": 0.9,
    "model": "gemini-3.5-flash"
  }'`,
    node: `fetch("https://api.neuralvoid.io/api/v1/toolkit/generate-text", {
  method: "POST",
  headers: {
    "Authorization": "Bearer nv_live_8a2d3fec99de2bc",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    prompt: "Create a robust design plan for software load testing.",
    temperature: 0.7,
    topP: 0.9,
    model: "gemini-3.5-flash"
  })
})
.then(res => res.json())
.then(data => console.log(data));`,
    python: `import requests

url = "https://api.neuralvoid.io/api/v1/toolkit/generate-text"
headers = {
    "Authorization": "Bearer nv_live_8a2d3fec99de2bc",
    "Content-Type": "application/json"
}
payload = {
    "prompt": "Create a robust design plan for software load testing.",
    "temperature": 0.7,
    "topP": 0.9,
    "model": "gemini-3.5-flash"
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`,
    response: `{
  "success": true,
  "text": "A robust load testing design plan involves: 1. Identification of key performance indicators (KPIs) like latency limit limits...",
  "metrics": {
    "durationMs": 850,
    "tokensUsed": 450,
    "timestamp": "2026-06-05T13:00:20Z",
    "modelUsed": "gemini-3.5-flash"
  }
}`
  },
  codeExplain: {
    path: "/api/toolkit/explain-code",
    curl: `curl -X POST "https://api.neuralvoid.io/api/v1/toolkit/explain-code" \\
  -H "Authorization: Bearer nv_live_8a2d3fec99de2bc" \\
  -H "Content-Type: application/json" \\
  -d '{
    "code": "const fib = n => n <= 1 ? n : fib(n-1) + fib(n-2);",
    "language": "javascript",
    "model": "gemini-3.5-flash"
  }'`,
    node: `fetch("https://api.neuralvoid.io/api/v1/toolkit/explain-code", {
  method: "POST",
  headers: {
    "Authorization": "Bearer nv_live_8a2d3fec99de2bc",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    code: "const fib = n => n <= 1 ? n : fib(n-1) + fib(n-2);",
    language: "javascript",
    model: "gemini-3.5-flash"
  })
})
.then(res => res.json())
.then(data => console.log(data));`,
    python: `import requests

url = "https://api.neuralvoid.io/api/v1/toolkit/explain-code"
headers = {
    "Authorization": "Bearer nv_live_8a2d3fec99de2bc",
    "Content-Type": "application/json"
}
payload = {
    "code": "const fib = n => n <= 1 ? n : fib(n-1) + fib(n-2);",
    "language": "javascript",
    "model": "gemini-3.5-flash"
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`,
    response: `{
  "success": true,
  "data": {
    "explanation": "This code implements an exponential recursive Fibonacci calculation...",
    "timeComplexity": "O(2^n) - Exponential growth pattern.",
    "spaceComplexity": "O(n) - Maximum depth stack calls.",
    "issues": [
      {
        "severity": "High",
        "description": "Calculates same subproblems repeatedly. Will hang for n > 45.",
        "fix": "Use memoization or bottom-up tabulation."
      }
    ],
    "optimizedCode": "const fibMemo = (n, memo = {}) => {\\n  if (n <= 1) return n;\\n  if (memo[n]) return memo[n];\\n  return memo[n] = fibMemo(n-1, memo) + fibMemo(n-2, memo);\\n};"
  },
  "metrics": {
    "durationMs": 1100,
    "tokensUsed": 650,
    "timestamp": "2026-06-05T13:01:10Z",
    "modelUsed": "gemini-1.5-pro"
  }
}`
  },
  svgGen: {
    path: "/api/toolkit/generate-image",
    curl: `curl -X POST "https://api.neuralvoid.io/api/v1/toolkit/generate-image" \\
  -H "Authorization: Bearer nv_live_8a2d3fec99de2bc" \\
  -H "Content-Type: application/json" \\
  -d '{
    "prompt": "Abstract quantum chip diagrams",
    "style": "Technical blueprint schematic diagram",
    "model": "gemini-3.5-flash"
  }'`,
    node: `fetch("https://api.neuralvoid.io/api/v1/toolkit/generate-image", {
  method: "POST",
  headers: {
    "Authorization": "Bearer nv_live_8a2d3fec99de2bc",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    prompt: "Abstract quantum chip diagrams",
    style: "Technical blueprint schematic diagram",
    model: "gemini-3.5-flash"
  })
})
.then(res => res.json())
.then(data => console.log(data));`,
    python: `import requests

url = "https://api.neuralvoid.io/api/v1/toolkit/generate-image"
headers = {
    "Authorization": "Bearer nv_live_8a2d3fec99de2bc",
    "Content-Type": "application/json"
}
payload = {
    "prompt": "Abstract quantum chip diagrams",
    "style": "Technical blueprint schematic diagram",
    "model": "gemini-3.5-flash"
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`,
    response: `{
  "success": true,
  "data": {
    "svgCode": "<svg viewBox=\\"0 0 800 450\\">\\n  <rect width=\\"800\\" height=\\"450\\" fill=\\"#040815\\"/>...\\n</svg>",
    "designAnalysis": "Created high-fidelity schematic layer with neon cyan vector paths...",
    "palette": ["#040815", "#22d3ee", "#0891b2", "#1e1b4b"]
  },
  "metrics": {
    "durationMs": 1450,
    "tokensUsed": 920,
    "timestamp": "2026-06-05T13:02:45Z",
    "modelUsed": "gemini-3.5-flash"
  }
}`
  }
};

interface ApiDocsProps {
  user: UserProfile | null;
  onLoggedRequest: (record: any) => void;
}

export default function ApiDocs({ user, onLoggedRequest }: ApiDocsProps) {
  const [activeTab, setActiveTab] = useState<"textGen" | "codeExplain" | "svgGen">("textGen");
  const [langTab, setLangTab] = useState<"curl" | "node" | "python">("curl");
  const [copiedText, setCopiedText] = useState<boolean>(false);
  
  // Right side selector tab: documentation reference vs. interactive playground
  const [mode, setMode] = useState<"static" | "playground">("playground");

  // Playground configs
  const [modelRoute, setModelRoute] = useState<string>("gemini-3.5-flash");
  
  // Endpoint input parameters
  const [textGenPrompt, setTextGenPrompt] = useState<string>("Plan a brief test script for load capacity verification.");
  const [textGenTemp, setTextGenTemp] = useState<number>(0.7);
  const [textGenSystem, setTextGenSystem] = useState<string>("You are a precision testing engineer assistant.");

  const [codeExplainCode, setCodeExplainCode] = useState<string>("const sum = arr => arr.reduce((x, y) => x + y, 0);");
  const [codeExplainLang, setCodeExplainLang] = useState<string>("javascript");
  const [codeExplainDepth, setCodeExplainDepth] = useState<string>("deep-dive");

  const [svgPrompt, setSvgPrompt] = useState<string>("Cyberpunk microchip gateway outline neon core");
  const [svgStyle, setSvgStyle] = useState<string>("Technical schematics blueprint vector lineart styling");
  const [svgAspect, setSvgAspect] = useState<string>("16:9");

  // Playground executor state
  const [executing, setExecuting] = useState<boolean>(false);
  const [responseStatus, setResponseStatus] = useState<string | null>(null);
  const [responseHeaders, setResponseHeaders] = useState<any>(null);
  const [rawResponse, setRawResponse] = useState<string | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);

  const currentCode = CODE_EXAMPLES[activeTab][langTab];
  const currentResponse = CODE_EXAMPLES[activeTab].response;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  // Generate dynamic raw request body depending on active endpoint selection
  const getPlaygroundPayload = () => {
    if (activeTab === "textGen") {
      return {
        prompt: textGenPrompt,
        systemInstruction: textGenSystem,
        temperature: textGenTemp,
        topP: 0.95,
        model: modelRoute,
        userId: user?.id || "guest"
      };
    } else if (activeTab === "codeExplain") {
      return {
        code: codeExplainCode,
        language: codeExplainLang,
        depth: codeExplainDepth,
        model: modelRoute,
        userId: user?.id || "guest"
      };
    } else {
      return {
        prompt: svgPrompt,
        style: svgStyle,
        aspectRatio: svgAspect,
        model: modelRoute,
        userId: user?.id || "guest"
      };
    }
  };

  const handleExecutePlayground = async () => {
    setExecuting(true);
    setRawResponse(null);
    setResponseStatus(null);
    setResponseHeaders(null);
    setLatencyMs(null);

    const startTime = Date.now();
    const payload = getPlaygroundPayload();
    const endpoint = CODE_EXAMPLES[activeTab].path;

    try {
      const fetchHeaders: Record<string, string> = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${user?.apiKey || "tk_proj_live_default_99ef1a"}`
      };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: fetchHeaders,
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      setLatencyMs(duration);
      setResponseStatus(`${res.status} ${res.statusText || (res.status === 200 ? "OK" : "Error")}`);
      setResponseHeaders({
        "Content-Type": res.headers.get("content-type") || "application/json",
        "Content-Length": JSON.stringify(data).length,
        "Server": "NeuralVoid API Gateway Engine"
      });

      setRawResponse(JSON.stringify(data, null, 2));

      // Append to global history log backup in App state
      if (res.ok) {
        let logTool: any = "Text Generator";
        let logPrompt = "";

        if (activeTab === "textGen") {
          logTool = "Text Generator";
          logPrompt = textGenPrompt;
        } else if (activeTab === "codeExplain") {
          logTool = "Code Explainer";
          logPrompt = `Explain Code: ${codeExplainCode.slice(0, 50)}`;
        } else if (activeTab === "svgGen") {
          logTool = "Image Generator";
          logPrompt = svgPrompt;
        }

        const metricsRec = data.metrics || {};
        
        onLoggedRequest({
          id: `log-${Math.random().toString(36).substr(2, 9)}`,
          userId: user?.id || "guest",
          timestamp: new Date().toISOString(),
          tool: logTool,
          prompt: logPrompt,
          status: "success",
          durationMs: duration,
          tokensUsed: metricsRec.tokensUsed || Math.round(logPrompt.length / 4 + 100),
          estimatedCost: metricsRec.tokensUsed ? Number(((metricsRec.tokensUsed * 0.0000004) + 0.00005).toFixed(6)) : 0.0001,
          modelUsed: modelRoute
        });
      }

    } catch (err: any) {
      const endTime = Date.now();
      setLatencyMs(endTime - startTime);
      setResponseStatus("500 INTERNAL_CONNECTION_FAILURE");
      setRawResponse(JSON.stringify({
        error: true,
        message: err.message || "Failed to route dispatch to the backend sandbox server.",
        timestamp: new Date().toISOString()
      }, null, 2));
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in relative z-10 font-sans">
      
      {/* 1. Left side specifications / parameters index */}
      <div className="lg:col-span-4 space-y-6">
        <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-4 bg-[#090f1f]">
          <h2 className="text-xs font-bold font-mono tracking-wider uppercase text-slate-400 flex items-center gap-1.5 border-b border-slate-800/80 pb-3">
            <BookOpen className="w-4 h-4 text-cyan-400" /> API DOCUMENTATION PORTAL
          </h2>
          
          <div className="space-y-4 text-xs">
            {/* Global Authentication header card */}
            <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-850/80">
              <div className="flex items-center gap-1.5 text-cyan-400 font-bold font-mono mb-1 text-[11px] uppercase tracking-wide">
                <ShieldCheck className="w-3.5 h-3.5" /> Static Auth Header
              </div>
              <p className="text-[11.5px] text-slate-400 leading-normal font-sans mb-3">
                Include this dynamic bearer key to route requests under your secure developer workspace profile logs:
              </p>
              <pre className="p-2.5 bg-[#02050e] text-[#22d3ee] font-mono text-[10px] rounded-xl border border-cyan-950 select-all overflow-x-auto truncate">
                {`Authorization: Bearer ${user?.apiKey || "tk_proj_live_default_99ef1a"}`}
              </pre>
            </div>

            {/* Select active Endpoint */}
            <div className="p-4 bg-slate-950/50 rounded-2xl border border-slate-850/50 space-y-2 block">
              <span className="text-[10px] font-bold font-mono text-slate-500 uppercase tracking-widest block mb-1.5">
                ENDPOINT GATEWAYS
              </span>
              
              <button
                onClick={() => { setActiveTab("textGen"); setRawResponse(null); }}
                className={`w-full text-left p-3 rounded-xl font-mono text-[10.5px] flex items-center justify-between transition cursor-pointer border ${
                  activeTab === "textGen" 
                    ? "bg-cyan-500/10 text-cyan-300 border-cyan-500/25 shadow-sm" 
                    : "text-slate-400 hover:bg-slate-900 border-transparent hover:text-white"
                }`}
              >
                <span>/toolkit/generate-text</span>
                <span className="text-[8px] bg-cyan-950 text-cyan-400 border border-cyan-800/60 px-1 rounded uppercase font-bold tracking-wide">TEXT</span>
              </button>

              <button
                onClick={() => { setActiveTab("codeExplain"); setRawResponse(null); }}
                className={`w-full text-left p-3 rounded-xl font-mono text-[10.5px] flex items-center justify-between transition cursor-pointer border ${
                  activeTab === "codeExplain" 
                    ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/25 shadow-sm" 
                    : "text-slate-400 hover:bg-slate-900 border-transparent hover:text-white"
                }`}
              >
                <span>/toolkit/explain-code</span>
                <span className="text-[8px] bg-emerald-950 text-emerald-400 border border-emerald-800/60 px-1 rounded uppercase font-bold tracking-wide">CODE</span>
              </button>

              <button
                onClick={() => { setActiveTab("svgGen"); setRawResponse(null); }}
                className={`w-full text-left p-3 rounded-xl font-mono text-[10.5px] flex items-center justify-between transition cursor-pointer border ${
                  activeTab === "svgGen" 
                    ? "bg-purple-500/10 text-purple-300 border-purple-500/25 shadow-sm" 
                    : "text-slate-400 hover:bg-slate-900 border-transparent hover:text-white"
                }`}
              >
                <span>/toolkit/generate-image</span>
                <span className="text-[8px] bg-purple-950 text-purple-400 border border-purple-800/60 px-1 rounded uppercase font-bold tracking-wide">SVG</span>
              </button>
            </div>

            {/* Model Route Selection and Costs */}
            <div className="p-4 bg-slate-950/40 rounded-2xl border border-slate-850/40 space-y-3">
              <span className="text-[10px] font-bold font-mono text-slate-500 uppercase tracking-widest block">
                INTELLIGENT MODEL ROUTING
              </span>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-400 block">Select Target Model:</label>
                <div className="relative">
                  <select
                    value={modelRoute}
                    onChange={(e) => setModelRoute(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none font-mono focus:border-cyan-500 cursor-pointer"
                  >
                    <option value="gemini-3.5-flash">Gemini 3.5 Flash (Cheapest/Fastest)</option>
                    <option value="gemini-2.1-pro">Gemini 2.1 Pro (Heavy Logic)</option>
                    <option value="gemini-1.5-pro">Gemini 1.5 Pro (Deep Analytics)</option>
                    <option value="gemini-1.5-flash">Gemini 1.5 Flash (Ultralight Core)</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-850/60 flex items-center justify-between text-[10px] font-mono text-slate-500">
                <span>EST. COST / 1K TOKENS:</span>
                <span className="text-emerald-400 font-bold">
                  {modelRoute.includes("pro") ? "$0.001250" : "$0.000075"}
                </span>
              </div>
            </div>

            <div className="text-[11.5px] text-slate-500 font-sans leading-relaxed px-1">
              Need direct pipeline execution integration? Refer to our NPM wrapper module or call these REST terminals with your generated profile API keys safely.
            </div>
          </div>
        </div>
      </div>

      {/* 2. Interactive Code Terminal Content & Testing Console on the Right */}
      <div className="lg:col-span-8 flex flex-col space-y-6">
        
        {/* Top Control Tabs to Switch Mode */}
        <div className="flex bg-slate-950 border border-slate-800 p-0.5 rounded-2xl self-start">
          <button
            onClick={() => setMode("playground")}
            className={`py-1.5 px-4 rounded-xl font-sans text-xs font-semibold flex items-center gap-1.5 transition outline-none cursor-pointer ${
              mode === "playground" ? "bg-cyan-500 text-white font-bold" : "text-slate-450 hover:text-slate-200"
            }`}
          >
            <Play className="w-3.5 h-3.5" /> Interactive Sandbox Playground
          </button>
          
          <button
            onClick={() => setMode("static")}
            className={`py-1.5 px-4 rounded-xl font-sans text-xs font-semibold flex items-center gap-1.5 transition outline-none cursor-pointer ${
              mode === "static" ? "bg-cyan-500 text-white font-bold" : "text-slate-450 hover:text-slate-200"
            }`}
          >
            <Terminal className="w-3.5 h-3.5" /> Static Code Snippets
          </button>
        </div>

        {/* --- STATIC CODE DISPLAY --- */}
        {mode === "static" && (
          <div className="glass-panel border border-slate-800 rounded-3xl shadow-xl flex-1 flex flex-col bg-[#080d19] overflow-hidden min-h-[500px]">
            {/* Header copy selector */}
            <div className="bg-slate-950/60 border-b border-slate-850 px-5 py-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1 bg-slate-950 border border-slate-855 rounded-xl p-0.5">
                {(["curl", "node", "python"] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setLangTab(lang)}
                    className={`py-1 px-3.5 rounded-lg font-mono text-[10px] uppercase transition cursor-pointer outline-none ${
                      langTab === lang ? "bg-slate-800 text-white font-bold border border-slate-700/50" : "text-slate-450 hover:text-slate-250"
                    }`}
                  >
                    {lang === "curl" ? "cURL" : lang === "node" ? "Node.js" : "Python"}
                  </button>
                ))}
              </div>

              <button
                onClick={() => handleCopy(currentCode)}
                className="px-4 py-1.5 bg-slate-950 border border-slate-800 text-slate-400 hover:text-white rounded-xl font-mono text-[10.5px] flex items-center gap-1.5 select-none cursor-pointer duration-100 outline-none hover:border-cyan-500/20"
              >
                {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedText ? "Copied" : "Copy Client Code"}
              </button>
            </div>

            {/* Sandbox code container */}
            <div className="p-5 flex-1 bg-[#02050e] font-mono text-xs overflow-auto leading-relaxed border-b border-slate-855 text-[#38bdf8] min-h-[220px]">
              <pre className="whitespace-pre overflow-auto select-all text-[11px]">
                {currentCode}
              </pre>
            </div>

            {/* Header response selector */}
            <div className="bg-slate-950/40 border-b border-slate-850 px-5 py-3 flex items-center justify-between">
              <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wider block">
                EXPECTED JSON RESPONSE SCHEMA
              </span>
              <button 
                onClick={() => handleCopy(currentResponse)}
                className="text-[10px] font-mono text-cyan-400 hover:underline outline-none"
              >
                Copy schema output
              </button>
            </div>

            <div className="p-5 bg-slate-950 font-mono text-[11px] overflow-auto leading-relaxed h-[180px] text-[#34d399]/90">
              <pre className="whitespace-pre select-all">
                {currentResponse}
              </pre>
            </div>
          </div>
        )}

        {/* --- INTERACTIVE PLAYGROUND --- */}
        {mode === "playground" && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Split A: Variable inputs parameters form */}
            <div className="md:col-span-5 glass-panel p-5 bg-[#070c18] border border-slate-800 rounded-3xl space-y-4">
              <h3 className="text-xs font-bold font-mono tracking-wider uppercase text-slate-400 flex items-center gap-1.5 border-b border-slate-800/80 pb-3">
                <Sliders className="w-4 h-4 text-cyan-400" /> REQUEST PARAMETERS
              </h3>

              {/* Text generation controls */}
              {activeTab === "textGen" && (
                <div className="space-y-3.5 text-xs text-left">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold font-mono tracking-wider text-slate-450 uppercase block">Prompt input</label>
                    <textarea
                      value={textGenPrompt}
                      onChange={(e) => setTextGenPrompt(e.target.value)}
                      rows={4}
                      className="w-full bg-slate-950 text-white outline-none p-3 border border-slate-850 rounded-xl font-mono text-xs focus:border-cyan-500 transition-colors"
                      placeholder="e.g. Brainstorm a task list summary..."
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between font-mono text-[10px] text-slate-450">
                      <span className="uppercase tracking-wider font-bold">Temperature</span>
                      <span className="text-cyan-400 font-bold">{textGenTemp}</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="1.5"
                      step="0.05"
                      value={textGenTemp}
                      onChange={(e) => setTextGenTemp(parseFloat(e.target.value))}
                      className="w-full text-cyan-500 accent-cyan-500 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold font-mono tracking-wider text-slate-450 uppercase block">System Directive</label>
                    <input
                      type="text"
                      value={textGenSystem}
                      onChange={(e) => setTextGenSystem(e.target.value)}
                      className="w-full bg-slate-950 text-white outline-none p-2.5 border border-slate-850 rounded-xl font-sans text-xs focus:border-cyan-500"
                    />
                  </div>
                </div>
              )}

              {/* Code Explainer parameters */}
              {activeTab === "codeExplain" && (
                <div className="space-y-3.5 text-xs text-left">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold font-mono tracking-wider text-slate-450 uppercase block">Snippet Code block</label>
                    <textarea
                      value={codeExplainCode}
                      onChange={(e) => setCodeExplainCode(e.target.value)}
                      rows={5}
                      className="w-full bg-slate-950 text-[#38bdf8] outline-none p-3 border border-slate-850 rounded-xl font-mono text-[11px] focus:border-cyan-500 transition-colors"
                      placeholder="Write your code snippet here..."
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold font-mono tracking-wider text-slate-450 uppercase block">Environment Language</label>
                    <select
                      value={codeExplainLang}
                      onChange={(e) => setCodeExplainLang(e.target.value)}
                      className="w-full bg-slate-950 text-white border border-slate-850 rounded-xl p-2.5 outline-none font-mono text-xs focus:border-cyan-500"
                    >
                      <option value="javascript">JavaScript</option>
                      <option value="typescript">TypeScript</option>
                      <option value="python">Python</option>
                      <option value="goylang">Go</option>
                      <option value="rust">Rust</option>
                      <option value="cpp">C++</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold font-mono tracking-wider text-slate-450 uppercase block">Explanation Depth</label>
                    <select
                      value={codeExplainDepth}
                      onChange={(e) => setCodeExplainDepth(e.target.value)}
                      className="w-full bg-slate-950 text-white border border-slate-850 rounded-xl p-2.5 outline-none font-mono text-xs focus:border-cyan-500"
                    >
                      <option value="deep-dive">Deep-Dive (Complete Review)</option>
                      <option value="high-level">Executive Summary</option>
                      <option value="line-by-line">Line-by-Line Annotations</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Vector generation parameters */}
              {activeTab === "svgGen" && (
                <div className="space-y-3.5 text-xs text-left">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold font-mono tracking-wider text-slate-450 uppercase block">Vector Prompt</label>
                    <textarea
                      value={svgPrompt}
                      onChange={(e) => setSvgPrompt(e.target.value)}
                      rows={3}
                      className="w-full bg-slate-950 text-white outline-none p-3 border border-slate-850 rounded-xl font-mono text-xs focus:border-cyan-500 transition-colors"
                      placeholder="e.g. glowing digital circuit shield flat"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold font-mono tracking-wider text-slate-450 uppercase block">Vector Art Style</label>
                    <input
                      type="text"
                      value={svgStyle}
                      onChange={(e) => setSvgStyle(e.target.value)}
                      className="w-full bg-slate-950 text-white outline-none p-2.5 border border-slate-850 rounded-xl font-sans text-xs focus:border-cyan-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold font-mono tracking-wider text-slate-450 uppercase block">Canvas Ratio</label>
                    <select
                      value={svgAspect}
                      onChange={(e) => setSvgAspect(e.target.value)}
                      className="w-full bg-slate-950 text-white border border-slate-855 rounded-xl p-2.5 outline-none font-mono text-xs focus:border-cyan-500"
                    >
                      <option value="1:1">1:1 (600x600px)</option>
                      <option value="16:9">16:9 (800x450px)</option>
                      <option value="4:3">4:3 (800x600px)</option>
                    </select>
                  </div>
                </div>
              )}

              <button
                onClick={handleExecutePlayground}
                disabled={executing}
                className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-450 hover:to-blue-550 text-white font-mono text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition cursor-pointer outline-none active:scale-[0.98]"
              >
                {executing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>EXECUTING DISPATCH...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>SEND SANDBOX REQUEST</span>
                  </>
                )}
              </button>
            </div>

            {/* Split B: Real-time request headers & live response window */}
            <div className="md:col-span-7 flex flex-col space-y-4">
              
              {/* Telemetry top statistics bar */}
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="bg-slate-900/60 border border-slate-800 p-2.5 rounded-2xl flex flex-col justify-center">
                  <span className="text-[8px] font-mono font-bold text-slate-500 uppercase block">Status</span>
                  <span className={`text-[11px] font-semibold font-mono tracking-wider mt-1 truncate ${
                    responseStatus 
                      ? responseStatus.startsWith("200") ? "text-emerald-400" : "text-amber-400 animate-pulse" 
                      : "text-slate-400"
                  }`}>
                    {responseStatus || "--"}
                  </span>
                </div>

                <div className="bg-slate-900/60 border border-slate-800 p-2.5 rounded-2xl">
                  <span className="text-[8px] font-mono font-bold text-slate-500 uppercase block">Latency</span>
                  <span className="text-[11px] text-cyan-400 font-bold font-mono block mt-1">
                    {latencyMs !== null ? `${latencyMs}ms` : "--"}
                  </span>
                </div>

                <div className="bg-slate-900/60 border border-slate-800 p-2.5 rounded-2xl">
                  <span className="text-[8px] font-mono font-bold text-slate-500 uppercase block">API Load</span>
                  <span className="text-[11px] text-slate-300 font-mono block mt-1 truncate">
                    {rawResponse ? `${Math.round(rawResponse.length / 4)} tokens` : "--"}
                  </span>
                </div>

                <div className="bg-slate-900/60 border border-slate-800 p-2.5 rounded-2xl">
                  <span className="text-[8px] font-mono font-bold text-slate-500 uppercase block">SaaS Dev cost</span>
                  <span className="text-[11px] text-emerald-400 font-mono font-bold block mt-1">
                    {latencyMs !== null ? modelRoute.includes("pro") ? "$0.0012" : "$0.0001" : "--"}
                  </span>
                </div>
              </div>

              {/* Terminal panel */}
              <div className="glass-panel border border-slate-800 rounded-3xl flex-1 flex flex-col min-h-0 overflow-hidden bg-[#02050e] text-left">
                {/* Header indicators */}
                <div className="bg-slate-950/60 border-b border-slate-850 px-4 py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 bg-red-500/70 rounded-full" />
                    <span className="w-2.5 h-2.5 bg-amber-500/70 rounded-full" />
                    <span className="w-2.5 h-2.5 bg-emerald-500/70 rounded-full" />
                    <span className="text-[10px] font-mono text-slate-450 ml-1.5 uppercase font-bold">
                      Interactive API Request / Response console
                    </span>
                  </div>
                  {rawResponse && (
                    <button
                      onClick={() => handleCopy(rawResponse)}
                      className="px-2.5 py-1 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-lg font-mono text-[9px] flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3 h-3" /> Copy JSON
                    </button>
                  )}
                </div>

                {/* Log outputs */}
                <div className="p-4 flex-1 font-mono text-[10px] space-y-4 overflow-y-auto max-h-[360px] scroll-hidden select-all text-slate-300 scroll-smooth">
                  {/* Step 1: Simulated Request headers detail */}
                  <div className="space-y-1 block shrink-0 text-amber-500">
                    <span className="text-slate-500 block uppercase text-[9px] font-bold tracking-widest mb-1">
                      ➔ CLIENT OUTGOING DISPATCH PAYLOAD:
                    </span>
                    <pre className="p-3 bg-slate-950 rounded-xl border border-slate-900 leading-normal text-slate-350 overflow-x-auto">
{`POST ${CODE_EXAMPLES[activeTab].path} HTTP/1.1
Host: api.neuralvoid.io
Authorization: Bearer ${user?.apiKey ? user.apiKey.slice(0, 15) : "tk_proj_dev_demo"}...
Content-Type: application/json

${JSON.stringify(getPlaygroundPayload(), null, 2)}`}
                    </pre>
                  </div>

                  {/* Step 2: Response text render */}
                  <div className="space-y-1 block">
                    <span className="text-slate-500 block uppercase text-[9px] font-bold tracking-widest mb-1">
                      ➔ INCOMING RESPONSE LAYER RAW JSON:
                    </span>

                    {executing ? (
                      <div className="p-10 border border-dashed border-cyan-800/15 rounded-xl text-center bg-slate-950/40 flex flex-col items-center justify-center space-y-2">
                        <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
                        <span className="text-cyan-300 font-mono text-xs animate-pulse uppercase">routing query across smart node pipeline...</span>
                      </div>
                    ) : rawResponse ? (
                      <pre className="p-3 bg-slate-950 rounded-xl border border-slate-900 text-emerald-400 overflow-x-auto font-mono text-[10.5px] leading-relaxed">
                        {rawResponse}
                      </pre>
                    ) : (
                      <div className="p-10 border border-dashed border-slate-800 rounded-2xl text-center bg-slate-950/20 text-slate-500">
                        <Terminal className="w-7 h-7 mx-auto mb-2 text-slate-600 animate-pulse" />
                        <p className="text-sans text-xs">Configure the parameters on the left and click "SEND Sandbox Request" to execute an authentic live REST API call.</p>
                      </div>
                    )}
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}

      </div>

    </div>
  );
}
