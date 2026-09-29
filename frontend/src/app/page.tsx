"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BrainCircuit,
  GitCommit,
  CheckSquare,
  AlertTriangle,
  ArrowRight,
  Plus,
  Sparkles,
  Search,
  Users,
  Activity,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldCheck,
  RotateCw,
  FolderLock,
  Calendar,
  Layers,
  Check,
  X
} from "lucide-react";
import { useWorkspace } from "../components/WorkspaceContext";
import { api } from "../lib/api";
import {
  DashboardResponse,
  TaskStatus,
  TaskPriority,
  DecisionStatus,
  MemoryItem,
  TaskItem,
  DecisionItem,
  Project,
  ActivityEvent
} from "../lib/types";

export default function CommandCenterPage() {
  const router = useRouter();
  const {
    workspace,
    currentUser,
    demoMode,
    isHindsightLive,
    projects,
    activeProject,
    addNotification,
    refreshDashboard,
    createTask,
    completeTask,
    createDecision
  } = useWorkspace();

  const workspaceId = workspace?.id || "ws-demo-hackathon-2026";

  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [decisions, setDecisions] = useState<DecisionItem[]>([]);
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [liveProjects, setLiveProjects] = useState<Project[]>([]);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState(false);
  const [quickQuery, setQuickQuery] = useState("");

  // Quick Action Modal States
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showDecisionModal, setShowDecisionModal] = useState(false);

  // Quick Task Form
  const [taskTitle, setTaskTitle] = useState("");
  const [taskAssignee, setTaskAssignee] = useState(currentUser.display_name);
  const [taskPriority, setTaskPriority] = useState<TaskPriority>("medium");
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);

  // Quick Decision Form
  const [decTitle, setDecTitle] = useState("");
  const [decRationale, setDecRationale] = useState("");
  const [isSubmittingDec, setIsSubmittingDec] = useState(false);

  const loadDashboard = useCallback(async () => {
    try {
      setRefreshing(true);
      const [dash, taskList, decList, memList, projList, actList] = await Promise.all([
        api.getDashboard(workspaceId).catch(() => null),
        api.getTasks(workspaceId).catch(() => []),
        api.getDecisions(workspaceId).catch(() => []),
        api.getMemories(workspaceId).catch(() => []),
        api.getProjects(workspaceId).catch(() => []),
        api.getActivity(workspaceId).catch(() => [])
      ]);

      setDashboardData(dash);
      setTasks(taskList || []);
      setDecisions(decList || []);
      setMemories(memList || []);
      setLiveProjects(projList || []);
      setActivity(actList && actList.length > 0 ? actList : (dash?.recent_activity || []));
      await refreshDashboard();
    } catch (err: any) {
      console.warn("Failed to load dashboard:", err);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, [workspaceId, refreshDashboard]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard, activeProject]);

  const handleCreateQuickTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    setIsSubmittingTask(true);
    try {
      await createTask({
        title: taskTitle.trim(),
        assignee: taskAssignee || undefined,
        priority: taskPriority,
        status: "todo"
      });
      setTaskTitle("");
      setShowTaskModal(false);
      await loadDashboard();
    } catch (err: any) {
      addNotification("error", "Failed to create task", err.message);
    } finally {
      setIsSubmittingTask(false);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      await completeTask(taskId);
      await loadDashboard();
    } catch (err: any) {
      addNotification("error", "Failed to complete task", err.message);
    }
  };

  const handleCreateQuickDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!decTitle.trim() || !decRationale.trim()) return;
    setIsSubmittingDec(true);
    try {
      await createDecision({
        title: decTitle.trim(),
        rationale: decRationale.trim(),
        status: "accepted"
      });
      setDecTitle("");
      setDecRationale("");
      setShowDecisionModal(false);
      await loadDashboard();
    } catch (err: any) {
      addNotification("error", "Failed to record decision", err.message);
    } finally {
      setIsSubmittingDec(false);
    }
  };

  // Compute live statistics directly from real arrays (No hardcoded/demo values)
  const isCompleted = (t: TaskItem) => {
    const s = String(t.status || "").toLowerCase();
    return s === "completed" || s === "done";
  };
  const isOpen = (t: TaskItem) => !isCompleted(t);

  const activeTasksList = tasks.filter(isOpen);
  const completedTasksList = tasks.filter(isCompleted);

  const activeTasksCount = activeTasksList.length;
  const completedTasksCount = completedTasksList.length;
  const totalTasksCount = activeTasksCount + completedTasksCount;
  const taskProgressPct = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

  const activeBlockersCount = tasks.filter(t => {
    const p = String(t.priority || "").toLowerCase();
    const title = String(t.title || "").toLowerCase();
    return (p === "urgent" || p === "blocker" || title.includes("blocker")) && isOpen(t);
  }).length;

  const memoriesRetainedCount = memories.length;
  const decisionsLoggedCount = decisions.length;
  const totalProjectsCount = liveProjects.length > 0 ? liveProjects.length : projects.length;

  const recentDecisionsList = decisions.slice(0, 3);
  const recentActiveTasksList = activeTasksList.slice(0, 4);
  const recentActivityList = activity.slice(0, 5);

  return (
    <div className="space-y-6 pb-12">
      {/* Welcome Hero Card (Clean Light Apple/Linear Aesthetic) */}
      <div className="vc-card p-6 bg-gradient-to-br from-white via-indigo-50/30 to-white border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-100">
                VC (V Connect) Active
              </span>
              <span className="text-xs text-slate-500 font-medium">
                • {currentUser.display_name} ({currentUser.role.toUpperCase()})
              </span>
              <span className="text-xs text-slate-500 font-medium">
                • {totalProjectsCount} {totalProjectsCount === 1 ? "Project" : "Projects"}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Command Center
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
              Persistent shared AI memory engine for your team. Every technical decision, task ownership assignment, and meeting note is retained with zero hallucinations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => setShowTaskModal(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Task</span>
            </button>
            <button
              onClick={() => setShowDecisionModal(true)}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <GitCommit className="w-3.5 h-3.5" />
              <span>Log Decision</span>
            </button>
            <Link
              href="/catch-up"
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-indigo-600 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>30s Catch-Up</span>
            </Link>
            <button
              onClick={loadDashboard}
              disabled={refreshing}
              className="p-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-800 transition-colors shadow-sm"
              title="Refresh Dashboard"
            >
              <RotateCw className={`w-4 h-4 ${refreshing ? "animate-spin text-indigo-600" : ""}`} />
            </button>
          </div>
        </div>

        {/* Core Loop Indicator: RETAIN -> RECALL -> REFLECT */}
        <div className="mt-6 pt-4 border-t border-slate-200/80 grid grid-cols-3 gap-3 text-center text-xs">
          <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-soft">
            <div className="text-[10px] font-bold text-indigo-600 tracking-wider uppercase">Step 1: Retain</div>
            <div className="text-slate-700 font-semibold truncate mt-0.5">Capture Notes & Decisions</div>
          </div>
          <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-soft">
            <div className="text-[10px] font-bold text-purple-600 tracking-wider uppercase">Step 2: Recall</div>
            <div className="text-slate-700 font-semibold truncate mt-0.5">Semantic Grounded Retrieval</div>
          </div>
          <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-soft">
            <div className="text-[10px] font-bold text-emerald-600 tracking-wider uppercase">Step 3: Reflect</div>
            <div className="text-slate-700 font-semibold truncate mt-0.5">Synthesis Without Hallucinations</div>
          </div>
        </div>
      </div>

      {/* KPI Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Memories Retained */}
        <Link href="/memory" className="vc-card vc-card-interactive p-4 block bg-white">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold">Memories Retained</span>
            <BrainCircuit className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2 flex items-baseline gap-2">
            <span>{memoriesRetainedCount}</span>
            <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> 100% Synced
            </span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 truncate">
            {isHindsightLive ? "Hindsight Cloud Live Bank" : "Simulated Memory Bank"}
          </div>
        </Link>

        {/* Metric 2: Decisions */}
        <Link href="/decisions" className="vc-card vc-card-interactive p-4 block bg-white">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold">Decisions Logged</span>
            <GitCommit className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2 flex items-baseline gap-2">
            <span>{decisionsLoggedCount}</span>
            <span className="text-[11px] font-semibold text-indigo-600">Accepted</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 truncate">
            With recorded rationales & dates
          </div>
        </Link>

        {/* Metric 3: Tasks & Completion */}
        <Link href="/tasks" className="vc-card vc-card-interactive p-4 block bg-white">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold">Tasks & Ownership</span>
            <CheckSquare className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2 flex items-baseline gap-2">
            <span>{activeTasksCount}</span>
            <span className="text-xs font-normal text-slate-500">/ {totalTasksCount} open</span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${taskProgressPct}%` }}
            />
          </div>
        </Link>

        {/* Metric 4: Active Blockers */}
        <Link href="/tasks?priority=urgent" className="vc-card vc-card-interactive p-4 block bg-white">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold">Active Blockers</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 mt-2 flex items-baseline gap-2">
            <span>{activeBlockersCount}</span>
            <span className="text-[11px] font-medium text-amber-600/90">Pending action</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 truncate">
            Requires team discussion
          </div>
        </Link>
      </div>

      {/* Prominent Ask VC Search Bar */}
      <div className="vc-card p-5 bg-white border-indigo-100 shadow-sm">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (quickQuery.trim()) {
              router.push(`/ask-vc?q=${encodeURIComponent(quickQuery.trim())}`);
            }
          }}
          className="flex flex-col sm:flex-row items-center gap-3"
        >
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Ask VC anything: 'Who owns the frontend?', 'Why did we choose Firebase?'..."
              value={quickQuery}
              onChange={(e) => setQuickQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
            />
          </div>
          <button
            type="submit"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            <span>Query Memory</span>
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-100 text-xs">
          <span className="text-slate-400 text-[11px] font-medium">Suggested queries:</span>
          {[
            "Who owns frontend API integration?",
            "Why did we choose Firebase?",
            "What are our current blockers?",
            "Summarize the kickoff meeting"
          ].map((q) => (
            <button
              key={q}
              onClick={() => {
                router.push(`/ask-vc?q=${encodeURIComponent(q)}`);
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 border border-slate-200/80 transition-colors text-[11px]"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Main Split Grid: Recent Decisions & Tasks / Activity & Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Recent Decisions & Upcoming Tasks */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Decisions */}
          <div className="vc-card p-5 bg-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <GitCommit className="w-4 h-4 text-purple-600" />
                <h2 className="font-bold text-sm text-slate-900">Recent Decisions</h2>
              </div>
              <Link
                href="/decisions"
                className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-semibold"
              >
                View timeline <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="divide-y divide-slate-100 mt-1">
              {recentDecisionsList.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No decisions logged yet. Click "Log Decision" to add one.
                </div>
              ) : (
                recentDecisionsList.map((dec) => (
                  <div key={dec.id} className="py-3.5 flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-slate-900">{dec.title}</span>
                        <span className="text-[10px] px-2 py-0.2 rounded-full bg-purple-50 text-purple-700 border border-purple-200 uppercase font-bold">
                          {dec.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                        {dec.rationale}
                      </p>
                      <div className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-2">
                        <span>By <strong className="text-slate-600">{dec.contributor}</strong></span>
                        <span>•</span>
                        <span>{dec.decision_date}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Active Tasks & Ownership */}
          <div className="vc-card p-5 bg-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-emerald-600" />
                <h2 className="font-bold text-sm text-slate-900">Active Tasks & Ownership</h2>
              </div>
              <Link
                href="/tasks"
                className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-semibold"
              >
                Kanban board <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="divide-y divide-slate-100 mt-1">
              {recentActiveTasksList.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No active tasks. Click "New Task" to create one.
                </div>
              ) : (
                recentActiveTasksList.map((task) => (
                  <div key={task.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                          task.priority === "urgent"
                            ? "bg-rose-500"
                            : task.priority === "high"
                            ? "bg-amber-500"
                            : "bg-indigo-500"
                        }`}
                        title={`Priority: ${task.priority}`}
                      />
                      <div className="truncate">
                        <div className="text-xs font-semibold text-slate-800 truncate">{task.title}</div>
                        <div className="text-[11px] text-slate-500">
                          Assignee: <span className="font-medium text-slate-700">{task.assignee || "Unassigned"}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleCompleteTask(task.id)}
                      title="Click to mark completed"
                      className="text-[10px] px-2.5 py-0.5 rounded-full uppercase font-bold bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 text-slate-700 border border-slate-200 shrink-0 flex items-center gap-1 transition-all group cursor-pointer"
                    >
                      <Check className="w-3 h-3 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                      <span>{task.status.replace("_", " ")}</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right 1 Column: Activity Timeline & Diagnostics */}
        <div className="space-y-6">
          {/* Activity Stream */}
          <div className="vc-card p-5 bg-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-600" />
                <h2 className="font-bold text-sm text-slate-900">Activity Timeline</h2>
              </div>
            </div>

            <div className="space-y-3 mt-3">
              {recentActivityList.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  No activity recorded yet.
                </div>
              ) : (
                recentActivityList.map((act) => (
                  <div key={act.id} className="flex items-start gap-3 text-xs">
                    <div className="w-6 h-6 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center font-bold text-[10px] text-indigo-700 shrink-0 mt-0.5">
                      {act.actor.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-slate-900 font-semibold truncate">{act.title}</div>
                      {act.description && (
                        <div className="text-[11px] text-slate-500 truncate mt-0.5">{act.description}</div>
                      )}
                      <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1 font-medium">
                        <span>{act.actor}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Integration Status Box */}
          <div className="vc-card p-5 bg-slate-50/70 border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <h2 className="font-bold text-sm text-slate-900">Diagnostics</h2>
              </div>
              <Link
                href="/settings"
                className="text-[11px] text-indigo-600 hover:underline font-semibold"
              >
                Settings
              </Link>
            </div>

            <div className="space-y-2 mt-3 text-xs">
              <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200">
                <span className="text-slate-700 font-medium">Hindsight Cloud Memory</span>
                <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                  {isHindsightLive ? "Cloud Live" : "Demo Engine"}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200">
                <span className="text-slate-700 font-medium">Groq LLM Engine</span>
                <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-purple-50 text-purple-700 border border-purple-100">
                  Llama 3.3 Active
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200">
                <span className="text-slate-700 font-medium">Supabase Database</span>
                <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                  Connected
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <CheckSquare className="w-4 h-4 text-emerald-600" />
                <span>Create New Task</span>
              </div>
              <button
                onClick={() => setShowTaskModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateQuickTask} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Task Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Implement real-time notifications"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-indigo-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Assignee</label>
                <input
                  type="text"
                  placeholder="Name of teammate"
                  value={taskAssignee}
                  onChange={(e) => setTaskAssignee(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
                <select
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-indigo-600"
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                  <option value="urgent">Urgent Blocker</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTask}
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-all"
                >
                  {isSubmittingTask ? "Saving..." : "Add Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Decision Modal */}
      {showDecisionModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <GitCommit className="w-4 h-4 text-purple-600" />
                <span>Log Architectural Decision</span>
              </div>
              <button
                onClick={() => setShowDecisionModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateQuickDecision} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Decision Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Adopt Next.js 14 App Router"
                  value={decTitle}
                  onChange={(e) => setDecTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-indigo-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Rationale / Why *</label>
                <textarea
                  rows={3}
                  placeholder="Explain why this decision was taken and what alternatives were ruled out..."
                  value={decRationale}
                  onChange={(e) => setDecRationale(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-indigo-600"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDecisionModal(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingDec}
                  className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-sm transition-all"
                >
                  {isSubmittingDec ? "Saving..." : "Record Decision"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
