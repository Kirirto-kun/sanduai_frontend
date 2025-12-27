"use client";

import { useState, FormEvent } from "react";
import { useTranslations } from "../../../../i18n/LanguageContext";
import {
  generateQuiz,
  exportQuizDocx,
  type QuizSourceType,
  type QuizLanguage,
  type QuizDifficulty,
  type QuestionType,
  type QuizGeneratePayload,
  type QuizTask,
} from "../../../../lib/api";
import { LatexRenderer } from "../../../../components/LatexRenderer";

export default function TestsPage() {
  const t = useTranslations();

  // Mode state
  const [activeMode, setActiveMode] = useState<QuizSourceType>("topic");

  // Form states
  const [topicForm, setTopicForm] = useState({
    subject: "",
    grade: "",
    topic: "",
  });

  const [textForm, setTextForm] = useState({
    context_text: "",
  });

  const [commonForm, setCommonForm] = useState<{
    language: QuizLanguage;
    question_count: number;
    difficulty: QuizDifficulty;
    question_types: QuestionType[];
  }>({
    language: "kz",
    question_count: 10,
    difficulty: "medium",
    question_types: [],
  });

  // Quiz data
  const [quizTitle, setQuizTitle] = useState("");
  const [tasks, setTasks] = useState<QuizTask[]>([]);

  // Editing states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>("");

  // Loading and error
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Handle question type toggle
  const toggleQuestionType = (type: QuestionType) => {
    setCommonForm((prev) => {
      const types = prev.question_types.includes(type)
        ? prev.question_types.filter((t) => t !== type)
        : [...prev.question_types, type];
      return { ...prev, question_types: types };
    });
  };

  // Validate form
  const validateForm = (): boolean => {
    if (activeMode === "topic") {
      if (!topicForm.subject.trim() || !topicForm.grade.trim() || !topicForm.topic.trim()) {
        setError(t.quiz.errors.required);
        return false;
      }
    } else {
      if (!textForm.context_text.trim()) {
        setError(t.quiz.errors.required);
        return false;
      }
      if (textForm.context_text.length > 10000) {
        setError(t.quiz.errors.contextTextTooLong);
        return false;
      }
    }

    if (commonForm.question_count < 5 || commonForm.question_count > 20) {
      setError(t.quiz.errors.questionCountRange);
      return false;
    }

    if (commonForm.question_types.length === 0) {
      setError(t.quiz.errors.questionTypesRequired);
      return false;
    }

    return true;
  };

  // Generate quiz
  const handleGenerate = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const payload: QuizGeneratePayload =
        activeMode === "topic"
          ? {
              source_type: "topic",
              subject: topicForm.subject,
              grade: topicForm.grade,
              topic: topicForm.topic,
              language: commonForm.language,
              question_count: commonForm.question_count,
              difficulty: commonForm.difficulty,
              question_types: commonForm.question_types,
            }
          : {
              source_type: "text",
              context_text: textForm.context_text,
              language: commonForm.language,
              question_count: commonForm.question_count,
              difficulty: commonForm.difficulty,
              question_types: commonForm.question_types,
            };

      const response = await generateQuiz(payload);
      setTasks(response.tasks);
      setQuizTitle("");
    } catch (err: any) {
      if (err.message?.includes("401") || err.message?.toLowerCase().includes("auth")) {
        setError(t.quiz.errors.auth);
      } else {
        setError(err.message || t.quiz.errors.generic);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Start editing
  const startEditing = (taskId: string, field: string, value: string) => {
    setEditingId(taskId);
    setEditingField(field);
    setEditingValue(value);
  };

  // Save editing
  const saveEditing = () => {
    if (editingId && editingField) {
      setTasks((prev) =>
        prev.map((task) => {
          if (task.id === editingId) {
            if (editingField === "question") {
              return { ...task, question: editingValue };
            } else if (editingField === "explanation") {
              return { ...task, explanation: editingValue };
            } else if (editingField.startsWith("option-")) {
              const index = parseInt(editingField.split("-")[1]);
              const newOptions = [...task.options];
              newOptions[index] = editingValue;
              return { ...task, options: newOptions };
            } else if (editingField === "correct_answer") {
              return { ...task, correct_answer: editingValue };
            }
          }
          return task;
        }),
      );
    }
    setEditingId(null);
    setEditingField(null);
    setEditingValue("");
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingId(null);
    setEditingField(null);
    setEditingValue("");
  };

  // Handle key down
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      cancelEditing();
    } else if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      saveEditing();
    }
  };

  // Remove task
  const removeTask = (taskId: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
  };

  // Add new task
  const addNewTask = () => {
    const newTask: QuizTask = {
      id: `q${Date.now()}`,
      type: "single_choice",
      question: "",
      options: ["", "", "", ""],
      correct_answer: "A",
      explanation: "",
    };
    setTasks((prev) => [...prev, newTask]);
  };

  // Export quiz
  const handleExport = async () => {
    if (!quizTitle.trim()) {
      setError("Введите название теста");
      return;
    }

    try {
      const blob = await exportQuizDocx({
        title: quizTitle,
        tasks,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `quiz_${quizTitle.replace(/\s+/g, "_")}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || t.quiz.errors.generic);
    }
  };

  // Create new quiz
  const handleCreateNew = () => {
    setTasks([]);
    setQuizTitle("");
    setTopicForm({ subject: "", grade: "", topic: "" });
    setTextForm({ context_text: "" });
    setCommonForm({
      language: "kz",
      question_count: 10,
      difficulty: "medium",
      question_types: [],
    });
    setError("");
  };

  // Get answer letter
  const getAnswerLetter = (index: number): string => {
    return String.fromCharCode(65 + index); // A, B, C, D...
  };

  // Check if answer is correct
  const isCorrectAnswer = (task: QuizTask, index: number): boolean => {
    if (Array.isArray(task.correct_answer)) {
      return task.correct_answer.includes(getAnswerLetter(index));
    }
    return task.correct_answer === getAnswerLetter(index);
  };

  // Render question type badge
  const renderTypeBadge = (type: QuestionType) => {
    const colors = {
      single_choice: "bg-blue-100 text-blue-700",
      multiple_choice: "bg-purple-100 text-purple-700",
      true_false: "bg-green-100 text-green-700",
      open: "bg-orange-100 text-orange-700",
    };

    return (
      <span className={`rounded-full px-3 py-1 text-xs font-medium ${colors[type]}`}>
        {t.quiz.questionTypeLabels[type]}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-beige to-green-50 p-4 sm:p-6">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-6 text-3xl font-bold text-slate-900">{t.quiz.form.title}</h1>

        {tasks.length === 0 ? (
          // Generation Form
          <div className="glass-card rounded-3xl border border-white/60 px-6 py-6 shadow-md sm:px-8">
            {/* Mode Tabs */}
            <div className="mb-6 flex gap-2 border-b border-slate-200">
              <button
                type="button"
                onClick={() => setActiveMode("topic")}
                className={`pb-3 px-4 font-medium transition ${
                  activeMode === "topic"
                    ? "border-b-2 border-orange-500 text-orange-600"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {t.quiz.form.modeTab.topic}
              </button>
              <button
                type="button"
                onClick={() => setActiveMode("text")}
                className={`pb-3 px-4 font-medium transition ${
                  activeMode === "text"
                    ? "border-b-2 border-orange-500 text-orange-600"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {t.quiz.form.modeTab.text}
              </button>
            </div>

            <form onSubmit={handleGenerate} className="space-y-4">
              {/* Mode-specific fields */}
              {activeMode === "topic" ? (
                <>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      {t.quiz.form.subject} *
                    </label>
                    <input
                      type="text"
                      value={topicForm.subject}
                      onChange={(e) =>
                        setTopicForm((prev) => ({ ...prev, subject: e.target.value }))
                      }
                      className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      {t.quiz.form.grade} *
                    </label>
                    <input
                      type="text"
                      value={topicForm.grade}
                      onChange={(e) =>
                        setTopicForm((prev) => ({ ...prev, grade: e.target.value }))
                      }
                      className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      {t.quiz.form.topic} *
                    </label>
                    <input
                      type="text"
                      value={topicForm.topic}
                      onChange={(e) =>
                        setTopicForm((prev) => ({ ...prev, topic: e.target.value }))
                      }
                      className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200"
                      required
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    {t.quiz.form.contextText} *
                  </label>
                  <textarea
                    value={textForm.context_text}
                    onChange={(e) =>
                      setTextForm({ context_text: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200"
                    placeholder={t.quiz.form.contextTextPlaceholder}
                    rows={8}
                    required
                  />
                  <div className="mt-1 text-right text-sm text-slate-500">
                    {textForm.context_text.length} / 10000 {t.quiz.form.contextTextLimit}
                  </div>
                </div>
              )}

              {/* Common fields */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  {t.quiz.form.language} *
                </label>
                <div className="flex gap-4">
                  {(["kz", "ru", "en"] as QuizLanguage[]).map((lang) => (
                    <label key={lang} className="flex cursor-pointer items-center gap-2">
                      <input
                        type="radio"
                        name="language"
                        value={lang}
                        checked={commonForm.language === lang}
                        onChange={(e) =>
                          setCommonForm((prev) => ({
                            ...prev,
                            language: e.target.value as QuizLanguage,
                          }))
                        }
                        className="h-4 w-4 border-slate-300 text-orange-500 focus:ring-orange-400"
                      />
                      <span className="text-sm text-slate-700">
                        {lang === "kz" ? "Қазақша" : lang === "ru" ? "Русский" : "English"}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  {t.quiz.form.questionCount} * (5-20)
                </label>
                <input
                  type="number"
                  min="5"
                  max="20"
                  value={commonForm.question_count}
                  onChange={(e) =>
                    setCommonForm((prev) => ({
                      ...prev,
                      question_count: parseInt(e.target.value) || 5,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  {t.quiz.form.difficulty} *
                </label>
                <select
                  value={commonForm.difficulty}
                  onChange={(e) =>
                    setCommonForm((prev) => ({
                      ...prev,
                      difficulty: e.target.value as QuizDifficulty,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200"
                  required
                >
                  <option value="easy">{t.quiz.form.difficultyOptions.easy}</option>
                  <option value="medium">{t.quiz.form.difficultyOptions.medium}</option>
                  <option value="hard">{t.quiz.form.difficultyOptions.hard}</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  {t.quiz.form.questionTypes} *
                </label>
                <div className="space-y-2">
                  {(["single_choice", "multiple_choice", "true_false", "open"] as QuestionType[]).map(
                    (type) => (
                      <label key={type} className="flex cursor-pointer items-center gap-2">
                        <input
                          type="checkbox"
                          checked={commonForm.question_types.includes(type)}
                          onChange={() => toggleQuestionType(type)}
                          className="h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-400"
                        />
                        <span className="text-sm text-slate-700">
                          {t.quiz.form.questionTypeOptions[type]}
                        </span>
                      </label>
                    ),
                  )}
                </div>
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
                {isLoading ? t.quiz.loading : t.quiz.form.generate}
              </button>
            </form>
          </div>
        ) : (
          // Quiz Results
          <div className="space-y-6">
            {/* Quiz Title */}
            <div className="glass-card rounded-3xl border border-white/60 px-6 py-4 shadow-md sm:px-8">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                {t.quiz.results.quizTitle}
              </label>
              <input
                type="text"
                value={quizTitle}
                onChange={(e) => setQuizTitle(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200"
                placeholder={t.quiz.results.quizTitlePlaceholder}
              />
            </div>

            {/* Question Cards */}
            {tasks.map((task, index) => (
              <div
                key={task.id}
                className="glass-card rounded-3xl border border-white/60 px-6 py-6 shadow-md sm:px-8"
              >
                {/* Header */}
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-slate-900">
                      {t.quiz.results.questionNumber} {index + 1}
                    </h3>
                    {renderTypeBadge(task.type)}
                  </div>
                  <button
                    onClick={() => removeTask(task.id)}
                    className="rounded-full p-2 text-red-600 hover:bg-red-50"
                    title={t.quiz.results.removeQuestion}
                  >
                    ×
                  </button>
                </div>

                {/* Question */}
                <div className="mb-4">
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    {t.quiz.results.question}
                  </label>
                  {editingId === task.id && editingField === "question" ? (
                    <textarea
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      onBlur={saveEditing}
                      onKeyDown={handleKeyDown}
                      className="w-full rounded-xl border border-orange-300 px-4 py-2.5 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200"
                      rows={3}
                      autoFocus
                    />
                  ) : (
                    <div
                      onClick={() => startEditing(task.id, "question", task.question)}
                      className="cursor-pointer rounded-xl bg-white/50 px-4 py-3 transition hover:bg-white/80"
                    >
                      <LatexRenderer text={task.question || "Нажмите для редактирования"} />
                    </div>
                  )}
                </div>

                {/* Options */}
                {task.type !== "open" && (
                  <div className="mb-4">
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      {t.quiz.results.options}
                    </label>
                    <div className="space-y-2">
                      {task.options.map((option, optIndex) => (
                        <div
                          key={optIndex}
                          className={`flex items-start gap-2 rounded-xl px-4 py-3 transition ${
                            isCorrectAnswer(task, optIndex)
                              ? "bg-green-100"
                              : "bg-white/50 hover:bg-white/80"
                          }`}
                        >
                          <span className="mt-0.5 font-semibold text-slate-700">
                            {getAnswerLetter(optIndex)}.
                          </span>
                          {editingId === task.id && editingField === `option-${optIndex}` ? (
                            <input
                              value={editingValue}
                              onChange={(e) => setEditingValue(e.target.value)}
                              onBlur={saveEditing}
                              onKeyDown={handleKeyDown}
                              className="flex-1 rounded-lg border border-orange-300 px-3 py-1 focus:border-orange-400 focus:outline-none"
                              autoFocus
                            />
                          ) : (
                            <div
                              onClick={() =>
                                startEditing(task.id, `option-${optIndex}`, option)
                              }
                              className="flex-1 cursor-pointer"
                            >
                              <LatexRenderer text={option || "Нажмите для редактирования"} />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Correct Answer for open type */}
                {task.type === "open" && (
                  <div className="mb-4">
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      {t.quiz.results.correctAnswer}
                    </label>
                    {editingId === task.id && editingField === "correct_answer" ? (
                      <textarea
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        onBlur={saveEditing}
                        onKeyDown={handleKeyDown}
                        className="w-full rounded-xl border border-orange-300 px-4 py-2.5 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200"
                        rows={3}
                        autoFocus
                      />
                    ) : (
                      <div
                        onClick={() =>
                          startEditing(
                            task.id,
                            "correct_answer",
                            typeof task.correct_answer === "string"
                              ? task.correct_answer
                              : task.correct_answer.join(", "),
                          )
                        }
                        className="cursor-pointer rounded-xl bg-green-100 px-4 py-3 transition hover:bg-green-200"
                      >
                        <LatexRenderer
                          text={
                            typeof task.correct_answer === "string"
                              ? task.correct_answer
                              : task.correct_answer.join(", ")
                          }
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Explanation */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    {t.quiz.results.explanation}
                  </label>
                  {editingId === task.id && editingField === "explanation" ? (
                    <textarea
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      onBlur={saveEditing}
                      onKeyDown={handleKeyDown}
                      className="w-full rounded-xl border border-orange-300 px-4 py-2.5 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200"
                      rows={2}
                      autoFocus
                    />
                  ) : (
                    <div
                      onClick={() => startEditing(task.id, "explanation", task.explanation)}
                      className="cursor-pointer rounded-xl bg-white/50 px-4 py-3 transition hover:bg-white/80"
                    >
                      <LatexRenderer text={task.explanation || "Нажмите для редактирования"} />
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Add Question Button */}
            <button
              onClick={addNewTask}
              className="w-full rounded-xl border-2 border-dashed border-slate-300 bg-white/50 px-6 py-4 font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-white/80"
            >
              + {t.quiz.results.addQuestion}
            </button>

            {/* Error Message */}
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
                {t.quiz.results.export}
              </button>
              <button
                onClick={handleCreateNew}
                className="flex-1 rounded-xl border-2 border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 shadow-md transition hover:bg-slate-50 hover:shadow-lg"
              >
                {t.quiz.results.createNew}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
