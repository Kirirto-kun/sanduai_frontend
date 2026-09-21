"use client";

import { useState } from "react";
import type { TeamState } from "../../types/games";
import type { ContentLanguage } from "../../lib/content-languages";
import { generatedContentCopy } from "../../lib/generated-content-copy";

interface TeamColumnProps {
  team: TeamState;
  language: ContentLanguage;
  onAnswer: (isCorrect: boolean) => void;
  isGameFinished: boolean;
}

export function TeamColumn({ team, language, onAnswer, isGameFinished }: TeamColumnProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const copy = generatedContentCopy(language).race;

  const currentQuestion = team.questions[team.currentQuestionIndex];

  if (!currentQuestion) {
    return (
      <div className="glass-card rounded-2xl border border-white/60 p-6 shadow-md">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">{team.name}</h3>
        <div className="flex h-32 items-center justify-center rounded-xl bg-slate-100 text-sm text-slate-500">
          {copy.questionsEnded}
        </div>
      </div>
    );
  }

  const handleOptionClick = (option: string) => {
    if (team.isBlocked || isGameFinished || selectedOption !== null) return;

    setSelectedOption(option);
    const isCorrect = option === currentQuestion.correct_answer;

    // Small delay for visual feedback
    setTimeout(() => {
      onAnswer(isCorrect);
      setSelectedOption(null);
    }, 300);
  };

  const isBlocked = team.isBlocked || isGameFinished;

  return (
    <div
      className={`glass-card rounded-2xl border border-white/60 p-6 shadow-md transition-all ${
        isBlocked ? "opacity-50 grayscale" : ""
      }`}
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">{team.name}</h3>
        {team.isBlocked && (
          <div className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
            {copy.blocked}
          </div>
        )}
      </div>

      {/* Question */}
      <div className="mb-4 rounded-xl bg-slate-50 p-4">
        <p className="text-sm font-medium text-slate-900">{currentQuestion.text}</p>
      </div>

      {/* Answer options */}
      <div className="space-y-2">
        {currentQuestion.options.map((option, index) => {
          const isSelected = selectedOption === option;
          const isCorrect = option === currentQuestion.correct_answer;
          const showFeedback = selectedOption !== null;

          let buttonClass =
            "w-full rounded-xl border-2 px-4 py-3 text-left text-sm font-medium transition-all ";
          if (isBlocked) {
            buttonClass += "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed";
          } else if (showFeedback) {
            if (isSelected && isCorrect) {
              buttonClass += "border-green-500 bg-green-50 text-green-700";
            } else if (isSelected && !isCorrect) {
              buttonClass += "border-red-500 bg-red-50 text-red-700";
            } else {
              buttonClass += "border-slate-200 bg-white text-slate-600";
            }
          } else {
            buttonClass +=
              "border-slate-300 bg-white text-slate-700 hover:border-[color:var(--primary)] hover:bg-slate-50 cursor-pointer";
          }

          return (
            <button
              key={index}
              type="button"
              onClick={() => handleOptionClick(option)}
              disabled={isBlocked || selectedOption !== null}
              className={buttonClass}
            >
              <span className="mr-2 font-bold text-slate-400">
                {String.fromCharCode(65 + index)}.
              </span>
              {option}
              {showFeedback && isSelected && isCorrect && (
                <span className="ml-2" aria-hidden="true">✓</span>
              )}
              {showFeedback && isSelected && !isCorrect && (
                <span className="ml-2" aria-hidden="true">✗</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Progress indicator */}
      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
          <span>{copy.progress}</span>
          <span className="font-semibold">{Math.round(team.progress)}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            role="progressbar"
            aria-label={`${copy.progress}: ${team.name}`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(team.progress)}
            className="h-full bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--secondary)] transition-all duration-1000 ease-in-out"
            style={{ width: `${team.progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
