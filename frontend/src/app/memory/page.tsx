"use client";

import React, { useState, useEffect } from "react";
import {
  BrainCircuit,
  Search,
  Filter,
  Plus,
  Tag,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCw,
  Trash2,
  X,
  Sparkles,
  Layers,
  FileText,
  GitCommit,
  CheckSquare
} from "lucide-react";
import { useWorkspace } from "../../components/WorkspaceContext";
import { api } from "../../lib/api";
import { MemoryItem, MemoryType, IngestionStatus } from "../../lib/types";

export default function TeamMemoryPage() {
  const { workspace, currentUser, isHindsightLive, addNotification } = useWorkspace();
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Add Memory Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalContent, setModalContent] = useState("");
  const [modalType, setModalType] = useState<MemoryType>("General");
  const [modalTags, setModalTags] = useState("hackathon, sync");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadMemories = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (selectedType !== "ALL") params.type = selectedType;
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (selectedTag) params.tag = selectedTag;

      const data = await api.getMemories("ws-demo-hackathon-2026", params);
      setMemories(data);
    } catch (err: any) {
      console.warn("Failed to load memories:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMemories();
  }, [selectedType, selectedTag]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadMemories();
  };

  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalTitle.trim() || !modalContent.trim()) {
      addNotification("warning", "Missing fields", "Title and content are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const tagsArray = modalTags.split(",").map((t) => t.trim()).filter(Boolean);
      const created = await api.createMemory("ws-demo-hackathon-2026", {
        title: modalTitle.trim(),
        content: modalContent.trim(),
        type: modalType,
        tags: tagsArray,
        source: "manual"
      });

      addNotification("success", "Memory Retained", `Retained: "${created.title}" in long-term memory`);
      setShowAddModal(false);
      setModalTitle("");
      setModalContent("");
      loadMemories();
    } catch (err: any) {
      addNotification("error", "Retention failed", err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetryIngestion = async (memId: string) => {
    try {
      const res = await api.retryMemory("ws-demo-hackathon-2026", memId);
      addNotification("success", "Ingestion Retried", res.message);
      loadMemories();
    } catch (err: any) {
      addNotification("error", "Retry failed", err.message);
    }
  };

  const handleDeleteMemory = async (memId: string) => {
    if (!confirm("Are you sure you want to delete this memory record?")) return;
    try {
      await api.deleteMemory("ws-demo-hackathon-2026", memId);
      addNotification("success", "Memory Deleted", "Record removed from memory bank.");
      loadMemories();
    } catch (err: any) {
      addNotification("error", "Deletion failed", err.message);
    }
  };

  const allTags = Array.from(new Set(memories.flatMap((m) => m.tags || []))).slice(0, 10);

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-indigo-600" />
              Team Memory Bank
            </h1>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                isHindsightLive
                  ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                  : "bg-indigo-50 text-indigo-700 border-indigo-100"
              }`}
            >
              {isHindsightLive ? "Hindsight Cloud Live" : "Persistent Local Bank"}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Authoritative semantic repository of all decisions, meeting transcripts, and project deliverables.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Retain New Memory</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="vc-card p-3 bg-white flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 ml-1" />
          <input
            type="text"
            placeholder="Search memories by keywords, concepts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs text-slate-900 placeholder-slate-400 bg-transparent focus:outline-none"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            {["ALL", "Meeting", "Decision", "Task", "Document"].map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                  selectedType === type
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <button
            onClick={loadMemories}
            disabled={loading}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors"
            title="Refresh Memory Bank"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-indigo-600" : ""}`} />
          </button>
        </div>
      </div>

      {/* Tags Filter Carousel */}
      {allTags.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
          <span className="text-slate-400 text-[11px] font-semibold shrink-0">Tags:</span>
          {selectedTag && (
            <button
              onClick={() => setSelectedTag(null)}
              className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[11px] font-semibold flex items-center gap-1 shrink-0"
            >
              Clear tag filter <X className="w-3 h-3" />
            </button>
          )}
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-colors shrink-0 ${
                selectedTag === tag
                  ? "bg-indigo-600 text-white font-semibold shadow-sm"
                  : "bg-white hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 border border-slate-200"
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {/* Memories Grid */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-500">
          <BrainCircuit className="w-6 h-6 text-indigo-600 animate-spin mx-auto mb-2" />
          Loading project memory bank...
        </div>
      ) : memories.length === 0 ? (
        <div className="vc-card p-12 text-center text-slate-400 bg-white">
          <BrainCircuit className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <div className="text-sm font-semibold text-slate-800">No memory records found</div>
          <p className="text-xs text-slate-500 mt-1">
            Try adjusting your search query or type filter, or retain a new memory record.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {memories.map((mem) => {
            const isRetained = mem.ingestion_status === "retained";
            const isFailed = mem.ingestion_status === "failed";

            return (
              <div
                key={mem.id}
                className="vc-card p-5 bg-white flex flex-col justify-between hover:border-indigo-200 shadow-soft hover:shadow-card transition-all"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          mem.type === "Meeting"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : mem.type === "Decision"
                            ? "bg-purple-50 text-purple-700 border border-purple-200"
                            : mem.type === "Task"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-slate-100 text-slate-700 border border-slate-200"
                        }`}
                      >
                        {mem.type}
                      </span>

                      {/* Ingestion Status Badge */}
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold ${
                          isRetained
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : isFailed
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {isRetained ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Retained
                          </>
                        ) : isFailed ? (
                          <>
                            <AlertTriangle className="w-3 h-3 text-rose-600" /> Sync Failed
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3 text-amber-600" /> Ingestion Pending
                          </>
                        )}
                      </span>
                    </div>

                    <button
                      onClick={() => handleDeleteMemory(mem.id)}
                      className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                      title="Delete memory"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Title & Content */}
                  <h3 className="font-bold text-sm text-slate-900 mt-3">{mem.title}</h3>
                  <p className="text-xs text-slate-600 mt-2 whitespace-pre-wrap leading-relaxed line-clamp-4">
                    {mem.content}
                  </p>
                </div>

                {/* Footer Info */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col gap-2">
                  {mem.tags && mem.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {mem.tags.map((t) => (
                        <span key={t} className="text-[10px] px-2 py-0.2 rounded-full bg-slate-100 text-slate-600 font-medium">
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                    <span>By <strong className="text-slate-700">{mem.contributor}</strong></span>
                    <span>{new Date(mem.created_at).toLocaleDateString()}</span>
                  </div>

                  {isFailed && (
                    <button
                      onClick={() => handleRetryIngestion(mem.id)}
                      className="w-full mt-1 py-1 rounded bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                    >
                      <RotateCw className="w-3 h-3" /> Retry Sync
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Memory Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <BrainCircuit className="w-4 h-4 text-indigo-600" />
                <span>Retain New Memory</span>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddMemory} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Memory Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Firebase Auth & Role Configuration"
                  value={modalTitle}
                  onChange={(e) => setModalTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-indigo-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Content / Evidence *</label>
                <textarea
                  rows={4}
                  placeholder="Provide detailed facts, decisions, or code architecture details..."
                  value={modalContent}
                  onChange={(e) => setModalContent(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-indigo-600"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Type</label>
                  <select
                    value={modalType}
                    onChange={(e) => setModalType(e.target.value as MemoryType)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-indigo-600"
                  >
                    <option value="General">General Fact</option>
                    <option value="Decision">Decision Rationale</option>
                    <option value="Task">Task Assignment</option>
                    <option value="Meeting">Meeting Note</option>
                    <option value="Document">Document Chunk</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tags</label>
                  <input
                    type="text"
                    placeholder="Comma separated"
                    value={modalTags}
                    onChange={(e) => setModalTags(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-all"
                >
                  {isSubmitting ? "Retaining..." : "Retain Memory"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
