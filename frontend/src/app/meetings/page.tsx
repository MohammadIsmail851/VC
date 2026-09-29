"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  Sparkles,
  Plus,
  CheckCircle2,
  ListTodo,
  GitCommit,
  HelpCircle,
  Clock,
  ArrowRight,
  RotateCw,
  Users,
  CheckSquare,
  Calendar as CalendarIcon,
  Trash2,
  Edit2,
  X,
  List,
  ChevronLeft,
  ChevronRight,
  Video
} from "lucide-react";
import { useWorkspace } from "../../components/WorkspaceContext";
import { api } from "../../lib/api";
import { MeetingItem, StructuredMeetingData, ActionItemExtracted } from "../../lib/types";

export default function MeetingsPage() {
  const { workspace, currentUser, addNotification } = useWorkspace();
  const [meetings, setMeetings] = useState<MeetingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"record" | "calendar" | "all">("record");

  // Form State for AI Structuring
  const [title, setTitle] = useState("");
  const [transcript, setTranscript] = useState("");
  const [participants, setParticipants] = useState("Aisha Patel, Rahul Sharma, Kiran Rao, Demo User");
  const [isProcessing, setIsProcessing] = useState(false);

  // Form State for Scheduling
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleTitle, setScheduleTitle] = useState("");
  const [scheduleDate, setScheduleDate] = useState(new Date().toISOString().split("T")[0]);
  const [scheduleTime, setScheduleTime] = useState("10:00");
  const [scheduleParticipants, setScheduleParticipants] = useState("Aisha Patel, Rahul Sharma, Kiran Rao");
  const [scheduleAgenda, setScheduleAgenda] = useState("");
  const [isSubmittingSchedule, setIsSubmittingSchedule] = useState(false);

  // Edit Meeting State
  const [editingMeeting, setEditingMeeting] = useState<MeetingItem | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editSummary, setEditSummary] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editParticipants, setEditParticipants] = useState("");
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Review & Confirmation Screen State
  const [activeMeetingForReview, setActiveMeetingForReview] = useState<MeetingItem | null>(null);
  const [confirmedDecisions, setConfirmedDecisions] = useState<string[]>([]);
  const [confirmedTasks, setConfirmedTasks] = useState<ActionItemExtracted[]>([]);
  const [isFinalizing, setIsFinalizing] = useState(false);

  const loadMeetings = async () => {
    try {
      setLoading(true);
      const data = await api.getMeetings("ws-demo-hackathon-2026");
      setMeetings(data);
    } catch (err: any) {
      console.warn("Failed to load meetings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMeetings();
  }, []);

  const handleStructureMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !transcript.trim()) {
      addNotification("warning", "Missing fields", "Title and transcript/notes are required.");
      return;
    }

    setIsProcessing(true);
    try {
      const parts = participants.split(",").map((p) => p.trim()).filter(Boolean);
      const newMeeting = await api.createMeeting("ws-demo-hackathon-2026", {
        title,
        transcript,
        participants: parts
      });

      addNotification("success", "AI Structuring Complete", "Review extracted decisions and tasks before confirming.");
      
      // Open confirmation screen
      setActiveMeetingForReview(newMeeting);
      if (newMeeting.structured_data) {
        setConfirmedDecisions(newMeeting.structured_data.decisions || []);
        setConfirmedTasks(newMeeting.structured_data.action_items || []);
      }
      loadMeetings();
    } catch (err: any) {
      addNotification("error", "Structuring failed", err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmAndSave = async () => {
    if (!activeMeetingForReview) return;

    setIsFinalizing(true);
    try {
      const res = await api.processMeeting("ws-demo-hackathon-2026", activeMeetingForReview.id, {
        confirmed_decisions: confirmedDecisions,
        confirmed_tasks: confirmedTasks
      });

      addNotification("success", "Meeting Processed & Retained", res.message);
      setActiveMeetingForReview(null);
      setTitle("");
      setTranscript("");
      loadMeetings();
    } catch (err: any) {
      addNotification("error", "Confirmation failed", err.message);
    } finally {
      setIsFinalizing(false);
    }
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleTitle.trim()) return;
    setIsSubmittingSchedule(true);
    try {
      const fullDate = `${scheduleDate}T${scheduleTime}:00`;
      const parts = scheduleParticipants.split(",").map((p) => p.trim()).filter(Boolean);
      await api.scheduleMeeting("ws-demo-hackathon-2026", {
        title: scheduleTitle.trim(),
        meeting_date: fullDate,
        participants: parts,
        agenda: scheduleAgenda.trim() || undefined,
        status: "scheduled"
      });
      addNotification("success", "Meeting Scheduled", `Scheduled for ${new Date(fullDate).toLocaleDateString()} at ${scheduleTime}`);
      setShowScheduleModal(false);
      setScheduleTitle("");
      setScheduleAgenda("");
      loadMeetings();
    } catch (err: any) {
      addNotification("error", "Failed to schedule", err.message);
    } finally {
      setIsSubmittingSchedule(false);
    }
  };

  const handleDeleteMeeting = async (meetingId: string, meetingTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${meetingTitle}"?`)) return;
    try {
      await api.deleteMeeting("ws-demo-hackathon-2026", meetingId);
      addNotification("success", "Meeting Deleted", `"${meetingTitle}" was removed.`);
      loadMeetings();
    } catch (err: any) {
      addNotification("error", "Delete failed", err.message);
    }
  };

  const handleOpenEdit = (m: MeetingItem) => {
    setEditingMeeting(m);
    setEditTitle(m.title);
    setEditSummary(m.summary || m.transcript || "");
    setEditDate(new Date(m.meeting_date).toISOString().split("T")[0]);
    setEditParticipants(m.participants ? m.participants.join(", ") : "");
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMeeting || !editTitle.trim()) return;
    setIsSubmittingEdit(true);
    try {
      const parts = editParticipants.split(",").map((p) => p.trim()).filter(Boolean);
      await api.updateMeeting("ws-demo-hackathon-2026", editingMeeting.id, {
        title: editTitle.trim(),
        summary: editSummary.trim(),
        participants: parts,
        meeting_date: `${editDate}T12:00:00`
      });
      addNotification("success", "Meeting Updated", `Saved changes to "${editTitle.trim()}".`);
      setEditingMeeting(null);
      loadMeetings();
    } catch (err: any) {
      addNotification("error", "Update failed", err.message);
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              AI Meeting Notes & Calendar
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 font-semibold border border-purple-100">
              Groq LLM Powered
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Capture transcripts, auto-extract action items, schedule syncs, and maintain a shared calendar.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => setShowScheduleModal(true)}
            className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
          >
            <CalendarIcon className="w-3.5 h-3.5 text-indigo-600" />
            <span>Schedule Sync</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("record");
              setTitle("Daily Team Standup");
              setTranscript("Discussed frontend Next.js 14 layout, agreed to use Tailwind CSS for UI components. Rahul will finish FastAPI endpoints by 3 PM. Blocked on Hindsight live bank key.");
            }}
            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Paste Sample Note</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab("record")}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
            activeTab === "record"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Record & Structure</span>
        </button>
        <button
          onClick={() => setActiveTab("calendar")}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
            activeTab === "calendar"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <CalendarIcon className="w-3.5 h-3.5" />
          <span>Meeting Calendar</span>
        </button>
        <button
          onClick={() => setActiveTab("all")}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
            activeTab === "all"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <List className="w-3.5 h-3.5" />
          <span>All Meetings ({meetings.length})</span>
        </button>
      </div>

      {/* Review & Confirmation Screen */}
      {activeMeetingForReview && (
        <div className="vc-card p-6 bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/40 border-indigo-200 shadow-md space-y-5 animate-in fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-indigo-100">
            <div>
              <div className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">Step 2: Explicit Confirmation</div>
              <h2 className="text-base font-bold text-slate-900 mt-0.5">
                Review & Confirm: {activeMeetingForReview.title}
              </h2>
            </div>
            <button
              onClick={() => setActiveMeetingForReview(null)}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Groq LLM automatically structured your raw notes into structured records. Edit or deselect items before confirming to persist them into Hindsight Cloud and team timelines.
          </p>

          {/* AI Generated Summary */}
          {activeMeetingForReview.structured_data?.summary && (
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-xs">
              <div className="font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Executive Summary</span>
              </div>
              <p className="text-slate-600 leading-relaxed">{activeMeetingForReview.structured_data.summary}</p>
            </div>
          )}

          {/* Extracted Decisions */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-purple-800 flex items-center gap-1.5">
              <GitCommit className="w-3.5 h-3.5 text-purple-600" />
              <span>Extracted Technical Decisions ({confirmedDecisions.length})</span>
            </div>
            {confirmedDecisions.map((dec, idx) => (
              <div key={idx} className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-purple-100 text-xs">
                <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                <input
                  type="text"
                  value={dec}
                  onChange={(e) => {
                    const next = [...confirmedDecisions];
                    next[idx] = e.target.value;
                    setConfirmedDecisions(next);
                  }}
                  className="w-full text-slate-800 font-medium bg-transparent focus:outline-none"
                />
              </div>
            ))}
          </div>

          {/* Extracted Action Items */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
              <ListTodo className="w-3.5 h-3.5 text-emerald-600" />
              <span>Extracted Action Items & Ownership ({confirmedTasks.length})</span>
            </div>
            {confirmedTasks.map((task, idx) => (
              <div key={idx} className="p-2.5 rounded-xl bg-white border border-emerald-100 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <input
                  type="text"
                  value={task.title}
                  onChange={(e) => {
                    const next = [...confirmedTasks];
                    next[idx].title = e.target.value;
                    setConfirmedTasks(next);
                  }}
                  className="w-full text-slate-800 font-medium bg-transparent focus:outline-none"
                />
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-slate-400">Assignee:</span>
                  <input
                    type="text"
                    value={task.assignee || ""}
                    onChange={(e) => {
                      const next = [...confirmedTasks];
                      next[idx].assignee = e.target.value;
                      setConfirmedTasks(next);
                    }}
                    placeholder="Assignee"
                    className="px-2 py-0.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-700 w-28"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Confirmation Action Button */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              onClick={() => setActiveMeetingForReview(null)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-medium hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmAndSave}
              disabled={isFinalizing}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isFinalizing ? "Retaining Memories..." : "Confirm & Retain All Records"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab: Record & Structure Form */}
      {activeTab === "record" && !activeMeetingForReview && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <form onSubmit={handleStructureMeeting} className="vc-card p-5 bg-white space-y-4 shadow-sm">
              <div className="font-bold text-sm text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Submit Meeting Notes or Audio Transcript</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Meeting Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Architecture Alignment Sync, Sprint 2 Review"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-indigo-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Participants</label>
                <input
                  type="text"
                  value={participants}
                  onChange={(e) => setParticipants(e.target.value)}
                  placeholder="Comma separated names..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Raw Notes or Transcript *</label>
                <textarea
                  rows={6}
                  placeholder="Paste raw conversation transcript, bullet point notes, or action items discussed during the call..."
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-mono leading-relaxed focus:outline-none focus:border-indigo-600"
                  required
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-slate-400">
                  Parsed via Groq Llama 3.3 for structured extraction.
                </span>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isProcessing ? "Analyzing with Groq..." : "Extract & Structure"}</span>
                </button>
              </div>
            </form>
          </div>

          <div className="space-y-4">
            <div className="vc-card p-5 bg-indigo-50/40 border-indigo-100">
              <h3 className="font-bold text-xs text-indigo-900 flex items-center gap-1.5 mb-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Zero Context Loss</span>
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                VC automatically parses decisions and task ownership from your meeting notes. Nothing gets buried in Slack or lost after the sync.
              </p>
            </div>

            <div className="vc-card p-4 bg-white space-y-2">
              <div className="font-semibold text-xs text-slate-800">Recent Syncs:</div>
              {meetings.slice(0, 3).map((m) => (
                <div key={m.id} className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                  <div className="font-semibold text-slate-900 truncate">{m.title}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {new Date(m.meeting_date).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Calendar View */}
      {activeTab === "calendar" && (
        <div className="vc-card p-5 bg-white space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-indigo-600" />
              <h2 className="font-bold text-sm text-slate-900">Sprint & Meeting Calendar</h2>
            </div>
            <button
              onClick={() => setShowScheduleModal(true)}
              className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              <span>Schedule</span>
            </button>
          </div>

          {/* Interactive Calendar Days Grid */}
          <div className="grid grid-cols-1 md:grid-cols-7 gap-2 text-xs">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="text-center font-bold text-slate-400 py-1 uppercase text-[10px]">
                {day}
              </div>
            ))}
            
            {/* Generate calendar cells */}
            {Array.from({ length: 14 }).map((_, i) => {
              const dayOffset = i - 3;
              const dateObj = new Date();
              dateObj.setDate(dateObj.getDate() + dayOffset);
              const dateStr = dateObj.toISOString().split("T")[0];
              const isToday = dayOffset === 0;

              // Find meetings matching date
              const dayMeetings = meetings.filter(m => {
                const mDate = new Date(m.meeting_date).toISOString().split("T")[0];
                return mDate === dateStr;
              });

              return (
                <div
                  key={i}
                  className={`min-h-[100px] p-2 rounded-xl border flex flex-col justify-between transition-colors ${
                    isToday
                      ? "bg-indigo-50/50 border-indigo-200"
                      : "bg-slate-50/40 border-slate-100 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[11px] font-bold ${isToday ? "text-indigo-700" : "text-slate-600"}`}>
                      {dateObj.getDate()} {dateObj.toLocaleDateString([], { month: "short" })}
                    </span>
                    {isToday && (
                      <span className="text-[9px] px-1 py-0.2 rounded bg-indigo-600 text-white font-bold">
                        Today
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 mt-1 overflow-y-auto max-h-16">
                    {dayMeetings.map((m) => (
                      <div
                        key={m.id}
                        className="px-1.5 py-0.5 rounded text-[10px] bg-white border border-indigo-100 shadow-soft font-semibold text-slate-800 truncate"
                        title={m.title}
                      >
                        {m.title}
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => {
                      setScheduleDate(dateStr);
                      setShowScheduleModal(true);
                    }}
                    className="text-[10px] text-slate-400 hover:text-indigo-600 font-medium self-end mt-1"
                  >
                    + sync
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab: All Meetings List */}
      {(activeTab === "all" || activeTab === "record") && (
        <div className="vc-card p-5 bg-white space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500" />
              <span>Recorded Meetings & Sessions ({meetings.length})</span>
            </h2>
            <button
              onClick={loadMeetings}
              disabled={loading}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800"
            >
              <RotateCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-indigo-600" : ""}`} />
            </button>
          </div>

          <div className="space-y-3">
            {meetings.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No meetings recorded yet. Use the form above to record your first sync.
              </div>
            ) : (
              meetings.map((m) => (
                <div
                  key={m.id}
                  className="p-4 rounded-xl bg-slate-50/50 border border-slate-200 hover:border-slate-300 transition-all space-y-2.5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="font-semibold text-xs text-slate-900">{m.title}</div>
                      <span className={`text-[10px] px-2 py-0.2 rounded-full font-bold uppercase ${
                        m.status === "scheduled"
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      }`}>
                        {m.status || "Completed"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-[11px] text-slate-400">
                        {new Date(m.meeting_date).toLocaleDateString()}
                      </span>
                      <button
                        onClick={() => handleOpenEdit(m)}
                        className="p-1 text-slate-400 hover:text-slate-700 transition-colors"
                        title="Edit Meeting"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteMeeting(m.id, m.title)}
                        className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                        title="Delete Meeting"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {m.summary && (
                    <p className="text-xs text-slate-600 leading-relaxed bg-white p-2.5 rounded-lg border border-slate-100">
                      {m.summary}
                    </p>
                  )}

                  {m.participants && m.participants.length > 0 && (
                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>{m.participants.join(", ")}</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Schedule Meeting Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <CalendarIcon className="w-4 h-4 text-indigo-600" />
                <span>Schedule Team Meeting</span>
              </div>
              <button onClick={() => setShowScheduleModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Meeting Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Sprint Planning, Architecture Sync"
                  value={scheduleTitle}
                  onChange={(e) => setScheduleTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-indigo-600"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-indigo-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Time</label>
                  <input
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-indigo-600"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Participants</label>
                <input
                  type="text"
                  value={scheduleParticipants}
                  onChange={(e) => setScheduleParticipants(e.target.value)}
                  placeholder="Comma separated names..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Agenda / Key Topics</label>
                <textarea
                  rows={2}
                  value={scheduleAgenda}
                  onChange={(e) => setScheduleAgenda(e.target.value)}
                  placeholder="Outline key discussion items..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingSchedule}
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-all"
                >
                  {isSubmittingSchedule ? "Scheduling..." : "Schedule Meeting"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Meeting Modal */}
      {editingMeeting && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <Edit2 className="w-4 h-4 text-indigo-600" />
                <span>Edit Meeting Details</span>
              </div>
              <button onClick={() => setEditingMeeting(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-indigo-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-indigo-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Participants</label>
                <input
                  type="text"
                  value={editParticipants}
                  onChange={(e) => setEditParticipants(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Summary / Notes</label>
                <textarea
                  rows={3}
                  value={editSummary}
                  onChange={(e) => setEditSummary(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingMeeting(null)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-all"
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
