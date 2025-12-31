"use client";

import { useState } from "react";
import { useTranslations } from "../../../../i18n/LanguageContext";
import {
  generateScientificProject,
  exportScientificProjectDocx,
  ScientificProjectGeneratePayload,
  ScientificProjectResponse,
} from "../../../../lib/api";
import Markdown from "react-markdown";

export default function ScientificProjectPage() {
  const t = useTranslations();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScientificProjectResponse | null>(null);

  // Form state
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [grade, setGrade] = useState("");
  const [language, setLanguage] = useState<"ru" | "kz" | "en">("ru");
  const [userComment, setUserComment] = useState("");

  // Edit state (for modifying generated content blocks)
  const [editingSection, setEditingSection] = useState<keyof ScientificProjectResponse | null>(null);
  const [editValue, setEditValue] = useState("");

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !topic || !grade) {
      setError(t.scientificProject.errors.required);
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const payload: ScientificProjectGeneratePayload = {
        subject,
        topic,
        grade,
        language,
        user_comment: userComment || undefined,
      };
      const res = await generateScientificProject(payload);
      setResult(res);
    } catch (err: any) {
      console.error(err);
      setError(err.message || t.scientificProject.errors.generic);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!result) return;
    try {
      const blob = await exportScientificProjectDocx({ content: result });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "scientific_project.docx";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error(err);
      alert("Failed to export DOCX");
    }
  };

  const startEditing = (section: keyof ScientificProjectResponse) => {
    if (!result) return;
    setEditingSection(section);
    setEditValue(result[section]);
  };

  const saveEditing = () => {
    if (!result || !editingSection) return;
    setResult({
      ...result,
      [editingSection]: editValue,
    });
    setEditingSection(null);
    setEditValue("");
  };

  const cancelEditing = () => {
    setEditingSection(null);
    setEditValue("");
  };

  // Render a result block with Markdown support and edit button
  const renderBlock = (
    label: string,
    sectionKey: keyof ScientificProjectResponse
  ) => {
    if (!result) return null;
    const content = result[sectionKey];
    const isEditing = editingSection === sectionKey;

    return (
      <div className="mb-6 rounded-3xl border border-white/60 bg-white/40 p-6 shadow-sm backdrop-blur-sm">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">{label}</h3>
          {!isEditing && (
            <button
              onClick={() => startEditing(sectionKey)}
              className="text-sm font-semibold text-[color:var(--primary)] hover:underline"
            >
              ✏️ {t.scientificProject.results.editBlock}
            </button>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-4">
            <textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-900 shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
              rows={8}
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={cancelEditing}
                className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
              >
                {t.scientificProject.results.cancel}
              </button>
              <button
                onClick={saveEditing}
                className="rounded-xl bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--secondary)] px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:opacity-90"
              >
                {t.scientificProject.results.saveBlock}
              </button>
            </div>
          </div>
        ) : (
          <div className="prose prose-sm max-w-none text-slate-800">
            <Markdown>{content}</Markdown>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-beige to-green-50 p-4 sm:p-6">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-6 text-3xl font-bold text-slate-900">
          {t.scientificProject.form.title}
        </h1>

        {!result ? (
          <div className="glass-card rounded-3xl border border-white/60 px-6 py-6 shadow-md sm:px-8">
            <form onSubmit={handleGenerate} className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                {/* Subject */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    {t.scientificProject.form.subject}
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
                    placeholder="Биология"
                    required
                  />
                </div>

                {/* Grade */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    {t.scientificProject.form.grade}
                  </label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
                    required
                  >
                    <option value="">--</option>
                    {[...Array(11)].map((_, i) => (
                      <option key={i} value={String(i + 1)}>
                        {i + 1}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Topic */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  {t.scientificProject.form.topic}
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
                  placeholder="Плесень на хлебе"
                  required
                />
              </div>

              {/* Language */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  {t.scientificProject.form.language}
                </label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {[
                    { val: "ru", label: "Русский" },
                    { val: "kz", label: "Қазақша" },
                    { val: "en", label: "English" },
                  ].map((opt) => (
                    <label
                      key={opt.val}
                      className={`flex cursor-pointer items-center justify-between rounded-xl border px-4 py-3 transition-all ${
                        language === opt.val
                          ? "border-[color:var(--primary)] bg-[color:var(--primary)]/5 ring-1 ring-[color:var(--primary)]"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="language"
                          value={opt.val}
                          checked={language === opt.val}
                          onChange={(e) => setLanguage(e.target.value as any)}
                          className="h-4 w-4 text-[color:var(--primary)] focus:ring-[color:var(--primary)]"
                        />
                        <span className="text-sm font-medium text-slate-900">{opt.label}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* User Comment */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  {t.scientificProject.form.userComment}
                </label>
                <textarea
                  value={userComment}
                  onChange={(e) => setUserComment(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
                  placeholder={t.scientificProject.form.userCommentPlaceholder}
                  rows={3}
                />
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600">
                  {error}
                </div>
              )}

              {/* Generate Button */}
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--secondary)] py-4 text-sm font-bold text-white shadow-lg transition hover:opacity-90 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />
                    {t.scientificProject.loading}
                  </>
                ) : (
                  t.scientificProject.form.generate
                )}
              </button>
            </form>
          </div>
        ) : (
          <div className="animate-fade-in space-y-6">
            <div className="glass-card rounded-3xl border border-white/60 px-6 py-6 shadow-md">
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-2xl font-bold text-slate-900">
                  {t.scientificProject.results.title}
                </h2>
                <div className="flex gap-3">
                  <button
                    onClick={() => setResult(null)}
                    className="rounded-2xl bg-white px-6 py-3 font-bold text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
                  >
                    {t.scientificProject.results.createNew}
                  </button>
                  <button
                    onClick={handleExport}
                    className="rounded-2xl bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--secondary)] px-6 py-3 font-bold text-white shadow-lg transition hover:opacity-90 disabled:opacity-50"
                  >
                    {t.scientificProject.results.export}
                  </button>
                </div>
              </div>

              {renderBlock(t.scientificProject.results.topic, "topic")}
              {renderBlock(t.scientificProject.results.abstract, "abstract")}
              {renderBlock(t.scientificProject.results.introduction, "introduction")}
              {renderBlock(t.scientificProject.results.mainPart, "main_part")}
              {renderBlock(t.scientificProject.results.conclusion, "conclusion")}
              {renderBlock(t.scientificProject.results.references, "references")}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
