import React, { useState, useEffect, useRef } from "react";
import { Copy, Check, Download, ZoomIn, ZoomOut, Maximize, Sparkles, AlertCircle, RefreshCw, Palette, Code, Image as ImageIcon, Layers, FileCode, CheckCircle2, ChevronRight, Settings2 } from "lucide-react";
import { ImageGenResult, UsageRecord } from "../types";
import { formatTimeWithRelative } from "../utils";

interface ImageGeneratorProps {
  onAddLog: (record: UsageRecord) => void;
  userId: string;
  customKey?: string;
  onSetStatus: (msg: string | null) => void;
}

const CONST_SAMPLES = [
  {
    title: "Quantum Schematic",
    prompt: "A beautiful detailed quantum computing terminal interface diagram showing qubits, microprocessors, flowcharts and nodes, neon cyan on elegant dark technical blueprint background lines",
    style: "Technical blueprint schematic diagram",
    aspectRatio: "16:9" as const,
  },
  {
    title: "Cyberpunk Logo",
    prompt: "Sleek geometric tech badge emblem, neon pink, deep space black and purple gradients, futuristic glowing rings, vector branding icon flat art",
    style: "Minimal flat digital vector logo",
    aspectRatio: "1:1" as const,
  },
];

export default function ImageGenerator({ onAddLog, userId, customKey, onSetStatus }: ImageGeneratorProps) {
  const [prompt, setPrompt] = useState<string>(CONST_SAMPLES[0].prompt);
  const [style, setStyle] = useState<string>(CONST_SAMPLES[0].style);
  const [aspectRatio, setAspectRatio] = useState<"1:1" | "16:9" | "9:16" | "4:3">("16:9");
  const [detailLevel, setDetailLevel] = useState<"Low" | "Medium" | "High" | "Ultra">("Ultra");

  const [result, setResult] = useState<ImageGenResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number, y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number, y: number }>({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedColor, setCopiedColor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<{ durationMs: number; tokensUsed: number } | null>(null);

  const [activeViewMode, setActiveViewMode] = useState<"preview" | "code" | "layers" | "wireframe">("preview");

  // SaaS Persistent Visual Library State
  const [gallery, setGallery] = useState<any[]>([]);

  const fetchGallery = async () => {
    try {
      const res = await fetch(`/api/images/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setGallery(data.images || []);
      }
    } catch (err) {
      console.error("Failed to fetch custom SVG library:", err);
    }
  };

  useEffect(() => {
    fetchGallery();
  }, [userId]);

  const handleDeleteArt = async (artId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this custom artwork from your persistent gallery?")) return;
    try {
      const res = await fetch(`/api/images/${artId}`, { method: "DELETE" });
      if (res.ok) {
        setGallery(prev => prev.filter(item => item.id !== artId));
        if (result?.svgCode && gallery.find(g => g.id === artId)?.svgCode === result.svgCode) {
          setResult(null);
        }
      }
    } catch (err) {
      console.error("Could not delete SVG artwork asset:", err);
    }
  };

  const handleRun = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);
    onSetStatus("Compiling vector image design...");

    try {
      const res = await fetch("/api/toolkit/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `${prompt} [Detail Target: ${detailLevel}]`,
          style,
          aspectRatio,
          userId,
          customKey,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to compile vector graphic.");
      }

      setResult(data.data);
      setActiveViewMode("preview");
      setZoom(1); // Reset zoom
      setPan({ x: 0, y: 0 }); // Reset pan

      // Auto-persist compiled visual graphic in Firestore / SQL dynamic library table
      try {
        await fetch("/api/images/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            prompt: prompt.trim(),
            svgCode: data.data.svgCode,
            designAnalysis: data.data.analysis || "Compiled Vector Art",
            palette: data.data.palette || []
          })
        });
        fetchGallery(); // Refresh personal library
      } catch (err) {
        console.warn("Could not archive graphic record:", err);
      }

      if (data.metrics) {
        setMetrics({
          durationMs: data.metrics.durationMs,
          tokensUsed: data.metrics.tokensUsed,
        });

        onAddLog({
          id: `log-${Math.random().toString(36).substr(2, 9)}`,
          userId,
          timestamp: data.metrics.timestamp,
          tool: "Image Generator",
          prompt: `Compile vector graphic: ${prompt}`,
          status: "success",
          durationMs: data.metrics.durationMs,
          tokensUsed: data.metrics.tokensUsed,
          estimatedCost: Number((data.metrics.tokensUsed * 0.00000045).toFixed(6)),
        });
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Vector compilation failed.");
      onAddLog({
        id: `log-${Math.random().toString(36).substr(2, 9)}`,
        userId,
        timestamp: new Date().toISOString(),
        tool: "Image Generator",
        prompt: `Compile vector graphic: ${prompt}`,
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

  const handleDownload = () => {
    if (!result?.svgCode) return;
    const blob = new Blob([result.svgCode], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `compiled_vector_${Date.now()}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyCode = () => {
    if (!result?.svgCode) return;
    navigator.clipboard.writeText(result.svgCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const analyzeSvg = (svgStr: string) => {
    if (!svgStr) return { nodes: 0, sizeKb: '0.0', paths: 0, shapes: 0, groups: 0, gradients: 0, filters: 0 };
    const nodes = (svgStr.match(/<[a-zA-Z]+/g) || []).length;
    const paths = (svgStr.match(/<path/g) || []).length;
    const shapes = (svgStr.match(/<(circle|rect|polygon|ellipse|line)/g) || []).length;
    const groups = (svgStr.match(/<g(\s|>)/g) || []).length;
    const gradients = (svgStr.match(/<(linearGradient|radialGradient)/g) || []).length;
    const filters = (svgStr.match(/<filter/g) || []).length;
    const sizeKb = (new Blob([svgStr]).size / 1024).toFixed(1);
    
    // Estimate width and height
    const wMatch = svgStr.match(/width="([^"]+)"/);
    const hMatch = svgStr.match(/height="([^"]+)"/);
    const width = wMatch ? wMatch[1] : (aspectRatio.split(':')[0] + '00');
    const height = hMatch ? hMatch[1] : (aspectRatio.split(':')[1] + '00');

    return { nodes, paths, shapes, groups, gradients, filters, sizeKb, width, height };
  };

  const stats = result?.svgCode ? analyzeSvg(result.svgCode) : null;

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!result) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !result) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!result || !canvasRef.current) return;
    
    // Determine mouse position relative to container center
    const rect = canvasRef.current.getBoundingClientRect();
    const cursorX = e.clientX - rect.left - rect.width / 2;
    const cursorY = e.clientY - rect.top - rect.height / 2;

    const zoomStep = 0.15;
    const isZoomIn = e.deltaY < 0;
    const newZoom = Math.max(0.2, Math.min(zoom + (isZoomIn ? zoomStep : -zoomStep), 10));

    if (newZoom !== zoom) {
      const scaleDiff = newZoom / zoom;
      setPan({
        x: cursorX - (cursorX - pan.x) * scaleDiff,
        y: cursorY - (cursorY - pan.y) * scaleDiff
      });
      setZoom(newZoom);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (!result || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const cursorX = e.clientX - rect.left - rect.width / 2;
    const cursorY = e.clientY - rect.top - rect.height / 2;
    
    // Zoom in x1.5 on cursor
    const newZoom = Math.min(zoom * 1.5, 10);
    if (newZoom !== zoom) {
      const scaleDiff = newZoom / zoom;
      setPan({
        x: cursorX - (cursorX - pan.x) * scaleDiff,
        y: cursorY - (cursorY - pan.y) * scaleDiff
      });
      setZoom(newZoom);
    }
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-12 w-full max-w-[1600px] mx-auto">
      {/* TOP HERO: SVG PREVIEW (65% VH) */}
      <div className="w-full h-[65vh] min-h-[500px] flex flex-col bg-[#050810] border border-slate-800 rounded-3xl shadow-2xl relative overflow-hidden isolate group order-2 lg:order-1">
        
        {/* subtle background grid for transparent svgs */}
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

        {/* Floating Top Control Bar */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between bg-[#0a0f1e]/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-2 px-3 shadow-2xl z-20">
          <div className="flex gap-1 bg-slate-950/80 rounded-xl p-1 border border-slate-800/80 backdrop-blur-md">
            <button
              onClick={() => setActiveViewMode("preview")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-mono font-bold uppercase transition-all ${
                activeViewMode === "preview" ? "bg-purple-600 shadow-md text-white" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              <ImageIcon className="w-4 h-4" /> Preview
            </button>
            <button
              onClick={() => setActiveViewMode("wireframe")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-mono font-bold uppercase transition-all ${
                activeViewMode === "wireframe" ? "bg-purple-600 shadow-md text-white" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              <Layers className="w-4 h-4" /> Wireframe
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 border-r border-slate-700 pr-3 mr-1 bg-slate-950/50 rounded-xl p-1 backdrop-blur-sm">
              <button onClick={() => setZoom((prev) => Math.max(prev - 0.25, 0.2))} className="p-2 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition" title="Zoom Out"><ZoomOut className="w-4 h-4" /></button>
              <button onClick={resetView} className="p-2 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition text-xs font-mono font-bold w-14 text-center">{Math.round(zoom * 100)}%</button>
              <button onClick={() => setZoom((prev) => Math.min(prev + 0.25, 10))} className="p-2 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition" title="Zoom In"><ZoomIn className="w-4 h-4" /></button>
              <div className="w-[1px] h-4 bg-slate-700 mx-1"></div>
              <button onClick={resetView} className="px-3 py-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition text-[10px] font-mono font-bold uppercase" title="Reset View">Fit / Reset</button>
            </div>
            
            <button
              type="button"
              onClick={handleDownload}
              disabled={!result?.svgCode}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-white text-slate-900 transition-colors rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50 shadow-lg"
            >
              <Download className="w-4 h-4" /> Export
            </button>
          </div>
        </div>

        {/* SV Canvas */}
        <div 
          ref={canvasRef}
          className={`flex-1 w-full h-full flex items-center justify-center overflow-hidden p-4 z-10 mt-16 select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          onDoubleClick={handleDoubleClick}
        >
          {loading ? (
             <div className="flex flex-col items-center gap-6">
                <div className="relative w-20 h-20 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-2 border-purple-500/20 border-t-purple-500 animate-spin" />
                  <div className="absolute inset-2 rounded-full border-2 border-cyan-500/20 border-b-cyan-500 animate-spin-slow" />
                  <Sparkles className="w-6 h-6 text-purple-400 animate-pulse" />
                </div>
                <div className="space-y-3 text-center">
                  <div className="text-2xl font-bold text-white tracking-[0.2em] font-mono">COMPILING PATHS</div>
                  <div className="text-sm text-slate-400 font-mono tracking-wider animate-pulse">Generating layered vector geometry...</div>
                </div>
             </div>
          ) : result ? (
               <div 
                  className={`origin-center transition-transform duration-75 ease-out shadow-2xl overflow-hidden rounded-md flex items-center justify-center bg-transparent ${activeViewMode === "wireframe" ? "opacity-75 *:stroke-purple-500 *:fill-transparent" : ""} `}
                  style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, minWidth: '100%', minHeight: '100%' }}
                  dangerouslySetInnerHTML={{ 
                    __html: result.svgCode
                      .replace(/width="[^"]+"/, 'width="100%"')
                      .replace(/height="[^"]+"/, 'height="100%"') 
                      + (activeViewMode === "wireframe" ? "<style>path, rect, circle, polygon, ellipse, line { fill: none !important; stroke: #a855f7 !important; stroke-width: 1px !important; vector-effect: non-scaling-stroke; } </style>" : "")
                  }}
                />
          ) : (
            <div className="text-slate-600 flex flex-col items-center gap-4">
              <ImageIcon className="w-16 h-16 opacity-30" />
              <p className="font-mono text-lg tracking-widest uppercase opacity-50">Canvas is empty</p>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 bg-red-950/40 backdrop-blur-md z-30 flex items-center justify-center p-6">
               <div className="bg-red-950 border border-red-500/50 p-8 rounded-3xl shadow-2xl max-w-lg text-center space-y-5">
                  <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
                  <h3 className="font-bold text-white text-xl uppercase tracking-widest">Compilation Error</h3>
                  <p className="text-slate-300 text-base leading-relaxed font-mono">{error}</p>
               </div>
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM GRID: CONTROLS & METADATA */}
      <div className="contents lg:grid lg:grid-cols-12 gap-6 lg:order-2">
        
        {/* Left Column: Prompt & Controls */}
        <div className="lg:col-span-5 flex flex-col gap-6 bg-[#0a0f1e] border border-slate-800 rounded-3xl p-6 shadow-lg order-1 lg:order-none">
          <div className="space-y-1 mb-2">
            <h2 className="text-xl font-bold font-sans text-white tracking-tight flex items-center gap-2">
              Studio Controls
            </h2>
          </div>

          {/* Configuration Controls */}
          <div className="space-y-6">
            <div className="space-y-2.5">
              <label className="text-[10px] uppercase font-mono tracking-widest text-slate-500 font-bold block">
                Prompt
              </label>
              <div className="relative group">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe your design..."
                  className="w-full h-32 p-4 font-sans text-sm bg-slate-950/60 border border-slate-800 rounded-2xl outline-none text-slate-200 focus:border-purple-500 leading-relaxed resize-none transition-colors group-hover:border-slate-700"
                />
                <div className="absolute bottom-3 right-4 text-[10px] text-slate-500 font-mono">
                  {prompt.length} / 500
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                  <label className="text-[10px] uppercase font-mono tracking-widest text-slate-500 font-bold block">
                    Aspect Ratio
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["1:1", "16:9", "9:16", "4:3"] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setAspectRatio(r)}
                        className={`py-2.5 border font-mono text-[10px] font-bold rounded-xl transition duration-200 outline-none cursor-pointer ${
                          aspectRatio === r ? "bg-slate-800 border-slate-700 text-white shadow-inner" : "bg-transparent border-slate-800 hover:bg-slate-900 text-slate-400"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
               </div>
               
               <div className="space-y-2">
                  <label className="text-[10px] uppercase font-mono tracking-widest text-slate-500 font-bold block flex justify-between">
                    <span>Detail Level</span>
                    <span className="text-purple-400">{detailLevel}</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["Low", "Medium", "High", "Ultra"] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setDetailLevel(r)}
                        className={`py-2.5 border font-mono text-[9px] font-bold uppercase rounded-xl transition duration-200 outline-none cursor-pointer ${
                          detailLevel === r ? "bg-slate-900 border-purple-500/50 text-purple-300 shadow-inner" : "bg-transparent border-slate-800 hover:bg-slate-900 text-slate-500 hover:text-slate-300"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
               </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase font-mono tracking-widest text-slate-500 font-bold block">
                Visual Style
              </label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="w-full bg-slate-950/60 text-slate-300 border border-slate-800 rounded-xl py-3 px-4 text-sm font-sans outline-none focus:border-purple-500 cursor-pointer transition-colors"
              >
                <option value="Technical blueprint schematic diagram" className="bg-slate-900">Technical Blueprint (Neon)</option>
                <option value="Minimal flat digital vector logo" className="bg-slate-900">Minimal Vector Logo</option>
                <option value="Sleek retro glow-line console grids" className="bg-slate-900">Cyberpunk Synthwave</option>
                <option value="Abstract modern isometric design" className="bg-slate-900">Isometric Concept</option>
                <option value="Futuristic synthwave pixel landscape" className="bg-slate-900">Sci-Fi Landscape</option>
              </select>
            </div>

            <div className="pt-4">
              <button
                type="button"
                onClick={handleRun}
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-sans text-lg font-bold px-4 py-4 rounded-2xl flex items-center justify-center gap-2 outline-none transition-all disabled:opacity-50 select-none cursor-pointer shadow-[0_0_30px_rgba(168,85,247,0.3)] hover:shadow-[0_0_40px_rgba(168,85,247,0.5)] active:scale-[0.98]"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" /> Compile Vector Art
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Details & Code Panels */}
        <div className="lg:col-span-7 flex flex-col gap-6 order-3 lg:order-none">
           
           {/* SVG Analysis Grid */}
           <div id="image-gen-metadata" className="bg-[#0a0f1e] border border-slate-800 rounded-3xl p-5 shadow-lg flex flex-col">
              <span className="text-[10px] font-mono font-bold tracking-widest text-slate-400 uppercase mb-4 opacity-80 border-b border-slate-800/80 pb-2">SVG Statistics Panel</span>
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="flex flex-col gap-1">
                   <span className="text-[9px] font-mono text-slate-500 uppercase font-semibold">Paths</span>
                   <span className="text-2xl font-bold font-mono text-slate-200">{stats ? stats.paths : '--'}</span>
                </div>
                <div className="flex flex-col gap-1">
                   <span className="text-[9px] font-mono text-slate-500 uppercase font-semibold">Groups</span>
                   <span className="text-2xl font-bold font-mono text-slate-200">{stats ? stats.groups : '--'}</span>
                </div>
                <div className="flex flex-col gap-1">
                   <span className="text-[9px] font-mono text-slate-500 uppercase font-semibold">Gradients</span>
                   <span className="text-2xl font-bold font-mono text-slate-200">{stats ? stats.gradients : '--'}</span>
                </div>
                <div className="flex flex-col gap-1">
                   <span className="text-[9px] font-mono text-slate-500 uppercase font-semibold">Filters</span>
                   <span className="text-2xl font-bold font-mono text-slate-200">{stats ? stats.filters : '--'}</span>
                </div>
                <div className="flex flex-col gap-1">
                   <span className="text-[9px] font-mono text-slate-500 uppercase font-semibold">Nodes / Size</span>
                   <div className="flex items-baseline gap-1.5">
                     <span className="text-2xl font-bold font-mono text-purple-400">{stats ? stats.nodes : '--'}</span>
                     <span className="text-[10px] font-mono text-slate-500">{stats ? `${stats.sizeKb}KB` : ''}</span>
                   </div>
                </div>
              </div>
           </div>

           {/* Source Data / Layers window */}
           <div className="bg-[#0a0f1e] border border-slate-800 rounded-3xl flex-1 flex flex-col shadow-lg overflow-hidden min-h-[300px]">
             <div className="bg-slate-900/60 border-b border-slate-800 p-3 px-5 flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold tracking-widest text-slate-400 uppercase">Vector Inspection</span>
                <div className="flex gap-2">
                  <button onClick={() => setActiveViewMode("code")} className={`text-[10px] px-3 py-1 rounded font-mono font-bold transition-colors ${activeViewMode === "code" ? "bg-purple-500/20 text-purple-300" : "bg-slate-800/50 text-slate-400 hover:text-slate-200"}`}>RAW SVG</button>
                  <button onClick={() => setActiveViewMode("layers")} className={`text-[10px] px-3 py-1 rounded font-mono font-bold transition-colors ${activeViewMode === "layers" ? "bg-cyan-500/20 text-cyan-300" : "bg-slate-800/50 text-slate-400 hover:text-slate-200"}`}>LAYERS</button>
                  <button onClick={handleCopyCode} className="text-slate-500 hover:text-white transition ml-3 bg-slate-800 hover:bg-slate-700 p-1.5 rounded-lg"><Copy className="w-4 h-4" /></button>
                </div>
             </div>
             
             <div className="flex-1 overflow-auto bg-[#070b14]/50 p-5 text-xs font-mono leading-relaxed text-slate-400 custom-scrollbar relative">
               {activeViewMode === "layers" ? (
                 <div className="space-y-2">
                    <div className="flex items-center gap-2 text-purple-300 font-bold"><ChevronRight className="w-4 h-4"/> Scene Root ({stats?.width} × {stats?.height})</div>
                    <div className="pl-6 border-l-2 border-slate-800/50 ml-2 space-y-3 py-3">
                      <div className="flex items-center justify-between group cursor-pointer pr-4 hover:bg-slate-800/30 p-1 rounded">
                         <span className="flex items-center gap-2 text-slate-300"><Settings2 className="w-4 h-4 text-slate-500"/> Definitions & Gradients</span>
                         <span className="text-slate-600 group-hover:text-cyan-400 transition-colors">[{stats?.groups || 0} nodes]</span>
                      </div>
                      <div className="flex items-center justify-between group cursor-pointer pr-4 hover:bg-slate-800/30 p-1 rounded">
                         <span className="flex items-center gap-2 text-slate-300"><Layers className="w-4 h-4 text-emerald-500"/> Primitives Layer</span>
                         <span className="text-slate-600 group-hover:text-cyan-400 transition-colors">[{stats?.shapes || 0} nodes]</span>
                      </div>
                      <div className="flex items-center justify-between group cursor-pointer pr-4 hover:bg-slate-800/30 p-1 rounded">
                         <span className="flex items-center gap-2 text-slate-300"><Layers className="w-4 h-4 text-purple-500"/> Complex Vectors</span>
                         <span className="text-slate-600 group-hover:text-cyan-400 transition-colors">[{stats?.paths || 0} paths]</span>
                      </div>
                    </div>
                 </div>
               ) : (
                <div className="whitespace-pre-wrap select-all font-mono text-[11px] leading-relaxed">
                  {result?.svgCode ? result.svgCode.split('\n').filter(Boolean).slice(0, 100).join('\n') + (result.svgCode.split('\n').length > 100 ? '\n\n... [Code Truncated for Visual Performance]' : '') : "<!-- No vector data. Compile a prompt to generate SVG code. -->"}
                </div>
               )}
             </div>
           </div>
        </div>

      </div>

      {/* Library Below Everything */}
      {gallery.length > 0 && (
         <div className="mt-4 pt-6 border-t border-slate-800/80 order-4 md:order-none">
            <h3 className="text-xs font-bold font-mono tracking-widest text-slate-400 uppercase mb-4 pl-2">Saved Vector Artworks</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {gallery.map((g) => (
                <div
                  key={g.id}
                  onClick={() => {
                    setResult({ svgCode: g.svgCode, palette: g.palette, analysis: g.designAnalysis });
                    setPrompt(g.prompt);
                    setActiveViewMode("preview");
                  }}
                  className={`flex flex-col gap-3 p-3 rounded-2xl border bg-slate-900/50 transition cursor-pointer group ${
                    result?.svgCode === g.svgCode ? "border-purple-500/50 shadow-lg shadow-purple-500/10" : "border-slate-800/80 hover:border-slate-600"
                  }`}
                >
                  <div 
                    className="w-full aspect-square flex items-center justify-center bg-[#070B14] rounded-xl overflow-hidden shrink-0 border border-slate-800/50 relative" 
                  >
                     <div className="w-full h-full p-2 origin-center" dangerouslySetInnerHTML={{ __html: g.svgCode.replace(/width="[^"]+"/, 'width="100%"').replace(/height="[^"]+"/, 'height="100%"') }} />
                     <button
                       type="button"
                       onClick={(e) => handleDeleteArt(g.id, e)}
                       className="absolute top-2 right-2 w-7 h-7 bg-red-950/80 text-red-400 border border-red-500/30 flex items-center justify-center rounded-lg text-sm transition opacity-0 group-hover:opacity-100 hover:bg-red-900 hover:text-white"
                     >
                       ×
                     </button>
                  </div>
                  <div>
                    <div className="text-xs font-bold font-sans text-slate-200 truncate pr-2">{g.prompt || "New Graphic"}</div>
                    <div className="text-[10px] font-mono text-slate-500 mt-1">{formatTimeWithRelative(g.createdAt || Date.now())}</div>
                  </div>
                </div>
              ))}
            </div>
         </div>
      )}
    </div>
  );
}
