"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Zap,
  CheckCircle2,
  GitCommit,
  UserCheck,
  AlertTriangle,
  RotateCw,
  BookOpen,
  Info,
  Layers,
  ArrowRight,
  Copy,
  Check
} from "lucide-react";
import { useWorkspace } from "../../components/WorkspaceContext";
import { api } from "../../lib/api";
import { ProjectBriefing } from "../../lib/types";

export default function CatchUpPage() {
  const { workspace, currentUser, isHindsightLive, addNotification } = useWorkspace();
  const [briefing, setBriefing] = useState<ProjectBriefing | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const loadBriefing = async () => {
    try {
      setLoading(true);
      const res = await api.getCatchUp("ws-demo-hackathon-2026");
      setBriefing(res.briefing);
    } catch (err: any) {
      console.warn("Failed to generate catch-up:", err);
      addNotification("error", "Briefing error", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBriefing();
  }, []);

  const handleCopySummary = () => {
    if (!briefing) return;
    const text = `VC (V Connect) 30s Catch-Up Briefing:\n\nObjective: ${briefing.project_objective}\n\nSummary: ${briefing.summary_30s}\n\nRecent Progress:\n${briefing.recent_progress.map(p => `- ${p}`).join("\n")}\n\nKey Decisions:\n${briefing.key_decisions.map(d => `- ${d}`).join("\n")}\n\nCurrent Blockers:\n${briefing.current_blockers.map(b => `- ${b}`).join("\n")}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    addNotification("success", "Briefing Copied", "Text copied to clipboard.");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              Instant Onboarding: Catch Me Up
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100">
              30-Second Synthesis
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Grounded 30-second context briefing synthesized directly from project memories for new teammates and judges.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {briefing && (
            <button
              onClick={handleCopySummary}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copied ? "Copied!" : "Copy Briefing"}</span>
            </button>
          )}

          <button
            onClick={loadBriefing}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all shrink-0"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Regenerate Briefing</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="vc-card p-12 text-center text-xs text-slate-400 space-y-3 bg-white">
          <Sparkles className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
          <div className="font-semibold text-sm text-slate-800">
            Synthesizing 30-second onboarding briefing from memory...
          </div>
          <p className="text-slate-500 max-w-sm mx-auto">
            Aggregating latest decisions, task assignments, and blockers across Hindsight Cloud.
          </p>
        </div>
      ) : briefing ? (
        <div className="space-y-6">
          {/* Highlighted 30-Second Summary Card */}
          <div className="vc-card p-6 bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/50 border-indigo-200 shadow-sm relative overflow-hidden">
            <div className="flex items-center gap-2 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-2">
              <Zap className="w-4 h-4 fill-current text-indigo-600" />
              The 30-Second Executive Summary
            </div>
            <p className="text-sm sm:text-base text-slate-900 leading-relaxed font-medium">
              "{briefing.summary_30s}"
            </p>

            <div className="mt-4 pt-3 border-t border-indigo-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>
                Engine: <strong className="text-indigo-700">{briefing.is_demo ? "Hindsight Demo Engine" : "Hindsight Cloud Live"}</strong>
              </span>
              <span>Generated: {new Date(briefing.generated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>

          {/* Project Objective */}
          <div className="vc-card p-5 bg-white space-y-2 shadow-soft">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-indigo-600" />
              <span>Project Core Objective</span>
            </div>
            <p className="text-sm text-slate-800 leading-relaxed font-semibold">
              {briefing.project_objective}
            </p>
          </div>

          {/* 2-Column Split: Key Milestones & Key Decisions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Recent Progress */}
            <div className="vc-card p-5 bg-white space-y-3 shadow-soft">
              <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Recent Completed Milestones</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-700">
                {briefing.recent_progress.map((prog, i) => (
                  <li key={i} className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <span>{prog}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Key Decisions */}
            <div className="vc-card p-5 bg-white space-y-3 shadow-soft">
              <div className="text-xs font-bold text-purple-700 uppercase tracking-wider flex items-center gap-1.5">
                <GitCommit className="w-4 h-4 text-purple-600" />
                <span>Key Architectural Decisions</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-700">
                {briefing.key_decisions.map((dec, i) => (
                  <li key={i} className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                    <span>{dec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Task Ownership Matrix */}
          <div className="vc-card p-5 bg-white space-y-3 shadow-soft">
            <div className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-indigo-600" />
              <span>Current Task Ownership Matrix</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {briefing.task_ownership.map((owner, i) => (
                <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <div className="font-semibold text-xs text-slate-900">{owner.owner}</div>
                  <div className="text-[11px] text-slate-500 capitalize">{owner.role}</div>
                  <div className="text-[10px] text-indigo-600 font-medium pt-1">
                    {owner.active_tasks?.length ?? 0} active task(s)
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Current Blockers */}
          {briefing.current_blockers.length > 0 && (
            <div className="vc-card p-5 bg-amber-50/50 border-amber-200 space-y-3 shadow-soft">
              <div className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Current Blockers & Immediate Actions</span>
              </div>
              <ul className="space-y-2 text-xs text-amber-900">
                {briefing.current_blockers.map((b, i) => (
                  <li key={i} className="flex items-start gap-2 bg-white p-2.5 rounded-xl border border-amber-200 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Verifiable Sources */}
          {briefing.sources && briefing.sources.length > 0 && (
            <div className="vc-card p-5 bg-white space-y-3 shadow-soft">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <span>Grounded Memory Citations ({briefing.sources.length})</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                {briefing.sources.map((s, i) => (
                  <div key={i} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <div className="font-semibold text-slate-900 truncate">{s.title}</div>
                    <p className="text-[11px] text-slate-600 italic line-clamp-2">"{s.snippet}"</p>
                    <div className="text-[10px] text-slate-400">Contributor: {s.contributor || "Team"}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
