import React, { useState, useEffect } from "react";
import { Layers, Plus, Trash2, Folder, Check, FolderOpen, Calendar, Shield, Sparkles, BookOpen, Layers as WorkflowIcon, Users, UserPlus, ShieldAlert, ShieldCheck, Mail } from "lucide-react";
import { Workspace, UserProfile } from "../types";

interface WorkspacesProps {
  user: UserProfile | null;
  activeWorkspaceId: string | null;
  onSelectWorkspace: (id: string | null) => void;
  onSetStatus: (msg: string | null) => void;
}

interface TeamMember {
  id: string;
  email: string;
  role: "Owner" | "Editor" | "Viewer";
  status: "active" | "invited";
  joinedAt: string;
}

export default function Workspaces({ user, activeWorkspaceId, onSelectWorkspace, onSetStatus }: WorkspacesProps) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [creating, setCreating] = useState<boolean>(false);

  // Participant members listed per workspace to show SaaS enterprise collaboration
  const [members, setMembers] = useState<Record<string, TeamMember[]>>({
    "ws-default": [
      { id: "mem-1", email: user?.email || "developer@aistudio-toolkit.internal", role: "Owner", status: "active", joinedAt: "2026-05-10" },
      { id: "mem-2", email: "clara.ai@company.internal", role: "Editor", status: "active", joinedAt: "2026-05-11" },
      { id: "mem-3", email: "auditor@sla-council.org", role: "Viewer", status: "invited", joinedAt: "2026-06-01" },
    ],
    "ws-sla": [
      { id: "mem-4", email: user?.email || "developer@aistudio-toolkit.internal", role: "Owner", status: "active", joinedAt: "2026-05-10" },
      { id: "mem-5", email: "chief-compliance@company.internal", role: "Editor", status: "active", joinedAt: "2026-05-15" },
    ]
  });

  // Invitation input states
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"Owner" | "Editor" | "Viewer">("Viewer");

  // Simple statistics counts for visual dashboard flair
  const [stats, setStats] = useState<Record<string, { prompts: number, kbs: number, flows: number }>>({});

  const userId = user?.id || "guest";

  const fetchWorkspaces = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/workspaces/${userId}`);
      if (!res.ok) throw new Error("Could not load workspaces list");
      const data = await res.json();
      setWorkspaces(data.workspaces || []);

      const statsObj: Record<string, { prompts: number, kbs: number, flows: number }> = {
        "ws-default": { prompts: 3, kbs: 1, flows: 2 },
        "ws-sla": { prompts: 2, kbs: 2, flows: 1 }
      };
      setStats(statsObj);
    } catch (e) {
      console.error(e);
      onSetStatus("Failed to synchronize project workspaces.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, [userId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      setCreating(true);
      const res = await fetch("/api/workspaces/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          name: name.trim(),
          description: description.trim()
        })
      });

      if (!res.ok) throw new Error("Workspace creation failed");
      
      const data = await res.json();
      
      // Initialize dynamic members for the new workspace
      const newWorkspaceId = data.workspace.id;
      setMembers(prev => ({
        ...prev,
        [newWorkspaceId]: [
          { id: `mem-${Math.random()}`, email: user?.email || "developer@aistudio-toolkit.internal", role: "Owner", status: "active", joinedAt: new Date().toISOString().split("T")[0] }
        ]
      }));

      onSetStatus(`Workspace "${data.workspace.name}" created successfully!`);
      setName("");
      setDescription("");
      await fetchWorkspaces();
      
      // Auto-activate the newly created workspace
      onSelectWorkspace(data.workspace.id);

      setTimeout(() => onSetStatus(null), 2500);
    } catch (err: any) {
      onSetStatus(`Error: ${err.message}`);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (id === "ws-default") {
      alert("The standard General Workspace is a core platform default and cannot be deleted.");
      return;
    }
    if (!confirm("Are you sure you want to delete this workspace? Resources associated with it will remain, but their workspace binding will be reset.")) return;
    
    try {
      const res = await fetch(`/api/workspaces/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Deletion failed");
      
      onSetStatus("Workspace deleted.");
      if (activeWorkspaceId === id) {
        onSelectWorkspace("ws-default");
      }
      await fetchWorkspaces();
      setTimeout(() => onSetStatus(null), 2000);
    } catch (err: any) {
      onSetStatus(`Error: ${err.message}`);
    }
  };

  // Invite user simulation
  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !activeWorkspaceId) return;

    const newMember: TeamMember = {
      id: `mem-${Math.random().toString(36).substr(2, 5)}`,
      email: inviteEmail.trim(),
      role: inviteRole,
      status: "invited",
      joinedAt: new Date().toISOString().split("T")[0]
    };

    setMembers(prev => ({
      ...prev,
      [activeWorkspaceId]: [...(prev[activeWorkspaceId] || []), newMember]
    }));

    onSetStatus(`Collaborative invitation sent to ${inviteEmail}!`);
    setInviteEmail("");
    
    setTimeout(() => onSetStatus(null), 2000);
  };

  const handleRemoveMember = (memberId: string) => {
    if (!activeWorkspaceId) return;
    const list = members[activeWorkspaceId] || [];
    const target = list.find(m => m.id === memberId);
    if (target?.role === "Owner") {
      alert("Cannot remove workspace Owner role.");
      return;
    }

    setMembers(prev => ({
      ...prev,
      [activeWorkspaceId]: (prev[activeWorkspaceId] || []).filter(m => m.id !== memberId)
    }));
    onSetStatus("Workspace team access revoked.");
    setTimeout(() => onSetStatus(null), 1500);
  };

  const activeSpaceName = workspaces.find(w => w.id === activeWorkspaceId)?.name || "General Sandbox";
  const activeMembersList = activeWorkspaceId ? members[activeWorkspaceId] || [] : [];

  return (
    <div id="workspaces_setup_layout" className="space-y-6 animate-fade-in">
      
      {/* Header section with description */}
      <div className="border-b border-slate-800 pb-5">
        <h2 className="text-xl font-bold text-white font-sans flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-400" />
          Workspace Context Engine
        </h2>
        <p className="text-slate-400 text-xs mt-1">
          Partition blueprints, semantic document blocks, prompt clusters, agents, and generative testing logs into secure isolated workspaces with granular member controls.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Creation panel on the left */}
        <div className="lg:col-span-4 bg-[#0a0f1e] border border-slate-800 rounded-xl p-5 h-fit space-y-4">
          <span className="text-[10px] font-bold font-mono tracking-wider text-indigo-400 uppercase block">Create Workspace</span>
          
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-500">Workspace Label</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. AI Research Pipeline"
                className="w-full bg-[#040815] border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-500">Workspace Core Mission / Description</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                placeholder="Briefly summarize the goal or project scope of this workspace segment..."
                className="w-full bg-[#040815] border border-slate-800 rounded-lg p-2.5 text-xs text-slate-300 outline-none focus:border-indigo-500 transition-colors leading-relaxed"
              />
            </div>

            <button
              type="submit"
              disabled={creating || !name.trim()}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-indigo-500/10 shadow-lg shadow-indigo-600/10 outline-none select-none"
            >
              <Plus className="w-4 h-4" />
              <span>{creating ? "Spinning Workspace..." : "Create New Workspace"}</span>
            </button>
          </form>
        </div>

        {/* Existing workspaces list on the right */}
        <div className="lg:col-span-8 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold font-mono tracking-wider text-slate-400 uppercase">Available Workspace Domains</span>
              
              <button
                onClick={() => onSelectWorkspace(null)}
                className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold border transition-all select-none cursor-pointer outline-none ${
                  activeWorkspaceId === null
                    ? "bg-indigo-500/15 border-indigo-500/40 text-indigo-400"
                    : "bg-transparent border-slate-800 text-slate-500 hover:text-white"
                }`}
              >
                🌐 Show All Workspaces Content Mixed
              </button>
            </div>

            {loading ? (
              <div className="p-12 text-center text-xs font-mono text-slate-600">
                Querying platform workspace databases...
              </div>
            ) : workspaces.length === 0 ? (
              <div className="p-12 border border-dashed border-slate-800 rounded-xl text-center text-slate-500 text-xs">
                No project workspaces found. Use the creation sidebar to spin one up!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {workspaces.map(ws => {
                  const isActive = activeWorkspaceId === ws.id;
                  const nodeStats = stats[ws.id] || { prompts: 0, kbs: 0, flows: 0 };
                  const memberCount = (members[ws.id] || []).length;
                  
                  return (
                    <div
                      key={ws.id}
                      onClick={() => onSelectWorkspace(ws.id)}
                      className={`relative border rounded-xl p-4 cursor-pointer flex flex-col justify-between min-h-[160px] transition-all hover:bg-slate-900/20 group ${
                        isActive 
                          ? "border-indigo-500 bg-indigo-950/10 shadow-md shadow-indigo-500/5 text-white" 
                          : "border-slate-800 bg-[#0a0f1e]/40 text-slate-350"
                      }`}
                    >
                      <div>
                        {/* Top Header Row of Workspace Card */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded-lg border ${
                              isActive ? "bg-indigo-500/10 border-indigo-500/40 text-indigo-400" : "bg-slate-900 border-slate-800 text-slate-500"
                            }`}>
                              {isActive ? <FolderOpen className="w-4 h-4" /> : <Folder className="w-4 h-4" />}
                            </div>
                            <h3 className="text-xs font-bold font-sans tracking-tight leading-tight max-w-[140px] truncate group-hover:text-white transition-colors">
                              {ws.name}
                            </h3>
                          </div>

                          {isActive && (
                            <span className="text-[8px] font-mono uppercase bg-indigo-500/20 border border-indigo-500/30 px-1.5 py-0.5 rounded text-indigo-400 font-bold flex items-center gap-0.5 whitespace-nowrap">
                              <Check className="w-3 h-3 text-indigo-400" /> Active Context
                            </span>
                          )}
                        </div>

                        {/* Main Workspace Description */}
                        <p className="text-[11px] text-slate-400 mt-3.5 leading-relaxed line-clamp-2">
                          {ws.description || "No core mission statement configured."}
                        </p>
                      </div>

                      {/* Footer Row containing metadata stats & actions */}
                      <div className="border-t border-slate-850 pt-3 mt-4 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500">
                          <span className="flex items-center gap-0.5" title="Associated Prompt Rules">
                            <Sparkles className="w-3 h-3 text-cyan-400" /> {nodeStats.prompts}
                          </span>
                          <span className="w-1 h-1 rounded-full bg-slate-800" />
                          <span className="flex items-center gap-0.5" title="Indexed Knowledge Bases">
                            <BookOpen className="w-3 h-3 text-emerald-400" /> {nodeStats.kbs}
                          </span>
                          <span className="w-1 h-1 rounded-full bg-slate-800" />
                          <span className="flex items-center gap-0.5" title="Saved Pipelines">
                            <WorkflowIcon className="w-3 h-3 text-indigo-400" /> {nodeStats.flows}
                          </span>
                          <span className="w-1 h-1 rounded-full bg-slate-800" />
                          <span className="flex items-center gap-0.5 text-indigo-350" title="Workspace Members Count">
                            <Users className="w-3 h-3" /> {memberCount || 1}
                          </span>
                        </div>

                        {ws.id !== "ws-default" && (
                          <button
                            onClick={(e) => handleDelete(ws.id, e)}
                            className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/10 text-slate-600 hover:text-red-400 rounded-lg transition-all outline-none border border-transparent hover:border-red-500/10"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* SaaS Core Feature: Collaborative Workspace Members */}
          {activeWorkspaceId && (
            <div className="border border-slate-800 rounded-xl bg-[#0a0f1e]/80 p-5 space-y-4 animate-slide-up">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-850 pb-3">
                <div>
                  <h3 className="text-xs font-bold text-white font-sans flex items-center gap-1.5 uppercase tracking-wide">
                    <Users className="w-4 h-4 text-indigo-450" />
                    Members & Roles: {activeSpaceName}
                  </h3>
                  <p className="text-slate-500 text-[10px] font-mono mt-0.5">
                    Configure granular read/write sharing permissions across prompts, agents, and pipelines.
                  </p>
                </div>
                
                {/* Visual role indicator */}
                <div className="flex items-center gap-2 text-[10px] font-mono">
                  <span className="flex items-center gap-1 text-indigo-400">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Role: Admin/Owner Engaged
                  </span>
                </div>
              </div>

              {/* Members List Table */}
              <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                {activeMembersList.map((m) => (
                  <div key={m.id} className="flex items-center justify-between p-2.5 bg-[#040815] border border-slate-850 rounded-lg text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-400">
                        {m.email.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-white font-semibold truncate leading-tight">{m.email}</p>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">Joined: {m.joinedAt}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono uppercase tracking-wider ${
                        m.role === "Owner" ? "bg-amber-500/10 text-amber-450 border border-amber-500/20" :
                        m.role === "Editor" ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" :
                        "bg-slate-900 text-slate-400 border border-slate-850"
                      }`}>
                        {m.role}
                      </span>

                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase ${
                        m.status === "active" ? "text-emerald-450 bg-emerald-950/20" : "text-slate-550 bg-slate-900 animate-pulse"
                      }`}>
                        {m.status}
                      </span>

                      {m.role !== "Owner" && (
                        <button
                          onClick={() => handleRemoveMember(m.id)}
                          className="p-1 hover:bg-slate-850 text-slate-500 hover:text-red-400 rounded transition"
                          title="Revoke access"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Invite Form */}
              <form onSubmit={handleInvite} className="pt-2 border-t border-slate-850 flex flex-col md:flex-row items-center gap-3">
                <div className="relative w-full md:flex-1">
                  <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-550" />
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    placeholder="teammate@company.com"
                    className="w-full bg-[#040815] pl-8 pr-3 py-1.5 border border-slate-850 rounded-lg text-xs text-white focus:border-indigo-500 outline-none"
                  />
                </div>

                <div className="w-full md:w-36 shrink-0">
                  <select
                    value={inviteRole}
                    onChange={e => setInviteRole(e.target.value as any)}
                    className="w-full bg-[#040815] border border-slate-850 rounded-lg px-2 py-1.5 text-xs text-slate-300 outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="Viewer">Viewer (Read-Only)</option>
                    <option value="Editor">Editor (Write)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={!inviteEmail.trim()}
                  className="w-full md:w-auto px-4 py-1.5 bg-indigo-650 hover:bg-indigo-650/90 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 cursor-pointer outline-none select-none shrink-0"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Send Invite</span>
                </button>
              </form>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
