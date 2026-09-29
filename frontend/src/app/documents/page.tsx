"use client";

import React, { useState, useEffect } from "react";
import {
  FolderLock,
  UploadCloud,
  FileText,
  FileCode,
  File,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCw,
  Search,
  BookOpen,
  Sparkles,
  Trash2
} from "lucide-react";
import { useWorkspace } from "../../components/WorkspaceContext";
import { api } from "../../lib/api";
import { DocumentItem } from "../../lib/types";

export default function DocumentsPage() {
  const { workspace, currentUser, addNotification } = useWorkspace();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [search, setSearch] = useState("");

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const data = await api.getDocuments("ws-demo-hackathon-2026");
      setDocuments(data);
    } catch (err: any) {
      console.warn("Failed to load documents:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (15MB)
    if (file.size > 15 * 1024 * 1024) {
      addNotification("error", "File too large", "Maximum file size is 15MB.");
      return;
    }

    setIsUploading(true);
    try {
      const res = await api.uploadDocument("ws-demo-hackathon-2026", file);
      addNotification("success", "Document Ingested", res.message || "Document processed and retained into Hindsight.");
      loadDocuments();
    } catch (err: any) {
      addNotification("error", "Upload failed", err.message);
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const filteredDocs = documents.filter((d) =>
    d.filename.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <FolderLock className="w-5 h-5 text-indigo-600" />
              Knowledge Hub
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100">
              PDF • DOCX • PPTX • TXT
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Upload specifications, research papers, and slide decks. Text is automatically chunked and retained in long-term memory.
          </p>
        </div>

        <button
          onClick={loadDocuments}
          disabled={loading}
          className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors self-start sm:self-auto"
        >
          <RotateCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-indigo-600" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Upload Dropzone */}
      <div className="vc-card p-6 border-dashed border-2 border-indigo-200 bg-indigo-50/30 text-center hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors cursor-pointer">
        <label className="cursor-pointer flex flex-col items-center justify-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-sm">
            {isUploading ? (
              <RotateCw className="w-6 h-6 animate-spin" />
            ) : (
              <UploadCloud className="w-6 h-6" />
            )}
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900">
              {isUploading ? "Extracting Text & Retaining in Hindsight..." : "Click to Upload Document or Drag & Drop"}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Supports PDF, DOCX, PPTX, TXT, and Markdown (up to 15MB)
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-indigo-600 font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Auto-chunked and indexed into Hindsight Cloud memory</span>
          </div>
          <input
            type="file"
            accept=".pdf,.docx,.pptx,.txt,.md"
            onChange={handleFileUpload}
            disabled={isUploading}
            className="hidden"
          />
        </label>
      </div>

      {/* Search Filter */}
      <div className="vc-card p-3 bg-white flex items-center gap-2 shadow-sm">
        <Search className="w-4 h-4 text-slate-400 ml-1 shrink-0" />
        <input
          type="text"
          placeholder="Search documents by filename..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full text-xs text-slate-900 placeholder-slate-400 bg-transparent focus:outline-none"
        />
      </div>

      {/* Documents List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-600" />
            Ingested Documents ({filteredDocs.length})
          </h2>
        </div>

        {loading ? (
          <div className="vc-card p-12 bg-white text-center text-xs text-slate-400">
            <RotateCw className="w-6 h-6 text-indigo-600 animate-spin mx-auto mb-2" />
            Loading documents...
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="vc-card p-12 bg-white text-center space-y-2">
            <FolderLock className="w-8 h-8 text-slate-300 mx-auto" />
            <div className="text-sm font-semibold text-slate-700">No documents uploaded yet</div>
            <p className="text-xs text-slate-500">
              Upload a project PDF, design doc, or slide deck above to get started.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredDocs.map((doc) => {
              const isPdf = doc.filename.endsWith(".pdf");
              const isDocx = doc.filename.endsWith(".docx");

              return (
                <div key={doc.id} className="vc-card p-4 bg-white flex flex-col justify-between text-xs space-y-3 hover:shadow-card transition-all">
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                          {isPdf ? (
                            <FileText className="w-4 h-4 text-rose-500" />
                          ) : isDocx ? (
                            <File className="w-4 h-4 text-blue-500" />
                          ) : (
                            <FileCode className="w-4 h-4 text-emerald-500" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 truncate">{doc.filename}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {doc.file_size ? `${(doc.file_size / 1024).toFixed(1)} KB` : "120 KB"} • Uploaded by {doc.uploaded_by}
                          </div>
                        </div>
                      </div>

                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 font-semibold flex items-center gap-1 shrink-0">
                        <CheckCircle2 className="w-3 h-3" /> Extracted
                      </span>
                    </div>

                    {doc.extracted_preview && (
                      <p className="text-[11px] text-slate-600 mt-3 line-clamp-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 leading-relaxed italic">
                        "{doc.extracted_preview}"
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                    <span className="text-indigo-600 font-semibold">
                      {doc.chunk_count} semantic chunk(s) retained in Hindsight
                    </span>
                    <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
