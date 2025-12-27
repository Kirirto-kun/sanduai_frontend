"use client";

import { useState, FormEvent } from "react";
import { useTranslations } from "../../../../i18n/LanguageContext";
import {
  generateClassHour,
  regenerateClassHourBlock,
  exportClassHourDocx,
  type ClassHourGeneratePayload,
  type ClassHourResponse,
  type ClassHourBlock,
} from "../../../../lib/api";
import { LatexRenderer } from "../../../../components/LatexRenderer";

export default function ClassHoursPage() {
  const t = useTranslations();

  // Form state
  const [formData, setFormData] = useState<ClassHourGeneratePayload>({
    language: "kz",
    topic: "",
    grade: "",
    value: "",
    format: "",
    wishes: "",
  });

  // Lesson data state
  const [lessonData, setLessonData] = useState<ClassHourResponse | null>(null);
  const [editingBlockId, setEditingBlockId] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState<string>("");

  // Regenerate modal state
  const [regenerateModal, setRegenerateModal] = useState<{
    blockId: number;
    blockTitle: string;
    currentContent: string;
  } | null>(null);
  const [regenerateInstruction, setRegenerateInstruction] = useState("");

  // Loading and error states
  const [isLoading, setIsLoading] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [error, setError] = useState("");

  // Handle form input changes
  const handleInputChange = (
    field: keyof ClassHourGeneratePayload,
    value: string,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Validate form
  const validateForm = (): boolean => {
    if (
      !formData.topic.trim() ||
      !formData.grade.trim() ||
      !formData.value.trim() ||
      !formData.format.trim()
    ) {
      setError(t.classHour.errors.required);
      return false;
    }
    return true;
  };

  // Generate class hour scenario
  const handleGenerate = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const response = await generateClassHour(formData);
      setLessonData(response);
    } catch (err: any) {
      if (err.message?.includes("401") || err.message?.toLowerCase().includes("auth")) {
        setError(t.classHour.errors.auth);
      } else {
        setError(err.message || t.classHour.errors.generic);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Update block content
  const updateBlockContent = (blockId: number, newContent: string) => {
    if (!lessonData) return;
    setLessonData({
      ...lessonData,
      blocks: lessonData.blocks.map((block) =>
        block.id === blockId ? { ...block, content: newContent } : block,
      ),
    });
  };

  // Start editing a block
  const startEditing = (blockId: number, content: string) => {
    setEditingBlockId(blockId);
    setEditingContent(content);
  };

  // Save editing
  const saveEditing = () => {
    if (editingBlockId !== null) {
      updateBlockContent(editingBlockId, editingContent);
      setEditingBlockId(null);
      setEditingContent("");
    }
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingBlockId(null);
    setEditingContent("");
  };

  // Handle key down in textarea (Escape to cancel)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      cancelEditing();
    }
  };

  // Open regenerate modal
  const openRegenerateModal = (block: ClassHourBlock) => {
    setRegenerateModal({
      blockId: block.id,
      blockTitle: block.title,
      currentContent: block.content,
    });
    setRegenerateInstruction("");
  };

  // Close regenerate modal
  const closeRegenerateModal = () => {
    setRegenerateModal(null);
    setRegenerateInstruction("");
  };

  // Regenerate block
  const handleRegenerateBlock = async () => {
    if (!regenerateModal || !lessonData) return;

    setIsRegenerating(true);
    setError("");
    try {
      const updatedBlock = await regenerateClassHourBlock({
        lesson_id: lessonData.lesson_id,
        block_id: regenerateModal.blockId,
        current_content: regenerateModal.currentContent,
        instruction: regenerateInstruction || undefined,
      });

      updateBlockContent(updatedBlock.id, updatedBlock.content);
      closeRegenerateModal();
    } catch (err: any) {
      setError(err.message || t.classHour.errors.generic);
    } finally {
      setIsRegenerating(false);
    }
  };

  // Export to DOCX
  const handleExport = async () => {
    if (!lessonData) return;

    try {
      const blob = await exportClassHourDocx({
        topic: lessonData.topic,
        blocks: lessonData.blocks,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `class_hour_${lessonData.topic.replace(/\s+/g, "_")}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || t.classHour.errors.generic);
    }
  };

  // Create new scenario
  const handleCreateNew = () => {
    setLessonData(null);
    setFormData({
      language: "kz",
      topic: "",
      grade: "",
      value: "",
      format: "",
      wishes: "",
    });
    setError("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-beige to-green-50 p-4 sm:p-6">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-6 text-3xl font-bold text-slate-900">
          {t.classHour.form.title}
        </h1>

        {!lessonData ? (
          // Generation Form
          <div className="glass-card rounded-3xl border border-white/60 px-6 py-6 shadow-md sm:px-8">
            <form onSubmit={handleGenerate} className="space-y-4">
              {/* Language Selection */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  {t.classHour.form.language} *
                </label>
                <div className="flex gap-4">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="language"
                      value="kz"
                      checked={formData.language === "kz"}
                      onChange={(e) => handleInputChange("language", e.target.value)}
                      className="h-4 w-4 border-slate-300 text-orange-500 focus:ring-orange-400"
                    />
                    <span className="text-sm text-slate-700">Қазақша</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="language"
                      value="ru"
                      checked={formData.language === "ru"}
                      onChange={(e) => handleInputChange("language", e.target.value)}
                      className="h-4 w-4 border-slate-300 text-orange-500 focus:ring-orange-400"
                    />
                    <span className="text-sm text-slate-700">Русский</span>
                  </label>
                </div>
              </div>

              {/* Topic */}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  {t.classHour.form.topic} *
                </label>
                <input
                  type="text"
                  value={formData.topic}
                  onChange={(e) => handleInputChange("topic", e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200"
                  required
                />
              </div>

              {/* Grade */}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  {t.classHour.form.grade} *
                </label>
                <input
                  type="text"
                  value={formData.grade}
                  onChange={(e) => handleInputChange("grade", e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200"
                  placeholder="5, 7-8"
                  required
                />
              </div>

              {/* Value */}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  {t.classHour.form.value} *
                </label>
                <input
                  type="text"
                  value={formData.value}
                  onChange={(e) => handleInputChange("value", e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200"
                  placeholder={t.classHour.form.valuePlaceholder}
                  required
                />
              </div>

              {/* Format */}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  {t.classHour.form.format} *
                </label>
                <input
                  type="text"
                  value={formData.format}
                  onChange={(e) => handleInputChange("format", e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200"
                  placeholder={t.classHour.form.formatPlaceholder}
                  required
                />
              </div>

              {/* Wishes (Optional) */}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  {t.classHour.form.wishes}
                </label>
                <textarea
                  value={formData.wishes}
                  onChange={(e) => handleInputChange("wishes", e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200"
                  placeholder={t.classHour.form.wishesPlaceholder}
                  rows={3}
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-green-500 px-6 py-3 font-semibold text-white shadow-md transition hover:shadow-lg disabled:opacity-50"
              >
                {isLoading ? t.classHour.loading : t.classHour.form.generate}
              </button>
            </form>
          </div>
        ) : (
          // Scenario Preview & Edit
          <div className="space-y-6">
            {/* Title */}
            <div className="glass-card rounded-3xl border border-white/60 px-6 py-4 shadow-md sm:px-8">
              <h2 className="text-2xl font-bold text-slate-900">
                {t.classHour.results.title}: {lessonData.topic}
              </h2>
            </div>

            {/* Blocks */}
            {lessonData.blocks.map((block) => (
              <div
                key={block.id}
                className="glass-card rounded-3xl border border-white/60 px-6 py-6 shadow-md sm:px-8"
              >
                {/* Block Title */}
                <h3 className="mb-4 text-xl font-bold text-slate-800">
                  {block.title}
                </h3>

                {/* Block Content */}
                {editingBlockId === block.id ? (
                  // Editing Mode
                  <div className="space-y-3">
                    <textarea
                      value={editingContent}
                      onChange={(e) => setEditingContent(e.target.value)}
                      onBlur={saveEditing}
                      onKeyDown={handleKeyDown}
                      className="w-full rounded-xl border border-orange-300 px-4 py-3 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200"
                      rows={10}
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={saveEditing}
                        className="rounded-xl bg-green-500 px-4 py-2 text-sm font-medium text-white hover:bg-green-600"
                      >
                        {t.classHour.results.editBlock}
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                      >
                        {t.classHour.results.cancel}
                      </button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div>
                    <div
                      onClick={() => startEditing(block.id, block.content)}
                      className="mb-4 cursor-pointer rounded-xl bg-white/50 px-4 py-3 text-slate-700 transition hover:bg-white/80"
                      style={{ whiteSpace: "pre-wrap" }}
                    >
                      <LatexRenderer text={block.content} />
                    </div>
                    <button
                      onClick={() => openRegenerateModal(block)}
                      className="rounded-xl border border-orange-300 bg-white px-4 py-2 text-sm font-medium text-orange-600 hover:bg-orange-50"
                    >
                      🔄 {t.classHour.results.regenerateBlock}
                    </button>
                  </div>
                )}
              </div>
            ))}

            {/* Error Message (if any during operations) */}
            {error && (
              <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4">
              <button
                onClick={handleExport}
                className="flex-1 rounded-xl bg-gradient-to-r from-orange-500 to-green-500 px-6 py-3 font-semibold text-white shadow-md transition hover:shadow-lg"
              >
                {t.classHour.results.export}
              </button>
              <button
                onClick={handleCreateNew}
                className="flex-1 rounded-xl border-2 border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 shadow-md transition hover:bg-slate-50 hover:shadow-lg"
              >
                {t.classHour.results.createNew}
              </button>
            </div>
          </div>
        )}

        {/* Regenerate Modal */}
        {regenerateModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={closeRegenerateModal}
          >
            <div
              className="w-full max-w-lg rounded-3xl border border-white/60 bg-white px-6 py-6 shadow-xl sm:px-8"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="mb-4 text-xl font-bold text-slate-900">
                {t.classHour.results.regenerateBlock}: {regenerateModal.blockTitle}
              </h3>

              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  {t.classHour.results.instructionPlaceholder}
                </label>
                <textarea
                  value={regenerateInstruction}
                  onChange={(e) => setRegenerateInstruction(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200"
                  placeholder={t.classHour.results.instructionPlaceholder}
                  rows={4}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleRegenerateBlock}
                  disabled={isRegenerating}
                  className="flex-1 rounded-xl bg-gradient-to-r from-orange-500 to-green-500 px-6 py-3 font-semibold text-white shadow-md transition hover:shadow-lg disabled:opacity-50"
                >
                  {isRegenerating
                    ? t.classHour.regenerating
                    : t.classHour.results.regenerateButton}
                </button>
                <button
                  onClick={closeRegenerateModal}
                  disabled={isRegenerating}
                  className="flex-1 rounded-xl border-2 border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 shadow-md transition hover:bg-slate-50 hover:shadow-lg disabled:opacity-50"
                >
                  {t.classHour.results.cancel}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
