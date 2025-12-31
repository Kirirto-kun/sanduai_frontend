"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  EssayContentBlock,
  EssayGeneratePayload,
  exportEssayDocx,
  generateEssay,
  reviseEssay,
} from "../../../lib/api";
import { useTranslations } from "../../../i18n/LanguageContext";

type PendingRevision = {
  id: string;
  blockType: string;
  targetText: string;
  instruction: string;
};

const initialPayload: EssayGeneratePayload = {
  topic: "",
  language: "kaz",
  grade_level: "",
  word_count: 400,
  essay_type: "argumentative",
};

export default function AiDocsPage() {
  const t = useTranslations();
  const [form, setForm] = useState<EssayGeneratePayload>(initialPayload);
  const [title, setTitle] = useState("");
  const [plan, setPlan] = useState<string[]>([]);
  const [blocks, setBlocks] = useState<EssayContentBlock[]>([]);
  const [blocksEditMode, setBlocksEditMode] = useState<Record<number, boolean>>({});
  const [pendingRevisions, setPendingRevisions] = useState<PendingRevision[]>([]);
  const [generalInstruction, setGeneralInstruction] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Modal state for adding a revision
  const [showModal, setShowModal] = useState(false);
  const [modalBlockType, setModalBlockType] = useState("");
  const [modalSelectedText, setModalSelectedText] = useState("");
  const [modalInstruction, setModalInstruction] = useState("");

  const hasResult = useMemo(() => title || plan.length || blocks.length, [title, plan, blocks]);

  const onGenerate = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.topic || !form.grade_level || !form.word_count || !form.essay_type) {
      setError(t.essay.errors.required);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const data = await generateEssay(form);
      setTitle(data.title);
      setPlan(data.essay_plan || []);
      setBlocks(data.content_blocks || []);
      setPendingRevisions([]);
      setGeneralInstruction("");
      setBlocksEditMode({});
    } catch (err) {
      setError(err instanceof Error ? err.message : t.essay.errors.generic);
    } finally {
      setLoading(false);
    }
  };

  const onApplyAllRevisions = async () => {
    if (!blocks.length) {
      setError(t.essay.errors.required);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const inline_comments = pendingRevisions.map((r) => ({
        block_type: r.blockType,
        target_text: r.targetText,
        instruction: r.instruction,
      }));
      const payload = {
        current_content_blocks: blocks,
        inline_comments: inline_comments.length > 0 ? inline_comments : undefined,
        general_instruction: generalInstruction || undefined,
      };
      const data = await reviseEssay(payload);
      setTitle(data.title);
      setPlan(data.essay_plan || []);
      setBlocks(data.content_blocks || []);
      setPendingRevisions([]);
      setGeneralInstruction("");
    } catch (err) {
      setError(err instanceof Error ? err.message : t.essay.errors.generic);
    } finally {
      setLoading(false);
    }
  };

  const onExport = async () => {
    if (!blocks.length) {
      setError(t.essay.errors.required);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const blob = await exportEssayDocx({
        title: title || form.topic || "essay",
        essay_plan: plan,
        content_blocks: blocks,
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "essay.docx";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.essay.errors.generic);
    } finally {
      setLoading(false);
    }
  };

  const openModalForSelection = (blockType: string) => {
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim() ?? "";
    if (!selectedText) {
      return;
    }
    setModalBlockType(blockType);
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
      blockType: modalBlockType,
      targetText: modalSelectedText,
      instruction: modalInstruction,
    };
    setPendingRevisions((prev) => [...prev, newRevision]);
    setShowModal(false);
    setModalBlockType("");
    setModalSelectedText("");
    setModalInstruction("");
  };

  const removeRevision = (id: string) => {
    setPendingRevisions((prev) => prev.filter((r) => r.id !== id));
  };

  const toggleEditMode = (index: number) => {
    setBlocksEditMode((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const getSectionTitle = (block: EssayContentBlock, index: number): string => {
    const type = block.section_type.toLowerCase();
    const sectionTypes = t.essay.results.sectionTypes as Record<string, string>;
    
    if (type === "introduction") {
      return sectionTypes.introduction || "Introduction";
    } else if (type === "conclusion") {
      return sectionTypes.conclusion || "Conclusion";
    } else if (type === "body") {
      // Count how many body blocks come before this one
      const bodyIndex = blocks.slice(0, index).filter(b => b.section_type.toLowerCase() === "body").length;
      return `${sectionTypes.body || "Body"} ${bodyIndex + 1}`;
    }
    return block.section_type;
  };

  return (
    <div className="space-y-6">
      {/* Generation Form */}
      <div className="glass-card rounded-3xl border border-white/60 px-6 py-6 shadow-md sm:px-8">
        <h2 className="text-xl font-semibold text-slate-900">{t.essay.form.title}</h2>
        <form className="mt-4 grid gap-4 sm:grid-cols-2" onSubmit={onGenerate}>
          <Input
            label={t.essay.form.topic}
            value={form.topic}
            onChange={(v) => setForm((f) => ({ ...f, topic: v }))}
            placeholder="Абай Құнанбаев"
          />
          <Select
            label={t.essay.form.language}
            value={form.language}
            onChange={(v) => setForm((f) => ({ ...f, language: v as "kaz" | "rus" }))}
            options={[
              { value: "kaz", label: "Қазақша" },
              { value: "rus", label: "Русский" },
            ]}
          />
          <Input
            label={t.essay.form.grade}
            value={form.grade_level}
            onChange={(v) => setForm((f) => ({ ...f, grade_level: v }))}
            placeholder="10 сынып"
          />
          <Input
            type="number"
            min={100}
            max={1200}
            label={t.essay.form.wordCount}
            value={String(form.word_count || "")}
            onChange={(v) => setForm((f) => ({ ...f, word_count: Number(v) || 0 }))}
            placeholder="400"
          />
          <Select
            label={t.essay.form.type}
            value={form.essay_type}
            onChange={(v) =>
              setForm((f) => ({
                ...f,
                essay_type: v as "argumentative" | "descriptive" | "narrative",
              }))
            }
            options={[
              { value: "argumentative", label: t.essay.types.argumentative },
              { value: "descriptive", label: t.essay.types.descriptive },
              { value: "narrative", label: t.essay.types.narrative },
            ]}
          />

          {error && (
            <div className="sm:col-span-2 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="sm:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--secondary)] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/30 transition hover:shadow-xl hover:shadow-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? t.essay.loading : t.essay.form.generate}
            </button>
          </div>
        </form>
      </div>

      {/* Results */}
      {hasResult && (
        <div className="space-y-6">
          {/* Title and Plan */}
          <div className="glass-card rounded-3xl border border-white/60 px-6 py-6 shadow-md sm:px-8">
            <h3 className="text-lg font-semibold text-slate-900">{title || form.topic}</h3>
            {plan.length > 0 && (
              <div className="mt-4">
                <ul className="mt-2 space-y-1 text-sm text-slate-700">
                  {plan.map((p, idx) => (
                    <li key={idx} className="flex gap-2">
                      <span className="text-xs font-semibold text-slate-500">{idx + 1}.</span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Content Blocks */}
          <div className="glass-card rounded-3xl border border-white/60 px-6 py-6 shadow-md sm:px-8">
            <div className="space-y-8">
              {blocks.map((block, idx) => (
                <div key={idx} className="group">
                  {/* Section Header */}
                  <div className="mb-2 flex items-center justify-between">
                    <h4
                      className="select-none text-[10px] font-bold uppercase tracking-wider text-slate-400"
                      style={{ userSelect: "none" }}
                    >
                      {getSectionTitle(block, idx)}
                    </h4>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleEditMode(idx)}
                        className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-800"
                      >
                        {blocksEditMode[idx] ? t.essay.results.saveBlock : t.essay.results.editBlock}
                      </button>
                      {!blocksEditMode[idx] && (
                        <button
                          type="button"
                          onClick={() => openModalForSelection(block.section_type)}
                          className="rounded-full border border-[color:var(--primary)] bg-white px-2.5 py-1 text-[10px] font-semibold text-[color:var(--primary)] shadow-sm transition hover:bg-[color:var(--primary)] hover:text-white"
                        >
                          ✏️ {t.essay.results.addRevision}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  {blocksEditMode[idx] ? (
                    <textarea
                      value={block.text}
                      onChange={(e) =>
                        setBlocks((prev) =>
                          prev.map((b, i) => (i === idx ? { ...b, text: e.target.value } : b)),
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
                      {block.text}
                    </div>
                  )}

                  {/* Subtle Separator */}
                  {idx < blocks.length - 1 && (
                    <div className="mt-6 border-b border-slate-200/50"></div>
                  )}
                </div>
              ))}
            </div>

            {/* Pending Revisions List */}
            {pendingRevisions.length > 0 && (
              <div className="mt-8 space-y-3 border-t border-slate-200 pt-6">
                <h4 className="text-sm font-semibold text-slate-800">
                  {t.essay.results.pendingRevisions} ({pendingRevisions.length})
                </h4>
                {pendingRevisions.map((rev, idx) => (
                  <div
                    key={rev.id}
                    className="rounded-2xl border border-orange-200 bg-orange-50/50 p-3 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 space-y-1">
                        <p className="text-xs font-semibold text-orange-900">
                          {t.essay.results.revision} {idx + 1}
                        </p>
                        <p className="text-xs text-orange-800">
                          <span className="font-medium">{t.essay.results.selectedText}:</span>{" "}
                          {rev.targetText.substring(0, 60)}
                          {rev.targetText.length > 60 ? "..." : ""}
                        </p>
                        <p className="text-xs text-orange-800">
                          <span className="font-medium">{t.essay.results.instruction}:</span>{" "}
                          {rev.instruction}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeRevision(rev.id)}
                        className="text-xs font-semibold text-red-600 hover:text-red-800"
                      >
                        {t.essay.results.delete}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* General Instruction */}
            <div className="mt-6 space-y-2 border-t border-slate-200 pt-6">
              <label className="text-xs font-semibold text-slate-700">
                {t.essay.results.generalInstruction}
              </label>
              <textarea
                value={generalInstruction}
                onChange={(e) => setGeneralInstruction(e.target.value)}
                rows={2}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
                placeholder="Сделай стиль более академичным"
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
                {t.essay.results.export}
              </button>
              {(pendingRevisions.length > 0 || generalInstruction) && (
                <button
                  type="button"
                  onClick={onApplyAllRevisions}
                  disabled={loading}
                  className="rounded-full bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--secondary)] px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-orange-500/30 transition hover:shadow-xl hover:shadow-emerald-500/30 disabled:opacity-70"
                >
                  {loading
                    ? t.essay.loading
                    : `${t.essay.results.applyAllRevisions} (${pendingRevisions.length + (generalInstruction ? 1 : 0)})`}
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
              {t.essay.results.addRevision}
            </h3>
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  {t.essay.results.selectedText}
                </label>
                <div className="mt-1 max-h-24 overflow-auto rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  {modalSelectedText}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  {t.essay.results.whatToChange}
                </label>
                <textarea
                  value={modalInstruction}
                  onChange={(e) => setModalInstruction(e.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
                  placeholder="Сделай этот абзац более кратким"
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
                {t.essay.results.cancel}
              </button>
              <button
                type="button"
                onClick={addRevision}
                disabled={!modalInstruction}
                className="rounded-full bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--secondary)] px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-orange-500/30 transition hover:shadow-xl hover:shadow-emerald-500/30 disabled:opacity-70"
              >
                {t.essay.results.addRevision}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  min,
  max,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  min?: number;
  max?: number;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700">{label}</label>
      <input
        type={type}
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
        placeholder={placeholder}
      />
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
