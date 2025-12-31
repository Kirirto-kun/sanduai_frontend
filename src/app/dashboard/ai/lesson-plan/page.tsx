"use client";

import { useState, FormEvent } from "react";
import { useTranslations } from "../../../../i18n/LanguageContext";
import {
  generateLessonPlan,
  exportLessonPlanDocx,
  type LessonPlanRequest,
  type LessonPlanResponse,
  type LessonMeta,
  type LessonStage,
  type LessonTask,
} from "../../../../lib/api";

export default function LessonPlanPage() {
  const t = useTranslations();

  // Helper function to safely render neuro_exercise
  const renderNeuroExercise = (neuroExercise: any): string => {
    if (!neuroExercise) return "";
    if (typeof neuroExercise === "string") return neuroExercise;
    if (typeof neuroExercise === "object" && neuroExercise.name) {
      return neuroExercise.description
        ? `${neuroExercise.name}: ${neuroExercise.description}`
        : neuroExercise.name;
    }
    return "";
  };

  // Helper to safely convert any value to string
  const safeString = (value: any): string => {
    if (value === null || value === undefined) return "";
    if (typeof value === "string") return value;
    if (typeof value === "object") {
      // If it's an object with name, return name
      if (value.name) return value.name;
      // Otherwise try to stringify
      return JSON.stringify(value);
    }
    return String(value);
  };

  // Form state
  const [formData, setFormData] = useState<LessonPlanRequest>({
    subject: "",
    grade: "",
    topic: "",
    teacher_name: "",
    section_name: "",
    lesson_number: "1",
    learning_objectives: [""],
    date: "",
  });

  // Lesson plan state
  const [lessonPlan, setLessonPlan] = useState<LessonPlanResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");

  // Handle form input changes
  const handleInputChange = (field: keyof LessonPlanRequest, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Handle learning objectives
  const addObjective = () => {
    setFormData((prev) => ({
      ...prev,
      learning_objectives: [...prev.learning_objectives, ""],
    }));
  };

  const updateObjective = (index: number, value: string) => {
    setFormData((prev) => {
      const newObjectives = [...prev.learning_objectives];
      newObjectives[index] = value;
      return { ...prev, learning_objectives: newObjectives };
    });
  };

  const removeObjective = (index: number) => {
    if (formData.learning_objectives.length > 1) {
      setFormData((prev) => ({
        ...prev,
        learning_objectives: prev.learning_objectives.filter((_, i) => i !== index),
      }));
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    if (
      !formData.subject ||
      !formData.grade ||
      !formData.topic ||
      !formData.teacher_name ||
      !formData.section_name ||
      !formData.lesson_number.trim()
    ) {
      setError(t.lessonPlan.errors.required);
      return false;
    }

    const nonEmptyObjectives = formData.learning_objectives.filter((obj) => obj.trim());
    if (nonEmptyObjectives.length === 0) {
      setError(t.lessonPlan.errors.objectivesMin);
      return false;
    }

    return true;
  };

  // Generate lesson plan
  const handleGenerate = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Filter out empty objectives
      const cleanedData = {
        ...formData,
        learning_objectives: formData.learning_objectives.filter((obj) => obj.trim()),
      };

      const response = await generateLessonPlan(cleanedData);
      setLessonPlan(response);
    } catch (err: any) {
      if (err.message?.includes("401") || err.message?.toLowerCase().includes("auth")) {
        setError(t.lessonPlan.errors.auth);
      } else {
        setError(err.message || t.lessonPlan.errors.generic);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Update meta field
  const updateMetaField = (field: keyof LessonMeta, value: any) => {
    if (!lessonPlan) return;
    setLessonPlan((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        meta: { ...prev.meta, [field]: value },
      };
    });
  };

  // Update task field
  const updateTaskField = (
    stageIndex: number,
    taskIndex: number,
    field: keyof LessonTask,
    value: any,
  ) => {
    if (!lessonPlan) return;
    setLessonPlan((prev) => {
      if (!prev) return null;
      const newFlow = [...prev.flow];
      const newTasks = [...newFlow[stageIndex].tasks];
      newTasks[taskIndex] = { ...newTasks[taskIndex], [field]: value };
      newFlow[stageIndex] = { ...newFlow[stageIndex], tasks: newTasks };
      return { ...prev, flow: newFlow };
    });
  };

  // Update descriptor
  const updateDescriptor = (
    stageIndex: number,
    taskIndex: number,
    descriptorIndex: number,
    value: string,
  ) => {
    if (!lessonPlan) return;
    setLessonPlan((prev) => {
      if (!prev) return null;
      const newFlow = [...prev.flow];
      const newTasks = [...newFlow[stageIndex].tasks];
      const newDescriptors = [...newTasks[taskIndex].descriptors];
      newDescriptors[descriptorIndex] = value;
      newTasks[taskIndex] = { ...newTasks[taskIndex], descriptors: newDescriptors };
      newFlow[stageIndex] = { ...newFlow[stageIndex], tasks: newTasks };
      return { ...prev, flow: newFlow };
    });
  };

  // Add descriptor
  const addDescriptor = (stageIndex: number, taskIndex: number) => {
    if (!lessonPlan) return;
    setLessonPlan((prev) => {
      if (!prev) return null;
      const newFlow = [...prev.flow];
      const newTasks = [...newFlow[stageIndex].tasks];
      const newDescriptors = [...newTasks[taskIndex].descriptors, ""];
      newTasks[taskIndex] = { ...newTasks[taskIndex], descriptors: newDescriptors };
      newFlow[stageIndex] = { ...newFlow[stageIndex], tasks: newTasks };
      return { ...prev, flow: newFlow };
    });
  };

  // Remove descriptor
  const removeDescriptor = (
    stageIndex: number,
    taskIndex: number,
    descriptorIndex: number,
  ) => {
    if (!lessonPlan) return;
    setLessonPlan((prev) => {
      if (!prev) return null;
      const newFlow = [...prev.flow];
      const newTasks = [...newFlow[stageIndex].tasks];
      const newDescriptors = newTasks[taskIndex].descriptors.filter(
        (_, i) => i !== descriptorIndex,
      );
      newTasks[taskIndex] = { ...newTasks[taskIndex], descriptors: newDescriptors };
      newFlow[stageIndex] = { ...newFlow[stageIndex], tasks: newTasks };
      return { ...prev, flow: newFlow };
    });
  };

  // Update lesson objective
  const updateLessonObjective = (index: number, value: string) => {
    if (!lessonPlan) return;
    setLessonPlan((prev) => {
      if (!prev) return null;
      const newObjectives = [...prev.meta.lesson_objectives];
      newObjectives[index] = value;
      return {
        ...prev,
        meta: { ...prev.meta, lesson_objectives: newObjectives },
      };
    });
  };

  // Add lesson objective
  const addLessonObjective = () => {
    if (!lessonPlan) return;
    setLessonPlan((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        meta: {
          ...prev.meta,
          lesson_objectives: [...prev.meta.lesson_objectives, ""],
        },
      };
    });
  };

  // Remove lesson objective
  const removeLessonObjective = (index: number) => {
    if (!lessonPlan || lessonPlan.meta.lesson_objectives.length <= 1) return;
    setLessonPlan((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        meta: {
          ...prev.meta,
          lesson_objectives: prev.meta.lesson_objectives.filter((_, i) => i !== index),
        },
      };
    });
  };

  // Export to DOCX
  const handleExport = async () => {
    if (!lessonPlan) return;

    try {
      const blob = await exportLessonPlanDocx(lessonPlan);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `kmzh_${lessonPlan.meta.subject}_${lessonPlan.meta.grade}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || t.lessonPlan.errors.generic);
    }
  };

  // Create new plan
  const handleCreateNew = () => {
    setLessonPlan(null);
    setFormData({
      subject: "",
      grade: "",
      topic: "",
      teacher_name: "",
      section_name: "",
      lesson_number: "1",
      learning_objectives: [""],
      date: "",
    });
    setError("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-beige to-green-50 p-4 sm:p-6">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-6 text-3xl font-bold text-slate-900">{t.lessonPlan.form.title}</h1>

        {!lessonPlan ? (
          // Generation Form
          <div className="glass-card rounded-3xl border border-white/60 px-6 py-6 shadow-md sm:px-8">
            <form onSubmit={handleGenerate} className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                {/* Subject */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    {t.lessonPlan.form.subject} *
                  </label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => handleInputChange("subject", e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
                    required
                  />
                </div>

                {/* Grade */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    {t.lessonPlan.form.grade} *
                  </label>
                  <select
                    value={formData.grade}
                    onChange={(e) => handleInputChange("grade", e.target.value)}
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

                {/* Topic */}
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    {t.lessonPlan.form.topic} *
                  </label>
                  <input
                    type="text"
                    value={formData.topic}
                    onChange={(e) => handleInputChange("topic", e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
                    required
                  />
                </div>

                {/* Teacher Name */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    {t.lessonPlan.form.teacherName} *
                  </label>
                  <input
                    type="text"
                    value={formData.teacher_name}
                    onChange={(e) => handleInputChange("teacher_name", e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
                    required
                  />
                </div>

                {/* Section Name */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    {t.lessonPlan.form.sectionName} *
                  </label>
                  <input
                    type="text"
                    value={formData.section_name}
                    onChange={(e) => handleInputChange("section_name", e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
                    required
                  />
                </div>

                {/* Lesson Number */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    {t.lessonPlan.form.lessonNumber} *
                  </label>
                  <input
                    type="text"
                    value={formData.lesson_number}
                    onChange={(e) => handleInputChange("lesson_number", e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
                    required
                  />
                </div>

                {/* Date (optional) */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    {t.lessonPlan.form.date}
                  </label>
                  <input
                    type="date"
                    value={formData.date || ""}
                    onChange={(e) => handleInputChange("date", e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
                  />
                </div>
              </div>

              {/* Learning Objectives */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  {t.lessonPlan.form.learningObjectives} *
                </label>
                <div className="space-y-3">
                  {formData.learning_objectives.map((objective, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={objective}
                        onChange={(e) => updateObjective(index, e.target.value)}
                        className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
                        placeholder={`${t.lessonPlan.form.learningObjectives} ${index + 1}`}
                      />
                      {formData.learning_objectives.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeObjective(index)}
                          className="rounded-xl bg-red-50 px-4 text-red-600 hover:bg-red-100"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addObjective}
                    className="flex items-center gap-2 rounded-xl border border-dashed border-[color:var(--primary)] bg-[color:var(--primary)]/5 px-4 py-2 text-sm font-semibold text-[color:var(--primary)] hover:bg-[color:var(--primary)]/10"
                  >
                    + {t.lessonPlan.form.addObjective}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--secondary)] py-4 text-sm font-bold text-white shadow-lg transition hover:opacity-90 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />
                    {t.lessonPlan.loading}
                  </>
                ) : (
                  t.lessonPlan.form.generate
                )}
              </button>
            </form>
          </div>
        ) : (
          // Lesson Plan Preview & Edit
          <div className="animate-fade-in space-y-6">
            {/* Meta Section */}
            <div className="glass-card rounded-3xl border border-white/60 px-6 py-6 shadow-md sm:px-8">
              <h2 className="mb-4 text-2xl font-bold text-slate-900">
                {t.lessonPlan.meta.title}
              </h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {/* Section Name */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    {t.lessonPlan.meta.sectionName}
                  </label>
                  <input
                    type="text"
                    value={lessonPlan.meta.section_name}
                    onChange={(e) => updateMetaField("section_name", e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
                  />
                </div>

                {/* Subject */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    {t.lessonPlan.meta.subject}
                  </label>
                  <input
                    type="text"
                    value={lessonPlan.meta.subject}
                    onChange={(e) => updateMetaField("subject", e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
                  />
                </div>

                {/* Teacher Name */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    {t.lessonPlan.meta.teacherName}
                  </label>
                  <input
                    type="text"
                    value={lessonPlan.meta.teacher_name}
                    onChange={(e) => updateMetaField("teacher_name", e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    {t.lessonPlan.meta.date}
                  </label>
                  <input
                    type="text"
                    value={lessonPlan.meta.date}
                    onChange={(e) => updateMetaField("date", e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
                  />
                </div>

                {/* Grade */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    {t.lessonPlan.meta.grade}
                  </label>
                  <input
                    type="text"
                    value={lessonPlan.meta.grade}
                    onChange={(e) => updateMetaField("grade", e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
                  />
                </div>

                {/* Students Present */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    {t.lessonPlan.meta.studentsPresent}
                  </label>
                  <input
                    type="text"
                    value={lessonPlan.meta.students_present}
                    onChange={(e) => updateMetaField("students_present", e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
                  />
                </div>

                {/* Students Absent */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    {t.lessonPlan.meta.studentsAbsent}
                  </label>
                  <input
                    type="text"
                    value={lessonPlan.meta.students_absent}
                    onChange={(e) => updateMetaField("students_absent", e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
                  />
                </div>

                {/* Topic */}
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    {t.lessonPlan.meta.topic}
                  </label>
                  <input
                    type="text"
                    value={lessonPlan.meta.topic}
                    onChange={(e) => updateMetaField("topic", e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
                  />
                </div>
              </div>

              {/* Learning Objectives */}
              <div className="mt-6">
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  {t.lessonPlan.meta.learningObjectives}
                </label>
                <ul className="list-disc space-y-1 pl-5">
                  {lessonPlan.meta.learning_objectives.map((obj, index) => (
                    <li key={index} className="text-slate-600">
                      {safeString(obj)}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Lesson Objectives */}
              <div className="mt-6">
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  {t.lessonPlan.meta.lessonObjectives}
                </label>
                <div className="space-y-3">
                  {lessonPlan.meta.lesson_objectives.map((obj, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={obj}
                        onChange={(e) => updateLessonObjective(index, e.target.value)}
                        className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
                      />
                      {lessonPlan.meta.lesson_objectives.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeLessonObjective(index)}
                          className="rounded-xl bg-red-50 px-4 text-red-600 hover:bg-red-100"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addLessonObjective}
                    className="flex items-center gap-2 rounded-xl border border-dashed border-[color:var(--primary)] bg-[color:var(--primary)]/5 px-4 py-2 text-sm font-semibold text-[color:var(--primary)] hover:bg-[color:var(--primary)]/10"
                  >
                    + {t.lessonPlan.meta.addObjective}
                  </button>
                </div>
              </div>
            </div>

            {/* Lesson Flow Table */}
            <div className="glass-card rounded-3xl border border-white/60 px-6 py-6 shadow-md sm:px-8">
              <h2 className="mb-4 text-2xl font-bold text-slate-900">
                {t.lessonPlan.table.stage}
              </h2>

              {lessonPlan.flow.map((stage, stageIndex) => (
                <div key={stageIndex} className="mb-8 last:mb-0">
                  {/* Stage Header */}
                  <div className="mb-4 rounded-2xl bg-gradient-to-r from-orange-100 to-green-100 px-6 py-4">
                    <h3 className="text-lg font-bold text-slate-800">
                      {stage.stage_name} — {stage.time}
                    </h3>
                    {stage.neuro_exercise && (
                      <p className="mt-1 text-sm text-slate-600">
                        {t.lessonPlan.stages.neuroExercise}: {renderNeuroExercise(stage.neuro_exercise)}
                      </p>
                    )}
                  </div>

                  {/* Tasks Table */}
                  <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                    <table className="w-full min-w-[800px] border-collapse">
                      <thead>
                        <tr className="bg-slate-50">
                          <th className="border-b border-r border-slate-200 px-4 py-3 text-left text-sm font-semibold text-slate-700 w-1/4">
                            {t.lessonPlan.table.teacherActivity}
                          </th>
                          <th className="border-b border-r border-slate-200 px-4 py-3 text-left text-sm font-semibold text-slate-700 w-1/4">
                            {t.lessonPlan.table.studentActivity}
                          </th>
                          <th className="border-b border-r border-slate-200 px-4 py-3 text-left text-sm font-semibold text-slate-700 w-1/4">
                            {t.lessonPlan.table.assessment}
                          </th>
                          <th className="border-b border-slate-200 px-4 py-3 text-left text-sm font-semibold text-slate-700 w-1/4">
                            {t.lessonPlan.table.resources}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {stage.tasks.map((task, taskIndex) => (
                          <tr key={taskIndex} className="group border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                            {/* Teacher Activity */}
                            <td className="border-r border-slate-200 px-4 py-3 align-top">
                              <div className="mb-2 text-xs text-slate-500">
                                <span className="font-semibold">{task.work_type}</span> •{" "}
                                {task.method_name}
                              </div>
                              <textarea
                                value={task.teacher_activity}
                                onChange={(e) =>
                                  updateTaskField(
                                    stageIndex,
                                    taskIndex,
                                    "teacher_activity",
                                    e.target.value,
                                  )
                                }
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
                                rows={4}
                              />
                            </td>

                            {/* Student Activity */}
                            <td className="border-r border-slate-200 px-4 py-3 align-top">
                              <textarea
                                value={task.student_activity}
                                onChange={(e) =>
                                  updateTaskField(
                                    stageIndex,
                                    taskIndex,
                                    "student_activity",
                                    e.target.value,
                                  )
                                }
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
                                rows={4}
                              />
                            </td>

                            {/* Assessment (Descriptors) */}
                            <td className="border-r border-slate-200 px-4 py-3 align-top">
                              <div className="space-y-2">
                                {task.descriptors.map((descriptor, descIndex) => (
                                  <div key={descIndex} className="flex gap-1">
                                    <input
                                      type="text"
                                      value={descriptor}
                                      onChange={(e) =>
                                        updateDescriptor(
                                          stageIndex,
                                          taskIndex,
                                          descIndex,
                                          e.target.value,
                                        )
                                      }
                                      className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
                                    />
                                    <button
                                      type="button"
                                      onClick={() =>
                                        removeDescriptor(stageIndex, taskIndex, descIndex)
                                      }
                                      className="rounded-lg px-2 text-red-600 hover:bg-red-50"
                                    >
                                      ×
                                    </button>
                                  </div>
                                ))}
                                <button
                                  type="button"
                                  onClick={() => addDescriptor(stageIndex, taskIndex)}
                                  className="mt-1 text-xs font-semibold text-[color:var(--primary)] hover:underline"
                                >
                                  + {t.lessonPlan.actions.addDescriptor}
                                </button>
                              </div>
                            </td>

                            {/* Resources */}
                            <td className="px-4 py-3 align-top">
                              <textarea
                                value={task.resources}
                                onChange={(e) =>
                                  updateTaskField(
                                    stageIndex,
                                    taskIndex,
                                    "resources",
                                    e.target.value,
                                  )
                                }
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
                                rows={2}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="glass-card rounded-3xl border border-white/60 px-6 py-6 shadow-md">
              <div className="flex flex-col gap-4 sm:flex-row">
                <button
                  onClick={handleExport}
                  className="flex-1 rounded-2xl bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--secondary)] px-6 py-3 font-bold text-white shadow-lg transition hover:opacity-90"
                >
                  {t.lessonPlan.actions.download}
                </button>
                <button
                  onClick={handleCreateNew}
                  className="flex-1 rounded-2xl bg-white px-6 py-3 font-bold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
                >
                  {t.lessonPlan.actions.createNew}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
