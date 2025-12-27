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
    lesson_number: 1,
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
      formData.lesson_number <= 0
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
      lesson_number: 1,
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
            <form onSubmit={handleGenerate} className="space-y-4">
              {/* Subject */}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  {t.lessonPlan.form.subject} *
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => handleInputChange("subject", e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200"
                  required
                />
              </div>

              {/* Grade */}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  {t.lessonPlan.form.grade} *
                </label>
                <input
                  type="text"
                  value={formData.grade}
                  onChange={(e) => handleInputChange("grade", e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200"
                  required
                />
              </div>

              {/* Topic */}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  {t.lessonPlan.form.topic} *
                </label>
                <input
                  type="text"
                  value={formData.topic}
                  onChange={(e) => handleInputChange("topic", e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200"
                  required
                />
              </div>

              {/* Teacher Name */}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  {t.lessonPlan.form.teacherName} *
                </label>
                <input
                  type="text"
                  value={formData.teacher_name}
                  onChange={(e) => handleInputChange("teacher_name", e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200"
                  required
                />
              </div>

              {/* Section Name */}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  {t.lessonPlan.form.sectionName} *
                </label>
                <input
                  type="text"
                  value={formData.section_name}
                  onChange={(e) => handleInputChange("section_name", e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200"
                  required
                />
              </div>

              {/* Lesson Number */}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  {t.lessonPlan.form.lessonNumber} *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.lesson_number}
                  onChange={(e) => handleInputChange("lesson_number", parseInt(e.target.value) || 1)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200"
                  required
                />
              </div>

              {/* Learning Objectives */}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  {t.lessonPlan.form.learningObjectives} *
                </label>
                <div className="space-y-2">
                  {formData.learning_objectives.map((objective, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={objective}
                        onChange={(e) => updateObjective(index, e.target.value)}
                        className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200"
                        placeholder={`${t.lessonPlan.form.learningObjectives} ${index + 1}`}
                      />
                      {formData.learning_objectives.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeObjective(index)}
                          className="rounded-xl border border-red-300 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          {t.lessonPlan.meta.removeObjective}
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addObjective}
                    className="rounded-xl border border-green-300 px-4 py-2 text-sm text-green-700 hover:bg-green-50"
                  >
                    + {t.lessonPlan.form.addObjective}
                  </button>
                </div>
              </div>

              {/* Date (optional) */}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  {t.lessonPlan.form.date}
                </label>
                <input
                  type="date"
                  value={formData.date || ""}
                  onChange={(e) => handleInputChange("date", e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200"
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
                {isLoading ? t.lessonPlan.loading : t.lessonPlan.form.generate}
              </button>
            </form>
          </div>
        ) : (
          // Lesson Plan Preview & Edit
          <div className="space-y-6">
            {/* Meta Section */}
            <div className="glass-card rounded-3xl border border-white/60 px-6 py-6 shadow-md sm:px-8">
              <h2 className="mb-4 text-2xl font-bold text-slate-900">
                {t.lessonPlan.meta.title}
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Section Name */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    {t.lessonPlan.meta.sectionName}
                  </label>
                  <input
                    type="text"
                    value={lessonPlan.meta.section_name}
                    onChange={(e) => updateMetaField("section_name", e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-2 focus:border-orange-400 focus:outline-none"
                  />
                </div>

                {/* Subject */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    {t.lessonPlan.meta.subject}
                  </label>
                  <input
                    type="text"
                    value={lessonPlan.meta.subject}
                    onChange={(e) => updateMetaField("subject", e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-2 focus:border-orange-400 focus:outline-none"
                  />
                </div>

                {/* Teacher Name */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    {t.lessonPlan.meta.teacherName}
                  </label>
                  <input
                    type="text"
                    value={lessonPlan.meta.teacher_name}
                    onChange={(e) => updateMetaField("teacher_name", e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-2 focus:border-orange-400 focus:outline-none"
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    {t.lessonPlan.meta.date}
                  </label>
                  <input
                    type="text"
                    value={lessonPlan.meta.date}
                    onChange={(e) => updateMetaField("date", e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-2 focus:border-orange-400 focus:outline-none"
                  />
                </div>

                {/* Grade */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    {t.lessonPlan.meta.grade}
                  </label>
                  <input
                    type="text"
                    value={lessonPlan.meta.grade}
                    onChange={(e) => updateMetaField("grade", e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-2 focus:border-orange-400 focus:outline-none"
                  />
                </div>

                {/* Students Present */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    {t.lessonPlan.meta.studentsPresent}
                  </label>
                  <input
                    type="text"
                    value={lessonPlan.meta.students_present}
                    onChange={(e) => updateMetaField("students_present", e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-2 focus:border-orange-400 focus:outline-none"
                  />
                </div>

                {/* Students Absent */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    {t.lessonPlan.meta.studentsAbsent}
                  </label>
                  <input
                    type="text"
                    value={lessonPlan.meta.students_absent}
                    onChange={(e) => updateMetaField("students_absent", e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-2 focus:border-orange-400 focus:outline-none"
                  />
                </div>

                {/* Topic */}
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    {t.lessonPlan.meta.topic}
                  </label>
                  <input
                    type="text"
                    value={lessonPlan.meta.topic}
                    onChange={(e) => updateMetaField("topic", e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-2 focus:border-orange-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Learning Objectives */}
              <div className="mt-4">
                <label className="mb-2 block text-sm font-medium text-slate-700">
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
              <div className="mt-4">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  {t.lessonPlan.meta.lessonObjectives}
                </label>
                <div className="space-y-2">
                  {lessonPlan.meta.lesson_objectives.map((obj, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={obj}
                        onChange={(e) => updateLessonObjective(index, e.target.value)}
                        className="flex-1 rounded-xl border border-slate-300 px-4 py-2 focus:border-orange-400 focus:outline-none"
                      />
                      {lessonPlan.meta.lesson_objectives.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeLessonObjective(index)}
                          className="rounded-xl border border-red-300 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          {t.lessonPlan.meta.removeObjective}
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addLessonObjective}
                    className="rounded-xl border border-green-300 px-4 py-2 text-sm text-green-700 hover:bg-green-50"
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
                <div key={stageIndex} className="mb-6 last:mb-0">
                  {/* Stage Header */}
                  <div className="mb-3 rounded-xl bg-gradient-to-r from-orange-100 to-green-100 px-4 py-3">
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
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-slate-100">
                          <th className="border border-slate-300 px-3 py-2 text-left text-sm font-semibold">
                            {t.lessonPlan.table.teacherActivity}
                          </th>
                          <th className="border border-slate-300 px-3 py-2 text-left text-sm font-semibold">
                            {t.lessonPlan.table.studentActivity}
                          </th>
                          <th className="border border-slate-300 px-3 py-2 text-left text-sm font-semibold">
                            {t.lessonPlan.table.assessment}
                          </th>
                          <th className="border border-slate-300 px-3 py-2 text-left text-sm font-semibold">
                            {t.lessonPlan.table.resources}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {stage.tasks.map((task, taskIndex) => (
                          <tr key={taskIndex} className="hover:bg-slate-50">
                            {/* Teacher Activity */}
                            <td className="border border-slate-300 px-3 py-2">
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
                                className="w-full rounded-lg border border-slate-300 px-2 py-1 text-sm focus:border-orange-400 focus:outline-none"
                                rows={3}
                              />
                            </td>

                            {/* Student Activity */}
                            <td className="border border-slate-300 px-3 py-2">
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
                                className="w-full rounded-lg border border-slate-300 px-2 py-1 text-sm focus:border-orange-400 focus:outline-none"
                                rows={3}
                              />
                            </td>

                            {/* Assessment (Descriptors) */}
                            <td className="border border-slate-300 px-3 py-2">
                              <div className="space-y-1">
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
                                      className="flex-1 rounded-lg border border-slate-300 px-2 py-1 text-sm focus:border-orange-400 focus:outline-none"
                                    />
                                    <button
                                      type="button"
                                      onClick={() =>
                                        removeDescriptor(stageIndex, taskIndex, descIndex)
                                      }
                                      className="rounded px-2 text-xs text-red-600 hover:bg-red-50"
                                    >
                                      ×
                                    </button>
                                  </div>
                                ))}
                                <button
                                  type="button"
                                  onClick={() => addDescriptor(stageIndex, taskIndex)}
                                  className="mt-1 rounded-lg border border-green-300 px-2 py-1 text-xs text-green-700 hover:bg-green-50"
                                >
                                  + {t.lessonPlan.actions.addDescriptor}
                                </button>
                              </div>
                            </td>

                            {/* Resources */}
                            <td className="border border-slate-300 px-3 py-2">
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
                                className="w-full rounded-lg border border-slate-300 px-2 py-1 text-sm focus:border-orange-400 focus:outline-none"
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
            <div className="flex flex-wrap gap-4">
              <button
                onClick={handleExport}
                className="flex-1 rounded-xl bg-gradient-to-r from-orange-500 to-green-500 px-6 py-3 font-semibold text-white shadow-md transition hover:shadow-lg"
              >
                {t.lessonPlan.actions.download}
              </button>
              <button
                onClick={handleCreateNew}
                className="flex-1 rounded-xl border-2 border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 shadow-md transition hover:bg-slate-50 hover:shadow-lg"
              >
                {t.lessonPlan.actions.createNew}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


