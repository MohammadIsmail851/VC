"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  ShieldCheck,
  GraduationCap,
  Mail,
  RotateCw,
  Search,
  Trash2,
  X,
  Crown,
  CheckCircle2,
  ShieldAlert
} from "lucide-react";
import { useWorkspace } from "../../components/WorkspaceContext";
import { api } from "../../lib/api";
import { WorkspaceMember } from "../../lib/types";

export default function TeamPage() {
  const { currentUser, isAdmin, addNotification } = useWorkspace();
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  // Invite Modal State
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("student");
  const [isInviting, setIsInviting] = useState(false);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const res = await api.getMembers("ws-demo-hackathon-2026");
      setMembers(res);
    } catch (err: any) {
      console.warn("Failed to load members:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
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
      loadMembers();
    } catch (err: any) {
      addNotification("error", "Invite Failed", err.message);
    } finally {
      setIsInviting(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      await api.updateMemberRole("ws-demo-hackathon-2026", userId, newRole);
      addNotification("info", "Role Updated", `Role updated to ${newRole}`);
      loadMembers();
    } catch (err: any) {
      addNotification("error", "Role Update Failed", err.message);
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
      loadMembers();
    } catch (err: any) {
      addNotification("error", "Remove Failed", err.message);
    }
  };

  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      m.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || m.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const adminCount = members.filter((m) => m.role === "admin" || m.role === "owner").length;
  const studentCount = members.filter((m) => m.role === "student").length;

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              Team Directory & Roles
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100">
              {members.length} Members
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage collaborators, assign ownership permissions, and review member contributions.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={loadMembers}
            disabled={loading}
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-indigo-600" : ""}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setShowInviteModal(true)}
            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>Invite Member</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="vc-card p-4 bg-white flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Total Collaborators</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{members.length}</p>
          </div>
          <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600">
            <Users className="w-5 h-5" />
          </div>
        </div>
        <div className="vc-card p-4 bg-white flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-purple-600 uppercase tracking-wide">Admins & Owners</p>
            <p className="text-2xl font-bold text-purple-700 mt-1">{adminCount}</p>
          </div>
          <div className="p-2.5 bg-purple-50 rounded-xl text-purple-600">
            <Crown className="w-5 h-5" />
          </div>
        </div>
        <div className="vc-card p-4 bg-white flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-blue-600 uppercase tracking-wide">Students & Builders</p>
            <p className="text-2xl font-bold text-blue-700 mt-1">{studentCount}</p>
          </div>
          <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600">
            <GraduationCap className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          {["all", "owner", "admin", "student", "mentor"].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-colors ${
                roleFilter === r
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Members Table */}
      <div className="vc-card bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="px-4 py-3">Member</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role & Permissions</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMembers.map((m) => {
                const isSelf = m.user_id === currentUser.uid;
                const isOwner = m.role === "owner";
                return (
                  <tr key={m.user_id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            m.avatar_url ||
                            `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.display_name.replace(" ", "")}`
                          }
                          alt={m.display_name}
                          className="w-8 h-8 rounded-full object-cover border border-slate-200"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 text-xs">{m.display_name}</span>
                            {isSelf && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 font-semibold">
                                You
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 capitalize">
                            ID: {m.user_id}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{m.email}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      {isOwner ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <Crown className="w-3 h-3 text-amber-600" />
                          <span>Workspace Owner</span>
                        </span>
                      ) : isAdmin ? (
                        <select
                          value={m.role}
                          onChange={(e) => handleUpdateRole(m.user_id, e.target.value)}
                          className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        >
                          <option value="student">Student</option>
                          <option value="admin">Administrator</option>
                          <option value="mentor">Mentor</option>
                          <option value="viewer">Viewer</option>
                        </select>
                      ) : (
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            m.role === "admin"
                              ? "bg-purple-50 text-purple-700 border border-purple-200"
                              : "bg-blue-50 text-blue-700 border border-blue-200"
                          }`}
                        >
                          {m.role === "admin" ? (
                            <ShieldCheck className="w-3 h-3" />
                          ) : (
                            <GraduationCap className="w-3 h-3" />
                          )}
                          <span className="capitalize">{m.role}</span>
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {!isOwner && !isSelf && isAdmin && (
                        <button
                          onClick={() => handleRemoveMember(m.user_id, m.display_name)}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Remove Member"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-indigo-600" />
                <span>Invite New Team Member</span>
              </h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleInvite} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Alex Johnson"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="alex@team.edu"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                >
                  <option value="student">Student (Developer / Contributor)</option>
                  <option value="admin">Administrator (Full Access)</option>
                  <option value="mentor">Mentor (Reviewer)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isInviting || !inviteName.trim() || !inviteEmail.trim()}
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
                >
                  {isInviting ? "Inviting..." : "Send Invite"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
