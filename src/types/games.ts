// Types for At Zharys game
import type { RaceQuestion } from "../lib/api";

export type GameSettings = {
  topic: string;
  grade: string;
  additional_info?: string;
  teams_count: 2 | 3 | 4;
  victory_condition: number; // How many correct answers needed to win (5-30)
  questions_count: number; // Total questions to generate (1-100)
  language: "kz" | "ru";
};

export type TeamState = {
  id: number;
  name: string;
  progress: number; // 0-100
  currentQuestionIndex: number;
  questions: RaceQuestion[]; // Shuffled questions for this team
  isBlocked: boolean; // Blocked for 3 seconds after wrong answer
  blockedUntil: number | null; // Timestamp when block ends
};

export type GameState = {
  gameId: string;
  settings: GameSettings;
  teams: TeamState[];
  winner: number | null; // Team ID of winner, or null if no winner yet
  isFinished: boolean;
};

// Re-export RaceQuestion from api for convenience
export type { RaceQuestion };

