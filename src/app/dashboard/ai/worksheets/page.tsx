"use client";

import { useState } from "react";
import { useAuth } from "../../../../contexts/AuthContext";
import { useTranslations } from "../../../../i18n/LanguageContext";
import {
  generateWorksheet,
  exportWorksheetDocx,
  WorksheetContent,
  WorksheetTaskType,
} from "../../../../lib/api";

const GRADES = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
const LANGUAGES = [
  { value: "kk", label: "Қазақша" },
  { value: "ru", label: "Русский" },
  { value: "en", label: "English" },
] as const;

const TASK_TYPES: { value: WorksheetTaskType; labelKey: "multiple_choice" | "fill_in_blank" | "matching" | "open_question" }[] = [
  { value: "multiple_choice", labelKey: "multiple_choice" },
  { value: "fill_in_blank", labelKey: "fill_in_blank" },
  { value: "matching", labelKey: "matching" },
  { value: "open_question", labelKey: "open_question" },
];

export default function WorksheetsPage() {
  const { isAuthenticated } = useAuth();
  const t = useTranslations();

  // Form State
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [grade, setGrade] = useState(GRADES[4]); // Default to 5
  const [language, setLanguage] = useState<"ru" | "kz" | "en">("ru");
  const [selectedTaskTypes, setSelectedTaskTypes] = useState<WorksheetTaskType[]>([
    "multiple_choice",
    "fill_in_blank",
    "matching",
    "open_question",
  ]);
  const [userComment, setUserComment] = useState("");

  // Result State
  const [worksheetData, setWorksheetData] = useState<WorksheetContent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Editing State
  const [editSection, setEditSection] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState<any>(null);

  const handleTaskTypeChange = (type: WorksheetTaskType) => {
    setSelectedTaskTypes((prev) =>
      prev.includes(type)
        ? prev.filter((t) => t !== type)
        : [...prev, type]
    );
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setError(t.worksheet.errors.auth);
      return;
    }
    if (!subject || !topic || selectedTaskTypes.length === 0) {
      setError(t.worksheet.errors.required);
      return;
    }

    setLoading(true);
    setError(null);
    setWorksheetData(null);

    try {
      const response = await generateWorksheet({
        subject,
        topic,
        grade,
        language,
        task_types: selectedTaskTypes,
        user_comment: userComment,
      });
      setWorksheetData(response.content);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.worksheet.errors.generic);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!worksheetData) return;
    try {
      const blob = await exportWorksheetDocx({ content: worksheetData });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "worksheet.docx";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert(t.worksheet.errors.generic);
    }
  };

  const startEditing = (sectionKey: string, content: any) => {
    setEditSection(sectionKey);
    setEditedContent(JSON.parse(JSON.stringify(content))); // Deep copy
  };

  const saveEditing = () => {
    if (worksheetData && editSection) {
      setWorksheetData({
        ...worksheetData,
        [editSection]: editedContent,
      });
      setEditSection(null);
      setEditedContent(null);
    }
  };

  const cancelEditing = () => {
    setEditSection(null);
    setEditedContent(null);
  };

  return (
    <div className="min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,_#fff7ed,_#fdfbf7_40%,_#f5e6d3_80%)]">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-6 text-3xl font-bold text-slate-900">
          {t.worksheet.form.title}
        </h1>

        <div className="glass-card mb-6 rounded-3xl border border-white/60 px-6 py-6 shadow-md sm:px-8">
          <form onSubmit={handleGenerate} className="grid gap-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  {t.worksheet.form.subject}
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  placeholder="English, Mathematics..."
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  {t.worksheet.form.topic}
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  placeholder="Present Simple..."
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  {t.worksheet.form.grade}
                </label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                >
                  {GRADES.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  {t.worksheet.form.language}
                </label>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.value}
                      type="button"
                      onClick={() => setLanguage(lang.value as any)}
                      className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                        language === lang.value
                          ? "bg-orange-100 text-orange-700 ring-1 ring-orange-300"
                          : "bg-white text-slate-600 hover:bg-slate-50 ring-1 ring-slate-200"
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                {t.worksheet.form.taskTypes}
              </label>
              <div className="flex flex-wrap gap-2">
                {TASK_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => handleTaskTypeChange(type.value)}
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                      selectedTaskTypes.includes(type.value)
                        ? "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300"
                        : "bg-white text-slate-600 hover:bg-slate-50 ring-1 ring-slate-200"
                    }`}
                  >
                    {t.worksheet.taskTypeLabels[type.labelKey]}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                {t.worksheet.form.userComment}
              </label>
              <textarea
                value={userComment}
                onChange={(e) => setUserComment(e.target.value)}
                rows={2}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                placeholder={t.worksheet.form.userCommentPlaceholder}
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 font-medium bg-red-50 p-3 rounded-lg border border-red-100">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-500/30 transition-all hover:shadow-xl hover:shadow-orange-500/40 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto sm:min-w-[200px]"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  {t.worksheet.loading}
                </span>
              ) : (
                t.worksheet.form.generate
              )}
            </button>
          </form>
        </div>

        {worksheetData && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">
                {worksheetData.title}
              </h2>
              <button
                onClick={handleExport}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition-all hover:shadow-xl hover:shadow-emerald-500/40"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {t.worksheet.results.export}
              </button>
            </div>

            {/* Multiple Choice Section */}
            {worksheetData.multiple_choice && worksheetData.multiple_choice.length > 0 && (
              <div className="glass-card rounded-3xl border border-white/60 p-6 shadow-md">
                <div className="flex justify-between items-center mb-4">
                   <h3 className="text-lg font-semibold text-slate-800">
                    {t.worksheet.results.multipleChoice}
                  </h3>
                  {editSection === "multiple_choice" ? (
                    <div className="flex gap-2">
                      <button onClick={saveEditing} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">{t.worksheet.results.saveBlock}</button>
                      <button onClick={cancelEditing} className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded">{t.worksheet.results.cancel}</button>
                    </div>
                  ) : (
                    <button onClick={() => startEditing("multiple_choice", worksheetData.multiple_choice)} className="text-xs text-orange-600 hover:text-orange-700 font-medium">
                      {t.worksheet.results.editBlock}
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  {(editSection === "multiple_choice" ? editedContent : worksheetData.multiple_choice).map((task: any, idx: number) => (
                    <div key={idx} className="bg-white/50 p-4 rounded-xl border border-slate-100">
                      {editSection === "multiple_choice" ? (
                         <div className="space-y-2">
                           <input 
                              type="text" 
                              value={task.question} 
                              onChange={(e) => {
                                const newContent = [...editedContent];
                                newContent[idx].question = e.target.value;
                                setEditedContent(newContent);
                              }}
                              className="w-full p-2 border rounded"
                           />
                           {task.options.map((opt: any, oIdx: number) => (
                             <div key={oIdx} className="flex gap-2 items-center">
                               <input 
                                 type="text" 
                                 value={opt.text}
                                 onChange={(e) => {
                                    const newContent = [...editedContent];
                                    newContent[idx].options[oIdx].text = e.target.value;
                                    setEditedContent(newContent);
                                 }}
                                 className={`w-full p-1 border rounded text-sm ${opt.is_correct ? 'border-green-300 bg-green-50' : ''}`}
                               />
                               <input 
                                  type="checkbox"
                                  checked={opt.is_correct}
                                  onChange={(e) => {
                                    const newContent = [...editedContent];
                                    newContent[idx].options[oIdx].is_correct = e.target.checked;
                                    setEditedContent(newContent);
                                  }}
                               />
                             </div>
                           ))}
                         </div>
                      ) : (
                        <>
                          <p className="font-medium text-slate-900 mb-2">{idx + 1}. {task.question}</p>
                          <ul className="space-y-1">
                            {task.options.map((opt: any, oIdx: number) => (
                              <li key={oIdx} className={`flex items-start gap-2 text-sm ${opt.is_correct ? "text-emerald-700 font-medium" : "text-slate-600"}`}>
                                <span className="w-5 h-5 flex items-center justify-center rounded-full border text-xs shrink-0 bg-white">
                                  {opt.key}
                                </span>
                                {opt.text}
                                {opt.is_correct && <span className="text-emerald-500">✓</span>}
                              </li>
                            ))}
                          </ul>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Fill In Blank Section */}
            {worksheetData.fill_in_blank && worksheetData.fill_in_blank.length > 0 && (
              <div className="glass-card rounded-3xl border border-white/60 p-6 shadow-md">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-slate-800">
                    {t.worksheet.results.fillInBlank}
                  </h3>
                   {editSection === "fill_in_blank" ? (
                    <div className="flex gap-2">
                      <button onClick={saveEditing} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">{t.worksheet.results.saveBlock}</button>
                      <button onClick={cancelEditing} className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded">{t.worksheet.results.cancel}</button>
                    </div>
                  ) : (
                    <button onClick={() => startEditing("fill_in_blank", worksheetData.fill_in_blank)} className="text-xs text-orange-600 hover:text-orange-700 font-medium">
                      {t.worksheet.results.editBlock}
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                   {(editSection === "fill_in_blank" ? editedContent : worksheetData.fill_in_blank).map((task: any, idx: number) => (
                    <div key={idx} className="bg-white/50 p-3 rounded-xl border border-slate-100">
                       {editSection === "fill_in_blank" ? (
                         <div className="space-y-2">
                            <textarea
                              value={task.text_with_gaps}
                              onChange={(e) => {
                                const newContent = [...editedContent];
                                newContent[idx].text_with_gaps = e.target.value;
                                setEditedContent(newContent);
                              }}
                              className="w-full p-2 border rounded"
                              rows={2}
                            />
                            <div className="text-xs text-slate-500">Correct answers: {task.correct_answers.join(", ")}</div>
                         </div>
                       ) : (
                         <p className="text-slate-800 leading-relaxed">{idx + 1}. {task.text_with_gaps}</p>
                       )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Matching Section */}
            {worksheetData.matching && worksheetData.matching.length > 0 && (
              <div className="glass-card rounded-3xl border border-white/60 p-6 shadow-md">
                 <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-slate-800">
                    {t.worksheet.results.matching}
                  </h3>
                  {editSection === "matching" ? (
                    <div className="flex gap-2">
                      <button onClick={saveEditing} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">{t.worksheet.results.saveBlock}</button>
                      <button onClick={cancelEditing} className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded">{t.worksheet.results.cancel}</button>
                    </div>
                  ) : (
                    <button onClick={() => startEditing("matching", worksheetData.matching)} className="text-xs text-orange-600 hover:text-orange-700 font-medium">
                      {t.worksheet.results.editBlock}
                    </button>
                  )}
                </div>
                <div className="space-y-4">
                  {(editSection === "matching" ? editedContent : worksheetData.matching).map((task: any, idx: number) => (
                    <div key={idx} className="bg-white/50 p-4 rounded-xl border border-slate-100">
                       <p className="text-sm font-medium text-slate-500 mb-2">Group {idx + 1}</p>
                       <div className="grid grid-cols-2 gap-4">
                          {task.pairs.map((pair: any, pIdx: number) => (
                            <div key={pIdx} className="contents">
                               {editSection === "matching" ? (
                                 <>
                                   <input 
                                      type="text" 
                                      value={pair.left} 
                                      onChange={(e) => {
                                         const newContent = [...editedContent];
                                         newContent[idx].pairs[pIdx].left = e.target.value;
                                         setEditedContent(newContent);
                                      }}
                                      className="p-1 border rounded text-sm"
                                   />
                                   <input 
                                      type="text" 
                                      value={pair.right} 
                                      onChange={(e) => {
                                         const newContent = [...editedContent];
                                         newContent[idx].pairs[pIdx].right = e.target.value;
                                         setEditedContent(newContent);
                                      }}
                                      className="p-1 border rounded text-sm"
                                   />
                                 </>
                               ) : (
                                 <>
                                   <div className="p-2 bg-slate-100 rounded text-sm">{pair.left}</div>
                                   <div className="p-2 bg-slate-100 rounded text-sm">{pair.right}</div>
                                 </>
                               )}
                            </div>
                          ))}
                       </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Open Question Section */}
            {worksheetData.open_questions && worksheetData.open_questions.length > 0 && (
              <div className="glass-card rounded-3xl border border-white/60 p-6 shadow-md">
                 <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-slate-800">
                    {t.worksheet.results.openQuestion}
                  </h3>
                   {editSection === "open_questions" ? (
                    <div className="flex gap-2">
                      <button onClick={saveEditing} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">{t.worksheet.results.saveBlock}</button>
                      <button onClick={cancelEditing} className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded">{t.worksheet.results.cancel}</button>
                    </div>
                  ) : (
                    <button onClick={() => startEditing("open_questions", worksheetData.open_questions)} className="text-xs text-orange-600 hover:text-orange-700 font-medium">
                      {t.worksheet.results.editBlock}
                    </button>
                  )}
                </div>
                <div className="space-y-4">
                  {(editSection === "open_questions" ? editedContent : worksheetData.open_questions).map((task: any, idx: number) => (
                    <div key={idx} className="bg-white/50 p-4 rounded-xl border border-slate-100">
                       {editSection === "open_questions" ? (
                          <div className="space-y-2">
                            <label className="text-xs text-slate-500">Question</label>
                            <input
                              type="text"
                              value={task.question}
                              onChange={(e) => {
                                const newContent = [...editedContent];
                                newContent[idx].question = e.target.value;
                                setEditedContent(newContent);
                              }}
                              className="w-full p-2 border rounded"
                            />
                             <label className="text-xs text-slate-500">Model Answer</label>
                             <textarea
                              value={task.model_answer}
                              onChange={(e) => {
                                const newContent = [...editedContent];
                                newContent[idx].model_answer = e.target.value;
                                setEditedContent(newContent);
                              }}
                              className="w-full p-2 border rounded"
                              rows={2}
                            />
                          </div>
                       ) : (
                         <>
                            <p className="font-medium text-slate-900 mb-2">{idx + 1}. {task.question}</p>
                            <div className="bg-orange-50 p-3 rounded-lg text-sm text-slate-700 italic border border-orange-100">
                              Answer: {task.model_answer}
                            </div>
                         </>
                       )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
