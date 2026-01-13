"use client";

import { useState, useCallback, useEffect } from "react";
import type { GameSettings, TeamState, GameState, RaceQuestion } from "../types/games";

// Shuffle array using Fisher-Yates algorithm
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Shuffle options for a question (correct answer is always first in API response)
function shuffleQuestionOptions(question: RaceQuestion): RaceQuestion {
  const shuffledOptions = shuffleArray(question.options);
  return {
    ...question,
    options: shuffledOptions,
  };
}

export function useRaceGame(
  gameId: string,
  settings: GameSettings,
  questions: RaceQuestion[],
) {
  const stepSize = 100 / settings.victory_condition;

  // Initialize teams with shuffled questions
  const initializeTeams = useCallback((): TeamState[] => {
    const teamNames = ["Команда 1", "Команда 2", "Команда 3", "Команда 4"];
    
    if (!questions || questions.length === 0) {
      // Return empty teams array if no questions (will be re-initialized when questions load)
      return Array.from({ length: settings.teams_count }, (_, index) => ({
        id: index + 1,
        name: teamNames[index],
        progress: 0,
        currentQuestionIndex: 0,
        questions: [],
        isBlocked: false,
        blockedUntil: null,
      }));
    }

    return Array.from({ length: settings.teams_count }, (_, index) => {
      // Shuffle questions uniquely for each team
      const shuffledQuestions = shuffleArray([...questions]).map(shuffleQuestionOptions);
      return {
        id: index + 1,
        name: teamNames[index],
        progress: 0,
        currentQuestionIndex: 0,
        questions: shuffledQuestions,
        isBlocked: false,
        blockedUntil: null,
      };
    });
  }, [settings.teams_count, questions]);

  const [gameState, setGameState] = useState<GameState>(() => {
    const teams = initializeTeams();
    return {
      gameId,
      settings,
      teams,
      winner: null,
      isFinished: false,
    };
  });

  // Re-initialize teams when questions are loaded (e.g., when data loads from sessionStorage)
  useEffect(() => {
    if (questions && questions.length > 0) {
      setGameState((prev) => {
        // Check if teams need to be initialized (empty questions or wrong count)
        const needsInitialization =
          prev.teams.length === 0 ||
          prev.teams.length !== settings.teams_count ||
          prev.teams.some((team) => !team.questions || team.questions.length === 0);

        if (needsInitialization) {
          const newTeams = initializeTeams();
          if (newTeams.length > 0 && newTeams[0].questions.length > 0) {
            return {
              ...prev,
              teams: newTeams,
              winner: null,
              isFinished: false,
            };
          }
        }
        return prev;
      });
    }
  }, [questions.length, settings.teams_count, initializeTeams]);

  // Check for blocked teams and unblock them
  useEffect(() => {
    const interval = setInterval(() => {
      setGameState((prev) => {
        const now = Date.now();
        const updatedTeams = prev.teams.map((team) => {
          if (team.blockedUntil && now >= team.blockedUntil) {
            return {
              ...team,
              isBlocked: false,
              blockedUntil: null,
            };
          }
          return team;
        });
        return { ...prev, teams: updatedTeams };
      });
    }, 100); // Check every 100ms

    return () => clearInterval(interval);
  }, []);

  const handleAnswer = useCallback(
    (teamId: number, isCorrect: boolean) => {
      if (gameState.isFinished) return;

      setGameState((prev) => {
        const team = prev.teams.find((t) => t.id === teamId);
        if (!team || team.isBlocked) return prev;

        const updatedTeams = prev.teams.map((t) => {
          if (t.id !== teamId) return t;

          if (isCorrect) {
            // Correct answer: move forward, remove question
            const newProgress = Math.min(100, t.progress + stepSize);
            const newQuestions = t.questions.filter(
              (_, idx) => idx !== t.currentQuestionIndex,
            );

            // After removing current question, the next question is at the same index
            // If we were at the last question, index should stay at the last valid index
            const newQuestionIndex = Math.min(t.currentQuestionIndex, newQuestions.length - 1);

            return {
              ...t,
              progress: newProgress,
              currentQuestionIndex: newQuestionIndex,
              questions: newQuestions,
            };
          } else {
            // Wrong answer: block for 3 seconds, move question to end
            const currentQuestion = t.questions[t.currentQuestionIndex];
            if (!currentQuestion) return t; // Safety check

            const otherQuestions = t.questions.filter(
              (_, idx) => idx !== t.currentQuestionIndex,
            );
            const newQuestions = [...otherQuestions, currentQuestion];

            return {
              ...t,
              isBlocked: true,
              blockedUntil: Date.now() + 3000, // 3 seconds
              questions: newQuestions,
              // currentQuestionIndex stays the same (next question is now at same index)
            };
          }
        });

        // Check for winner
        const winner = updatedTeams.find((t) => t.progress >= 100);
        const winnerId = winner ? winner.id : null;

        return {
          ...prev,
          teams: updatedTeams,
          winner: winnerId,
          isFinished: winnerId !== null,
        };
      });
    },
    [gameState.isFinished, stepSize],
  );

  const resetGame = useCallback(() => {
    setGameState({
      gameId,
      settings,
      teams: initializeTeams(),
      winner: null,
      isFinished: false,
    });
  }, [gameId, settings, initializeTeams]);

  return {
    gameState,
    handleAnswer,
    resetGame,
    stepSize,
  };
}

