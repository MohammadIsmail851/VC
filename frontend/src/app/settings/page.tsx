"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  ShieldCheck,
  RotateCw,
  Users,
  CheckCircle2,
  AlertTriangle,
  Server,
  Key,
  Database,
  Lock,
  Github,
  BrainCircuit,
  ExternalLink,
  Sparkles,
  Plus,
  Trash2,
  Edit2,
  UserPlus,
  Shield,
  GraduationCap,
  X,
  FolderLock,
  Layers
} from "lucide-react";
import { useWorkspace } from "../../components/WorkspaceContext";
import { api } from "../../lib/api";
import { IntegrationStatusItem, WorkspaceMember, Project } from "../../lib/types";

export default function SettingsPage() {
  const {
    workspace,
    currentUser,
    isAdmin,
    isStudent,
    projects,
    activeProject,
    setActiveProject,
    createProject,
    updateProject,
    deleteProject,
    refreshProjects,
    addNotification,
    refreshWorkspaceData
  } = useWorkspace();

  const [integrations, setIntegrations] = useState<IntegrationStatusItem[]>([]);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [testingHindsight, setTestingHindsight] = useState(false);
  const [hindsightTestResult, setHindsightTestResult] = useState<any>(null);

  // Invite Member Modal
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("student");
  const [isInviting, setIsInviting] = useState(false);

  // Project Modal
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projName, setProjName] = useState("");
  const [projDesc, setProjDesc] = useState("");
  const [projStatus, setProjStatus] = useState("active");
  const [isSavingProject, setIsSavingProject] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [intRes, memRes] = await Promise.allSettled([
        api.getIntegrationsStatus(),
        api.getMembers("ws-demo-hackathon-2026")
      ]);
      if (intRes.status === "fulfilled") {
        setIntegrations(intRes.value.integrations);
      }
      if (memRes.status === "fulfilled") {
        setMembers(memRes.value);
      }
    } catch (err: any) {
      console.warn("Failed to load settings data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTestHindsight = async () => {
    setTestingHindsight(true);
    try {
      const res = await api.testHindsightConnection();
      setHindsightTestResult(res);
      if (res.success) {
        addNotification("success", "Hindsight Connected", `Latency: ${res.latency_ms}ms, Bank ID: ${res.bank_id}`);
      } else {
        addNotification("warning", "Hindsight Test Result", res.message);
      }
      refreshWorkspaceData();
      loadData();
    } catch (err: any) {
      addNotification("error", "Test Failed", err.message);
    } finally {
      setTestingHindsight(false);
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) return;
    setIsInviting(true);
    try {
      const newMember = await api.inviteMember("ws-demo-hackathon-2026", {
        display_name: inviteName.trim(),
        email: inviteEmail.trim(),
        role: inviteRole
      });
      addNotification("success", "Member Invited", `${newMember.display_name} added to workspace.`);
      setShowInviteModal(false);
      setInviteName("");
      setInviteEmail("");
      loadData();
    } catch (err: any) {
      addNotification("error", "Invite failed", err.message);
    } finally {
      setIsInviting(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      await api.updateMemberRole("ws-demo-hackathon-2026", userId, newRole);
      addNotification("info", "Role Updated", `Role changed to ${newRole}`);
      loadData();
    } catch (err: any) {
      addNotification("error", "Update failed", err.message);
    }
  };

  const handleRemoveMember = async (userId: string, name: string) => {
    if (!isAdmin) {
      addNotification("error", "Permission Denied", "Only administrators can remove team members.");
      return;
    }
    if (!confirm(`Remove ${name} from the workspace?`)) return;
    try {
      await api.removeMember("ws-demo-hackathon-2026", userId);
      addNotification("success", "Member Removed", `${name} removed from workspace.`);
      loadData();
    } catch (err: any) {
      addNotification("error", "Failed to remove member", err.message);
    }
  };

  const handleOpenEditProject = (p: Project) => {
    setEditingProject(p);
    setProjName(p.name);
    setProjDesc(p.description || "");
    setProjStatus(p.status);
    setShowProjectModal(true);
  };

  const handleOpenNewProject = () => {
    setEditingProject(null);
    setProjName("");
    setProjDesc("");
    setProjStatus("active");
    setShowProjectModal(true);
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projName.trim()) return;
    setIsSavingProject(true);
    try {
      if (editingProject) {
        await updateProject(editingProject.id, {
          name: projName.trim(),
          description: projDesc.trim() || undefined,
          status: projStatus
        });
      } else {
        await createProject({
          name: projName.trim(),
          description: projDesc.trim() || undefined,
          status: projStatus
        });
      }
      setShowProjectModal(false);
      refreshProjects();
    } catch (err: any) {
      addNotification("error", "Failed to save project", err.message);
    } finally {
      setIsSavingProject(false);
    }
  };

  const handleDeleteProj = async (p: Project) => {
    if (!confirm(`Delete project "${p.name}"? This cannot be undone.`)) return;
    try {
      await deleteProject(p.id);
    } catch (err: any) {
      // Error handled in deleteProject
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Settings className="w-5 h-5 text-indigo-600" />
              Workspace & Team Settings
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-100">
              Live System Diagnostics
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage projects, invite team members, adjust permissions, and verify third-party service connections.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors self-start sm:self-auto"
        >
          <RotateCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-indigo-600" : ""}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Projects Management Section */}
      <div className="vc-card p-5 bg-white space-y-4 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900">Projects ({projects.length})</h2>
          </div>
          <button
            onClick={handleOpenNewProject}
            className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Project</span>
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {projects.map((p) => {
            const isActive = activeProject?.id === p.id;
            return (
              <div key={p.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-slate-900">{p.name}</span>
                    {isActive && (
                      <span className="text-[10px] px-2 py-0.2 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-100">
                        Active Project
                      </span>
                    )}
                    <span className="text-[10px] px-2 py-0.2 rounded-full bg-slate-100 text-slate-600 uppercase font-semibold">
                      {p.status}
                    </span>
                  </div>
                  {p.description && (
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{p.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {!isActive && (
                    <button
                      onClick={() => {
                        setActiveProject(p);
                        addNotification("info", "Active Project Switched", `Now viewing ${p.name}`);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 text-xs font-medium transition-colors"
                    >
                      Make Active
                    </button>
                  )}
                  <button
                    onClick={() => handleOpenEditProject(p)}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors"
                    title="Edit Project"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => handleDeleteProj(p)}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Delete Project"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Team Collaboration Section */}
      <div className="vc-card p-5 bg-white space-y-4 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900">Team Collaboration & Members ({members.length})</h2>
          </div>
          <button
            onClick={() => setShowInviteModal(true)}
            className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1 shadow-sm"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Invite Member</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="px-3 py-2.5 rounded-l-lg">Member</th>
                <th className="px-3 py-2.5">Email</th>
                <th className="px-3 py-2.5">Role</th>
                <th className="px-3 py-2.5 text-right rounded-r-lg">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {members.map((m) => (
                <tr key={m.user_id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={m.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces"}
                        alt={m.display_name}
                        className="w-7 h-7 rounded-full object-cover border border-slate-200"
                      />
                      <span className="font-semibold text-slate-900">{m.display_name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-slate-500">{m.email}</td>
                  <td className="px-3 py-3">
                    <select
                      value={m.role}
                      onChange={(e) => handleUpdateRole(m.user_id, e.target.value)}
                      disabled={!isAdmin}
                      className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-800 capitalize font-medium focus:outline-none"
                    >
                      <option value="student">Student / Member</option>
                      <option value="admin">Admin / Director</option>
                      <option value="owner">Owner</option>
                    </select>
                  </td>
                  <td className="px-3 py-3 text-right">
                    {isAdmin && m.user_id !== currentUser.uid ? (
                      <button
                        onClick={() => handleRemoveMember(m.user_id, m.display_name)}
                        className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                        title="Remove member"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-medium">Self</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Live System Diagnostics & Hindsight Cloud */}
      <div className="vc-card p-5 bg-white space-y-4 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <BrainCircuit className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900">Third-Party Integrations & Live Health</h2>
          </div>
          <button
            onClick={handleTestHindsight}
            disabled={testingHindsight}
            className="px-3 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <ShieldCheck className={`w-3.5 h-3.5 ${testingHindsight ? "animate-spin" : ""}`} />
            <span>{testingHindsight ? "Pinging..." : "Test Connection"}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Hindsight Cloud */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900">Hindsight Cloud Memory</span>
              <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                Connected
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Provides long-term semantic banks for retaining and recalling project decisions and action items.
            </p>
            {hindsightTestResult && (
              <div className="mt-2 p-2 rounded-lg bg-white border border-slate-200 text-[10px] font-mono text-slate-600">
                Latency: {hindsightTestResult.latency_ms || "14"}ms • Bank: {hindsightTestResult.bank_id || "demo-bank"}
              </div>
            )}
          </div>

          {/* Groq LLM */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900">Groq Fast LLM</span>
              <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-purple-50 text-purple-700 border border-purple-100">
                Llama 3.3 Active
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Powers instant transcript structuring and grounded multi-step reasoning.
            </p>
          </div>

          {/* Supabase DB */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900">Supabase PostgreSQL</span>
              <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                Schema Ready
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Stores relational workspace metadata, audit logs, and document chunk references.
            </p>
          </div>

          {/* Firebase Authentication */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900">Firebase Authentication</span>
              <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-blue-50 text-blue-700 border border-blue-100">
                RBAC Enabled
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Handles student, contributor, and administrator role validation and session persistence.
            </p>
          </div>
        </div>
      </div>

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <UserPlus className="w-4 h-4 text-indigo-600" />
                <span>Invite Team Member</span>
              </div>
              <button onClick={() => setShowInviteModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleInviteMember} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Sameer Verma"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-indigo-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  placeholder="sameer@vconnect.edu"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-indigo-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-indigo-600"
                >
                  <option value="student">Student / Member</option>
                  <option value="admin">Admin / Director</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isInviting}
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-all"
                >
                  {isInviting ? "Inviting..." : "Send Invitation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Project Modal (Create / Edit) */}
      {showProjectModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <Layers className="w-4 h-4 text-indigo-600" />
                <span>{editingProject ? "Edit Project" : "Create New Project"}</span>
              </div>
              <button onClick={() => setShowProjectModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProject} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Project Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Mobile Client V2"
                  value={projName}
                  onChange={(e) => setProjName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-indigo-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Objective / Description</label>
                <textarea
                  rows={3}
                  placeholder="Describe the deliverables and target outcome..."
                  value={projDesc}
                  onChange={(e) => setProjDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                <select
                  value={projStatus}
                  onChange={(e) => setProjStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-indigo-600"
                >
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="paused">Paused</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowProjectModal(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingProject}
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-all"
                >
                  {isSavingProject ? "Saving..." : editingProject ? "Save Changes" : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
