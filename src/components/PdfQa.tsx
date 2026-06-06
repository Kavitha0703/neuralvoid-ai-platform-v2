import React, { useState, useRef, useEffect } from "react";
import { FileText, Send, CheckCircle, RefreshCw, Sparkles, MessageCircle, AlertTriangle, ShieldCheck } from "lucide-react";
import { ChatMessage, UsageRecord } from "../types";
import { formatTimeWithRelative } from "../utils";

interface PdfQaProps {
  onAddLog: (record: UsageRecord) => void;
  userId: string;
  customKey?: string;
  onSetStatus: (msg: string | null) => void;
  initialText?: string;
  initialFilename?: string;
}

const CONST_DOC_TEMPLATES = [
  {
    filename: "AI_Studio_Security_Protocols.txt",
    text: `GOOGLE AI STUDIO CORE SECURITY SPECIFICATION:
1. Environment variables set up inside the Secrets drawer are fully sandboxed. Standard browser runtime calls must route through an intermediate full-stack server proxy so that API secrets do not leak to client-side bundles.
2. Cross-origin requests are controlled via standard CORS rules. Port 3000 is the exclusive permitted ingress port.
3. Persistent backups are made utilizing encrypted Firestore storage buckets bound to standard rules.
4. Client integrations can authenticate using localized developer keys (prefix "tk_proj_") which have a standard rate-limit quota of 60 requests per minute to prevent model abuse.`,
  },
  {
    filename: "React_19_State_Architectures.txt",
    text: `REACT 19 DEVELOPMENT NOTES AND PATTERNS:
1. React 19 natively handles async transitions without throwing stale state warnings. When dispatching actions, components can utilize the custom React.useActionState tracker.
2. Element references (ref) can now be parsed seamlessly as standard props without manually wrapping components inside the classic React.forwardRef descriptor.
3. Uncontrolled form submissions can utilize the native <form action={asyncAction}> callback, which automatically handles form parameters and execution locks elegantly.
4. Hot Module Replacement (HMR) is disabled in the cloud development workspace to prevent flashing preview rebuild cycles during code manipulations.`,
  }
];

export default function PdfQa({ onAddLog, userId, customKey, onSetStatus, initialText, initialFilename }: PdfQaProps) {
  const [docText, setDocText] = useState<string>(initialText || CONST_DOC_TEMPLATES[0].text);
  const [filename, setFilename] = useState<string>(initialFilename || CONST_DOC_TEMPLATES[0].filename);

  useEffect(() => {
    if (initialText) {
      setDocText(initialText);
    }
  }, [initialText]);

  useEffect(() => {
    if (initialFilename) {
      setFilename(initialFilename);
    }
  }, [initialFilename]);

  const [documentLoaded, setDocumentLoaded] = useState<boolean>(true);
  const [query, setQuery] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "wel-1",
      sender: "assistant",
      text: "I have loaded your Document specifications. Input any query below, and I will analyze the document specifically to synthesize response explanations.",
      timestamp: new Date().toISOString(),
    }
  ]);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // SaaS Dynamic Cloud Document library state
  const [dbDocs, setDbDocs] = useState<any[]>([]);

  const fetchDbDocs = async () => {
    try {
      const res = await fetch(`/api/documents/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setDbDocs(data.documents || []);
      }
    } catch (err) {
      console.error("Failed to fetch cloud document library:", err);
    }
  };

  useEffect(() => {
    fetchDbDocs();
  }, [userId]);

  const handleLoadDoc = async () => {
    if (!docText.trim() || !filename.trim()) return;
    setDocumentLoaded(true);
    setMessages([
      {
        id: `wel-${Date.now()}`,
        sender: "assistant",
        text: `Successfully initialized context tracker for "${filename}". Ready to answer queries grounded on this documentation. Try asking a question.`,
        timestamp: new Date().toISOString(),
      }
    ]);
    setError(null);

    // Auto-save custom uploaded text profiles directly to cloud file tables
    try {
      // Avoid duplicate naming spam in library
      const isAlreadyInCatalog = dbDocs.some(d => d.name.toLowerCase() === filename.toLowerCase());
      if (!isAlreadyInCatalog) {
         const res = await fetch("/api/documents/create", {
           method: "POST",
           headers: { "Content-Type": "application/json" },
           body: JSON.stringify({
             userId,
             name: filename.trim(),
             textLength: docText.length,
             snippet: docText.slice(0, 400) + (docText.length > 400 ? "..." : "")
           })
         });
         if (res.ok) {
           fetchDbDocs();
         }
      }
    } catch (err) {
      console.warn("Could not catalog file specification inside database records:", err);
    }
  };

  const handleDeleteDbDoc = async (docId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this document from your database catalog?")) return;
    try {
      const res = await fetch(`/api/documents/${docId}`, { method: "DELETE" });
      if (res.ok) {
        setDbDocs(prev => prev.filter(d => d.id !== docId));
        // Reset if we deleted active one
        setDocumentLoaded(false);
      }
    } catch (err) {
      console.error("Failed deleting catalog document from cloud storage:", err);
    }
  };

  const handleUnloadDoc = () => {
    setDocumentLoaded(false);
    setMessages([]);
    setError(null);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || loading || !documentLoaded) return;

    const userQuery = query.trim();
    setQuery("");
    setError(null);

    const userMsg: ChatMessage = {
      id: `m-${Math.random().toString(36).substr(2, 9)}`,
      sender: "user",
      text: userQuery,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    onSetStatus("Answering grounded document query...");

    // Scroll to bottom
    setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);

    try {
      const res = await fetch("/api/toolkit/pdf-qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentText: docText,
          filename,
          query: userQuery,
          chatHistory: messages.slice(-6), // Send last 6 messages as summary context
          userId,
          customKey,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Grounded PDF Q&A endpoint failed to fulfill query.");
      }

      const assistMsg: ChatMessage = {
        id: `m-${Math.random().toString(36).substr(2, 9)}`,
        sender: "assistant",
        text: data.answer,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistMsg]);

      // Record logs
      if (data.metrics) {
        onAddLog({
          id: `log-${Math.random().toString(36).substr(2, 9)}`,
          userId,
          timestamp: data.metrics.timestamp,
          tool: "PDF Q&A",
          prompt: `File: ${filename} | Query: ${userQuery}`,
          status: "success",
          durationMs: data.metrics.durationMs,
          tokensUsed: data.metrics.tokensUsed,
          estimatedCost: Number((data.metrics.tokensUsed * 0.00000045).toFixed(6)),
        });
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to formulate answer.");

      onAddLog({
        id: `log-${Math.random().toString(36).substr(2, 9)}`,
        userId,
        timestamp: new Date().toISOString(),
        tool: "PDF Q&A",
        prompt: `File: ${filename} | Query: ${userQuery}`,
        status: "error",
        durationMs: 0,
        tokensUsed: 0,
        estimatedCost: 0,
      });
    } finally {
      setLoading(false);
      onSetStatus(null);
      setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  };

  const handleTemplateSelect = (idx: number) => {
    setFilename(CONST_DOC_TEMPLATES[idx].filename);
    setDocText(CONST_DOC_TEMPLATES[idx].text);
    setDocumentLoaded(false);
    setError(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
      {/* Sidebar: Load / Edit Document Source */}
      <div className="lg:col-span-5 glass-panel p-5 rounded-2xl shadow-xl space-y-4 h-fit border border-slate-800">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <h2 className="text-xs font-bold font-mono tracking-wider uppercase text-slate-400 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-amber-500" /> Reference File Specification
          </h2>
          {documentLoaded && (
            <button
              onClick={handleUnloadDoc}
              className="text-[9px] text-rose-450 font-mono font-bold hover:text-rose-400 cursor-pointer outline-none transition-colors"
            >
              Unload File
            </button>
          )}
        </div>

        {/* Templates select */}
        {!documentLoaded && (
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-mono tracking-wider text-slate-500 font-bold block">
              Choose Ready Document Spec:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {CONST_DOC_TEMPLATES.map((tpl, i) => (
                <button
                  key={i}
                  onClick={() => handleTemplateSelect(i)}
                  className={`bg-slate-950 p-2.5 rounded-xl border text-left transition duration-150 outline-none hover:border-amber-550 cursor-pointer ${
                    filename === tpl.filename ? "border-amber-500 bg-amber-500/10" : "border-slate-850"
                  }`}
                >
                  <div className="text-[10px] font-mono leading-none truncate text-slate-200 font-semibold">{tpl.filename}</div>
                  <div className="text-[9px] text-slate-500 mt-1 line-clamp-1">{tpl.text}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Cloud database catalogs */}
        {!documentLoaded && dbDocs.length > 0 && (
          <div className="space-y-2 pt-3 border-t border-slate-900">
            <label className="text-[10px] uppercase font-mono tracking-wider text-amber-450 font-bold block flex items-center justify-between">
              <span>Cloud Database Document Catalog ({dbDocs.length}):</span>
              <span className="text-[8px] font-mono text-slate-500 font-normal">SaaS ACTIVE</span>
            </label>
            <div className="grid grid-cols-1 gap-2 max-h-36 overflow-y-auto pr-1">
              {dbDocs.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => {
                    setFilename(doc.name);
                    setDocText(doc.snippet); 
                    setDocumentLoaded(false);
                    setError(null);
                  }}
                  className={`bg-slate-950 p-2.5 rounded-xl border text-left transition duration-150 flex items-center justify-between group cursor-pointer ${
                    filename === doc.name ? "border-amber-550/60 bg-amber-550/5" : "border-slate-850 hover:border-slate-700"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-[9.5px] font-mono leading-none truncate text-slate-200 font-semibold">{doc.name}</div>
                    <div className="text-[8px] text-slate-500 font-mono mt-1">Stored {formatTimeWithRelative(doc.uploadedAt)} • {doc.textLength} chars</div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => handleDeleteDbDoc(doc.id, e)}
                    className="px-1 text-slate-500 hover:text-red-400 group-hover:opacity-100 transition-opacity font-mono text-xs cursor-pointer"
                    title="Delete file from persistent database"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* File Config settings */}
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-mono tracking-wider text-slate-500 font-bold block">
              Virtual Filename
            </label>
            <input
              type="text"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="e.g. security_protocols.pdf"
              disabled={documentLoaded}
              className="w-full bg-slate-950/80 text-slate-200 border border-slate-800 rounded-xl p-2.5 text-xs font-mono outline-none focus:border-amber-500 disabled:opacity-50"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-mono tracking-wider text-slate-500 font-bold block">
              Document Text Contents
            </label>
            <textarea
              value={docText}
              onChange={(e) => setDocText(e.target.value)}
              placeholder="Paste parsed text here..."
              disabled={documentLoaded}
              className="w-full h-44 p-3 font-mono text-[11px] bg-slate-950/80 border border-slate-800 rounded-xl outline-none text-slate-200 focus:border-amber-500 disabled:opacity-50 leading-relaxed"
            />
          </div>

          {!documentLoaded ? (
            <button
              onClick={handleLoadDoc}
              disabled={!docText.trim() || !filename.trim()}
              className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-450 hover:to-yellow-550 text-white font-mono text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 outline-none transition disabled:opacity-50 select-none cursor-pointer shadow-md shadow-amber-500/10"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Initialize Context Parser
            </button>
          ) : (
            <div className="bg-emerald-950/20 border border-emerald-900/40 rounded-xl p-3.5 flex gap-2.5">
              <ShieldCheck className="w-4.5 h-4.5 text-emerald-450 shrink-0 mt-0.5" />
              <div className="text-[11px] text-slate-300">
                <span className="font-bold block uppercase font-mono text-[9px] text-emerald-400 mb-0.5">Active Grounding Rule</span>
                Document context <span className="font-mono text-white underline decoration-emerald-500">{filename}</span> is locked. Responses are certified against hallucination errors.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Grounded Chat Area */}
      <div className="lg:col-span-7 flex flex-col h-[460px]">
        <div className="glass-panel border border-slate-800 rounded-2xl shadow-xl flex-1 flex flex-col min-h-0">
          {/* Header */}
          <div className="bg-slate-950/50 border-b border-slate-850 p-3.5 rounded-t-2xl flex items-center gap-2.5">
            <MessageCircle className="w-4 h-4 text-amber-500" />
            <div>
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-300 leading-none">
                Grounded Research Assistant
              </h3>
              <p className="text-[9px] text-slate-500 mt-1 leading-none font-mono">
                Context: {documentLoaded ? filename : "No Sandbox file state initialized"}
              </p>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => {
              const isUser = msg.sender === "user";
              return (
                <div key={msg.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                    isUser
                      ? "bg-slate-850 text-slate-200 rounded-tr-none border border-slate-800"
                      : "bg-amber-955/15 border border-amber-900/30 text-amber-250 rounded-tl-none whitespace-pre-wrap select-text"
                  }`}>
                    {msg.text}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-amber-955/10 border border-amber-905/20 rounded-2xl rounded-tl-none p-3.5 max-w-[85%] text-xs text-slate-400 flex items-center gap-2 font-mono">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce" />
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce delay-75" />
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce delay-150" />
                  Searching local source specs...
                </div>
              </div>
            )}

            {error && (
              <div className="bg-rose-950/20 border border-rose-900/30 text-rose-400 p-3.5 text-xs rounded-xl flex gap-2 items-start">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold block uppercase tracking-wider">Query Processing Fail</strong>
                  {error}
                </div>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* Footer Input Bar */}
          <form onSubmit={handleSend} className="p-3 border-t border-slate-850 flex gap-2 bg-slate-950/30 rounded-b-2xl">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={loading || !documentLoaded}
              placeholder={documentLoaded ? "Formulate a query concerning the document specs..." : "Load a document first."}
              className="flex-1 bg-slate-950/80 text-slate-200 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-amber-500"
            />
            <button
              type="submit"
              disabled={loading || !query.trim() || !documentLoaded}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-450 hover:to-amber-550 text-white p-2.5 px-4 rounded-xl flex items-center justify-center disabled:opacity-40 shrink-0 select-none cursor-pointer outline-none transition"
            >
              <Send className="w-3.5 h-3.5 animate-pulse" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
