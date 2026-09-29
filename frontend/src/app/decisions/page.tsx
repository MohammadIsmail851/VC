"use client";

import React, { useState, useEffect } from "react";
import {
  GitCommit,
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Sparkles,
  Link as LinkIcon,
  ShieldCheck,
  Search,
  ArrowUpDown,
  Trash2,
  Edit2,
  RotateCw
} from "lucide-react";
import { useWorkspace } from "../../components/WorkspaceContext";
import { api } from "../../lib/api";
import { DecisionItem, DecisionStatus } from "../../lib/types";

export default function DecisionTimelinePage() {
  const {
    workspace,
    currentUser,
    addNotification,
    refreshDashboard,
    createDecision,
    updateDecision,
    deleteDecision
  } = useWorkspace();
  const [decisions, setDecisions] = useState<DecisionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  // Add Decision Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalRationale, setModalRationale] = useState("");
  const [modalAlternatives, setModalAlternatives] = useState("");
  const [modalStatus, setModalStatus] = useState<DecisionStatus>("accepted");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Decision Modal
  const [editingDecision, setEditingDecision] = useState<DecisionItem | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editRationale, setEditRationale] = useState("");
  const [editAlternatives, setEditAlternatives] = useState("");
  const [editStatus, setEditStatus] = useState<DecisionStatus>("accepted");
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  const loadDecisions = async () => {
    try {
      setLoading(true);
      const statusParam = selectedStatus !== "ALL" ? (selectedStatus as DecisionStatus) : undefined;
      const data = await api.getDecisions("ws-demo-hackathon-2026", statusParam);
      setDecisions(data);
    } catch (err: any) {
      console.warn("Failed to load decisions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDecisions();
  }, [selectedStatus]);

  const handleAddDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalTitle.trim() || !modalRationale.trim()) {
      addNotification("warning", "Missing fields", "Title and rationale are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createDecision({
        title: modalTitle.trim(),
        rationale: modalRationale.trim(),
        alternatives: modalAlternatives.trim() || undefined,
        status: modalStatus
      });

      setShowAddModal(false);
      setModalTitle("");
      setModalRationale("");
      setModalAlternatives("");
      loadDecisions();
    } catch (err: any) {
      addNotification("error", "Error creating decision", err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDecision = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      await deleteDecision(id);
      loadDecisions();
    } catch (err: any) {
      addNotification("error", "Delete failed", err.message);
    }
  };

  const handleOpenEdit = (dec: DecisionItem) => {
    setEditingDecision(dec);
    setEditTitle(dec.title);
    setEditRationale(dec.rationale);
    setEditAlternatives(dec.alternatives || "");
    setEditStatus(dec.status);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDecision || !editTitle.trim()) return;
    setIsSubmittingEdit(true);
    try {
      await updateDecision(editingDecision.id, {
        title: editTitle.trim(),
        rationale: editRationale.trim(),
        alternatives: editAlternatives.trim() || undefined,
        status: editStatus
      });
      addNotification("success", "Decision Updated", `Saved changes to "${editTitle.trim()}".`);
      setEditingDecision(null);
      loadDecisions();
    } catch (err: any) {
      addNotification("error", "Update failed", err.message);
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleStatusChange = async (decId: string, newStatus: DecisionStatus) => {
    try {
      await updateDecision(decId, { status: newStatus });
      addNotification("info", "Status Updated", `Decision status set to ${newStatus}`);
      loadDecisions();
    } catch (err: any) {
      addNotification("error", "Failed to update status", err.message);
    }
  };

  // Filter & Sort Decisions
  const filteredDecisions = decisions
    .filter(d => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        d.title.toLowerCase().includes(q) ||
        d.rationale.toLowerCase().includes(q) ||
        (d.contributor && d.contributor.toLowerCase().includes(q)) ||
        (d.alternatives && d.alternatives.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      const dateA = new Date(a.decision_date || a.created_at).getTime();
      const dateB = new Date(b.decision_date || b.created_at).getTime();
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <GitCommit className="w-5 h-5 text-purple-600" />
              Decision Timeline
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 font-semibold border border-purple-100">
              Architectural Context
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Chronological log of technical decisions, rationale, alternatives ruled out, and contributor attributions.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Log Decision</span>
        </button>
      </div>

      {/* Filter, Search & Ordering Bar */}
      <div className="vc-card p-3 bg-white flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 ml-1" />
          <input
            type="text"
            placeholder="Search decisions, rationale, contributors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs text-slate-900 placeholder-slate-400 bg-transparent focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Status Tabs */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            {["ALL", "accepted", "proposed", "superseded"].map((status) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                  selectedStatus === status
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {status.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Sort Order Toggle */}
          <button
            onClick={() => setSortOrder(prev => prev === "newest" ? "oldest" : "newest")}
            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
            title="Toggle chronological sorting"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span className="capitalize">{sortOrder}</span>
          </button>

          <button
            onClick={loadDecisions}
            disabled={loading}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors"
            title="Refresh Decisions"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-purple-600" : ""}`} />
          </button>
        </div>
      </div>

      {/* Decision Timeline List */}
      <div className="space-y-4">
        {filteredDecisions.length === 0 ? (
          <div className="vc-card p-12 bg-white text-center text-xs text-slate-400 space-y-2">
            <GitCommit className="w-8 h-8 text-slate-300 mx-auto" />
            <div className="font-semibold text-slate-700">No decisions match criteria.</div>
            <p className="text-slate-400">Click "Log Decision" to record your team's choices.</p>
          </div>
        ) : (
          filteredDecisions.map((dec) => (
            <div
              key={dec.id}
              className="vc-card p-5 bg-white border-slate-200 hover:border-slate-300 transition-all space-y-3 relative overflow-hidden"
            >
              {/* Top Row: Title, Status & Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="font-bold text-sm text-slate-900 tracking-tight">
                    {dec.title}
                  </h3>
                  <select
                    value={dec.status}
                    onChange={(e) => handleStatusChange(dec.id, e.target.value as DecisionStatus)}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border focus:outline-none cursor-pointer uppercase ${
                      dec.status === "accepted"
                        ? "bg-purple-50 text-purple-700 border-purple-200"
                        : dec.status === "proposed"
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : dec.status === "superseded"
                        ? "bg-slate-100 text-slate-600 border-slate-200"
                        : "bg-rose-50 text-rose-700 border-rose-200"
                    }`}
                  >
                    <option value="accepted">Accepted</option>
                    <option value="proposed">Proposed</option>
                    <option value="superseded">Superseded</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <span className="text-[11px] font-medium text-slate-500">{dec.decision_date}</span>
                  <button
                    onClick={() => handleOpenEdit(dec)}
                    className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                    title="Edit Decision"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteDecision(dec.id, dec.title)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                    title="Delete Decision"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Rationale Context */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-700 leading-relaxed">
                <span className="font-semibold text-slate-900">Rationale: </span>
                {dec.rationale}
              </div>

              {/* Alternatives considered */}
              {dec.alternatives && (
                <div className="text-xs text-slate-500 leading-relaxed pl-1">
                  <span className="font-semibold text-slate-700">Alternatives ruled out: </span>
                  {dec.alternatives}
                </div>
              )}

              {/* Metadata Footer */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span>Contributor: <strong className="text-slate-700">{dec.contributor}</strong></span>
                </div>
                {dec.linked_memory_id && (
                  <span className="flex items-center gap-1 text-[10px] text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>Memory Grounded</span>
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Decision Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <GitCommit className="w-4 h-4 text-purple-600" />
                <span>Log New Technical Decision</span>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddDecision} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Decision Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Use Supabase PostgreSQL over MongoDB"
                  value={modalTitle}
                  onChange={(e) => setModalTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-indigo-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Rationale / Why *</label>
                <textarea
                  rows={3}
                  placeholder="Explain why this option was chosen..."
                  value={modalRationale}
                  onChange={(e) => setModalRationale(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-indigo-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Alternatives Ruled Out</label>
                <textarea
                  rows={2}
                  placeholder="What other tools/approaches were evaluated?"
                  value={modalAlternatives}
                  onChange={(e) => setModalAlternatives(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                <select
                  value={modalStatus}
                  onChange={(e) => setModalStatus(e.target.value as DecisionStatus)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-indigo-600"
                >
                  <option value="accepted">Accepted (Agreed by team)</option>
                  <option value="proposed">Proposed (Under review)</option>
                  <option value="superseded">Superseded (Replaced)</option>
                  <option value="rejected">Rejected</option>
                </select>
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
                  className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-sm transition-all"
                >
                  {isSubmitting ? "Recording..." : "Record Decision"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Decision Modal */}
      {editingDecision && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <Edit2 className="w-4 h-4 text-purple-600" />
                <span>Edit Decision</span>
              </div>
              <button onClick={() => setEditingDecision(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Decision Title *</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-indigo-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Rationale *</label>
                <textarea
                  rows={3}
                  value={editRationale}
                  onChange={(e) => setEditRationale(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-indigo-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Alternatives Ruled Out</label>
                <textarea
                  rows={2}
                  value={editAlternatives}
                  onChange={(e) => setEditAlternatives(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as DecisionStatus)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-indigo-600"
                >
                  <option value="accepted">Accepted</option>
                  <option value="proposed">Proposed</option>
                  <option value="superseded">Superseded</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingDecision(null)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-sm transition-all"
                >
                  {isSubmittingEdit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
