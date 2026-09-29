"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquareCode,
  BrainCircuit,
  GitCommit,
  CheckSquare,
  FileText,
  Sparkles,
  BarChart3,
  FolderLock,
  Settings,
  ShieldCheck,
  ChevronDown,
  Search,
  Bell,
  ExternalLink,
  Plus,
  Play,
  CheckCircle2,
  X,
  AlertCircle,
  Menu,
  Activity,
  Layers,
  LogOut,
  UserCheck,
  GraduationCap,
  Shield,
  FolderPlus,
  Trash2,
  Edit2,
  Clock,
  ArrowRight
} from "lucide-react";
import { useWorkspace } from "./WorkspaceContext";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Command Center", href: "/", icon: LayoutDashboard },
  { label: "Ask VC", href: "/ask-vc", icon: MessageSquareCode, badge: "AI" },
  { label: "Team Memory", href: "/memory", icon: BrainCircuit },
  { label: "Decision Timeline", href: "/decisions", icon: GitCommit },
  { label: "Tasks & Ownership", href: "/tasks", icon: CheckSquare },
  { label: "AI Meeting Notes", href: "/meetings", icon: FileText },
  { label: "Instant Catch-up", href: "/catch-up", icon: Sparkles, badge: "30s" },
  { label: "Reflect & Insights", href: "/insights", icon: BarChart3 },
  { label: "Knowledge Hub", href: "/documents", icon: FolderLock },
  { label: "Team Settings", href: "/settings", icon: Settings },
];

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const {
    workspace,
    currentUser,
    isAuthenticated,
    isAdmin,
    isStudent,
    demoMode,
    isHindsightLive,
    activePersona,
    switchPersona,
    loginAsStudent,
    loginAsAdmin,
    loginWithEmail,
    logout,
    projects,
    activeProject,
    setActiveProject,
    createProject,
    deleteProject,
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    addNotification
  } = useWorkspace();

  // Local UI States
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showJudgeBanner, setShowJudgeBanner] = useState(true);
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showProjectMenu, setShowProjectMenu] = useState(false);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // New Project Form
  const [newProjName, setNewProjName] = useState("");
  const [newProjDesc, setNewProjDesc] = useState("");
  const [isSubmittingProject, setIsSubmittingProject] = useState(false);

  // Email login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginRole, setLoginRole] = useState<"student" | "admin">("student");

  // Keyboard shortcut for search (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowSearchModal(prev => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleCreateProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName.trim()) {
      addNotification("warning", "Missing project name", "Please provide a name for the project.");
      return;
    }
    setIsSubmittingProject(true);
    try {
      await createProject({
        name: newProjName.trim(),
        description: newProjDesc.trim() || undefined,
        status: "active"
      });
      setNewProjName("");
      setNewProjDesc("");
      setShowNewProjectModal(false);
    } catch (err: any) {
      addNotification("error", "Failed to create project", err.message);
    } finally {
      setIsSubmittingProject(false);
    }
  };

  const handleQuickSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setShowSearchModal(false);
    router.push(`/ask-vc?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans antialiased selection:bg-indigo-100 selection:text-indigo-900">
      {/* Toast Notifications (Top-Right Floating) */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        {notifications.slice(0, 3).map(n => (
          <div
            key={n.id}
            className={`pointer-events-auto p-4 rounded-xl border shadow-lg flex items-start gap-3 backdrop-blur-md transition-all duration-200 ${
              n.type === "success"
                ? "bg-white/95 border-emerald-200 text-slate-800"
                : n.type === "error"
                ? "bg-white/95 border-rose-200 text-slate-800"
                : n.type === "warning"
                ? "bg-white/95 border-amber-200 text-slate-800"
                : "bg-white/95 border-indigo-200 text-slate-800"
            }`}
          >
            {n.type === "success" ? (
              <div className="p-1 rounded-lg bg-emerald-50 text-emerald-600 shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            ) : n.type === "error" ? (
              <div className="p-1 rounded-lg bg-rose-50 text-rose-600 shrink-0">
                <AlertCircle className="w-4 h-4" />
              </div>
            ) : (
              <div className="p-1 rounded-lg bg-indigo-50 text-indigo-600 shrink-0">
                <Activity className="w-4 h-4" />
              </div>
            )}
            <div className="flex-1 text-xs">
              <div className="font-semibold text-slate-900">{n.title}</div>
              {n.message && <div className="text-slate-500 mt-0.5 leading-relaxed">{n.message}</div>}
            </div>
            <button
              onClick={() => removeNotification(n.id)}
              className="text-slate-400 hover:text-slate-600 p-0.5 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Judge Walkthrough Quick Bar */}
      {showJudgeBanner && (
        <div className="bg-gradient-to-r from-indigo-50 via-slate-50 to-indigo-50/60 border-b border-indigo-100/80 px-4 py-2 text-xs flex items-center justify-between z-40 transition-all">
          <div className="flex items-center gap-2 overflow-x-auto py-0.5">
            <span className="px-2 py-0.5 rounded-full bg-indigo-600 text-white font-semibold text-[10px] tracking-wide flex items-center gap-1.5 shrink-0 shadow-sm">
              <Play className="w-2.5 h-2.5 fill-current" />
              JUDGE WALKTHROUGH
            </span>
            <span className="text-slate-300 hidden sm:inline">|</span>
            <div className="flex items-center gap-2 text-slate-600 text-[11px] font-medium">
              <Link href="/meetings" className="hover:text-indigo-600 hover:underline shrink-0">1. Record Meeting</Link>
              <span className="text-slate-300">→</span>
              <Link href="/decisions" className="hover:text-indigo-600 hover:underline shrink-0">2. Decision Timeline</Link>
              <span className="text-slate-300">→</span>
              <Link href="/ask-vc" className="hover:text-indigo-600 hover:underline shrink-0">3. Ask VC AI</Link>
              <span className="text-slate-300">→</span>
              <Link href="/catch-up" className="hover:text-indigo-600 hover:underline shrink-0">4. 30s Catch-Up</Link>
              <span className="text-slate-300">→</span>
              <Link href="/insights" className="hover:text-indigo-600 hover:underline shrink-0">5. Reflect & Insights</Link>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0 ml-2">
            <Link
              href="/settings"
              className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium text-[11px]"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Live Health Check</span>
            </Link>
            <button
              onClick={() => setShowJudgeBanner(false)}
              className="text-slate-400 hover:text-slate-600 p-0.5"
              title="Dismiss banner"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-slate-900/30 z-30 lg:hidden backdrop-blur-sm transition-opacity"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar (Clean Apple/Linear Light Style) */}
        <aside
          className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200/80 flex flex-col transition-transform duration-200 ease-in-out shadow-sm lg:shadow-none ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
        >
          {/* Brand Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-600 flex items-center justify-center font-black text-white text-base shadow-sm group-hover:scale-105 transition-transform">
                VC
              </div>
              <div>
                <div className="font-bold text-sm text-slate-900 tracking-tight flex items-center gap-1.5">
                  VC (V Connect)
                  <span className="text-[10px] px-1.5 py-0.2 bg-indigo-50 text-indigo-700 font-semibold rounded border border-indigo-100">
                    v3.0
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-medium tracking-wide">
                  RETAIN • RECALL • REFLECT
                </div>
              </div>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Project Switcher */}
          <div className="p-3 border-b border-slate-100 relative">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-1 mb-1.5 flex items-center justify-between">
              <span>Current Project</span>
              <button
                onClick={() => setShowNewProjectModal(true)}
                className="text-indigo-600 hover:text-indigo-800 text-[10px] font-bold flex items-center gap-0.5"
                title="Create New Project"
              >
                <Plus className="w-3 h-3" />
                <span>New</span>
              </button>
            </div>
            <button
              onClick={() => setShowProjectMenu(!showProjectMenu)}
              className="w-full px-3 py-2 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200/80 flex items-center justify-between transition-colors text-left"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-5 h-5 rounded-md bg-indigo-100 border border-indigo-200 flex items-center justify-center text-xs font-bold text-indigo-700 shrink-0">
                  {activeProject ? activeProject.name[0].toUpperCase() : "P"}
                </div>
                <div className="truncate text-xs font-semibold text-slate-800">
                  {activeProject ? activeProject.name : (workspace?.name || "Hackathon Project")}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
            </button>

            {/* Project Switcher Dropdown */}
            {showProjectMenu && (
              <div className="absolute top-16 left-3 right-3 bg-white border border-slate-200 rounded-xl p-2 shadow-xl z-50 space-y-1">
                <div className="text-[10px] font-semibold text-slate-400 px-2 py-1 uppercase tracking-wider">
                  Available Projects ({projects.length})
                </div>
                {projects.map(p => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setActiveProject(p);
                      setShowProjectMenu(false);
                      addNotification("info", `Project Switched`, `Now viewing ${p.name}`);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                      activeProject?.id === p.id
                        ? "bg-indigo-50 text-indigo-700 font-semibold"
                        : "hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <span className="truncate">{p.name}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 capitalize">{p.status}</span>
                  </button>
                ))}
                <div className="pt-1 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setShowProjectMenu(false);
                      setShowNewProjectModal(true);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-indigo-600 hover:bg-indigo-50 flex items-center gap-1.5 font-medium"
                  >
                    <FolderPlus className="w-3.5 h-3.5" />
                    <span>Create New Project</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
            {NAV_ITEMS.map(item => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-sm font-semibold"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-indigo-50 text-indigo-600 border border-indigo-100"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Profile & Role Switcher */}
          <div className="p-3 border-t border-slate-100 relative">
            <button
              onClick={() => setShowPersonaMenu(!showPersonaMenu)}
              className="w-full p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src={currentUser.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces"}
                  alt={currentUser.display_name}
                  className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                />
                <div className="text-left min-w-0">
                  <div className="text-xs font-semibold text-slate-800 truncate">
                    {currentUser.display_name}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase ${
                      isAdmin
                        ? "bg-purple-100 text-purple-700"
                        : "bg-blue-100 text-blue-700"
                    }`}>
                      {isAdmin ? "Admin" : "Student"}
                    </span>
                  </div>
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </button>

            {/* Persona & Role Switcher Popup */}
            {showPersonaMenu && (
              <div className="absolute bottom-16 left-3 right-3 bg-white border border-slate-200 rounded-xl p-2 shadow-2xl z-50 space-y-1">
                <div className="text-[10px] font-semibold text-slate-400 px-2 py-1 uppercase tracking-wider">
                  Switch Active Role:
                </div>
                
                {/* 1-Click Role Switch */}
                <button
                  onClick={() => {
                    loginAsStudent();
                    setShowPersonaMenu(false);
                  }}
                  className={`w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center gap-2 ${
                    isStudent ? "bg-blue-50 text-blue-700 font-bold" : "hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <GraduationCap className="w-4 h-4 text-blue-600" />
                  <div>
                    <div>Student Contributor</div>
                    <div className="text-[10px] text-slate-400 font-normal">Aisha Patel (Frontend Lead)</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    loginAsAdmin();
                    setShowPersonaMenu(false);
                  }}
                  className={`w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center gap-2 ${
                    isAdmin ? "bg-purple-50 text-purple-700 font-bold" : "hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <Shield className="w-4 h-4 text-purple-600" />
                  <div>
                    <div>Admin / Director</div>
                    <div className="text-[10px] text-slate-400 font-normal">Lead Architect (Full Access)</div>
                  </div>
                </button>

                <div className="pt-1 border-t border-slate-100 mt-1">
                  <button
                    onClick={() => {
                      logout();
                      setShowPersonaMenu(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Top Bar Header */}
          <header className="h-14 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-1.5 rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
                <span className="text-slate-800 font-semibold">VC (V Connect)</span>
                <span>/</span>
                <span className="capitalize text-slate-600 font-medium">
                  {pathname === "/" ? "Command Center" : pathname.replace("/", "").replace("-", " ")}
                </span>
                {activeProject && (
                  <>
                    <span>/</span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold truncate max-w-[150px]">
                      {activeProject.name}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Right Header: Search + Notifications + Quick Actions */}
            <div className="flex items-center gap-2.5">
              {/* Global Search Shortcut Button */}
              <button
                onClick={() => setShowSearchModal(true)}
                className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/70 border border-slate-200 text-slate-500 text-xs transition-colors"
                title="Search memories, decisions, tasks (Ctrl+K)"
              >
                <Search className="w-3.5 h-3.5 text-slate-400" />
                <span>Search memories...</span>
                <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white border border-slate-200 rounded text-slate-400">⌘K</kbd>
              </button>

              {/* Memory Engine Status Badge */}
              <div
                className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                  isHindsightLive
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : "bg-indigo-50 border-indigo-200 text-indigo-700"
                }`}
                title={isHindsightLive ? "Connected to Hindsight Cloud API" : "Running offline Demo Memory Engine"}
              >
                <span className={`w-2 h-2 rounded-full ${isHindsightLive ? "bg-emerald-500 animate-pulse" : "bg-indigo-500"}`} />
                <span className="text-[11px]">{isHindsightLive ? "Hindsight Cloud Live" : "Demo Memory Mode"}</span>
              </div>

              {/* Notification Center Bell */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                  className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 relative transition-colors"
                  title="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-indigo-600 text-white text-[9px] font-bold flex items-center justify-center animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown Drawer */}
                {showNotifDropdown && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-3 space-y-2">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 px-1">
                      <div className="font-bold text-xs text-slate-900 flex items-center gap-2">
                        <span>Notifications</span>
                        {unreadCount > 0 && (
                          <span className="px-1.5 py-0.2 rounded-full bg-indigo-50 text-indigo-700 text-[10px]">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllAsRead}
                            className="text-[11px] text-indigo-600 hover:underline font-medium"
                          >
                            Mark all read
                          </button>
                        )}
                        <button
                          onClick={() => setShowNotifDropdown(false)}
                          className="text-slate-400 hover:text-slate-600 p-0.5"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-400">
                          No notifications yet.
                        </div>
                      ) : (
                        notifications.map(n => (
                          <div
                            key={n.id}
                            onClick={() => markAsRead(n.id)}
                            className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                              !n.read
                                ? "bg-indigo-50/50 border-indigo-100 text-slate-900"
                                : "bg-white border-slate-100 text-slate-600 hover:bg-slate-50"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="font-semibold flex items-center gap-1.5">
                                {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0" />}
                                <span>{n.title}</span>
                              </div>
                              <span className="text-[10px] text-slate-400 shrink-0">
                                {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            {n.message && (
                              <div className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                                {n.message}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Record Action */}
              <Link
                href="/meetings"
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Record Meeting</span>
              </Link>
            </div>
          </header>

          {/* Page Body */}
          <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>

      {/* Global Search Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-start justify-center pt-20 p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-lg w-full p-4 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                <Search className="w-4 h-4 text-indigo-600" />
                <span>Search VC Team Memory</span>
              </div>
              <button
                onClick={() => setShowSearchModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleQuickSearchSubmit} className="space-y-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ask a question or search decisions, tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-2 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
                >
                  Recall
                </button>
              </div>

              <div className="space-y-1.5 text-xs text-slate-500">
                <div className="font-semibold text-slate-400 text-[10px] uppercase">Quick Shortcuts:</div>
                <div className="grid grid-cols-2 gap-1.5">
                  <Link
                    href="/ask-vc?q=Who%20owns%20frontend%20API%20integration?"
                    onClick={() => setShowSearchModal(false)}
                    className="p-2 rounded-lg bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 transition-colors text-slate-700 border border-slate-100"
                  >
                    "Who owns frontend?"
                  </Link>
                  <Link
                    href="/ask-vc?q=Why%20did%20we%20choose%20Firebase?"
                    onClick={() => setShowSearchModal(false)}
                    className="p-2 rounded-lg bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 transition-colors text-slate-700 border border-slate-100"
                  >
                    "Why Firebase Auth?"
                  </Link>
                  <Link
                    href="/decisions"
                    onClick={() => setShowSearchModal(false)}
                    className="p-2 rounded-lg bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 transition-colors text-slate-700 border border-slate-100"
                  >
                    Browse Decision Timeline
                  </Link>
                  <Link
                    href="/tasks"
                    onClick={() => setShowSearchModal(false)}
                    className="p-2 rounded-lg bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 transition-colors text-slate-700 border border-slate-100"
                  >
                    View Active Kanban
                  </Link>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Project Modal */}
      {showNewProjectModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <FolderPlus className="w-4 h-4 text-indigo-600" />
                <span>Create New Project</span>
              </div>
              <button
                onClick={() => setShowNewProjectModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProjectSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Project Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Mobile App V2, Research Sprint"
                  value={newProjName}
                  onChange={(e) => setNewProjName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-indigo-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Objective / Description</label>
                <textarea
                  rows={3}
                  placeholder="Describe the project goal, scope, and target outcomes..."
                  value={newProjDesc}
                  onChange={(e) => setNewProjDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewProjectModal(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingProject}
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-all"
                >
                  {isSubmittingProject ? "Creating..." : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Logged Out Modal / Auth Dialog */}
      {!isAuthenticated && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-5 text-center">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-xl mx-auto shadow-md">
              VC
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Sign in to VC (V Connect)
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Select your account role or sign in with your student/institution email.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={loginAsStudent}
                className="p-3.5 rounded-2xl border-2 border-blue-200 hover:border-blue-500 bg-blue-50/50 hover:bg-blue-50 text-left transition-all group"
              >
                <GraduationCap className="w-5 h-5 text-blue-600 mb-1.5 group-hover:scale-110 transition-transform" />
                <div className="font-bold text-xs text-blue-900">Student Login</div>
                <div className="text-[10px] text-blue-600 mt-0.5">Contributor Access</div>
              </button>

              <button
                onClick={loginAsAdmin}
                className="p-3.5 rounded-2xl border-2 border-purple-200 hover:border-purple-500 bg-purple-50/50 hover:bg-purple-50 text-left transition-all group"
              >
                <Shield className="w-5 h-5 text-purple-600 mb-1.5 group-hover:scale-110 transition-transform" />
                <div className="font-bold text-xs text-purple-900">Admin Login</div>
                <div className="text-[10px] text-purple-600 mt-0.5">Full Workspace Access</div>
              </button>
            </div>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
                <span className="bg-white px-2 text-slate-400">Or use email</span>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (loginEmail.trim()) {
                  loginWithEmail(loginEmail.trim(), loginRole);
                }
              }}
              className="space-y-3 text-left"
            >
              <div>
                <input
                  type="email"
                  placeholder="student@vconnect.edu"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-indigo-600"
                  required
                />
              </div>
              <div className="flex items-center gap-3 text-xs">
                <label className="flex items-center gap-1.5 text-slate-600">
                  <input
                    type="radio"
                    name="role"
                    checked={loginRole === "student"}
                    onChange={() => setLoginRole("student")}
                    className="text-indigo-600"
                  />
                  <span>Student</span>
                </label>
                <label className="flex items-center gap-1.5 text-slate-600">
                  <input
                    type="radio"
                    name="role"
                    checked={loginRole === "admin"}
                    onChange={() => setLoginRole("admin")}
                    className="text-indigo-600"
                  />
                  <span>Admin</span>
                </label>
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors shadow-sm"
              >
                Sign In With Email
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
