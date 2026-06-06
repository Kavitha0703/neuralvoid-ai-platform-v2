import React, { useState } from "react";
import { 
  ShieldCheck, Users, Activity, ToggleLeft, ToggleRight, DollarSign, Database, 
  Cpu, HeartPulse, HardDrive, RefreshCw, AlertTriangle, ShieldAlert 
} from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import { AdminUserRecord, UsageRecord } from "../types";

interface AdminPanelProps {
  history: UsageRecord[];
}

const SYSTEM_LOGS = [
  { event: "API_GATEWAY_AUTH_KEY_VERIFIED", keyId: "nv_live_8a3fd...", time: "13:02:14" },
  { event: "VECTOR_SVG_COMPILATION_INITIATED", query: "Quantum computing diagram", time: "13:01:45" },
  { event: "GEMINI_PROXY_REQUEST_COMPLETED", duration: "840ms", tokens: "450", time: "13:01:22" },
  { event: "USER_PROFILE_METRICS_SYNC_SUCCESS", count: "12", time: "12:59:15" },
  { event: "DATABASE_BLUEPRINT_SCHEMA_LOCKED", status: "SLA_HEALTHY", time: "12:50:00" },
];

export default function AdminPanel({ history }: AdminPanelProps) {
  // Simulated list of developers that admins can click to switch status (active/disabled)
  const [users, setUsers] = useState<AdminUserRecord[]>(() => [
    {
      id: "usr_guest",
      email: "developer@aistudio-toolkit.internal",
      apiKey: "tk_proj_live_default_99ef1a",
      createdAt: "2026-06-03T10:00:20Z",
      status: "active",
      totalHits: 412,
      totalTokens: 185200,
    },
    {
      id: "usr_2",
      email: "intern_audit@portfolio.dev",
      apiKey: "tk_proj_dev_f284dc912a",
      createdAt: "2026-06-04T12:30:15Z",
      status: "active",
      totalHits: 82,
      totalTokens: 34100,
    },
    {
      id: "usr_3",
      email: "external_consulting@sandbox.net",
      apiKey: "tk_proj_dev_bc99e1a8fa",
      createdAt: "2026-06-04T15:10:00Z",
      status: "disabled",
      totalHits: 145,
      totalTokens: 62000,
    },
  ]);

  const [togglingId, setTogglingId] = useState<string | null>(null);

  const handleToggleUserStatus = (id: string) => {
    setTogglingId(id);
    setTimeout(() => {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === id ? { ...u, status: u.status === "active" ? "disabled" as const : "active" as const } : u
        )
      );
      setTogglingId(null);
    }, 250);
  };

  // Compile real stats from history
  const totalTokens = history.reduce((acc, curr) => acc + (curr.tokensUsed || 0), 0);
  const totalCost = history.reduce((acc, curr) => acc + (curr.estimatedCost || 0), 0);
  const successRate = history.length > 0 
    ? Math.round((history.filter((h) => h.status === "success").length / history.length) * 100) 
    : 100;

  // Chart data matching sandbox usage trends
  const chartData = [
    { name: "05/30", cost: 0.0031, tokens: 6200 },
    { name: "06/01", cost: 0.0045, tokens: 9200 },
    { name: "06/02", cost: 0.0038, tokens: 7800 },
    { name: "06/03", cost: 0.0052, tokens: 10400 },
    { name: "06/04", cost: 0.0061, tokens: 12200 },
    { name: "06/05", cost: totalCost, tokens: totalTokens }, // Live today
  ];

  return (
    <div className="space-y-6 animate-fade-in relative z-10">
      
      {/* 1. Header with Admin Credentials branding */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-3">
        <div>
          <h1 className="text-xl font-bold font-sans tracking-tight text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-400" /> Administrative SLA Command Center
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Global developer access control list, cost analysis metrics, token charts, and server-side container cluster health.
          </p>
        </div>
        <span className="bg-red-500/10 border border-red-500/30 text-red-400 font-mono text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-full leading-none">
          SECURE AUDIT VIEW
        </span>
      </div>

      {/* Bento Grid layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Column Left: Bento grids indicators */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Bento Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="glass-panel border border-slate-800 p-4 rounded-xl flex flex-col justify-center bg-slate-950/20">
              <span className="text-[10px] font-bold font-mono text-slate-500 uppercase tracking-wider block">DEPLOYED HOST</span>
              <span className="text-xs font-bold font-mono text-white mt-0.5">Google Cloud Run</span>
            </div>
            <div className="glass-panel border border-slate-800 p-4 rounded-xl flex flex-col justify-center bg-slate-950/20">
              <span className="text-[10px] font-bold font-mono text-slate-500 uppercase tracking-wider block">API SUCCESS RATE</span>
              <span className="text-sm font-bold font-mono text-emerald-400 mt-0.5">{successRate}% uptime</span>
            </div>
            <div className="glass-panel border border-slate-800 p-4 rounded-xl flex flex-col justify-center bg-slate-950/20">
              <span className="text-[10px] font-bold font-mono text-slate-500 uppercase tracking-wider block">CUMULATIVE CHARGES</span>
              <span className="text-sm font-bold font-mono text-indigo-400 mt-0.5">${totalCost.toFixed(6)} USD</span>
            </div>
            <div className="glass-panel border border-slate-800 p-4 rounded-xl flex flex-col justify-center bg-slate-950/20">
              <span className="text-[10px] font-bold font-mono text-slate-500 uppercase tracking-wider block">CONTAINER LOAD</span>
              <span className="text-sm font-bold font-mono text-amber-500 mt-0.5">14.2% CPU</span>
            </div>
          </div>

          {/* Recharts Usage charts */}
          <div className="glass-panel border border-slate-800 p-5 rounded-2xl bg-[#080d19]">
            <h2 className="text-xs font-bold font-mono tracking-wider uppercase text-slate-400 flex items-center gap-1.5 mb-4 border-b border-slate-850 pb-2.5">
              <Activity className="w-4 h-4 text-[#22d3ee]" /> Cumulative Cost Billing Trend ($)
            </h2>
            
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#475569" fontSize={9} fontClassName="font-mono" />
                  <YAxis stroke="#475569" fontSize={9} fontClassName="font-mono" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#020617", borderColor: "#1e293b", borderRadius: "12px", fontSize: "10px" }}
                    labelStyle={{ color: "#94a3b8", fontFamily: "monospace" }}
                  />
                  <Area type="monotone" dataKey="cost" stroke="#22d3ee" strokeWidth={1.5} fillOpacity={1} fill="url(#colorCost)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* User Account Manager Section */}
          <div className="glass-panel border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/10">
            <div className="bg-[#070b14] border-b border-slate-850 p-4">
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-404" /> Platform Developer User Registries
              </h3>
            </div>

            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left text-slate-300">
                <thead className="bg-[#040811] border-b border-slate-850 text-slate-450 font-mono text-[10px] uppercase">
                  <tr>
                    <th className="p-4">Developer Identity</th>
                    <th className="p-4">Default API Key Block</th>
                    <th className="p-4 font-mono text-right">Server Hits</th>
                    <th className="p-4 text-right">Allocated Tokens</th>
                    <th className="p-4">Lock Status</th>
                    <th className="p-4 text-center">Toggle Acc</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850/50">
                  {users.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-900/30 transition">
                      {/* Identity */}
                      <td className="p-4 font-mono text-[11px] font-semibold text-slate-200">
                        {item.email}
                      </td>

                      {/* API Key */}
                      <td className="p-4 font-mono text-slate-400 text-[10.5px]">
                        {item.apiKey}
                      </td>

                      {/* Hits */}
                      <td className="p-4 font-mono text-right font-medium text-slate-300">
                        {item.totalHits}
                      </td>

                      {/* Tokens */}
                      <td className="p-4 font-mono text-right text-indigo-300">
                        {item.totalTokens.toLocaleString()}
                      </td>

                      {/* Status */}
                      <td className="p-4 font-mono uppercase text-[9px] font-bold">
                        <span className={`inline-flex items-center gap-1 ${item.status === "active" ? "text-emerald-400" : "text-rose-400"}`}>
                          <span className={`w-1 h-1 rounded-full ${item.status === "active" ? "bg-emerald-400 animate-ping" : "bg-rose-450"}`} />
                          {item.status}
                        </span>
                      </td>

                      {/* Toggle status action */}
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleToggleUserStatus(item.id)}
                          disabled={togglingId === item.id}
                          className="text-slate-400 hover:text-white inline-flex items-center outline-none cursor-pointer duration-100"
                        >
                          {item.status === "active" ? (
                            <ToggleLeft className="w-5 h-5 text-emerald-400" />
                          ) : (
                            <ToggleRight className="w-5 h-5 text-rose-400" />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Column Right: Health and Log trace */}
        <div className="lg:col-span-4 space-y-6">

          {/* Cluster Status Health */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 bg-[#080d19] space-y-3">
            <h2 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-300 flex items-center gap-2 border-b border-slate-850 pb-2.5">
              <HeartPulse className="w-4 h-4 text-emerald-400 animate-pulse" /> Sandbox Node Health
            </h2>

            <div className="space-y-3 font-mono text-xs pt-1">
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-850 flex items-center justify-between">
                <span className="text-slate-500 font-mono flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5" /> InMemory Database
                </span>
                <span className="text-emerald-400 font-bold uppercase">SECURE_SYNC</span>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-850 flex items-center justify-between">
                <span className="text-slate-500 font-mono flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5" /> SQLite/Memory Nodes
                </span>
                <span className="text-emerald-400 font-bold uppercase">SPLAT_OK</span>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-850 flex items-center justify-between">
                <span className="text-slate-500 font-mono flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5" /> CPU VM Cluster
                </span>
                <span className="text-cyan-400 font-bold">14.2%</span>
              </div>
            </div>
          </div>

          {/* System API Action Stream logs */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 bg-[#080d19] space-y-3">
            <h2 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-300 flex items-center gap-2 border-b border-slate-850 pb-2.5">
              <ShieldAlert className="w-4 h-4 text-[#22d3ee]" /> System Live Core Logs
            </h2>

            <div className="space-y-2.5 font-mono text-[9px] text-slate-400 leading-normal bg-black rounded-xl p-3.5 border border-slate-850 max-h-[220px] overflow-auto select-all">
              {SYSTEM_LOGS.map((log, idx) => (
                <div key={idx} className="border-b border-slate-900 pb-1.5 last:border-0 last:pb-0">
                  <span className="text-cyan-400 font-bold">[{log.time}]</span>{" "}
                  <span className="text-slate-500">{log.event}</span>{" "}
                  {log.keyId && <span className="text-slate-400">{log.keyId}</span>}
                  {log.duration && <span className="text-emerald-400">{log.duration} ({log.tokens}t)</span>}
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
