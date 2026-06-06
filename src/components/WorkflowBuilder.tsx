import React, { useState, useEffect } from "react";
import { Sparkles, Play, Plus, Trash2, Settings, ArrowRight, Layers, CheckCircle, Database, HelpCircle, HardDrive, Eye } from "lucide-react";
import { SavedWorkflow, UserProfile, UsageRecord } from "../types";

interface WorkflowBuilderProps {
  user: UserProfile | null;
  onAddLog: (newRec: UsageRecord) => void;
  onSetStatus: (msg: string | null) => void;
}

interface WorkflowNode {
  id: string;
  type: "input" | "prompt" | "llm" | "summarize" | "grammar" | "explainer" | "pdf-search" | "output";
  label: string;
  config: Record<string, any>;
  status: "idle" | "running" | "success" | "error";
  output?: string;
  x: number;
  y: number;
}

export default function WorkflowBuilder({ user, onAddLog, onSetStatus }: WorkflowBuilderProps) {
  const [workflows, setWorkflows] = useState<SavedWorkflow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeWorkflowId, setActiveWorkflowId] = useState<string | null>("flow-1");

  // Dynamic Workspace Flow nodes and settings
  const [nodes, setNodes] = useState<WorkflowNode[]>([
    {
      id: "node-1",
      type: "input",
      label: "Initial Code Segment",
      config: { value: "function calculateSLA(uptime) { return uptime >= 0.9998; }" },
      status: "idle",
      x: 10,
      y: 10
    },
    {
      id: "node-2",
      type: "explainer",
      label: "Complexity Analyzer",
      config: { language: "javascript", depth: "deep-dive" },
      status: "idle",
      x: 200,
      y: 10
    },
    {
      id: "node-3",
      type: "summarize",
      label: "Summary Refiner",
      config: { length: "short", style: "bullets" },
      status: "idle",
      x: 400,
      y: 10
    },
    {
      id: "node-4",
      type: "output",
      label: "Pipeline Target Output",
      config: {},
      status: "idle",
      x: 600,
      y: 10
    }
  ]);

  // Editor states
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>("node-1");
  const [flowName, setFlowName] = useState<string>("SLA Audit Pipeline");
  const [flowDesc, setFlowDesc] = useState<string>("Analyze uptime SLA and output review bullets.");
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [activeMobileTab, setActiveMobileTab] = useState<"workspace" | "canvas" | "inspector">("canvas");

  const userId = user?.id || "guest";

  const loadWorkflows = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/workflows/${userId}`);
      if (!res.ok) throw new Error("Could not load workflows");
      const data = await res.json();
      setWorkflows(data.workflows || []);
    } catch (e) {
      console.error(e);
      onSetStatus("Failed to synchronize saved workflows.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkflows();
  }, [userId]);

  // Save current dynamic canvas to database
  const saveCurrentFlow = async () => {
    try {
      onSetStatus("Persisting workflow canvas to disk...");
      const res = await fetch("/api/workflows/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          name: flowName,
          description: flowDesc,
          nodes,
          connections: []
        }),
      });
      if (res.ok) {
        onSetStatus("Workflow backup persisted successfully!");
        await loadWorkflows();
        setTimeout(() => onSetStatus(null), 2500);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Delete a saved flow from catalog
  const deleteWorkflow = async (id: string) => {
    if (!confirm("Are you sure you want to delete this saved workflow?")) return;
    try {
      const res = await fetch(`/api/workflows/${id}`, { method: "DELETE" });
      if (res.ok) {
        onSetStatus("Workflow deleted.");
        setWorkflows(prev => prev.filter(w => w.id !== id));
        setTimeout(() => onSetStatus(null), 2000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Load selected saved flow into dynamic canvas
  const selectWorkflow = (flow: SavedWorkflow) => {
    setActiveWorkflowId(flow.id);
    setFlowName(flow.name);
    setFlowDesc(flow.description || "");
    if (Array.isArray(flow.nodes) && flow.nodes.length > 0) {
      setNodes(flow.nodes);
      setSelectedNodeId(flow.nodes[0].id);
    }
  };

  // Trigger Sequential Execution of visual nodes
  const executePipeline = async () => {
    if (isRunning) return;
    try {
      setIsRunning(true);
      onSetStatus("Sequencing visual node pipelines...");

      // Instantly set all node states of active execution to idle
      setNodes(prev => prev.map(n => ({ ...n, status: "idle", output: undefined })));

      const res = await fetch("/api/workflows/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nodes,
          connections: [],
          customKey: user?.customGeminiKey
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Workflow pipeline compilation failed.");

      if (Array.isArray(data.nodes)) {
        setNodes(data.nodes);
        onSetStatus("Visual workflow processed successfully!");
        
        // Log to telemetry cost
        onAddLog({
          id: `log-${Math.random().toString(36).substr(2, 9)}`,
          userId,
          timestamp: new Date().toISOString(),
          tool: "Code Explainer",
          prompt: `Workflow Pipeline run: ${flowName}`,
          status: "success",
          durationMs: 1450,
          tokensUsed: 650,
          estimatedCost: 0.00065,
          modelUsed: "gemini-3.5-flash"
        });
      }

      setTimeout(() => onSetStatus(null), 3000);

    } catch (e: any) {
      console.error(e);
      onSetStatus(`Workflow error: ${e.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  // Add new node in visual matrix
  const addNode = (type: WorkflowNode["type"]) => {
    const id = `node-${Math.random().toString(36).substr(2, 5)}`;
    let label = "New Node";
    let nodeConfig: Record<string, any> = {};

    switch (type) {
      case "input":
        label = "Input Variable";
        nodeConfig = { value: "Incoming raw content..." };
        break;
      case "prompt":
        label = "Prompt Formula";
        nodeConfig = { prompt: "Translate style to markdown:\n\n{{input}}" };
        break;
      case "llm":
        label = "Gemini Core Generator";
        nodeConfig = { model: "gemini-3.5-flash", systemInstruction: "Be professional." };
        break;
      case "summarize":
        label = "Summarizer Engine";
        nodeConfig = { length: "medium", style: "bullets" };
        break;
      case "grammar":
        label = "Grammar Audit Task";
        nodeConfig = { tone: "professional" };
        break;
      case "explainer":
        label = "Code Review Explainer";
        nodeConfig = { language: "typescript", depth: "high-level" };
        break;
      case "pdf-search":
        label = "Semantic Document QA";
        nodeConfig = { query: "What are the core guarantees?" };
        break;
      case "output":
         label = "Output Destination";
         nodeConfig = {};
         break;
    }

    // Insert as the last node in coordinate lines
    const lastNode = nodes[nodes.length - 1];
    const newX = lastNode ? lastNode.x + 150 : 20;

    const newNode: WorkflowNode = {
      id,
      type,
      label,
      config: nodeConfig,
      status: "idle",
      x: newX,
      y: 10
    };

    setNodes(prev => [...prev, newNode]);
    setSelectedNodeId(id);
  };

  // Delete node from matrix coordinates
  const deleteNode = (id: string) => {
    if (nodes.length <= 1) {
      alert("At least one target node must be maintained inside the execution context.");
      return;
    }
    setNodes(prev => prev.filter(n => n.id !== id));
    if (selectedNodeId === id) {
      setSelectedNodeId(null);
    }
  };

  // Update selected Node configs
  const updateNodeConfig = (key: string, val: any) => {
    if (!selectedNodeId) return;
    setNodes(prev => prev.map(n => {
      if (n.id === selectedNodeId) {
        return { ...n, config: { ...n.config, [key]: val } };
      }
      return n;
    }));
  };

  const updateNodeLabel = (val: string) => {
    if (!selectedNodeId) return;
    setNodes(prev => prev.map(n => {
      if (n.id === selectedNodeId) {
        return { ...n, label: val };
      }
      return n;
    }));
  };

  // Visual move sequence (simple left/right sorting adjustments for nodes)
  const shiftNodeOrder = (index: number, direction: "left" | "right") => {
    if (direction === "left" && index === 0) return;
    if (direction === "right" && index === nodes.length - 1) return;

    const targetIdx = direction === "left" ? index - 1 : index + 1;
    const copied = [...nodes];
    const temp = copied[index];
    copied[index] = copied[targetIdx];
    copied[targetIdx] = temp;

    setNodes(copied);
  };

  const activeNode = nodes.find(n => n.id === selectedNodeId);

  return (
    <div id="workflow_builder_layout" className="space-y-6">
      
      {/* Upper header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-xl font-bold text-white font-sans flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            Visual AI Workflow Pipelines
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Design multi-stage Gemini computing workflows. Combine prompt processors, summarizers, classifiers, and code evaluators sequentially.
          </p>
        </div>
        
        <div className="flex gap-2.5 items-center shrink-0">
          <button
            onClick={saveCurrentFlow}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer outline-none select-none"
          >
            <HardDrive className="w-4 h-4" /> Save Pipeline
          </button>
          <button
            onClick={executePipeline}
            disabled={isRunning}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 rounded-lg text-xs font-semibold text-white transition-all cursor-pointer shadow-lg shadow-emerald-500/10 outline-none select-none border border-emerald-500/20"
          >
            {isRunning ? (
              <span className="animate-spin text-xs">🌀</span>
            ) : (
              <Play className="w-4 h-4 fill-current text-white/90" />
            )}
            <span>Execute Workflow</span>
          </button>
        </div>
      </div>

      {/* Grid containing saved presets sidebar, dynamic editor canvas, inspector drawer */}
      <div className="lg:hidden flex bg-slate-900 border border-slate-800 rounded-lg p-1 select-none w-full max-w-sm mb-4">
         <button onClick={() => setActiveMobileTab("workspace")} className={`flex-1 py-3 text-[10px] font-bold font-mono tracking-wider rounded-md uppercase transition-colors ${activeMobileTab === "workspace" ? "bg-slate-800 text-cyan-400 shadow-sm border border-slate-700/50" : "text-slate-500 hover:text-slate-300"}`}>Workspaces</button>
         <button onClick={() => setActiveMobileTab("canvas")} className={`flex-1 py-3 text-[10px] font-bold font-mono tracking-wider rounded-md uppercase transition-colors ${activeMobileTab === "canvas" ? "bg-slate-800 text-indigo-400 shadow-sm border border-slate-700/50" : "text-slate-500 hover:text-slate-300"}`}>Canvas Map</button>
         <button onClick={() => setActiveMobileTab("inspector")} className={`flex-1 py-3 text-[10px] font-bold font-mono tracking-wider rounded-md uppercase transition-colors ${activeMobileTab === "inspector" ? "bg-slate-800 text-emerald-400 shadow-sm border border-slate-700/50" : "text-slate-500 hover:text-slate-300"}`}>Inspector</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Saved pipelines library drawer */}
        <div className={`lg:col-span-3 space-y-4 ${activeMobileTab === 'workspace' ? 'block' : 'hidden lg:block'}`}>
          <div className="bg-[#0a0f1e] border border-slate-800 rounded-xl p-4 space-y-3.5">
            <span className="text-[10px] font-bold font-mono tracking-wider text-slate-400 uppercase block">Active Configurations</span>
            
            <div className="space-y-2">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-500">Pipeline Name</label>
                <input
                  type="text"
                  value={flowName}
                  onChange={e => setFlowName(e.target.value)}
                  className="w-full bg-[#040815] border border-slate-850 rounded-lg px-2.5 py-1 text-xs text-white outline-none focus:border-cyan-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-500">Description Summary</label>
                <input
                  type="text"
                  value={flowDesc}
                  onChange={e => setFlowDesc(e.target.value)}
                  className="w-full bg-[#040815] border border-slate-850 rounded-lg px-2.5 py-1 text-xs text-white outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          <div className="bg-[#0a0f1e] border border-slate-800 rounded-xl p-4 space-y-2">
            <span className="text-[10px] font-bold font-mono tracking-wider text-slate-400 uppercase block mb-2">Saved Pipelines Catalog</span>
            {loading ? (
              <p className="text-[10px] font-mono text-slate-500 text-center py-4">Syncing templates...</p>
            ) : workflows.length === 0 ? (
              <p className="text-[10px] text-slate-600 font-mono text-center py-4">No custom backups created.</p>
            ) : (
              <div className="space-y-2 max-h-[220px] overflow-y-auto">
                {workflows.map(w => (
                  <div
                    key={w.id}
                    onClick={() => selectWorkflow(w)}
                    className={`p-2 rounded-lg border text-left cursor-pointer transition-all flex items-center justify-between gap-2 ${
                      activeWorkflowId === w.id
                        ? "bg-cyan-500/15 border-cyan-500/40 text-cyan-400"
                        : "bg-slate-900/40 border-slate-850 text-slate-400 hover:text-white"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold truncate leading-none">{w.name}</p>
                      <span className="text-[9px] font-mono text-slate-550 block mt-1">{w.nodes?.length || 0} stages</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteWorkflow(w.id);
                      }}
                      className="text-slate-600 hover:text-red-400 p-0.5 outline-none"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Node orchestration canvas */}
        <div className={`lg:col-span-6 bg-[#0a0f1e] border border-slate-800 rounded-xl p-5 space-y-5 flex-col min-h-[500px] ${activeMobileTab === 'canvas' ? 'flex' : 'hidden lg:flex'}`}>
          
          {/* Action toolbar to insert nodes */}
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
            <span className="text-[10px] font-bold font-mono uppercase text-slate-400 mr-1.5">Add Stage Node:</span>
            <button
              onClick={() => addNode("input")}
              className="px-2.5 py-1 bg-[#11192e] border border-slate-850 text-slate-300 rounded-lg text-[10px] font-mono font-bold hover:text-white outline-none cursor-pointer"
            >
              + Input
            </button>
            <button
              onClick={() => addNode("prompt")}
              className="px-2.5 py-1 bg-[#11192e] border border-slate-850 text-slate-300 rounded-lg text-[10px] font-mono font-bold hover:text-white outline-none cursor-pointer"
            >
              + Prompt
            </button>
            <button
              onClick={() => addNode("llm")}
              className="px-2.5 py-1 bg-[#11192e] border border-slate-850 text-slate-300 rounded-lg text-[10px] font-mono font-bold hover:text-white outline-none cursor-pointer"
            >
              + Gemini Core
            </button>
            <button
              onClick={() => addNode("summarize")}
              className="px-2.5 py-1 bg-[#11192e] border border-slate-850 text-slate-300 rounded-lg text-[10px] font-mono font-bold hover:text-white outline-none cursor-pointer"
            >
              + Summarizer
            </button>
            <button
              onClick={() => addNode("grammar")}
              className="px-2.5 py-1 bg-[#11192e] border border-slate-850 text-slate-300 rounded-lg text-[10px] font-mono font-bold hover:text-white outline-none cursor-pointer"
            >
              + Grammar
            </button>
            <button
              onClick={() => addNode("explainer")}
              className="px-2.5 py-1 bg-[#11192e] border border-slate-850 text-slate-300 rounded-lg text-[10px] font-mono font-bold hover:text-white outline-none cursor-pointer"
            >
              + Explainer
            </button>
            <button
              onClick={() => addNode("pdf-search")}
              className="px-2.5 py-1 bg-[#11192e] border border-slate-850 text-slate-400 rounded-lg text-[10px] font-mono font-bold hover:text-white outline-none cursor-pointer"
            >
              + Doc Search
            </button>
            <button
              onClick={() => addNode("output")}
              className="px-2.5 py-1 bg-[#11192e] border border-slate-850 text-slate-400 rounded-lg text-[10px] font-mono font-bold hover:text-white outline-none cursor-pointer"
            >
              + Output
            </button>
          </div>

          {/* Sequential visual node tracks */}
          <div className="flex-1 overflow-x-auto py-4 flex flex-row items-center gap-4 border-slate-800/60 leading-relaxed scrollbar-thin relative min-h-[300px]">
            
            {nodes.map((node, index) => {
              const isSelected = selectedNodeId === node.id;
              
              return (
                <React.Fragment key={node.id}>
                  
                  {/* Visually connecting arrow before the node (if not index 0) */}
                  {index > 0 && (
                    <div className="flex flex-col items-center shrink-0">
                      <div className="w-8 h-0.5 bg-slate-800 flex items-center justify-center">
                        <ArrowRight className="w-3.5 h-3.5 text-slate-600 shrink-0 select-none pointer-events-none" />
                      </div>
                    </div>
                  )}

                  {/* Individual Node Box */}
                  <div
                    onClick={() => setSelectedNodeId(node.id)}
                    className={`w-48 bg-[#0b1021] border rounded-xl p-3.5 select-none cursor-pointer shrink-0 transition-all relative overflow-hidden flex flex-col justify-between min-h-[140px] ${
                      isSelected
                        ? "border-cyan-500 shadow-lg shadow-cyan-500/10 bg-[#0c162e]"
                        : "border-slate-800 hover:border-slate-700 hover:bg-[#070b16]"
                    }`}
                  >
                    {/* Status beacon glows on top row */}
                    <div className="flex justify-between items-center">
                      <span className="text-[8px] font-mono uppercase bg-[#11192e] border border-slate-800 px-1.5 py-0.5 rounded text-cyan-400 font-bold uppercase tracking-wider">
                        {node.type}
                      </span>
                      
                      <div className="flex items-center gap-1.5">
                        {/* Status beacon color glows */}
                        <span className={`w-2 h-2 rounded-full leading-none block ${
                          node.status === "running" ? "bg-amber-400 animate-ping" :
                          node.status === "success" ? "bg-emerald-400 shadow shadow-emerald-500/50" :
                          node.status === "error" ? "bg-red-400 animate-pulse" : "bg-slate-700"
                        }`} />
                      </div>
                    </div>

                    <div className="my-2 min-w-0">
                      <p className="text-xs font-bold text-white tracking-tight truncate leading-tight">
                        {node.label}
                      </p>
                      
                      {/* Configuration teaser lines */}
                      <p className="text-[9px] font-mono text-slate-500 truncate mt-1">
                        {node.type === "input" && `${node.config?.value?.slice(0, 20)}...`}
                        {node.type === "llm" && `Model: ${node.config?.model || "Flash"}`}
                        {node.type === "summarize" && `Format: ${node.config?.style || "bullets"}`}
                        {node.type === "prompt" && `Prompt: ${node.config?.prompt?.slice(0, 20)}...`}
                        {node.type === "grammar" && `Tone: ${node.config?.tone || "professional"}`}
                        {node.type === "explainer" && `Language: ${node.config?.language || "all"}`}
                        {node.type === "pdf-search" && `SLA Query...`}
                        {node.type === "output" && "Pipeline Collector"}
                      </p>
                    </div>

                    {/* Left shift, delete, right shift actions inside container */}
                    <div className="flex justify-between items-center border-t border-slate-850/80 pt-2 shrink-0">
                      <div className="flex items-center gap-1">
                        <button
                          disabled={index === 0}
                          onClick={(e) => {
                            e.stopPropagation();
                            shiftNodeOrder(index, "left");
                          }}
                          className={`text-slate-500 hover:text-white px-1 py-0.5 rounded border border-transparent hover:border-slate-800 text-[10px] font-semibold leading-none ${index === 0 && "opacity-25"}`}
                          title="Shift left"
                        >
                          ‹
                        </button>
                        <button
                          disabled={index === nodes.length - 1}
                          onClick={(e) => {
                            e.stopPropagation();
                            shiftNodeOrder(index, "right");
                          }}
                          className={`text-slate-500 hover:text-white px-1 py-0.5 rounded border border-transparent hover:border-slate-800 text-[10px] font-semibold leading-none ${index === nodes.length - 1 && "opacity-25"}`}
                          title="Shift right"
                        >
                          ›
                        </button>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNode(node.id);
                        }}
                        className="text-slate-600 hover:text-red-400 hover:bg-red-500/5 p-1 rounded-lg transition-colors outline-none"
                        title="Delete stage"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
          </div>

          <div className="flex items-center gap-1.5 px-3 py-2 bg-[#080d19] rounded-xl border border-slate-850">
            <HelpCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <p className="text-[10px] text-slate-500 font-mono">
              The pipeline executes left-to-right. The output of each completed stage is automatically channeled down as input to the next node.
            </p>
          </div>
        </div>

        {/* Selected Config/Inspector Panel side panel */}
        <div className={`lg:col-span-3 space-y-4 ${activeMobileTab === 'inspector' ? 'block' : 'hidden lg:block'}`}>
          {activeNode ? (
            <div className="bg-[#0a0f1e] border border-cyan-500/20 rounded-xl p-4 space-y-4 animate-fadeIn">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <div>
                  <span className="text-[9px] font-mono uppercase text-cyan-400">STAGE INSPECTOR</span>
                  <p className="text-xs font-bold text-white mt-0.5">{activeNode.label}</p>
                </div>
              </div>

              {/* Editable configurations */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-500">Stage Label</label>
                  <input
                    type="text"
                    value={activeNode.label}
                    onChange={e => updateNodeLabel(e.target.value)}
                    className="w-full bg-[#040815] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-cyan-500 outline-none"
                  />
                </div>

                {/* Conditional node attributes */}
                {activeNode.type === "input" && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-500">Raw Input Content</label>
                    <textarea
                      value={activeNode.config.value || ""}
                      rows={5}
                      onChange={e => updateNodeConfig("value", e.target.value)}
                      className="w-full bg-[#040815] border border-slate-800 rounded-lg p-2 text-xs font-mono text-slate-200 outline-none focus:border-cyan-500"
                    />
                  </div>
                )}

                {activeNode.type === "prompt" && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-500">Prompt Wrapper formula</label>
                    <span className="text-[9px] font-mono text-cyan-400 block pb-1">💡 Must include {"{{input}}"} to represent previous step</span>
                    <textarea
                      value={activeNode.config.prompt || ""}
                      rows={4}
                      onChange={e => updateNodeConfig("prompt", e.target.value)}
                      className="w-full bg-[#040815] border border-slate-800 rounded-lg p-2 text-xs font-mono text-slate-200 outline-none focus:border-cyan-500"
                    />
                  </div>
                )}

                {activeNode.type === "llm" && (
                  <div className="space-y-3.5">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-slate-500">Generation Model</label>
                      <select
                        value={activeNode.config.model || "gemini-3.5-flash"}
                        onChange={e => updateNodeConfig("model", e.target.value)}
                        className="w-full bg-[#040815] border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-300 focus:border-cyan-500 outline-none"
                      >
                        <option value="gemini-3.5-flash">Gemini 3.5 Flash</option>
                        <option value="gemini-3.5-pro">Gemini 3.5 Pro</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-slate-500">System Instruction</label>
                      <input
                        type="text"
                        value={activeNode.config.systemInstruction || ""}
                        onChange={e => updateNodeConfig("systemInstruction", e.target.value)}
                        className="w-full bg-[#040815] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:border-cyan-500 outline-none"
                      />
                    </div>
                  </div>
                )}

                {activeNode.type === "summarize" && (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-slate-500">Length</label>
                      <select
                        value={activeNode.config.length || "medium"}
                        onChange={e => updateNodeConfig("length", e.target.value)}
                        className="w-full bg-[#040815] border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-300 focus:border-cyan-500 outline-none"
                      >
                        <option value="short">Short</option>
                        <option value="medium">Medium</option>
                        <option value="long">Long</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-slate-500">Style</label>
                      <select
                        value={activeNode.config.style || "bullets"}
                        onChange={e => updateNodeConfig("style", e.target.value)}
                        className="w-full bg-[#040815] border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-300 focus:border-cyan-500 outline-none"
                      >
                        <option value="bullets">Bullets</option>
                        <option value="paragraph">Paragraph</option>
                      </select>
                    </div>
                  </div>
                )}

                {activeNode.type === "grammar" && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-500">Refine Tone Style</label>
                    <select
                      value={activeNode.config.tone || "professional"}
                      onChange={e => updateNodeConfig("tone", e.target.value)}
                      className="w-full bg-[#040815] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-350 focus:border-cyan-500 outline-none"
                    >
                      <option value="professional">Professional SLA</option>
                      <option value="casual">Casual conversational</option>
                      <option value="poetic">Poetic Slate</option>
                    </select>
                  </div>
                )}

                {activeNode.type === "explainer" && (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-slate-500">Language</label>
                      <select
                        value={activeNode.config.language || "typescript"}
                        onChange={e => updateNodeConfig("language", e.target.value)}
                        className="w-full bg-[#040815] border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-300 focus:border-cyan-500 outline-none"
                      >
                        <option value="typescript">TypeScript</option>
                        <option value="javascript">JavaScript</option>
                        <option value="go">Go Logic</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-slate-500">Depth</label>
                      <select
                        value={activeNode.config.depth || "deep-dive"}
                        onChange={e => updateNodeConfig("depth", e.target.value)}
                        className="w-full bg-[#040815] border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-300 focus:border-cyan-500 outline-none"
                      >
                        <option value="high-level">High-level review</option>
                        <option value="deep-dive">Deep-dive analysis</option>
                      </select>
                    </div>
                  </div>
                )}

                {activeNode.type === "pdf-search" && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-500">Automated Q&A Target Prompt</label>
                    <input
                      type="text"
                      value={activeNode.config.query || ""}
                      onChange={e => updateNodeConfig("query", e.target.value)}
                      className="w-full bg-[#040815] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:border-cyan-500 outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Node runtime outputs indicator */}
              <div className="space-y-1 pt-2">
                <span className="text-[10px] font-bold font-mono tracking-wider text-slate-500 uppercase block">Runtime Outputs inspection</span>
                <div className="bg-[#030610] border border-slate-850 p-2.5 h-44 rounded-lg overflow-y-auto text-[10px] font-mono text-slate-400 select-text leading-relaxed whitespace-pre-wrap relative">
                  {activeNode.output ? (
                    activeNode.output
                  ) : (
                    <span className="text-slate-650 flex items-center justify-center h-full text-[9px]">No runtime data indexed yet. Run the flow to populate.</span>
                  )}
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-[#0a0f1e] border border-slate-800 rounded-xl p-6 text-center text-slate-600 font-mono text-[11px]">
              Select a stage node inside canvas map to review configuration.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
