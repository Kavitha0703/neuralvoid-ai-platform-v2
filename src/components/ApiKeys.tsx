import React, { useState, useEffect } from "react";
import { Key, Plus, Trash2, Copy, Check, Shield, AlertTriangle, HelpCircle, Eye, EyeOff, Activity, Clock } from "lucide-react";
import { ApiKeyRecord } from "../types";
import { formatTimeWithRelative } from "../utils";

interface ApiKeysProps {
  userId: string;
}

export default function ApiKeys({ userId }: ApiKeysProps) {
  // Read existing keys from localStorage specific to this developer profile
  const [keys, setKeys] = useState<ApiKeyRecord[]>(() => {
    const saved = localStorage.getItem(`developer_api_keys_${userId}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    // Prefeed a default active live credential
    return [
      {
        id: "key-1",
        key: `nv_live_${Math.random().toString(36).substr(2, 24)}`,
        createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
        status: "active" as const,
        hits: 142,
        lastUsed: new Date(Date.now() - 600000).toISOString(),
      },
    ];
  });

  const [newKeyLabel, setNewKeyLabel] = useState<string>("");
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  // Sync back to storage
  useEffect(() => {
    localStorage.setItem(`developer_api_keys_${userId}`, JSON.stringify(keys));
  }, [keys, userId]);

  const handleCreateKey = (e: React.FormEvent) => {
    e.preventDefault();
    const label = newKeyLabel.trim() || `Production Key ${keys.length + 1}`;
    
    const newRecord: ApiKeyRecord = {
      id: `key-${Math.random().toString(36).substr(2, 9)}`,
      key: `nv_live_${Math.random().toString(36).substr(2, 24)}`,
      createdAt: new Date().toISOString(),
      status: "active",
      hits: 0,
      lastUsed: "Never",
    };

    setKeys((prev) => [newRecord, ...prev]);
    setNewKeyLabel("");
  };

  const handleRevokeKey = (id: string) => {
    setKeys((prev) =>
      prev.map((k) => (k.id === id ? { ...k, status: "revoked" as const } : k))
    );
  };

  const handleCopyKey = (id: string, val: string) => {
    navigator.clipboard.writeText(val);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 1500);
  };

  const toggleShowKey = (id: string) => {
    setShowKeys((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Stats
  const activeCount = keys.filter((k) => k.status === "active").length;
  const totalCalls = keys.reduce((acc, curr) => acc + curr.hits, 0);

  return (
    <div className="space-y-6 animate-fade-in relative z-10">
      
      {/* 1. Header & Summary Grid */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-3">
        <div>
          <h1 className="text-xl font-bold font-sans tracking-tight text-white flex items-center gap-2">
            <Key className="w-5 h-5 text-[#22d3ee]" /> Dev Credentials Manager
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-sans">
            Provision personal auth secrets to integrate NeuralVoid capabilities directly into client software, CLI consoles, or backends.
          </p>
        </div>
      </div>

      {/* Stats Board */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel border border-slate-800 p-4.5 rounded-2xl flex flex-col justify-center bg-slate-950/20">
          <span className="text-[10px] font-bold font-mono tracking-wider text-slate-500 uppercase block mb-1">TOTAL KEY SECRETS</span>
          <span className="text-xl font-bold font-mono text-white">{keys.length}</span>
        </div>
        <div className="glass-panel border border-slate-800 p-4.5 rounded-2xl flex flex-col justify-center bg-slate-950/20">
          <span className="text-[10px] font-bold font-mono tracking-wider text-slate-500 uppercase block mb-1">ACTIVE NODE STATUS</span>
          <span className="text-xl font-bold font-mono text-cyan-400">{activeCount} Secrets</span>
        </div>
        <div className="glass-panel border border-slate-800 p-4.5 rounded-2xl flex flex-col justify-center bg-slate-950/20">
          <span className="text-[10px] font-bold font-mono tracking-wider text-slate-500 uppercase block mb-1">CUMULATIVE KEY TELEMETRY</span>
          <span className="text-xl font-bold font-mono text-indigo-400">{totalCalls.toLocaleString()} calls</span>
        </div>
      </div>

      {/* 2. Key Builder Console */}
      <div className="glass-panel border border-slate-800 p-5 rounded-2xl shadow-xl bg-slate-950/10 space-y-4">
        <h2 className="text-xs font-bold font-mono tracking-wider uppercase text-slate-300 flex items-center gap-1.5 border-b border-slate-850 pb-2.5">
          <Shield className="w-4 h-4 text-cyan-400" /> Provision Virtual Bearer Secret
        </h2>

        <form onSubmit={handleCreateKey} className="flex gap-3 max-w-xl">
          <input
            type="text"
            value={newKeyLabel}
            onChange={(e) => setNewKeyLabel(e.target.value)}
            placeholder="e.g. Test Production Environment Key..."
            className="flex-1 bg-slate-955/80 border border-slate-800 rounded-xl px-3.5 py-2 text-xs outline-none text-slate-200 focus:border-cyan-500 font-sans"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-450 hover:to-blue-550 text-white font-mono text-xs font-bold rounded-xl flex items-center gap-1.5 transition outline-none cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Generate key
          </button>
        </form>

        <p className="text-[10px] text-slate-500 font-sans leading-relaxed flex items-center gap-1.5 pt-1">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          Ensure you treat generated keys with security protection. Never commit them to public version controls or browsers.
        </p>
      </div>

      {/* 3. API Keys Table Panel */}
      <div className="glass-panel border border-slate-800 rounded-2xl shadow-xl overflow-hidden bg-slate-950/10">
        <div className="bg-[#070b14] border-b border-slate-850 p-4">
          <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400">Your Applet API Key Cache</h3>
        </div>

        {keys.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <Key className="w-8 h-8 text-slate-700 mx-auto mb-2 animate-pulse" />
            <span className="text-sm font-sans font-semibold text-slate-400">No active keys generated</span>
            <p className="text-[10px] text-slate-500 mt-1 font-mono">Use the controller above to create a sandbox API key.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/50 border-b border-slate-850 font-mono text-[10px] text-slate-450 uppercase tracking-wider">
                <tr>
                  <th className="p-4">Authorization Secret (Key)</th>
                  <th className="p-4">Created Date</th>
                  <th className="p-4">Node Hits</th>
                  <th className="p-4">Last Activated</th>
                  <th className="p-4">Lock Status</th>
                  <th className="p-4 text-right">Scope Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850/60 font-sans leading-none">
                {keys.map((k) => {
                  const showing = showKeys[k.id] || false;
                  const redactedKey = `${k.key.substring(0, 11)}...${k.key.substring(k.key.length - 8)}`;
                  const fullVisibleKey = k.key;

                  return (
                    <tr key={k.id} className="hover:bg-slate-900/40 transition">
                      {/* Key Value */}
                      <td className="p-4 font-mono select-all">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${k.status === "active" ? "bg-cyan-500/10 text-cyan-300" : "bg-slate-800 text-slate-500"}`}>
                            LIVE
                          </span>
                          <span className="text-slate-350 tracking-wider">
                            {showing ? fullVisibleKey : redactedKey}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleShowKey(k.id)}
                            className="text-slate-500 hover:text-slate-300 p-0.5 outline-none cursor-pointer"
                            title={showing ? "Mask Key" : "Reveal Raw Key"}
                          >
                            {showing ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>

                      {/* Created */}
                      <td className="p-4 text-slate-400 font-mono text-[10px]">
                        {formatTimeWithRelative(k.createdAt)}
                      </td>

                      {/* Hits */}
                      <td className="p-4 font-mono text-[11px] font-semibold text-slate-300">
                        {k.hits}
                      </td>

                      {/* Last Used */}
                      <td className="p-4 text-[10px] text-slate-400 font-mono">
                        {k.lastUsed === "Never" ? "Never" : new Date(k.lastUsed).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>

                      {/* Status */}
                      <td className="p-4 font-mono">
                        <span className={`inline-flex items-center gap-1 text-[9px] leading-none font-bold uppercase ${k.status === "active" ? "text-emerald-400" : "text-rose-400"}`}>
                          <span className={`w-1 h-1 rounded-full ${k.status === "active" ? "bg-emerald-400 animate-ping" : "bg-rose-400"}`} />
                          {k.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2 items-center">
                          <button
                            onClick={() => handleCopyKey(k.id, k.key)}
                            className="p-1 px-2 border border-slate-800 hover:border-slate-700 bg-slate-950 hover:bg-slate-900 rounded text-[10px] font-mono text-slate-400 flex items-center gap-1 cursor-pointer transition select-none"
                            title="Copy auth credential secret"
                          >
                            {copiedKeyId === k.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            {copiedKeyId === k.id ? "Copied" : "Copy"}
                          </button>

                          <button
                            onClick={() => handleRevokeKey(k.id)}
                            disabled={k.status === "revoked"}
                            className="p-1 text-slate-500 hover:text-rose-400 disabled:opacity-30 disabled:text-slate-700 hover:bg-rose-500/10 rounded cursor-pointer transition outline-none"
                            title="Revoke and cancel secret authorization key"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
