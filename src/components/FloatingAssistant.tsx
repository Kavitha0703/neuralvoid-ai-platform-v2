import React, { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, Sparkles, Loader2, Info, RotateCcw, ChevronLeft, Plus, MessageSquare, Search, Trash2, Edit3, Check } from "lucide-react";
import { UserProfile } from "../types";
import { formatTimeWithRelative } from "../utils";

interface FloatingAssistantProps {
  currentTab: string;
  user?: UserProfile | null;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

export default function FloatingAssistant({ currentTab, user }: FloatingAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  
  const getInitialGreeting = () => {
    return {
      role: "assistant" as const,
      content: "Hi there! I'm your NeuralVoid Copilot. How can I help you today?",
    };
  };

  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    if (user?.id) {
      const saved = localStorage.getItem(`copilot_sessions_${user.id}`);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch(e) {}
      }
    }
    return [];
  });

  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const activeSession = sessions.find((s) => s.id === activeSessionId) || null;
  const messages = activeSession ? activeSession.messages : [];

  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [editSessionId, setEditSessionId] = useState<string | null>(null);
  const [editSessionTitle, setEditSessionTitle] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (user?.id && sessions.length > 0) {
      localStorage.setItem(`copilot_sessions_${user.id}`, JSON.stringify(sessions));
    } else if (user?.id && sessions.length === 0) {
      localStorage.removeItem(`copilot_sessions_${user.id}`);
    }
  }, [sessions, user]);

  const updateSessionMessages = (updater: (prev: Message[]) => Message[]) => {
    setSessions((prev) => {
      // If we don't have an active session, implicitly create one
      if (!activeSessionId) return prev;
      
      const sessionIndex = prev.findIndex(s => s.id === activeSessionId);
      if (sessionIndex === -1) return prev;
      
      const updatedSessions = [...prev];
      const oldMessages = updatedSessions[sessionIndex].messages;
      const newMessages = updater(oldMessages);
      
      // Auto generate title on first user message
      let newTitle = updatedSessions[sessionIndex].title;
      if (newTitle === "New Chat" && oldMessages.length <= 1 && newMessages.length > 1) {
         const firstUserMsg = newMessages.find(m => m.role === 'user');
         if (firstUserMsg) {
             const words = firstUserMsg.content.split(' ').slice(0, 4).join(' ');
             newTitle = words.length > 0 ? (words + (firstUserMsg.content.length > words.length ? '...' : '')) : "Chat";
         }
      }
      
      updatedSessions[sessionIndex] = {
        ...updatedSessions[sessionIndex],
        messages: newMessages,
        title: newTitle,
        updatedAt: Date.now()
      };
      
      // Bubble to top
      const [active] = updatedSessions.splice(sessionIndex, 1);
      return [active, ...updatedSessions];
    });
  };

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: `chat_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      title: "New Chat",
      messages: [getInitialGreeting()],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    setSessions([newSession, ...sessions]);
    setActiveSessionId(newSession.id);
    setIsSidebarOpen(false);
  };

  const deleteSession = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSessions((prev) => prev.filter(s => s.id !== id));
    if (activeSessionId === id) setActiveSessionId(null);
  };

  const startEditTitle = (id: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditSessionId(id);
    setEditSessionTitle(currentTitle);
  };

  const saveEditTitle = (id: string) => {
    setSessions((prev) => prev.map(s => s.id === id ? { ...s, title: editSessionTitle } : s));
    setEditSessionId(null);
  };

  useEffect(() => {
    if (isOpen && activeSessionId && messages.length === 1) {
      if (currentTab === "workflows") {
        updateSessionMessages(prev => [...prev, {
          role: "assistant",
          content: "I see you're in the Workflow Builder. Do you need help adding nodes or running a workflow? If you have a failing workflow, I can help troubleshoot."
        }]);
      } else if (currentTab === "knowledge-bases") {
        updateSessionMessages(prev => [...prev, {
          role: "assistant",
          content: "You're in Knowledge Bases. I can help you understand how to upload PDFs and connect them to agents for Retrieval-Augmented Generation (RAG)."
        }]);
      } else if (currentTab === "agents") {
        updateSessionMessages(prev => [...prev, {
          role: "assistant",
          content: "Building an Agent? I can explain how to set system instructions or equip them with knowledge bases."
        }]);
      } else if (currentTab === "image-gen") {
        updateSessionMessages(prev => [...prev, {
          role: "assistant",
          content: "Welcome to the Vector SVG Art Compiler. Need help crafting a prompt for your custom graphics?"
        }]);
      }
    }
  }, [isOpen, currentTab, activeSessionId]);

  const handleReset = () => {
    if (activeSessionId) {
      updateSessionMessages(() => [getInitialGreeting()]);
    }
  };

  const executeAction = async (actionDef: any) => {
    const userId = user?.id || "guest";
    setIsTyping(true);
    let resultMsg = "Action completed successfully.";
    let navigateAfter = null;
    try {
      if (actionDef.action === "NAVIGATE") {
        window.dispatchEvent(new CustomEvent("copilot_navigate", { detail: actionDef.tab }));
        resultMsg = `Navigated to ${actionDef.tab}.`;
      } else if (actionDef.action === "CREATE_WORKSPACE") {
        await fetch("/api/workspaces/create", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, ...actionDef.payload })
        });
        resultMsg = `Workspace '${actionDef.payload.name}' created successfully.`;
        navigateAfter = "workspaces";
      } else if (actionDef.action === "CREATE_AGENT") {
        await fetch("/api/agents/create", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, ...actionDef.payload })
        });
        resultMsg = `Agent '${actionDef.payload.name}' created.`;
        navigateAfter = "agents";
      } else if (actionDef.action === "CREATE_WORKFLOW") {
        await fetch("/api/workflows/create", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, ...actionDef.payload, nodes: [], connections: [] })
        });
        resultMsg = `Workflow '${actionDef.payload.name}' created.`;
        navigateAfter = "workflows";
      } else if (actionDef.action === "CREATE_PROMPT") {
        await fetch("/api/prompts/create", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, ...actionDef.payload })
        });
        resultMsg = `Prompt '${actionDef.payload.title}' saved to Studio.`;
        navigateAfter = "prompts";
      }
      
      updateSessionMessages(prev => [...prev.filter(m => m !== prev[prev.length-1] || !(m as any).action), { role: "assistant", content: resultMsg }]);
      if (navigateAfter && currentTab !== navigateAfter) {
         setTimeout(() => {
           window.dispatchEvent(new CustomEvent("copilot_navigate", { detail: navigateAfter }));
         }, 1000);
      }
    } catch (e) {
      updateSessionMessages(prev => [...prev, { role: "assistant", content: "Sorry, I ran into an error performing that action." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSendText = async (text: string) => {
    if (!text.trim()) return;
    
    updateSessionMessages(prev => [...prev, { role: "user", content: text }]);
    setMessage("");
    setIsTyping(true);

    try {
      // Build workspace context
      let workspaceContext: any = {
        activeTab: currentTab,
        workspaceId: localStorage.getItem("toolkit_active_workspace_id") || "ws-default",
        userEmail: user?.email || "Unknown"
      };
      
      if (user?.id) {
        try {
          const wfsStr = localStorage.getItem(`toolkit_workflows_${user.id}`);
          const agsStr = localStorage.getItem(`toolkit_agents_${user.id}`);
          const histStr = localStorage.getItem(`toolkit_history_backup_${user.id}`);
          
          if (wfsStr) {
            const wfs = JSON.parse(wfsStr);
            workspaceContext.workflowsCount = wfs.length;
            workspaceContext.workflowsList = wfs.map((w: any) => ({
              id: w.id, name: w.name, edges: w.edges?.length || 0, nodes: w.nodes?.length || 0
            })).slice(0, 10);
          }
          if (agsStr) {
            const ags = JSON.parse(agsStr);
            workspaceContext.agentsCount = ags.length;
            workspaceContext.agentsList = ags.map((a: any) => ({
              id: a.id, name: a.name, model: a.model, kbId: a.knowledgeBaseId
            })).slice(0, 10);
          }
          
          if (histStr) {
            const hData = JSON.parse(histStr);
            workspaceContext.totalUsageRecords = hData.length;
            const totalCost = hData.reduce((acc: number, item: any) => acc + (item.cost || 0), 0);
            workspaceContext.totalEstimatedCost = `$${totalCost.toFixed(5)}`;
            // Aggregate cost by source
            const sourceCosts: Record<string, number> = {};
            hData.forEach((h: any) => {
              const src = h.source || 'Unknown';
              sourceCosts[src] = (sourceCosts[src] || 0) + (h.cost || 0);
            });
            workspaceContext.topCostSources = Object.entries(sourceCosts)
              .sort((a,b) => b[1] - a[1])
              .slice(0, 5)
              .map(([src, cost]) => `${src}: $${cost.toFixed(5)}`);
          }
        } catch (e) {
          // ignore parse errors
        }
      }

      const response = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          chatHistory: messages,
          currentTab,
          workspaceContext,
          customKey: user?.customGeminiKey
        })
      });

      const data = await response.json();
      
      if (data.success && data.text) {
        let msgText = data.text;
        let actionObj = null;
        
        // Parse special action block if present
        const match = msgText.match(/```json\s*(\{[\s\S]*?"action"\s*:[\s\S]*?\})\s*```/);
        if (match) {
          try {
            actionObj = JSON.parse(match[1]);
            msgText = msgText.replace(match[0], "").trim();
          } catch(e) {}
        }
        
        updateSessionMessages(prev => [...prev, { role: "assistant", content: msgText, action: actionObj }]);
      } else {
        updateSessionMessages(prev => [...prev, { role: "assistant", content: "Sorry, I encountered an error answering your request." }]);
      }
    } catch (err) {
      updateSessionMessages(prev => [...prev, { role: "assistant", content: "Connectivity issue: unable to reach the assistant server." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = () => {
    handleSendText(message);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Mobile background overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99] md:hidden" onClick={() => setIsOpen(false)} />
      )}
      
      {isOpen && (
        <div className="fixed inset-x-0 bottom-0 md:bottom-24 md:right-6 md:inset-x-auto z-[100] bg-[#0a0f1e] md:border border-slate-800 rounded-t-3xl md:rounded-b-3xl shadow-2xl w-full h-[90vh] md:h-auto md:w-80 lg:w-96 md:min-h-[500px] overflow-hidden flex flex-col transform transition-all duration-300 md:origin-bottom-right">
          
          {!activeSessionId ? (
             /* --- CHAT HISTORY VIEW --- */
             <>
               {/* Header */}
               <div className="bg-gradient-to-r from-indigo-900/50 to-blue-900/50 border-b border-slate-800 p-3 flex justify-between items-center text-white">
                 <div className="flex items-center gap-2">
                   <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center">
                     <Bot className="w-4 h-4 text-cyan-400" />
                   </div>
                   <div>
                     <div className="font-bold text-sm tracking-wide">NeuralVoid Copilot</div>
                     <div className="text-[10px] text-cyan-300 flex items-center gap-1">
                       <Sparkles className="w-3 h-3" /> System Helper
                     </div>
                   </div>
                 </div>
                 <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg transition" title="Close">
                   <X className="w-5 h-5" />
                 </button>
               </div>

               {/* History Content */}
               <div className="flex-1 overflow-y-auto p-4 custom-scrollbar flex flex-col gap-4">
                  <button onClick={createNewSession} className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-3 px-4 font-bold text-sm flex items-center justify-center gap-2 transition-colors">
                     <Plus className="w-4 h-4" /> New Chat
                  </button>
                  
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input 
                      type="text" 
                      placeholder="Search conversations..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 pl-9 pr-4 text-sm text-slate-200 outline-none focus:border-blue-500/50 transition-colors placeholder:text-slate-600"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 mt-2">
                     <div className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-500 mb-1 px-1">Recent Chats</div>
                     {sessions.filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase()) || s.messages.some(m => m.content.toLowerCase().includes(searchQuery.toLowerCase()))).length === 0 ? (
                        <div className="text-sm text-slate-600 text-center py-4 bg-slate-900/30 rounded-xl border border-slate-800/50">No conversations found</div>
                     ) : (
                       sessions.filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase()) || s.messages.some(m => m.content.toLowerCase().includes(searchQuery.toLowerCase()))).map(session => (
                         <div key={session.id} onClick={() => setActiveSessionId(session.id)} className="group flex items-center justify-between p-3 rounded-xl bg-slate-900/50 hover:bg-slate-800 border border-transparent hover:border-slate-700 cursor-pointer transition-all w-full text-left">
                            <div className="flex items-center gap-3 overflow-hidden">
                               <MessageSquare className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 shrink-0" />
                               {editSessionId === session.id ? (
                                  <div className="flex items-center gap-2 w-full" onClick={e => e.stopPropagation()}>
                                    <input 
                                      value={editSessionTitle} 
                                      onChange={(e) => setEditSessionTitle(e.target.value)} 
                                      onKeyDown={(e) => { if (e.key === 'Enter') saveEditTitle(session.id); }}
                                      className="bg-slate-950 text-sm text-white px-2 py-1 rounded border border-slate-700 outline-none w-full"
                                      autoFocus
                                    />
                                    <button onClick={() => saveEditTitle(session.id)} className="text-emerald-400 hover:text-emerald-300"><Check className="w-4 h-4" /></button>
                                  </div>
                               ) : (
                                  <div className="flex flex-col overflow-hidden">
                                    <h4 className="text-sm text-slate-200 font-medium truncate">{session.title}</h4>
                                    <span className="text-[10px] text-slate-500 truncate">{formatTimeWithRelative(session.updatedAt)}</span>
                                  </div>
                               )}
                            </div>
                            {editSessionId !== session.id && (
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={(e) => startEditTitle(session.id, session.title, e)} className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-700 rounded"><Edit3 className="w-3.5 h-3.5" /></button>
                                <button onClick={(e) => deleteSession(session.id, e)} className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                              </div>
                            )}
                         </div>
                       ))
                     )}
                  </div>
               </div>
             </>
          ) : (
             /* --- ACTIVE CHAT VIEW --- */
             <>
               {/* Header */}
               <div className="bg-gradient-to-r from-indigo-900/50 to-blue-900/50 border-b border-slate-800 p-3 flex justify-between items-center text-white">
                 <div className="flex items-center gap-2">
                   <button onClick={() => setActiveSessionId(null)} className="p-1.5 mr-1 hover:bg-slate-800 rounded-lg transition text-slate-400 hover:text-white"><ChevronLeft className="w-4 h-4" /></button>
                   <div className="flex flex-col">
                     <span className="font-bold text-sm tracking-wide line-clamp-1">{activeSession?.title || 'Chat'}</span>
                     <span className="text-[10px] text-cyan-300">Active Session</span>
                   </div>
                 </div>
                 <div className="flex">
                   <button 
                     onClick={handleReset}
                     className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg transition mr-1"
                     title="Reset Conversation"
                   >
                     <RotateCcw className="w-4 h-4" />
                   </button>
                   <button 
                     onClick={() => setIsOpen(false)}
                     className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg transition"
                     title="Close"
                   >
                     <X className="w-5 h-5" />
                   </button>
                 </div>
               </div>

          {/* Chat Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-xl p-3 text-sm flex gap-2 ${
                  msg.role === "user" 
                    ? "bg-cyan-600/20 text-cyan-50 border border-cyan-500/30 rounded-tr-sm" 
                    : "bg-slate-800/50 text-slate-200 border border-slate-700/50 rounded-tl-sm"
                }`}>
                  {msg.role === "assistant" && <Bot className="w-4 h-4 mt-0.5 shrink-0 text-cyan-400" />}
                  <div className="leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                    {msg.action && (
                      <div className="mt-3 border-t border-slate-700/50 pt-2">
                        <button
                          onClick={() => executeAction(msg.action)}
                          className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold font-mono transition-colors w-full tracking-wide shadow-md shadow-cyan-500/20"
                        >
                          Execute: {
                            msg.action.action === "NAVIGATE" ? `Go to ${msg.action.tab}` :
                            msg.action.action === "CREATE_AGENT" ? `Create Agent` :
                            msg.action.action === "CREATE_WORKFLOW" ? `Create Workflow` :
                            msg.action.action === "CREATE_PROMPT" ? `Save Prompt` :
                            msg.action.action === "CREATE_WORKSPACE" ? `Create Workspace` : "Confirm Action"
                          }
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-xl p-3 text-sm bg-slate-800/50 border border-slate-700/50 rounded-tl-sm flex items-center gap-2">
                  <Bot className="w-4 h-4 text-cyan-400" />
                  <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Default prompt chips */}
          {messages.length <= 2 && (
            <div className="px-4 pb-2 flex flex-wrap gap-2">
              {(currentTab === "workflows" 
                ? ['How do workflows work?', 'Why is my workflow failing?', 'How do I add nodes?']
                : currentTab === "image-gen"
                ? ['🚀 Futuristic rocket logo', '🌿 Minimal eco-friendly leaf emblem', 'How does the SVG compiler work?']
                : currentTab === "settings"
                ? ['Which workflow costs me the most?', 'How do I create an API key?', 'Show my current API usage']
                : currentTab === "knowledge-bases"
                ? ['Explain Knowledge Bases', 'What is RAG?', 'How do I connect a KB to an agent?']
                : ['How do workflows work?', 'Explain Knowledge Bases', 'Which workflow costs me the most?']).map((chip, i) => (
                <button
                  key={i}
                  onClick={() => handleSendText(chip)}
                  className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1.5 rounded-full border border-slate-700 transition"
                >
                  {chip}
                </button>
              ))}
            </div>
          )}

          {/* Input Area */}
          <div className="p-3 border-t border-slate-800 bg-[#070b16]">
            <div className="relative flex items-center">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about NeuralVoid..."
                className="w-full bg-[#0a0f1e] text-sm text-white placeholder-slate-500 rounded-xl px-4 py-2.5 pr-10 border border-slate-800 focus:border-cyan-500/50 focus:outline-none transition-colors shadow-inner"
              />
              <button 
                onClick={handleSend}
                disabled={!message.trim()}
                className="absolute right-2 p-1.5 rounded-lg text-cyan-500 hover:bg-cyan-500/10 disabled:opacity-50 disabled:hover:bg-transparent transition"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}
      </div>
      )}

      <div className="fixed bottom-6 right-6 z-[100]">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="h-14 md:h-12 w-14 md:w-auto px-0 md:px-4 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white rounded-full shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 hover:scale-105 transition-all duration-300 font-medium text-sm border border-cyan-400/30 outline-none"
        >
          {isOpen ? <X className="w-6 h-6 md:w-5 md:h-5" /> : (
            <>
              <MessageCircle className="w-6 h-6 md:w-5 md:h-5" />
              <span className="hidden md:inline">Help</span>
            </>
          )}
        </button>
      </div>
    </>
  );
}
