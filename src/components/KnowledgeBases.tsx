import React, { useState, useEffect } from "react";
import { Sparkles, Library, Plus, Trash2, ArrowUpRight, Search, FileText, UploadCloud, FolderDot, AlertCircle } from "lucide-react";
import { KnowledgeBase, UserProfile, UsageRecord } from "../types";

interface KnowledgeBasesProps {
  user: UserProfile | null;
  onNavigateToQA: (docSnippet: string, docName: string) => void;
  onSetStatus: (msg: string | null) => void;
}

export default function KnowledgeBases({ user, onNavigateToQA, onSetStatus }: KnowledgeBasesProps) {
  const [collections, setCollections] = useState<KnowledgeBase[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null);

  // Creation forms
  const [isCreatingKb, setIsCreatingKb] = useState<boolean>(false);
  const [kbName, setKbName] = useState<string>("");
  const [kbDesc, setKbDesc] = useState<string>("");

  // Add doc form
  const [docName, setDocName] = useState<string>("");
  const [docSnippet, setDocSnippet] = useState<string>("");
  const [isAddingDoc, setIsAddingDoc] = useState<boolean>(false);

  const userId = user?.id || "guest";

  const loadKbs = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/knowledge-bases/${userId}`);
      if (!res.ok) throw new Error("Could not load knowledge bases");
      const data = await res.json();
      setCollections(data.knowledgeBases || []);
    } catch (e) {
      console.error(e);
      onSetStatus("Failed to synchronize knowledge base collections.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKbs();
  }, [userId]);

  // Create Collection
  const handleCreateKb = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kbName.trim()) return;

    try {
      onSetStatus("Initializing knowledge collection...");
      const res = await fetch("/api/knowledge-bases/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          name: kbName,
          description: kbDesc || "Standard Developer Guideline Index"
        }),
      });
      if (res.ok) {
        onSetStatus("Collection created successfully!");
        setKbName("");
        setKbDesc("");
        setIsCreatingKb(false);
        await loadKbs();
        setTimeout(() => onSetStatus(null), 2500);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Add text document to collection
  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCollectionId || !docName.trim() || !docSnippet.trim()) return;

    try {
      onSetStatus("Indexing text segment in collection...");
      const res = await fetch(`/api/knowledge-bases/${activeCollectionId}/add-document`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document: {
            name: docName,
            snippet: docSnippet,
            textLength: docSnippet.length
          }
        }),
      });

      if (res.ok) {
        onSetStatus("Document indexed successfully!");
        setDocName("");
        setDocSnippet("");
        setIsAddingDoc(false);
        await loadKbs();
        setTimeout(() => onSetStatus(null), 2500);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Delete KB collection
  const deleteCollection = async (id: string) => {
    if (!confirm("Are you sure you want to delete this collection and all indexed documents?")) return;
    try {
      const res = await fetch(`/api/knowledge-bases/${id}`, { method: "DELETE" });
      if (res.ok) {
        onSetStatus("Collection removed.");
        setCollections(prev => prev.filter(c => c.id !== id));
        if (activeCollectionId === id) setActiveCollectionId(null);
        setTimeout(() => onSetStatus(null), 2000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Quick Action: Query selected Collection in PDF QA interface
  const handleLoadToQA = (collection: KnowledgeBase) => {
    if (collection.documents.length === 0) {
      alert("Please add at least one document segment to this collection before running Q&A queries.");
      return;
    }

    // Merge multiple snippets into a large continuous context matching the collection
    const combinedContext = collection.documents.map(d => `--- [Document Source: ${d.name}] ---\n${d.snippet}`).join("\n\n");
    onNavigateToQA(combinedContext, `Collection Cluster: ${collection.name}`);
  };

  const filteredKbs = collections.filter(kb =>
    kb.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    kb.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeKb = collections.find(c => c.id === activeCollectionId);

  return (
    <div id="knowledge_base_layout" className="space-y-6">
      
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-xl font-bold text-white font-sans flex items-center gap-2">
            <Library className="w-5 h-5 text-cyan-400" />
            Knowledge Base Collections
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Build custom offline semantic document clusters. Bundle technical guidelines, manuals, and datasets to ask queries in PDF Q&A.
          </p>
        </div>
        <button
          onClick={() => setIsCreatingKb(!isCreatingKb)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-lg text-xs font-semibold text-white transition-all cursor-pointer shadow-lg shadow-cyan-500/10 outline-none"
        >
          <Plus className="w-4 h-4" />
          Create Collection
        </button>
      </div>

      {isCreatingKb && (
        <form onSubmit={handleCreateKb} className="bg-[#0b1021] border border-slate-800 rounded-xl p-5 space-y-4 animate-fadeIn">
          <h3 className="text-xs font-mono font-bold uppercase text-[#22d3ee] tracking-widest flex items-center gap-1.5">
            <FolderDot className="w-4 h-4" /> New RAG Document Collection
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400">Collection Name</label>
              <input
                type="text"
                value={kbName}
                onChange={e => setKbName(e.target.value)}
                placeholder="e.g. SLA references & manual guides"
                required
                className="w-full bg-[#040815] border border-slate-800 rounded-lg px-3 py-2 text-xs font-medium text-white placeholder-slate-500 focus:border-cyan-500 outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400">Description Summary</label>
              <input
                type="text"
                value={kbDesc}
                onChange={e => setKbDesc(e.target.value)}
                placeholder="e.g. Code, specifications, standard constraints..."
                className="w-full bg-[#040815] border border-slate-800 rounded-lg px-3 py-2 text-xs font-medium text-white placeholder-slate-500 focus:border-cyan-500 outline-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 px-1">
            <button
              type="button"
              onClick={() => setIsCreatingKb(false)}
              className="px-3 py-1.5 border border-slate-800 hover:bg-slate-900 rounded-lg text-xs font-medium text-slate-400 cursor-pointer outline-none"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-xs font-bold text-white cursor-pointer outline-none"
            >
              Initialize Cluster
            </button>
          </div>
        </form>
      )}

      {/* Main layout split list vs documents indexed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Collections Catalog list */}
        <div className="lg:col-span-5 space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Filter collections..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-[#0a0f1e] border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs font-medium text-white placeholder-slate-500 focus:border-cyan-500 focus:bg-[#070b16] outline-none"
            />
          </div>

          {loading ? (
            <div className="py-16 text-center text-slate-500 font-mono text-xs animate-pulse">
              Scanning knowledge base catalogs...
            </div>
          ) : filteredKbs.length === 0 ? (
            <div className="border border-slate-850 bg-slate-950/20 p-8 rounded-xl text-center">
              <p className="text-xs text-slate-500 font-mono">No document collections created yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredKbs.map(kb => {
                const isActive = activeCollectionId === kb.id;
                return (
                  <div
                    key={kb.id}
                    onClick={() => {
                      setActiveCollectionId(kb.id);
                      setIsAddingDoc(false);
                    }}
                    className={`border rounded-xl p-4 cursor-pointer transition-all duration-150 relative overflow-hidden group ${
                      isActive
                        ? "bg-[#0b1428]/50 border-cyan-500 shadow-md shadow-cyan-500/5"
                        : "bg-[#0a0f1e] border-slate-800 hover:border-slate-700 hover:bg-slate-950/20"
                    }`}
                  >
                    {isActive && (
                      <div className="absolute right-0 top-0 bg-cyan-500 w-1 h-full"></div>
                    )}
                    <div className="flex justify-between items-start gap-3">
                      <div className="space-y-1 min-w-0">
                        <span className="text-[9px] font-mono font-bold leading-none bg-[#11192e] border border-slate-800 px-2.5 py-0.5 rounded-full text-cyan-400 uppercase">
                          {kb.documents.length} Indexed segments
                        </span>
                        <h4 className="text-sm font-bold text-white tracking-tight pt-1">{kb.name}</h4>
                        <p className="text-slate-400 text-xs truncate">{kb.description}</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteCollection(kb.id);
                        }}
                        className="text-slate-600 hover:text-red-400 p-1 rounded-lg border border-transparent hover:border-slate-800 outline-none transition-colors shrink-0"
                        title="Delete collection"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="mt-3 flex justify-end">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLoadToQA(kb);
                        }}
                        className="flex items-center gap-1 text-[10px] font-mono leading-none font-bold text-cyan-400 hover:text-cyan-333 transition-colors outline-none"
                      >
                        Query Cluster QA
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Cluster Documents Indexer */}
        <div className="lg:col-span-7 bg-[#0a0f1e] border border-slate-800 rounded-xl p-5 space-y-5 shadow-2xl">
          {activeKb ? (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[9px] font-mono uppercase text-[#22d3ee] tracking-widest font-bold">Document Cluster Contents</span>
                  <h3 className="text-sm font-bold text-white mt-0.5">{activeKb.name}</h3>
                </div>
                {!isAddingDoc && (
                  <button
                    onClick={() => setIsAddingDoc(true)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-[#11192e] border border-cyan-800 hover:bg-cyan-950/20 text-cyan-400 rounded-lg text-xs font-mono font-bold shrink-0 outline-none cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Doc Segment
                  </button>
                )}
              </div>

              {isAddingDoc ? (
                <form onSubmit={handleAddDocument} className="bg-[#0b1021] border border-slate-850 p-4 rounded-xl space-y-4 animate-fadeIn">
                  <div className="flex justify-between items-center pb-1">
                    <span className="text-[10px] font-bold font-mono uppercase text-cyan-400">Index Text Segment</span>
                    <button
                      type="button"
                      onClick={() => setIsAddingDoc(false)}
                      className="text-xs font-mono text-slate-500 hover:text-slate-300 cursor-pointer outline-none"
                    >
                      cancel
                    </button>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-400">Document Segment Name</label>
                    <input
                      type="text"
                      value={docName}
                      onChange={e => setDocName(e.target.value)}
                      placeholder="e.g. REST_Interface_v2_SLA.txt"
                      required
                      className="w-full bg-[#040815] border border-slate-800 rounded-lg px-3 py-2 text-xs font-medium text-white placeholder-slate-600 focus:border-cyan-500 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-400">Raw Text content / Data Snippet</label>
                    <textarea
                      value={docSnippet}
                      rows={6}
                      onChange={e => setDocSnippet(e.target.value)}
                      placeholder="Paste guidelines, regulations, or manual code snippet to query against later..."
                      required
                      className="w-full bg-[#040815] border border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-200 placeholder-slate-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="submit"
                      className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-xs font-bold text-white cursor-pointer outline-none"
                    >
                      Process & Index Segment
                    </button>
                  </div>
                </form>
              ) : activeKb.documents.length === 0 ? (
                <div className="border border-dashed border-slate-800 py-16 text-center text-slate-500 space-y-2 rounded-xl bg-slate-900/10">
                  <UploadCloud className="w-8 h-8 text-slate-600 mx-auto animate-bounce" />
                  <p className="text-xs font-mono">No document segments indexed inside this collection cluster.</p>
                  <button
                    onClick={() => setIsAddingDoc(true)}
                    className="mt-2 text-xs text-cyan-400 font-bold hover:underline"
                  >
                    Index your first segment +
                  </button>
                </div>
              ) : (
                <div className="space-y-3.5 max-h-[480px] overflow-y-auto pr-1">
                  {activeKb.documents.map(doc => (
                    <div key={doc.id} className="bg-[#050914] border border-slate-850/80 rounded-xl p-3.5 space-y-2 relative group">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <FileText className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          <span className="text-xs font-mono font-bold text-white truncate" title={doc.name}>
                            {doc.name}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500 shrink-0">
                          {doc.textLength ? `${Math.round(doc.textLength / 1000)}kb` : ""} text
                        </span>
                      </div>
                      <div className="bg-[#02050c] p-2.5 rounded-lg border border-slate-900/50 text-[11px] font-mono text-slate-400 whitespace-pre-wrap leading-relaxed line-clamp-3">
                        {doc.snippet}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="py-24 text-center text-slate-500 space-y-2">
              <FolderDot className="w-10 h-10 text-slate-700 mx-auto" />
              <p className="text-xs font-mono">Select a knowledge collection cluster from catalog side to explore index nodes.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
