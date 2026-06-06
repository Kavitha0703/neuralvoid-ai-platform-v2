import React, { useState, useEffect, useRef } from "react";
import { Sparkles, MessageSquare, Play, Plus, Trash2, ArrowRight, User, HelpCircle, HardDrive, CheckCircle, Send, Badge, ShieldAlert } from "lucide-react";
import { CustomAgent, KnowledgeBase, UserProfile, UsageRecord } from "../types";
import { Skeleton } from "./Skeleton";

interface AgentsProps {
  user: UserProfile | null;
  onAddLog: (newRec: UsageRecord) => void;
  onSetStatus: (msg: string | null) => void;
  activeWorkspaceId: string | null;
}

interface ChatHistoryMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: string;
}

export default function Agents({ user, onAddLog, onSetStatus, activeWorkspaceId }: AgentsProps) {
  const [agents, setAgents] = useState<CustomAgent[]>([]);
  const [kbs, setKbs] = useState<KnowledgeBase[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null);

  // Form states for creating/editing agents
  const [agentId, setAgentId] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [instructions, setInstructions] = useState<string>("");
  const [kbId, setKbId] = useState<string>("");
  const [model, setModel] = useState<string>("gemini-3.5-flash");
  const [avatarEmoji, setAvatarEmoji] = useState<string>("🤖");

  // Live Sandbox chat panel states
  const [chatMessage, setChatMessage] = useState<string>("");
  const [chatHistory, setChatHistory] = useState<Record<string, ChatHistoryMessage[]>>({});
  const [chatPending, setChatPending] = useState<boolean>(false);

  // UI status helpers
  const [saving, setSaving] = useState<boolean>(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const userId = user?.id || "guest";

  const loadData = async () => {
    try {
      setLoading(true);

      // Fetch custom agents list
      const agentsRes = await fetch(`/api/agents/${userId}`);
      if (!agentsRes.ok) throw new Error("Could not fetch Custom Agents system.");
      const agentsData = await agentsRes.json();
      const loadedAgents: CustomAgent[] = agentsData.agents || [];
      
      // Fetch knowledge bases for the association dropdown SELECT parameter
      const kbRes = await fetch(`/api/knowledge-bases/${userId}`);
      if (!kbRes.ok) throw new Error("Could not fetch Knowledge Bases matrix.");
      const kbData = await kbRes.json();
      const loadedKbsByWorkspace: KnowledgeBase[] = kbData.knowledgeBases || [];

      // Filter knowledge bases by active workspace to support sandbox contexts
      const filteredKbs = activeWorkspaceId 
        ? loadedKbsByWorkspace.filter(k => k.workspaceId === activeWorkspaceId)
        : loadedKbsByWorkspace;

      setKbs(filteredKbs);

      // Filter agents list by active workspace
      const filteredAgents = activeWorkspaceId
        ? loadedAgents.filter(a => a.workspaceId === activeWorkspaceId || !a.workspaceId)
        : loadedAgents;

      setAgents(filteredAgents);

      // Set initial agent highlights
      if (filteredAgents.length > 0 && !activeAgentId) {
        editAndInspectAgent(filteredAgents[0]);
      } else if (filteredAgents.length === 0) {
        resetAgentForm();
      }
    } catch (e) {
      console.error(e);
      onSetStatus("Failed to synchronize Custom AI Agents matrix.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [userId, activeWorkspaceId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory, activeAgentId]);

  const editAndInspectAgent = (agent: CustomAgent) => {
    setActiveAgentId(agent.id);
    setAgentId(agent.id);
    setName(agent.name);
    setInstructions(agent.instructions);
    setKbId(agent.kbId || "");
    setModel(agent.model);
    setAvatarEmoji(agent.avatarEmoji);
  };

  const resetAgentForm = () => {
    setAgentId("");
    setName("");
    setInstructions("");
    setKbId("");
    setModel("gemini-3.5-flash");
    setAvatarEmoji("🤖");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !instructions.trim()) return;

    try {
      setSaving(true);
      onSetStatus("Persisting Custom GPT-Agent configuration...");
      
      const payload = {
        id: agentId || undefined,
        userId,
        name: name.trim(),
        instructions: instructions.trim(),
        kbId: kbId || undefined,
        model,
        avatarEmoji,
        workspaceId: activeWorkspaceId || "ws-default"
      };

      const res = await fetch("/api/agents/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Agent storage operation failed.");
      const data = await res.json();
      
      onSetStatus(`Agent "${data.agent.name}" persisted successfully!`);
      await loadData();
      
      // Highlight the saved/updated agent
      editAndInspectAgent(data.agent);

      setTimeout(() => onSetStatus(null), 2500);
    } catch (err: any) {
      console.error(err);
      onSetStatus(`Failed to persist: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to retire this Custom Assistant? This cannot be undone.")) return;
    
    try {
      const res = await fetch(`/api/agents/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Retirement service failed.");
      
      onSetStatus("Custom AI Agent deleted.");
      if (activeAgentId === id) {
        setActiveAgentId(null);
        resetAgentForm();
      }
      await loadData();
      setTimeout(() => onSetStatus(null), 2000);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAgentId || !chatMessage.trim() || chatPending) return;

    const currentAgent = agents.find(a => a.id === activeAgentId);
    if (!currentAgent) return;

    const userTurnText = chatMessage.trim();
    setChatMessage("");

    const activeAgentHistory = chatHistory[activeAgentId] || [];
    const userMessageObj: ChatHistoryMessage = {
      id: `chat-${Math.random().toString(36).substr(2, 9)}`,
      sender: "user",
      text: userTurnText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    const nextHistory = [...activeAgentHistory, userMessageObj];
    setChatHistory(prev => ({
      ...prev,
      [activeAgentId]: nextHistory
    }));

    try {
      setChatPending(true);

      const res = await fetch("/api/agents/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: activeAgentId,
          message: userTurnText,
          chatHistory: activeAgentHistory, // Carry historical rounds for contextual turn management,
          customKey: user?.customGeminiKey,
          userId
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Agent sandbox communication channel experienced an error.");

      const assistantMessageObj: ChatHistoryMessage = {
        id: `chat-${Math.random().toString(36).substr(2, 9)}`,
        sender: "assistant",
        text: data.text,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };

      setChatHistory(prev => ({
        ...prev,
        [activeAgentId]: [...nextHistory, assistantMessageObj]
      }));

      // Add to audit activities logs list
      onAddLog({
        id: `log-${Math.random().toString(36).substr(2, 9)}`,
        userId,
        timestamp: new Date().toISOString(),
        tool: "Text Generator",
        prompt: `Agent Chat [${currentAgent.name}]: ${userTurnText.slice(0, 40)}`,
        status: "success",
        durationMs: 1200,
        tokensUsed: Math.round(userTurnText.length / 4 + data.text.length / 4),
        estimatedCost: 0.0003,
        modelUsed: currentAgent.model
      });

    } catch (err: any) {
      console.error(err);
      const errorMessageObj: ChatHistoryMessage = {
        id: `chat-err-${Math.random().toString(36).substr(2, 9)}`,
        sender: "assistant",
        text: `⚠️ Platform Connection Failure: ${err.message}`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };
      setChatHistory(prev => ({
        ...prev,
        [activeAgentId]: [...nextHistory, errorMessageObj]
      }));
    } finally {
      setChatPending(false);
    }
  };

  const activeHistory = activeAgentId ? chatHistory[activeAgentId] || [] : [];
  const selectedAgent = agents.find(a => a.id === activeAgentId);

  return (
    <div id="ai_agents_orchestration" className="space-y-6">
      
      {/* Platform Title Banner */}
      <div className="border-b border-slate-800 pb-5">
        <h2 className="text-xl font-bold text-white font-sans flex items-center gap-2">
          <MessageSquare className="text-cyan-400 w-5 h-5" />
          Autonomous Developer GPT-Agents
        </h2>
        <p className="text-slate-400 text-xs mt-1">
          Compose custom target personas configured with distinct System Instructions, tied contextually to targeted semantic Knowledge Bases for auto-RAG execution.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Sidebar catalogue directory */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-[#0a0f1e] border border-slate-800 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold font-mono tracking-wider text-slate-400 uppercase">Agents Directory</span>
              <button
                onClick={resetAgentForm}
                className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 font-bold outline-none flex items-center gap-1 cursor-pointer select-none"
              >
                + New Asset
              </button>
            </div>

            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : agents.length === 0 ? (
              <p className="text-[10px] text-slate-600 font-mono text-center py-6">No custom agents found.</p>
            ) : (
              <div className="space-y-2 max-h-[350px] overflow-y-auto">
                {agents.map(a => (
                  <div
                    key={a.id}
                    onClick={() => editAndInspectAgent(a)}
                    className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all flex items-center justify-between gap-2.5 ${
                      activeAgentId === a.id
                        ? "bg-cyan-500/15 border-cyan-500/40 text-cyan-400"
                        : "bg-slate-900/40 border-slate-850 text-slate-400 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="text-base shrink-0">{a.avatarEmoji || "🤖"}</span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate leading-none">{a.name}</p>
                        <span className="text-[9px] font-mono text-slate-500 block mt-1 uppercase truncate">{a.model}</span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDelete(a.id, e)}
                      className="text-slate-600 hover:text-red-400 p-0.5 outline-none hover:bg-slate-850 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Configuration core inputs */}
        <div className="lg:col-span-5 bg-[#0a0f1e] border border-slate-800 rounded-xl p-5 space-y-4">
          <span className="text-[10px] font-bold font-mono tracking-wider text-slate-450 uppercase block">
            {agentId ? "Inspect & Refine Persona Settings" : "Configure AI Persona Instance"}
          </span>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-10 space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-500">Agent Label Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. SLA Audit Guru"
                  className="w-full bg-[#040815] border border-slate-850 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-cyan-500 outline-none"
                />
              </div>

              <div className="col-span-2 space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-500">Avatar</label>
                <select
                  value={avatarEmoji}
                  onChange={e => setAvatarEmoji(e.target.value)}
                  className="w-full bg-[#040815] border border-slate-850 rounded-lg px-2.5 py-1.5 text-xs text-center text-white focus:border-cyan-500 outline-none cursor-pointer"
                >
                  {["🤖", "🔍", "⚡", "⚖️", "🚀", "🧑‍💻", "⚙️", "📚", "📋"].map(emo => (
                    <option key={emo} value={emo}>{emo}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-500">Persona Role System Instruction</label>
              <textarea
                required
                value={instructions}
                onChange={e => setInstructions(e.target.value)}
                rows={5}
                placeholder="Examine the system conditions: 'Highlight missed SLAs...' 'Structure outcomes in detailed checklists...'"
                className="w-full bg-[#040815] border border-slate-850 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-cyan-500 leading-relaxed font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-500">Model Engine</label>
                <select
                  value={model}
                  onChange={e => setModel(e.target.value)}
                  className="w-full bg-[#040815] border border-slate-850 rounded-lg px-2 py-1.5 text-xs text-slate-300 focus:border-cyan-500 outline-none"
                >
                  <option value="gemini-3.5-flash">Gemini 3.5 Flash</option>
                  <option value="gemini-Pro">Gemini 3.5 Pro</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-500">Retrieve Context Resource</label>
                <select
                  value={kbId}
                  onChange={e => setKbId(e.target.value)}
                  className="w-full bg-[#040815] border border-slate-850 rounded-lg px-2 py-1.5 text-xs text-slate-300 focus:border-cyan-500 outline-none"
                >
                  <option value="">-- No Document context --</option>
                  {kbs.map(k => (
                    <option key={k.id} value={k.id}>{k.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving || !name.trim() || !instructions.trim()}
              className="w-full py-2 bg-slate-900 hover:bg-slate-850 disabled:bg-slate-950 text-cyan-400 border border-slate-800 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer outline-none select-none"
            >
              <HardDrive className="w-4 h-4" />
              <span>{saving ? "Persisting to Platform..." : agentId ? "Commit Changes" : "Deploy Custom Agent"}</span>
            </button>
          </form>

          {kbId && (
            <div className="bg-[#050b16] border border-emerald-950 p-2.5 rounded-lg flex items-start gap-2">
              <HelpCircle className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
              <p className="text-[10px] text-slate-500 font-mono">
                💡 Currently bound to the knowledge book index. Queries inside the testing playground will reference document assets from that collection in real time!
              </p>
            </div>
          )}
        </div>

        {/* Dynamic Sandbox testing sandbox panel */}
        <div className="lg:col-span-4 flex flex-col h-[520px] bg-[#050814] border border-slate-800 rounded-xl overflow-hidden">
          
          {/* Header */}
          <div className="bg-[#0a0f1e] border-b border-slate-850 px-4 py-3 shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">{selectedAgent?.avatarEmoji || "🤖"}</span>
              <div>
                <p className="text-xs font-bold text-white tracking-tight">
                  {selectedAgent?.name || "Agent Playground Sandbox"}
                </p>
                <p className="text-[9px] font-mono text-slate-550">
                  {selectedAgent ? `Interactive turn testing (${selectedAgent.model})` : "Configure an agent to begin"}
                </p>
              </div>
            </div>
          </div>

          {/* Chat Container */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin">
            {!selectedAgent ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
                <User className="w-8 h-8 text-slate-700" />
                <p className="text-xs font-mono text-slate-500">Pick or deploy an agent to activate the testing console.</p>
              </div>
            ) : activeHistory.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
                <MessageSquare className="w-6 h-6 text-cyan-400/20" />
                <p className="text-xs font-mono text-slate-500">Ask a question to test their customized expertise.</p>
              </div>
            ) : (
              activeHistory.map((h) => {
                const isUser = h.sender === "user";
                return (
                  <div
                    key={h.id}
                    className={`flex flex-col max-w-[85%] ${
                      isUser ? "ml-auto items-end" : "mr-auto items-start"
                    }`}
                  >
                    <div
                      className={`p-3 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap select-text ${
                        isUser
                          ? "bg-cyan-600/10 border border-cyan-500/20 text-white rounded-br-none"
                          : "bg-slate-900 border border-slate-850 text-slate-200 rounded-bl-none font-sans"
                      }`}
                    >
                      {h.text}
                    </div>
                    <span className="text-[8px] font-mono text-slate-650 mt-1 block">
                      {h.timestamp}
                    </span>
                  </div>
                );
              })
            )}

            {chatPending && (
              <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-900/60 border border-slate-850/40 w-fit max-w-[80%] animate-pulse">
                <span className="text-xs">🌀</span>
                <span className="text-[10px] font-mono text-cyan-400">Assistant is reviewing context...</span>
              </div>
            )}
          </div>

          {/* Chat Input Turn */}
          <div className="bg-[#0a0f1e] border-t border-slate-850 p-3 shrink-0">
            <form onSubmit={handleSendChatMessage} className="flex gap-2">
              <input
                type="text"
                disabled={!selectedAgent || chatPending}
                required
                value={chatMessage}
                onChange={e => setChatMessage(e.target.value)}
                placeholder={selectedAgent ? "Ask anything..." : "Sandbox is disabled"}
                className="flex-1 bg-[#040815] border border-slate-850 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:border-cyan-500 outline-none disabled:opacity-40"
              />
              <button
                type="submit"
                disabled={!selectedAgent || chatPending || !chatMessage.trim()}
                className="px-3.5 py-1.5 bg-cyan-600 text-white rounded-lg text-xs font-bold hover:bg-cyan-500 disabled:bg-slate-800 transition-colors shrink-0 flex items-center justify-center stroke-current cursor-pointer outline-none select-none"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
}
