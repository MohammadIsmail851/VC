"use client";

import React, { useState, useEffect } from "react";
import {
  CheckSquare,
  Plus,
  Filter,
  Columns,
  List as ListIcon,
  Clock,
  AlertTriangle,
  History,
  X,
  UserCheck,
  Calendar,
  AlertCircle,
  Search,
  Trash2,
  Edit2,
  CheckCircle2,
  RotateCw,
  MoreVertical
} from "lucide-react";
import { useWorkspace } from "../../components/WorkspaceContext";
import { api } from "../../lib/api";
import { TaskItem, TaskEvent, TaskStatus, TaskPriority } from "../../lib/types";

const COLUMNS: { id: TaskStatus; label: string; dotColor: string; bgBadge: string }[] = [
  { id: "todo", label: "To Do", dotColor: "bg-slate-400", bgBadge: "bg-slate-100 text-slate-700" },
  { id: "in_progress", label: "In Progress", dotColor: "bg-indigo-500", bgBadge: "bg-indigo-50 text-indigo-700" },
  { id: "review", label: "In Review", dotColor: "bg-purple-500", bgBadge: "bg-purple-50 text-purple-700" },
  { id: "done", label: "Done", dotColor: "bg-emerald-500", bgBadge: "bg-emerald-50 text-emerald-700" }
];

export default function TasksOwnershipPage() {
  const { workspace, currentUser, addNotification } = useWorkspace();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");
  const [searchQuery, setSearchQuery] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");

  // History Modal
  const [selectedTaskHistory, setSelectedTaskHistory] = useState<TaskItem | null>(null);
  const [taskEvents, setTaskEvents] = useState<TaskEvent[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Add Task Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalDesc, setModalDesc] = useState("");
  const [modalAssignee, setModalAssignee] = useState("Aisha Patel");
  const [modalPriority, setModalPriority] = useState<TaskPriority>("medium");
  const [modalStatus, setModalStatus] = useState<TaskStatus>("todo");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Task Modal
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editAssignee, setEditAssignee] = useState("");
  const [editPriority, setEditPriority] = useState<TaskPriority>("medium");
  const [editStatus, setEditStatus] = useState<TaskStatus>("todo");
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (assigneeFilter !== "ALL") params.assignee = assigneeFilter;
      if (priorityFilter !== "ALL") params.priority = priorityFilter;

      const data = await api.getTasks("ws-demo-hackathon-2026", params);
      setTasks(data);
    } catch (err: any) {
      console.warn("Failed to load tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [assigneeFilter, priorityFilter]);

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await api.updateTask("ws-demo-hackathon-2026", taskId, { status: newStatus });
      addNotification("info", "Task Updated", `Status changed to ${newStatus.replace("_", " ")}`);
      loadTasks();
    } catch (err: any) {
      addNotification("error", "Update failed", err.message);
    }
  };

  const handleReassign = async (taskId: string, newAssignee: string) => {
    try {
      await api.updateTask("ws-demo-hackathon-2026", taskId, { assignee: newAssignee });
      addNotification("success", "Task Reassigned", `Reassigned to ${newAssignee}`);
      loadTasks();
    } catch (err: any) {
      addNotification("error", "Reassignment failed", err.message);
    }
  };

  const handleDeleteTask = async (taskId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      await api.deleteTask("ws-demo-hackathon-2026", taskId);
      addNotification("success", "Task Deleted", `"${title}" was removed.`);
      loadTasks();
    } catch (err: any) {
      addNotification("error", "Delete failed", err.message);
    }
  };

  const handleOpenEdit = (task: TaskItem) => {
    setEditingTask(task);
    setEditTitle(task.title);
    setEditDesc(task.description || "");
    setEditAssignee(task.assignee || "");
    setEditPriority(task.priority);
    setEditStatus(task.status);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask || !editTitle.trim()) return;
    setIsSubmittingEdit(true);
    try {
      await api.updateTask("ws-demo-hackathon-2026", editingTask.id, {
        title: editTitle.trim(),
        description: editDesc.trim(),
        assignee: editAssignee.trim() || undefined,
        priority: editPriority,
        status: editStatus
      });
      addNotification("success", "Task Updated", `Saved changes to "${editTitle.trim()}".`);
      setEditingTask(null);
      loadTasks();
    } catch (err: any) {
      addNotification("error", "Update failed", err.message);
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleViewHistory = async (task: TaskItem) => {
    setSelectedTaskHistory(task);
    setHistoryLoading(true);
    try {
      const history = await api.getTaskHistory("ws-demo-hackathon-2026", task.id);
      setTaskEvents(history);
    } catch (err: any) {
      addNotification("error", "History error", err.message);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalTitle.trim()) {
      addNotification("warning", "Missing Title", "Task title is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.createTask("ws-demo-hackathon-2026", {
        title: modalTitle.trim(),
        description: modalDesc.trim() || undefined,
        assignee: modalAssignee.trim() || undefined,
        priority: modalPriority,
        status: modalStatus
      });

      addNotification("success", "Task Created", `"${modalTitle.trim()}" added to board.`);
      setShowAddModal(false);
      setModalTitle("");
      setModalDesc("");
      loadTasks();
    } catch (err: any) {
      addNotification("error", "Failed to create task", err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter tasks by search query
  const filteredTasks = tasks.filter(t => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.title.toLowerCase().includes(q) ||
      (t.description && t.description.toLowerCase().includes(q)) ||
      (t.assignee && t.assignee.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-indigo-600" />
              Tasks & Ownership
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100">
              Audit Log Tracked
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Assign ownership, track delivery status, and inspect verifiable audit history timelines.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode("kanban")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === "kanban"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === "table"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <ListIcon className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="vc-card p-3 bg-white flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 ml-1" />
          <input
            type="text"
            placeholder="Search tasks, descriptions, assignees..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs text-slate-900 placeholder-slate-400 bg-transparent focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold text-slate-700">Assignee:</span>
            <select
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Members</option>
              <option value="Aisha Patel">Aisha Patel</option>
              <option value="Rahul Sharma">Rahul Sharma</option>
              <option value="Kiran Rao">Kiran Rao</option>
              <option value="Demo User">Demo User</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-slate-600">
            <span className="font-semibold text-slate-700">Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Priorities</option>
              <option value="urgent">Urgent Blocker</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
          </div>

          <button
            onClick={loadTasks}
            disabled={loading}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors"
            title="Refresh Tasks"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-indigo-600" : ""}`} />
          </button>
        </div>
      </div>

      {/* Main View: Kanban or Table */}
      {viewMode === "kanban" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {COLUMNS.map((col) => {
            const colTasks = filteredTasks.filter((t) => t.status === col.id);
            return (
              <div key={col.id} className="vc-card bg-slate-50/70 p-3.5 border-slate-200/90 flex flex-col min-h-[450px]">
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${col.dotColor}`} />
                    <span className="font-bold text-xs text-slate-900">{col.label}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${col.bgBadge}`}>
                    {colTasks.length}
                  </span>
                </div>

                {/* Column Cards */}
                <div className="space-y-3 flex-1 overflow-y-auto pr-0.5">
                  {colTasks.length === 0 ? (
                    <div className="h-32 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-xs font-medium">
                      No tasks in {col.label}
                    </div>
                  ) : (
                    colTasks.map((task) => (
                      <div
                        key={task.id}
                        className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-soft hover:shadow-card hover:border-slate-300 transition-all space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="font-semibold text-xs text-slate-900 leading-snug">
                            {task.title}
                          </div>
                          <span
                            className={`text-[9px] px-2 py-0.5 rounded uppercase font-bold shrink-0 ${
                              task.priority === "urgent"
                                ? "bg-rose-50 text-rose-700 border border-rose-200"
                                : task.priority === "high"
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : "bg-slate-100 text-slate-600 border border-slate-200"
                            }`}
                          >
                            {task.priority}
                          </span>
                        </div>

                        {task.description && (
                          <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                            {task.description}
                          </p>
                        )}

                        {/* Assignee & Status Quick Actions */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center font-bold text-[9px] text-indigo-700">
                              {(task.assignee || "U").charAt(0)}
                            </div>
                            <select
                              value={task.assignee || ""}
                              onChange={(e) => handleReassign(task.id, e.target.value)}
                              className="text-[11px] bg-transparent text-slate-600 font-medium focus:outline-none cursor-pointer hover:text-indigo-600"
                            >
                              <option value="Aisha Patel">Aisha Patel</option>
                              <option value="Rahul Sharma">Rahul Sharma</option>
                              <option value="Kiran Rao">Kiran Rao</option>
                              <option value="Demo User">Demo User</option>
                            </select>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleViewHistory(task)}
                              className="p-1 text-slate-400 hover:text-indigo-600 rounded transition-colors"
                              title="Audit History"
                            >
                              <History className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenEdit(task)}
                              className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                              title="Edit Task"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteTask(task.id, task.title)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                              title="Delete Task"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Move status dropdown */}
                        <div className="pt-1 flex items-center justify-between">
                          <span className="text-[10px] text-slate-400">Move to:</span>
                          <select
                            value={task.status}
                            onChange={(e) => handleStatusChange(task.id, e.target.value as TaskStatus)}
                            className="text-[10px] font-semibold bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-slate-700 focus:outline-none"
                          >
                            <option value="todo">To Do</option>
                            <option value="in_progress">In Progress</option>
                            <option value="review">In Review</option>
                            <option value="done">Done</option>
                          </select>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="vc-card overflow-hidden bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="px-4 py-3">Task Title</th>
                  <th className="px-4 py-3">Assignee</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                      No matching tasks found.
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map((task) => (
                    <tr key={task.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-900">{task.title}</div>
                        {task.description && (
                          <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{task.description}</div>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                          <span>{task.assignee || "Unassigned"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <select
                          value={task.status}
                          onChange={(e) => handleStatusChange(task.id, e.target.value as TaskStatus)}
                          className="text-[11px] font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-800"
                        >
                          <option value="todo">To Do</option>
                          <option value="in_progress">In Progress</option>
                          <option value="review">In Review</option>
                          <option value="done">Done</option>
                        </select>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                            task.priority === "urgent"
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : task.priority === "high"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {task.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right space-x-1">
                        <button
                          onClick={() => handleViewHistory(task)}
                          className="px-2 py-1 rounded bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 text-xs font-medium transition-colors"
                        >
                          Audit Log
                        </button>
                        <button
                          onClick={() => handleOpenEdit(task)}
                          className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteTask(task.id, task.title)}
                          className="px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-medium transition-colors"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <CheckSquare className="w-4 h-4 text-indigo-600" />
                <span>Create New Task</span>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Task Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Implement Hindsight cloud connection"
                  value={modalTitle}
                  onChange={(e) => setModalTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-indigo-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Provide context and requirements..."
                  value={modalDesc}
                  onChange={(e) => setModalDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Assignee</label>
                  <select
                    value={modalAssignee}
                    onChange={(e) => setModalAssignee(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-indigo-600"
                  >
                    <option value="Aisha Patel">Aisha Patel (Frontend)</option>
                    <option value="Rahul Sharma">Rahul Sharma (Backend)</option>
                    <option value="Kiran Rao">Kiran Rao (QA)</option>
                    <option value="Demo User">Demo User (Lead)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    value={modalPriority}
                    onChange={(e) => setModalPriority(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-indigo-600"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                    <option value="urgent">Urgent Blocker</option>
                  </select>
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
                  {isSubmitting ? "Creating..." : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {editingTask && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <Edit2 className="w-4 h-4 text-indigo-600" />
                <span>Edit Task</span>
              </div>
              <button onClick={() => setEditingTask(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Task Title *</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-indigo-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Assignee</label>
                  <select
                    value={editAssignee}
                    onChange={(e) => setEditAssignee(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none"
                  >
                    <option value="Aisha Patel">Aisha Patel</option>
                    <option value="Rahul Sharma">Rahul Sharma</option>
                    <option value="Kiran Rao">Kiran Rao</option>
                    <option value="Demo User">Demo User</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full px-2 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none"
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="review">In Review</option>
                    <option value="done">Done</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value as any)}
                    className="w-full px-2 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
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

      {/* Task Audit History Modal */}
      {selectedTaskHistory && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-lg w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">Audit History Log</h3>
              </div>
              <button
                onClick={() => setSelectedTaskHistory(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 shrink-0">
              <div className="font-semibold text-xs text-slate-900">{selectedTaskHistory.title}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Current Assignee: <strong className="text-slate-800">{selectedTaskHistory.assignee || "Unassigned"}</strong> • Status: {selectedTaskHistory.status.replace("_", " ")}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {historyLoading ? (
                <div className="py-8 text-center text-xs text-slate-400">Loading history events...</div>
              ) : taskEvents.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">No previous audit events recorded.</div>
              ) : (
                taskEvents.map((ev) => (
                  <div key={ev.id} className="p-3 rounded-xl bg-white border border-slate-200/80 text-xs space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-slate-800">{ev.actor}</span>
                      <span className="text-slate-400">
                        {new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(ev.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    {ev.notes && <div className="text-[11px] text-slate-600">{ev.notes}</div>}
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                      {ev.previous_owner !== ev.new_owner && (
                        <span>Owner: {ev.previous_owner || "None"} → <strong>{ev.new_owner}</strong></span>
                      )}
                      {ev.previous_status !== ev.new_status && (
                        <span>Status: {ev.previous_status} → <strong>{ev.new_status}</strong></span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
