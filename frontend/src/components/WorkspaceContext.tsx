"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import {
  UserProfile,
  Workspace,
  Project,
  ProjectCreate,
  ProjectUpdate,
  IntegrationStatusItem,
  DashboardResponse,
  TaskItem,
  TaskCreate,
  TaskUpdate,
  DecisionItem,
  DecisionCreate,
  DecisionUpdate,
  MemoryItem
} from "../lib/types";
import { api } from "../lib/api";

export interface NotificationItem {
  id: string;
  type: "success" | "info" | "warning" | "error";
  title: string;
  message?: string;
  timestamp: Date;
  read?: boolean;
}

interface WorkspaceContextType {
  workspace: Workspace | null;
  currentUser: UserProfile;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isStudent: boolean;
  demoMode: boolean;
  integrations: IntegrationStatusItem[];
  isHindsightLive: boolean;
  activePersona: string;
  projects: Project[];
  tasks: TaskItem[];
  decisions: DecisionItem[];
  memories: MemoryItem[];
  activeProject: Project | null;
  setActiveProject: (project: Project) => void;
  createProject: (data: ProjectCreate) => Promise<Project>;
  updateProject: (id: string, data: ProjectUpdate) => Promise<Project>;
  deleteProject: (id: string) => Promise<void>;
  refreshProjects: () => Promise<void>;
  dashboardData: DashboardResponse | null;
  isDashboardLoading: boolean;
  refreshDashboard: () => Promise<void>;
  loadDashboard: () => Promise<void>;
  createTask: (data: TaskCreate) => Promise<TaskItem>;
  updateTask: (taskId: string, data: TaskUpdate) => Promise<TaskItem>;
  completeTask: (taskId: string) => Promise<TaskItem>;
  deleteTask: (taskId: string) => Promise<void>;
  createDecision: (data: DecisionCreate) => Promise<DecisionItem>;
  updateDecision: (id: string, data: DecisionUpdate) => Promise<DecisionItem>;
  deleteDecision: (id: string) => Promise<void>;
  switchPersona: (personaKey: "admin" | "student" | "judge" | "aisha" | "rahul" | "kiran") => void;
  loginAsStudent: () => void;
  loginAsAdmin: () => void;
  loginWithEmail: (email: string, role?: "admin" | "student") => void;
  logout: () => void;
  notifications: NotificationItem[];
  unreadCount: number;
  addNotification: (type: "success" | "info" | "warning" | "error", title: string, message?: string) => void;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  refreshWorkspaceData: () => Promise<void>;
}

const DEFAULT_ADMIN: UserProfile = {
  uid: "user-admin-demo",
  email: "admin@vconnect.edu",
  display_name: "Admin (Lead Director)",
  role: "admin",
  is_demo_user: true,
  avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces"
};

const DEFAULT_STUDENT: UserProfile = {
  uid: "user-student-demo",
  email: "student@vconnect.edu",
  display_name: "Student (Aisha Patel)",
  role: "student",
  is_demo_user: true,
  avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces"
};

const PERSONAS: Record<string, UserProfile> = {
  admin: DEFAULT_ADMIN,
  judge: DEFAULT_ADMIN,
  student: DEFAULT_STUDENT,
  aisha: DEFAULT_STUDENT,
  rahul: {
    uid: "user-rahul",
    email: "rahul@vconnect.edu",
    display_name: "Rahul Sharma",
    role: "student",
    is_demo_user: true,
    avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces"
  },
  kiran: {
    uid: "user-kiran",
    email: "kiran@vconnect.edu",
    display_name: "Kiran Rao",
    role: "student",
    is_demo_user: true,
    avatar_url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=faces"
  }
};

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-001",
    type: "info",
    title: "Welcome to VC (V Connect)",
    message: "Persistent team memory engine is initialized and ready for collaboration.",
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    read: false
  },
  {
    id: "notif-002",
    type: "success",
    title: "Architecture Decision Synced",
    message: "Database selection decision retained with verifiable citations.",
    timestamp: new Date(Date.now() - 1000 * 60 * 120),
    read: false
  },
  {
    id: "notif-003",
    type: "info",
    title: "Sprint Sync Scheduled",
    message: "Meeting scheduled on calendar for project alignment.",
    timestamp: new Date(Date.now() - 1000 * 60 * 360),
    read: true
  }
];

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile>(DEFAULT_ADMIN);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [activePersona, setActivePersona] = useState<string>("admin");
  const [demoMode, setDemoMode] = useState<boolean>(true);
  const [integrations, setIntegrations] = useState<IntegrationStatusItem[]>([]);
  const [isHindsightLive, setIsHindsightLive] = useState<boolean>(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [decisions, setDecisions] = useState<DecisionItem[]>([]);
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(null);
  const [isDashboardLoading, setIsDashboardLoading] = useState<boolean>(true);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  // Computed Roles
  const isAdmin = useMemo(() => {
    const role = currentUser.role?.toLowerCase() || "";
    return role === "admin" || role === "owner" || role === "lead";
  }, [currentUser.role]);

  const isStudent = useMemo(() => {
    return !isAdmin;
  }, [isAdmin]);

  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.read).length;
  }, [notifications]);

  // Session Persistence
  useEffect(() => {
    try {
      const savedSession = localStorage.getItem("vc_user_session");
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        if (parsed.user && parsed.token) {
          setCurrentUser(parsed.user);
          setActivePersona(parsed.personaKey || "admin");
          setIsAuthenticated(true);
          api.setToken(parsed.token);
        }
      } else {
        // Save default admin session
        saveSession(DEFAULT_ADMIN, "demo-token-admin", "admin");
      }
    } catch {
      // LocalStorage error fallback
    }
  }, []);

  const saveSession = (user: UserProfile, token: string, personaKey: string) => {
    try {
      localStorage.setItem("vc_user_session", JSON.stringify({ user, token, personaKey }));
    } catch {
      // Ignore
    }
  };

  const addNotification = (type: "success" | "info" | "warning" | "error", title: string, message?: string) => {
    const item: NotificationItem = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      title,
      message,
      timestamp: new Date(),
      read: false
    };
    setNotifications(prev => [item, ...prev.slice(0, 19)]);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    addNotification("info", "All notifications marked as read");
  };

  const switchPersona = (personaKey: "admin" | "student" | "judge" | "aisha" | "rahul" | "kiran") => {
    const selected = PERSONAS[personaKey] || DEFAULT_ADMIN;
    const token = `demo-token-${personaKey}`;
    setCurrentUser(selected);
    setActivePersona(personaKey);
    setIsAuthenticated(true);
    api.setToken(token);
    saveSession(selected, token, personaKey);
    addNotification("info", `Switched to persona: ${selected.display_name}`, `Role: ${selected.role.toUpperCase()}`);
  };

  const loginAsStudent = () => {
    switchPersona("student");
    addNotification("success", "Logged in as Student", "Active role: Student Contributor");
  };

  const loginAsAdmin = () => {
    switchPersona("admin");
    addNotification("success", "Logged in as Admin", "Active role: Admin Director (Full Privileges)");
  };

  const loginWithEmail = (email: string, role: "admin" | "student" = "student") => {
    const customUser: UserProfile = {
      uid: `user-${Math.random().toString(36).substring(2, 8)}`,
      email,
      display_name: email.split("@")[0].replace(".", " "),
      role,
      is_demo_user: true,
      avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`
    };
    const token = `demo-token-${role}`;
    setCurrentUser(customUser);
    setActivePersona(role);
    setIsAuthenticated(true);
    api.setToken(token);
    saveSession(customUser, token, role);
    addNotification("success", `Welcome back!`, `Signed in as ${customUser.display_name} (${role})`);
  };

  const logout = () => {
    try {
      localStorage.removeItem("vc_user_session");
    } catch {
      // Ignore
    }
    setIsAuthenticated(false);
    addNotification("warning", "Signed Out", "You have been logged out of VC (V Connect).");
  };

  const refreshDashboard = useCallback(async () => {
    try {
      setIsDashboardLoading(true);
      const wsId = workspace?.id || "ws-demo-hackathon-2026";
      const [res, taskList, decList, memList, projs] = await Promise.all([
        api.getDashboard(wsId).catch(() => null),
        api.getTasks(wsId).catch(() => []),
        api.getDecisions(wsId).catch(() => []),
        api.getMemories(wsId).catch(() => []),
        api.getProjects(wsId).catch(() => [])
      ]);
      setDashboardData(res);
      setTasks(taskList || []);
      setDecisions(decList || []);
      setMemories(memList || []);
      setProjects(projs || []);
      if (projs && projs.length > 0 && !activeProject) {
        setActiveProject(projs[0]);
      }
    } catch (err: any) {
      console.warn("Failed to refresh dashboard:", err);
    } finally {
      setIsDashboardLoading(false);
    }
  }, [workspace?.id, activeProject]);

  const loadDashboard = refreshDashboard;

  const refreshProjects = async () => {
    try {
      const projs = await api.getProjects("ws-demo-hackathon-2026");
      setProjects(projs);
      if (projs.length > 0 && !activeProject) {
        setActiveProject(projs[0]);
      }
    } catch (e) {
      console.warn("Could not fetch projects:", e);
    }
  };

  const createProject = async (data: ProjectCreate): Promise<Project> => {
    const newProj = await api.createProject("ws-demo-hackathon-2026", data);
    setProjects(prev => [newProj, ...prev]);
    setActiveProject(newProj);
    addNotification("success", "Project Created", `"${newProj.name}" is now active.`);
    await refreshDashboard();
    return newProj;
  };

  const updateProject = async (id: string, data: ProjectUpdate): Promise<Project> => {
    const updated = await api.updateProject("ws-demo-hackathon-2026", id, data);
    setProjects(prev => prev.map(p => p.id === id ? updated : p));
    if (activeProject?.id === id) {
      setActiveProject(updated);
    }
    addNotification("success", "Project Updated", `Changes saved for "${updated.name}".`);
    await refreshDashboard();
    return updated;
  };

  const deleteProject = async (id: string): Promise<void> => {
    if (!isAdmin) {
      addNotification("error", "Permission Denied", "Only administrators can delete projects.");
      throw new Error("Only administrators can delete projects.");
    }
    await api.deleteProject("ws-demo-hackathon-2026", id);
    setProjects(prev => prev.filter(p => p.id !== id));
    if (activeProject?.id === id) {
      setActiveProject(projects.find(p => p.id !== id) || null);
    }
    addNotification("success", "Project Deleted", "Project removed from workspace.");
    await refreshDashboard();
  };

  const createTask = async (data: TaskCreate): Promise<TaskItem> => {
    const newTask = await api.createTask("ws-demo-hackathon-2026", data);
    addNotification("success", "Task Created", `"${newTask.title}" added to board.`);
    await refreshDashboard();
    return newTask;
  };

  const updateTask = async (taskId: string, data: TaskUpdate): Promise<TaskItem> => {
    const updated = await api.updateTask("ws-demo-hackathon-2026", taskId, data);
    await refreshDashboard();
    return updated;
  };

  const completeTask = async (taskId: string): Promise<TaskItem> => {
    const updated = await api.updateTask("ws-demo-hackathon-2026", taskId, { status: "done" });
    addNotification("success", "Task Completed", `"${updated.title}" marked as done.`);
    await refreshDashboard();
    return updated;
  };

  const deleteTask = async (taskId: string): Promise<void> => {
    await api.deleteTask("ws-demo-hackathon-2026", taskId);
    addNotification("success", "Task Deleted", "Task removed from workspace.");
    await refreshDashboard();
  };

  const createDecision = async (data: DecisionCreate): Promise<DecisionItem> => {
    const newDec = await api.createDecision("ws-demo-hackathon-2026", data);
    addNotification("success", "Decision Logged", `"${newDec.title}" retained in memory.`);
    await refreshDashboard();
    return newDec;
  };

  const updateDecision = async (id: string, data: DecisionUpdate): Promise<DecisionItem> => {
    const updated = await api.updateDecision("ws-demo-hackathon-2026", id, data);
    await refreshDashboard();
    return updated;
  };

  const deleteDecision = async (id: string): Promise<void> => {
    await api.deleteDecision("ws-demo-hackathon-2026", id);
    addNotification("success", "Decision Deleted", "Decision removed from workspace.");
    await refreshDashboard();
  };

  const refreshWorkspaceData = async () => {
    try {
      const [wsList, intData] = await Promise.allSettled([
        api.getWorkspaces(),
        api.getIntegrationsStatus()
      ]);

      if (wsList.status === "fulfilled" && wsList.value.length > 0) {
        setWorkspace(wsList.value[0]);
      }

      if (intData.status === "fulfilled") {
        setIntegrations(intData.value.integrations);
        setDemoMode(intData.value.demo_mode_active);
        const hs = intData.value.integrations.find(i => i.name === "hindsight");
        setIsHindsightLive(hs?.status === "connected");
      }

      await Promise.allSettled([refreshProjects(), refreshDashboard()]);
    } catch (e) {
      console.warn("Could not fetch workspace initial state:", e);
    }
  };

  useEffect(() => {
    refreshWorkspaceData();
  }, []);

  return (
    <WorkspaceContext.Provider
      value={{
        workspace,
        currentUser,
        isAuthenticated,
        isAdmin,
        isStudent,
        demoMode,
        integrations,
        isHindsightLive,
        activePersona,
        projects,
        tasks,
        decisions,
        memories,
        activeProject,
        setActiveProject,
        createProject,
        updateProject,
        deleteProject,
        refreshProjects,
        dashboardData,
        isDashboardLoading,
        refreshDashboard,
        loadDashboard,
        createTask,
        updateTask,
        completeTask,
        deleteTask,
        createDecision,
        updateDecision,
        deleteDecision,
        switchPersona,
        loginAsStudent,
        loginAsAdmin,
        loginWithEmail,
        logout,
        notifications,
        unreadCount,
        addNotification,
        removeNotification,
        markAsRead,
        markAllAsRead,
        refreshWorkspaceData
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
};
