"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart3,
  Sparkles,
  RotateCw,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Users,
  MessageSquare,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  Activity
} from "lucide-react";
import { useWorkspace } from "../../components/WorkspaceContext";
import { api } from "../../lib/api";
import { InsightsResponse } from "../../lib/types";

export default function InsightsPage() {
  const { workspace, currentUser, isHindsightLive, addNotification } = useWorkspace();
  const [data, setData] = useState<InsightsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadInsights = async () => {
    try {
      setLoading(true);
      const res = await api.getInsights("ws-demo-hackathon-2026");
      setData(res);
    } catch (err: any) {
      console.warn("Failed to load insights:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInsights();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await api.refreshInsights("ws-demo-hackathon-2026");
      setData(res);
      addNotification("success", "Insights Refreshed", "Re-analyzed memory graph and generated updated metrics.");
    } catch (err: any) {
      addNotification("error", "Refresh failed", err.message);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              Reflect & Insights
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100">
              Memory Graph Analytics
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Synthesized insights across tasks, discussions, and decisions with explainable evidence citations.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all shrink-0"
        >
          <RotateCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          <span>{refreshing ? "Analyzing..." : "Refresh Insights"}</span>
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-slate-500">
          <BarChart3 className="w-6 h-6 text-indigo-600 animate-spin mx-auto mb-2" />
          Analyzing project memory graph and task distribution...
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="vc-card p-4 bg-white shadow-soft">
              <span className="text-xs text-slate-500 font-semibold">Task Completion Rate</span>
              <div className="text-2xl font-black text-slate-900 mt-2 flex items-baseline gap-2">
                <span>{data.task_completion_rate}%</span>
                <span className="text-xs text-emerald-600 font-semibold">Active Sprint</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${data.task_completion_rate}%` }}
                />
              </div>
            </div>

            <div className="vc-card p-4 bg-white shadow-soft">
              <span className="text-xs text-slate-500 font-semibold">Identified Team Blockers</span>
              <div className="text-2xl font-black text-amber-600 mt-2 flex items-baseline gap-2">
                <span>{data.open_blockers_count}</span>
                <span className="text-xs text-slate-500 font-normal">Requiring Sync</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-2">
                Highest impact on velocity
              </div>
            </div>

            <div className="vc-card p-4 bg-white shadow-soft">
              <span className="text-xs text-slate-500 font-semibold">Proposed Decisions</span>
              <div className="text-2xl font-black text-indigo-600 mt-2 flex items-baseline gap-2">
                <span>{data.unresolved_decisions_count}</span>
                <span className="text-xs text-slate-500 font-normal">Pending Approval</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-2">
                Awaiting team consensus
              </div>
            </div>
          </div>

          {/* Actionable Insights Cards */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Grounded Reflection Insights ({data.insights.length})</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.insights.map((ins) => (
                <div
                  key={ins.id}
                  className="vc-card p-5 bg-white border-slate-200/90 shadow-soft hover:shadow-card transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider ${
                          ins.impact === "positive"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : ins.impact === "warning"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-indigo-50 text-indigo-700 border border-indigo-200"
                        }`}
                      >
                        {ins.category}
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-slate-900 leading-snug">{ins.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{ins.description}</p>
                  </div>

                  {ins.actionable_recommendation && (
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                      <span className="font-semibold text-indigo-700">Recommendation: </span>
                      <span className="text-slate-700">{ins.actionable_recommendation}</span>
                    </div>
                  )}

                  {ins.evidence_sources && ins.evidence_sources.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400">
                      Evidence: {ins.evidence_sources.join(", ")}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Workload Distribution Table */}
          <div className="vc-card p-5 bg-white shadow-soft space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="font-bold text-xs text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                <span>Team Workload Distribution</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="px-3 py-2 rounded-l-lg">Team Member</th>
                    <th className="px-3 py-2">Total Tasks</th>
                    <th className="px-3 py-2">Completed</th>
                    <th className="px-3 py-2">In Progress</th>
                    <th className="px-3 py-2 text-right rounded-r-lg">Load Ratio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.workload.map((w, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-3 py-2.5 font-semibold text-slate-900">{w.member_name}</td>
                      <td className="px-3 py-2.5 text-slate-600">{w.task_count}</td>
                      <td className="px-3 py-2.5 text-emerald-600 font-semibold">{w.completed_count}</td>
                      <td className="px-3 py-2.5 text-indigo-600 font-semibold">{w.in_progress_count}</td>
                      <td className="px-3 py-2.5 text-right font-medium text-slate-500">
                        {w.task_count > 0 ? Math.round((w.completed_count / w.task_count) * 100) : 0}% done
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Discussion Signals */}
          <div className="vc-card p-5 bg-white shadow-soft space-y-3">
            <div className="font-bold text-xs text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
              <MessageSquare className="w-4 h-4 text-purple-600" />
              <span>Discussion Recurrence & Emerging Signals</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {data.discussion_signals.map((sig, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">{sig.topic}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-purple-50 text-purple-700 border border-purple-100">
                      {sig.frequency}x mentioned
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">{sig.context}</p>
                  <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-200">
                    Last mentioned: {sig.last_mentioned}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
