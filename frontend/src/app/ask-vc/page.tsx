"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  MessageSquareCode,
  Send,
  Sparkles,
  User,
  Trash2,
  ExternalLink,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  BrainCircuit,
  Info
} from "lucide-react";
import { useWorkspace } from "../../components/WorkspaceContext";
import { api } from "../../lib/api";
import { ChatMessage, SourceCitation } from "../../lib/types";

const SUGGESTED_PROMPTS = [
  "Who owns the frontend?",
  "Why did we choose Firebase?",
  "What are our current blockers?",
  "Summarize the last meeting.",
  "Catch me up in 30 seconds.",
  "What database are we using for metadata?"
];

export default function AskVcPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs text-slate-500">Loading Ask VC...</div>}>
      <AskVcContent />
    </Suspense>
  );
}

function AskVcContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const { workspace, currentUser, isHindsightLive, addNotification } = useWorkspace();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg-welcome",
      role: "assistant",
      content: (
        "Hello! I am **VC AI**, grounded in your team's persistent long-term memory. " +
        "Ask me anything about past decisions, task ownership, meeting notes, or project blockers. " +
        "I will cite the exact records and will never fabricate information."
      ),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      engine: isHindsightLive ? "Hindsight Cloud (Live Bank)" : "Hindsight Demo Memory Engine (Offline Simulated)",
      is_demo: !isHindsightLive
    }
  ]);
  const [input, setInput] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  useEffect(() => {
    if (initialQuery) {
      handleSendMessage(initialQuery);
    }
  }, []);

  const handleSendMessage = async (queryText?: string) => {
    const q = (queryText || input).trim();
    if (!q || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const resp = await api.askChat("ws-demo-hackathon-2026", {
        query: q,
        conversation_history: messages.map((m) => ({ role: m.role, content: m.content }))
      });

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: resp.answer,
        sources: resp.sources,
        confidence: resp.confidence,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        engine: resp.engine,
        is_demo: resp.is_demo
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      addNotification("error", "Query Failed", err.message);
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: `Error: Unable to query memory bank. (${err.message}). Please check backend status.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const clearChat = () => {
    setMessages([
      {
        id: "msg-welcome-new",
        role: "assistant",
        content: "Chat history cleared. How can I assist you with your project context?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        engine: isHindsightLive ? "Hindsight Cloud" : "Demo Memory Engine"
      }
    ]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <MessageSquareCode className="w-5 h-5 text-indigo-600" />
              Ask VC AI
            </h1>
            <span
              className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${
                isHindsightLive
                  ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                  : "bg-indigo-50 text-indigo-700 border-indigo-100"
              }`}
            >
              {isHindsightLive ? "Hindsight Cloud Live" : "Grounded Team Memory"}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Query your project's decisions, meetings, and task ownership without hallucinations.
          </p>
        </div>

        <button
          onClick={clearChat}
          className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear History</span>
        </button>
      </div>

      {/* Suggested Prompts Carousel */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2.5 mb-2 no-scrollbar shrink-0">
        <span className="text-[11px] text-slate-400 font-semibold shrink-0 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-indigo-600" /> Quick Ask:
        </span>
        {SUGGESTED_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            onClick={() => handleSendMessage(prompt)}
            disabled={loading}
            className="px-3 py-1 rounded-full bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-xs text-slate-700 hover:text-indigo-700 font-medium whitespace-nowrap shadow-soft transition-colors shrink-0 disabled:opacity-50"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${
              msg.role === "user" ? "flex-row-reverse" : "flex-row"
            }`}
          >
            {/* Avatar */}
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold shadow-soft ${
                msg.role === "user"
                  ? "bg-gradient-to-br from-indigo-600 to-violet-600 text-white"
                  : "bg-white border border-slate-200 text-indigo-600"
              }`}
            >
              {msg.role === "user" ? (
                <User className="w-4 h-4" />
              ) : (
                <BrainCircuit className="w-4 h-4 text-indigo-600" />
              )}
            </div>

            {/* Message Bubble */}
            <div
              className={`max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-indigo-600 text-white rounded-tr-none shadow-sm"
                  : "vc-card bg-white text-slate-800 rounded-tl-none border-slate-200/90 shadow-soft"
              }`}
            >
              {/* Message Header */}
              <div className={`flex items-center justify-between gap-4 text-[10px] mb-2 pb-1.5 border-b ${
                msg.role === "user" ? "border-indigo-500 text-indigo-100" : "border-slate-100 text-slate-400"
              }`}>
                <span className="font-semibold">
                  {msg.role === "user" ? currentUser.display_name : "VC AI Memory Assistant"}
                </span>
                <div className="flex items-center gap-2">
                  <span>{msg.timestamp}</span>
                  {msg.role === "assistant" && (
                    <button
                      onClick={() => copyToClipboard(msg.content, msg.id)}
                      className="hover:text-slate-700 p-0.5"
                      title="Copy response"
                    >
                      {copiedId === msg.id ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Message Content */}
              <div className="whitespace-pre-wrap leading-relaxed font-normal">
                {msg.content}
              </div>

              {/* Verified Sources / Grounding Cards */}
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-3.5 pt-3 border-t border-slate-100 space-y-2">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen className="w-3 h-3 text-indigo-600" />
                    <span>Evidence-Backed Sources ({msg.sources.length}):</span>
                  </div>
                  <div className="grid grid-cols-1 gap-1.5">
                    {msg.sources.map((src, i) => (
                      <div
                        key={i}
                        className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1 hover:border-slate-300 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-slate-800 text-xs truncate">
                            {src.title}
                          </span>
                          <span className="text-[10px] px-2 py-0.2 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 shrink-0">
                            {Math.round((src.confidence || 1) * 100)}% Match
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 italic line-clamp-2 leading-relaxed">
                          "{src.snippet}"
                        </p>
                        <div className="text-[10px] text-slate-400 flex items-center gap-2 pt-0.5">
                          {src.contributor && <span>Author: {src.contributor}</span>}
                          {src.date && <span>• {src.date}</span>}
                          <span className="uppercase text-indigo-600 font-semibold">• {src.type}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-soft">
              <BrainCircuit className="w-4 h-4 text-indigo-600 animate-pulse" />
            </div>
            <div className="p-4 rounded-2xl rounded-tl-none bg-white border border-slate-200 text-xs text-slate-600 shadow-soft flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600 animate-spin" />
              <span>Querying team semantic bank & generating grounded citations...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input Bar */}
      <div className="pt-3 border-t border-slate-200 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-card focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/10 transition-all"
        >
          <input
            type="text"
            placeholder="Ask anything: 'Who is working on the API?', 'What was decided yesterday?'..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            className="flex-1 px-3 py-1.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 bg-transparent focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-40 shadow-sm transition-all shrink-0"
            title="Send query"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <div className="text-[10px] text-slate-400 text-center mt-1.5">
          Grounded in VC team memory • Never hallucinates unrecorded information
        </div>
      </div>
    </div>
  );
}
