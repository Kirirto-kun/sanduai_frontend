"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  ArticleGeneratePayload,
  ArticleMeta,
  ArticleResponse,
  ArticleSection,
  exportArticleDocx,
  generateArticle,
  reviseArticle,
} from "../../../../lib/api";
import { useTranslations } from "../../../../i18n/LanguageContext";

type PendingRevision = {
  id: string;
  targetText: string;
  instruction: string;
};

const initialPayload: ArticleGeneratePayload = {
  topic: "",
  language: "rus",
  author_name: "",
  author_role: "",
  genre: "scientific",
};

export default function ArticlePage() {
  const t = useTranslations();
  const [form, setForm] = useState<ArticleGeneratePayload>(initialPayload);
  const [meta, setMeta] = useState<ArticleMeta | null>(null);
  const [sections, setSections] = useState<ArticleSection[]>([]);
  const [conclusion, setConclusion] = useState("");
  const [references, setReferences] = useState<string[]>([]);
  const [pendingRevisions, setPendingRevisions] = useState<PendingRevision[]>([]);
  const [blocksEditMode, setBlocksEditMode] = useState<Record<number, boolean>>({});
  const [generalInstruction, setGeneralInstruction] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Modal state for adding a revision
  const [showModal, setShowModal] = useState(false);
  const [modalSelectedText, setModalSelectedText] = useState("");
  const [modalInstruction, setModalInstruction] = useState("");

  const hasResult = useMemo(
    () => meta !== null || sections.length > 0,
    [meta, sections],
  );

  const onGenerate = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.topic || !form.author_name || !form.author_role) {
      setError(t.article.errors.required);
      return;
    }
    if (form.genre === "custom" && !form.custom_genre_description) {
      setError(t.article.errors.required);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const data = await generateArticle(form);
      setMeta(data.meta);
      setSections(data.sections);
      setConclusion(data.conclusion);
      setReferences(data.references || []);
      setPendingRevisions([]);
      setGeneralInstruction("");
      setBlocksEditMode({});
    } catch (err) {
      setError(err instanceof Error ? err.message : t.article.errors.generic);
    } finally {
      setLoading(false);
    }
  };

  const onApplyAllRevisions = async () => {
    if (!meta || !sections.length) {
      setError(t.article.errors.required);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const inline_comments = pendingRevisions.map((r) => ({
        target_text: r.targetText,
        instruction: r.instruction,
      }));
      const payload = {
        current_meta: meta,
        current_sections: sections,
        current_conclusion: conclusion,
        current_references: references,
        inline_comments: inline_comments.length > 0 ? inline_comments : undefined,
        general_instruction: generalInstruction || undefined,
      };
      const data = await reviseArticle(payload);
      setMeta(data.meta);
      setSections(data.sections);
      setConclusion(data.conclusion);
      setReferences(data.references || []);
      setPendingRevisions([]);
      setGeneralInstruction("");
    } catch (err) {
      setError(err instanceof Error ? err.message : t.article.errors.generic);
    } finally {
      setLoading(false);
    }
  };

  const onExport = async () => {
    if (!meta || !sections.length) {
      setError(t.article.errors.required);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const articleData: ArticleResponse = {
        meta,
        sections,
        conclusion,
        references,
      };
      const blob = await exportArticleDocx(articleData);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "article.docx";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.article.errors.generic);
    } finally {
      setLoading(false);
    }
  };

  const openModalForSelection = () => {
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim() ?? "";
    if (!selectedText) {
      return;
    }
    setModalSelectedText(selectedText);
    setModalInstruction("");
    setShowModal(true);
  };

  const addRevision = () => {
    if (!modalSelectedText || !modalInstruction) {
      return;
    }
    const newRevision: PendingRevision = {
      id: Date.now().toString(),
      targetText: modalSelectedText,
      instruction: modalInstruction,
    };
    setPendingRevisions((prev) => [...prev, newRevision]);
    setShowModal(false);
    setModalSelectedText("");
    setModalInstruction("");
  };

  const removeRevision = (id: string) => {
    setPendingRevisions((prev) => prev.filter((r) => r.id !== id));
  };

  const toggleEditMode = (index: number) => {
    setBlocksEditMode((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-beige to-green-50 p-4 sm:p-6">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-6 text-3xl font-bold text-slate-900">{t.article.form.title}</h1>

        {/* Generation Form */}
        <div className="glass-card mb-6 rounded-3xl border border-white/60 px-6 py-6 shadow-md sm:px-8">
          <form className="space-y-6" onSubmit={onGenerate}>
            <div className="grid gap-6 sm:grid-cols-2">
              <Input
                label={t.article.form.topic}
                value={form.topic}
                onChange={(v) => setForm((f) => ({ ...f, topic: v }))}
                placeholder="Цифровизация образования в РК"
              />
              
              {/* Language Radio Group */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  {t.article.form.language}
                </label>
                <div className="flex gap-4">
                  <label
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-all ${
                      form.language === "rus"
                        ? "border-[color:var(--primary)] bg-[color:var(--primary)]/5 ring-1 ring-[color:var(--primary)]"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="language"
                      value="rus"
                      checked={form.language === "rus"}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, language: e.target.value as "kaz" | "rus" }))
                      }
                      className="h-4 w-4 text-[color:var(--primary)] focus:ring-[color:var(--primary)]"
                    />
                    <span className="text-sm font-medium text-slate-900">Русский</span>
                  </label>
                  <label
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-all ${
                      form.language === "kaz"
                        ? "border-[color:var(--primary)] bg-[color:var(--primary)]/5 ring-1 ring-[color:var(--primary)]"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="language"
                      value="kaz"
                      checked={form.language === "kaz"}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, language: e.target.value as "kaz" | "rus" }))
                      }
                      className="h-4 w-4 text-[color:var(--primary)] focus:ring-[color:var(--primary)]"
                    />
                    <span className="text-sm font-medium text-slate-900">Қазақша</span>
                  </label>
                </div>
              </div>

              <Input
                label={t.article.form.authorName}
                value={form.author_name}
                onChange={(v) => setForm((f) => ({ ...f, author_name: v }))}
                placeholder="Айгүл Омарова"
              />
              <Input
                label={t.article.form.authorRole}
                value={form.author_role}
                onChange={(v) => setForm((f) => ({ ...f, author_role: v }))}
                placeholder="Учитель информатики"
              />
            </div>

            {/* Genre */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                {t.article.form.genre}
              </label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {[
                  { value: "scientific", label: t.article.genres.scientific },
                  { value: "publicistic", label: t.article.genres.publicistic },
                  { value: "custom", label: t.article.genres.custom },
                ].map((option) => (
                  <label
                    key={option.value}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-all ${
                      form.genre === option.value
                        ? "border-[color:var(--primary)] bg-[color:var(--primary)]/5 ring-1 ring-[color:var(--primary)]"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="genre"
                      value={option.value}
                      checked={form.genre === option.value}
                      onChange={(e) => setForm((f) => ({ ...f, genre: e.target.value as any }))}
                      className="h-4 w-4 text-[color:var(--primary)] focus:ring-[color:var(--primary)]"
                    />
                    <span className="text-sm font-medium text-slate-900">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {form.genre === "custom" && (
              <div>
                <Input
                  label={t.article.form.customGenre}
                  value={form.custom_genre_description || ""}
                  onChange={(v) => setForm((f) => ({ ...f, custom_genre_description: v }))}
                  placeholder="Пост для Инстаграм"
                />
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                {t.article.form.additionalContext}
              </label>
              <textarea
                value={form.additional_context || ""}
                onChange={(e) => setForm((f) => ({ ...f, additional_context: e.target.value }))}
                rows={3}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
                placeholder="Упомяни платформу Bilimland и мой 7 'А' класс"
              />
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--secondary)] py-4 text-sm font-bold text-white shadow-lg transition hover:opacity-90 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />
                  {t.article.loading}
                </>
              ) : (
                t.article.form.generate
              )}
            </button>
          </form>
        </div>

        {/* Results */}
        {hasResult && (
          <div className="animate-fade-in space-y-6">
            {/* Metadata */}
            {meta && (
              <div className="glass-card rounded-3xl border border-white/60 px-6 py-6 shadow-md sm:px-8">
                <h3 className="text-center text-xl font-bold uppercase text-slate-900">
                  {meta.title}
                </h3>
                <p className="mt-2 text-right text-sm italic text-slate-700">{meta.author_block}</p>
                <div className="mt-4 space-y-2">
                  <div>
                    <span className="select-none text-xs font-semibold text-slate-500">
                      {t.article.results.abstract}:
                    </span>
                    <p className="mt-1 text-sm text-slate-700">{meta.abstract}</p>
                  </div>
                  <div>
                    <span className="select-none text-xs font-semibold text-slate-500">
                      {t.article.results.keywords}:
                    </span>
                    <p className="mt-1 text-sm italic text-slate-600">
                      {meta.keywords?.join(", ") || ""}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Content Sections */}
            <div className="glass-card rounded-3xl border border-white/60 px-6 py-6 shadow-md sm:px-8">
              <div className="space-y-8">
                {sections.map((section, idx) => (
                  <div key={idx} className="group">
                    {/* Section Header */}
                    <div className="mb-2 flex items-center justify-between">
                      <h4
                        className="select-none text-sm font-bold uppercase tracking-wider text-slate-700"
                        style={{ userSelect: "none" }}
                      >
                        {section.heading}
                      </h4>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleEditMode(idx)}
                          className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-800"
                        >
                          {blocksEditMode[idx] ? t.article.results.saveBlock : t.article.results.editBlock}
                        </button>
                        {!blocksEditMode[idx] && (
                          <button
                            type="button"
                            onClick={openModalForSelection}
                            className="rounded-full border border-[color:var(--primary)] bg-white px-2.5 py-1 text-[10px] font-semibold text-[color:var(--primary)] shadow-sm transition hover:bg-[color:var(--primary)] hover:text-white"
                          >
                            ✏️ {t.article.results.addRevision}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    {blocksEditMode[idx] ? (
                      <textarea
                        value={section.content}
                        onChange={(e) =>
                          setSections((prev) =>
                            prev.map((s, i) => (i === idx ? { ...s, content: e.target.value } : s)),
                          )
                        }
                        rows={8}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-relaxed text-slate-900 shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
                      />
                    ) : (
                      <div
                        className="whitespace-pre-wrap rounded-2xl bg-white/50 px-4 py-3 text-sm leading-relaxed text-slate-800"
                        style={{ whiteSpace: "pre-wrap" }}
                      >
                        {section.content}
                      </div>
                    )}

                    {/* Separator */}
                    {idx < sections.length - 1 && (
                      <div className="mt-6 border-b border-slate-200/50"></div>
                    )}
                  </div>
                ))}

                {/* Conclusion */}
                {conclusion && (
                  <div className="group">
                    <h4
                      className="mb-2 select-none text-sm font-bold uppercase tracking-wider text-slate-700"
                      style={{ userSelect: "none" }}
                    >
                      {t.article.results.conclusion}
                    </h4>
                    <div className="mb-2 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => toggleEditMode(sections.length)}
                        className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-800"
                      >
                        {blocksEditMode[sections.length] ? t.article.results.saveBlock : t.article.results.editBlock}
                      </button>
                      {!blocksEditMode[sections.length] && (
                        <button
                          type="button"
                          onClick={openModalForSelection}
                          className="rounded-full border border-[color:var(--primary)] bg-white px-2.5 py-1 text-[10px] font-semibold text-[color:var(--primary)] shadow-sm transition hover:bg-[color:var(--primary)] hover:text-white"
                        >
                          ✏️ {t.article.results.addRevision}
                        </button>
                      )}
                    </div>
                    {blocksEditMode[sections.length] ? (
                      <textarea
                        value={conclusion}
                        onChange={(e) => setConclusion(e.target.value)}
                        rows={6}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-relaxed text-slate-900 shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
                      />
                    ) : (
                      <div
                        className="whitespace-pre-wrap rounded-2xl bg-white/50 px-4 py-3 text-sm leading-relaxed text-slate-800"
                        style={{ whiteSpace: "pre-wrap" }}
                      >
                        {conclusion}
                      </div>
                    )}
                  </div>
                )}

                {/* References */}
                {references.length > 0 && (
                  <div className="group mt-6 border-t border-slate-200 pt-6">
                    <h4
                      className="mb-3 select-none text-sm font-bold uppercase tracking-wider text-slate-700"
                      style={{ userSelect: "none" }}
                    >
                      {t.article.results.references}
                    </h4>
                    <ol className="space-y-1 pl-5 text-sm text-slate-700">
                      {references.map((ref, idx) => (
                        <li key={idx} className="list-decimal">
                          {ref}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>

              {/* Pending Revisions List */}
              {pendingRevisions.length > 0 && (
                <div className="mt-8 space-y-3 border-t border-slate-200 pt-6">
                  <h4 className="text-sm font-semibold text-slate-800">
                    {t.article.results.pendingRevisions} ({pendingRevisions.length})
                  </h4>
                  {pendingRevisions.map((rev, idx) => (
                    <div
                      key={rev.id}
                      className="rounded-2xl border border-orange-200 bg-orange-50/50 p-3 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 space-y-1">
                          <p className="text-xs font-semibold text-orange-900">
                            {t.article.results.revision} {idx + 1}
                          </p>
                          <p className="text-xs text-orange-800">
                            <span className="font-medium">{t.article.results.selectedText}:</span>{" "}
                            {rev.targetText.substring(0, 60)}
                            {rev.targetText.length > 60 ? "..." : ""}
                          </p>
                          <p className="text-xs text-orange-800">
                            <span className="font-medium">{t.article.results.instruction}:</span>{" "}
                            {rev.instruction}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeRevision(rev.id)}
                          className="text-xs font-semibold text-red-600 hover:text-red-800"
                        >
                          {t.article.results.delete}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* General Instruction */}
              <div className="mt-6 space-y-2 border-t border-slate-200 pt-6">
                <label className="text-xs font-semibold text-slate-700">
                  {t.article.results.generalInstruction}
                </label>
                <textarea
                  value={generalInstruction}
                  onChange={(e) => setGeneralInstruction(e.target.value)}
                  rows={2}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
                  placeholder="Сделай стиль более научным, добавь ссылки на стандарты РК"
                />
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onExport}
                  disabled={loading}
                  className="rounded-2xl bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--secondary)] px-6 py-3 font-bold text-white shadow-lg transition hover:opacity-90 disabled:opacity-50"
                >
                  {t.article.results.export}
                </button>
                {(pendingRevisions.length > 0 || generalInstruction) && (
                  <button
                    type="button"
                    onClick={onApplyAllRevisions}
                    disabled={loading}
                    className="rounded-2xl bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--secondary)] px-6 py-3 font-bold text-white shadow-lg transition hover:opacity-90 disabled:opacity-70"
                  >
                    {loading
                      ? t.article.loading
                      : `${t.article.results.applyAllRevisions} (${pendingRevisions.length + (generalInstruction ? 1 : 0)})`}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal for adding revision */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-md rounded-3xl border border-white/60 bg-white p-6 shadow-2xl">
              <h3 className="text-lg font-semibold text-slate-900">
                {t.article.results.addRevision}
              </h3>
              <div className="mt-4 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    {t.article.results.selectedText}
                  </label>
                  <div className="mt-1 max-h-24 overflow-auto rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                    {modalSelectedText}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    {t.article.results.whatToChange}
                  </label>
                  <textarea
                    value={modalInstruction}
                    onChange={(e) => setModalInstruction(e.target.value)}
                    rows={3}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
                    placeholder="Замени на 'образовательная платформа Bilimland'"
                    autoFocus
                  />
                </div>
              </div>
              <div className="mt-5 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50"
                >
                  {t.article.results.cancel}
                </button>
                <button
                  type="button"
                  onClick={addRevision}
                  disabled={!modalInstruction}
                  className="rounded-full bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--secondary)] px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-orange-500/30 transition hover:shadow-xl hover:shadow-emerald-500/30 disabled:opacity-70"
                >
                  {t.article.results.addRevision}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
        placeholder={placeholder}
      />
    </div>
  );
}
