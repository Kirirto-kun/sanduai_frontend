"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useRaceGame } from "../../../../../../hooks/useRaceGame";
import { RaceTrack } from "../../../../../../components/games/RaceTrack";
import { TeamColumn } from "../../../../../../components/games/TeamColumn";
import { VictoryModal } from "../../../../../../components/games/VictoryModal";
import type { GameSettings, RaceQuestion } from "../../../../../../types/games";

interface GameData {
  gameId: string;
  settings: GameSettings;
  questions: RaceQuestion[];
}

export default function AtZharysGamePage() {
  const params = useParams();
  const router = useRouter();
  const gameId = params.gameId as string;
  const gameContainerRef = useRef<HTMLDivElement>(null);

  const [gameData, setGameData] = useState<GameData | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    let active = true;
    // Load game data from sessionStorage
    const stored = sessionStorage.getItem(`atZharys_${gameId}`);
    if (!stored) {
      // Redirect to setup if no game data
      router.push("/dashboard/library/games/at-zharys");
      return;
    }

    try {
      const data: GameData = JSON.parse(stored);
      
      // Validate game data
      if (!data.questions || data.questions.length === 0) {
        console.error("No questions in game data");
        router.push("/dashboard/library/games/at-zharys");
        return;
      }
      
      if (!data.settings) {
        console.error("No settings in game data");
        router.push("/dashboard/library/games/at-zharys");
        return;
      }

      queueMicrotask(() => {
        if (active) setGameData(data);
      });
    } catch (err) {
      console.error("Error parsing game data:", err);
      router.push("/dashboard/library/games/at-zharys");
    }
    return () => {
      active = false;
    };
  }, [gameId, router]);

  // Only initialize game hook when data is loaded
  const { gameState, handleAnswer, resetGame } = useRaceGame(
    gameId,
    gameData?.settings || {
      topic: "",
      grade: "",
      teams_count: 2,
      victory_condition: 10,
      questions_count: 40,
      language: "kz",
    },
    gameData?.questions || [],
  );

  // Handle fullscreen API
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!gameContainerRef.current) return;

    if (!document.fullscreenElement) {
      gameContainerRef.current.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const handlePlayAgain = () => {
    if (!gameData) return;
    resetGame();
  };

  const handleGoToLibrary = () => {
    router.push("/dashboard/library/games");
  };

  if (!gameData) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[color:var(--primary)] border-r-transparent"></div>
        <p className="ml-3 text-sm text-slate-600">Загрузка игры...</p>
      </div>
    );
  }

  // Additional safety check
  if (!gameData.questions || gameData.questions.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-sm font-semibold text-red-700">Ошибка: вопросы не загружены</p>
          <button
            onClick={() => router.push("/dashboard/library/games/at-zharys")}
            className="mt-4 rounded-lg bg-[color:var(--primary)] px-4 py-2 text-sm font-semibold text-white"
          >
            Вернуться к настройке
          </button>
        </div>
      </div>
    );
  }

  const winnerTeam = gameState.teams.find((t) => t.id === gameState.winner);

  return (
    <div
      ref={gameContainerRef}
      className={`flex flex-col space-y-4 bg-white ${
        isFullscreen
          ? "fixed inset-0 z-50 p-4 h-screen w-screen"
          : "h-[calc(100vh-8rem)]"
      }`}
    >
      {/* Fullscreen button */}
      <div className="flex justify-end mb-2">
        <button
          onClick={toggleFullscreen}
          className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 z-50"
          title={isFullscreen ? "Выйти из полноэкранного режима" : "На весь экран"}
        >
          {isFullscreen ? (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25"
                />
              </svg>
              Выйти
            </>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
                />
              </svg>
              На весь экран
            </>
          )}
        </button>
      </div>

      {/* Race Track - 45% of height (increased) */}
      <div className="flex-shrink-0" style={{ height: "45%" }}>
        <RaceTrack
          teams={gameState.teams.map((team) => ({
            id: team.id,
            name: team.name,
            progress: team.progress,
          }))}
        />
      </div>

      {/* Control Panels - 55% of height (moved down a bit) */}
      <div className="flex-1 overflow-y-auto mt-4">
        <div
          className="grid h-full gap-4"
          style={{
            gridTemplateColumns: `repeat(${gameData.settings.teams_count}, 1fr)`,
          }}
        >
          {gameState.teams.map((team) => (
            <TeamColumn
              key={team.id}
              team={team}
              onAnswer={(isCorrect) => handleAnswer(team.id, isCorrect)}
              isGameFinished={gameState.isFinished}
            />
          ))}
        </div>
      </div>

      {/* Victory Modal */}
      {winnerTeam && (
        <VictoryModal
          winnerName={winnerTeam.name}
          onPlayAgain={handlePlayAgain}
          onGoToLibrary={handleGoToLibrary}
        />
      )}
    </div>
  );
}
