"use client";

import { useQuery } from "@tanstack/react-query";
import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useRaceGame } from "../../../../../../hooks/useRaceGame";
import { RaceTrack } from "../../../../../../components/games/RaceTrack";
import { TeamColumn } from "../../../../../../components/games/TeamColumn";
import { VictoryModal } from "../../../../../../components/games/VictoryModal";
import { useLanguage } from "../../../../../../i18n/LanguageContext";
import { getGenerationJob } from "../../../../../../lib/api";
import {
  generationJobIdFromSearchParam,
  generationServerStatusCopy,
  isAcknowledgedGenerationJob,
  isActiveGenerationJob,
  isUnavailableGenerationJobError,
} from "../../../../../../lib/generation-history";
import {
  restoreRaceGame,
  RACE_GENERATION_KIND,
  RACE_SOURCE_PATH,
  type RestoredRaceGame,
} from "../../../../../../lib/race-generation";
import { useTeacherErrorMessage } from "@/hooks/useTeacherErrorMessage";

type GameMessageProps = {
  title: string;
  description?: string;
  loading?: boolean;
  backLabel?: string;
};


function GameMessage({
  title,
  description,
  loading = false,
  backLabel = "Вернуться к играм",
}: GameMessageProps) {
  const router = useRouter();

  return (
    <div className="flex min-h-96 items-center justify-center rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="max-w-lg text-center" aria-live="polite">
        {loading ? (
          <div className="mx-auto h-11 w-11 animate-spin rounded-full border-4 border-sky-200 border-t-sky-600" />
        ) : (
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-amber-100 text-xl text-amber-800">
            !
          </div>
        )}
        <h1 className="mt-4 text-xl font-bold text-slate-950">{title}</h1>
        {description ? <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p> : null}
        {!loading ? (
          <button
            type="button"
            onClick={() => router.push(RACE_SOURCE_PATH)}
            className="mt-5 min-h-11 rounded-xl bg-slate-950 px-5 text-sm font-bold text-white transition hover:bg-slate-800"
          >
            {backLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}


function RaceArena({ gameData }: { gameData: RestoredRaceGame }) {
  const router = useRouter();
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { gameState, handleAnswer, resetGame } = useRaceGame(
    gameData.gameId,
    gameData.settings,
    gameData.questions,
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
    resetGame();
  };

  const handleGoToLibrary = () => {
    router.push("/dashboard/library/games");
  };

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
          type="button"
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


function AtZharysGameContent() {
  const { language } = useLanguage();
  const toTeacherErrorMessage = useTeacherErrorMessage();
  const searchParams = useSearchParams();
  const requestedJobId = generationJobIdFromSearchParam(searchParams.get("job"));
  const job = useQuery({
    queryKey: ["generation-job", requestedJobId],
    queryFn: () => getGenerationJob(requestedJobId as string),
    enabled: Boolean(requestedJobId),
    retry: (failureCount, requestError) =>
      !isUnavailableGenerationJobError(requestError) && failureCount < 2,
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
    refetchInterval: (query) =>
      query.state.data && isActiveGenerationJob(query.state.data) ? 2_000 : false,
  });
  const backLabel = language === "kk" ? "Ойындарға оралу" : "Вернуться к играм";
  const jobAcknowledged = isAcknowledgedGenerationJob(
    job.data,
    requestedJobId,
    [RACE_GENERATION_KIND],
  );

  if (!requestedJobId) {
    return (
      <GameMessage
        title={language === "kk" ? "Ойынды ашу мүмкін болмады" : "Не удалось открыть игру"}
        description={
          language === "kk"
            ? "Ойынды бөлім тарихынан қайта ашыңыз немесе жаңасын жасаңыз."
            : "Откройте игру заново из истории раздела или создайте новую."
        }
        backLabel={backLabel}
      />
    );
  }

  if (job.isPending || (jobAcknowledged && job.data && isActiveGenerationJob(job.data))) {
    return (
      <GameMessage
        loading
        title={language === "kk" ? "Ойын жасалып жатыр" : "Создаём игру"}
        description={generationServerStatusCopy(language, jobAcknowledged)}
        backLabel={backLabel}
      />
    );
  }

  if (job.error) {
    const unavailable = isUnavailableGenerationJobError(job.error) && !jobAcknowledged;
    return (
      <GameMessage
        title={language === "kk" ? "Ойынды жүктеу мүмкін болмады" : "Не удалось загрузить игру"}
        description={unavailable
          ? language === "kk"
            ? "Бұл ойын енді қолжетімді емес. «Ат жарыс» бөлімінен басқа ойынды ашыңыз немесе жаңасын жасаңыз."
            : "Эта игра больше недоступна. Откройте другую игру в разделе «Ат жарыс» или создайте новую."
          : toTeacherErrorMessage(job.error)}
        backLabel={backLabel}
      />
    );
  }

  const value = job.data;
  if (!value || value.kind !== RACE_GENERATION_KIND) {
    return (
      <GameMessage
        title={language === "kk" ? "Бұл басқа материал" : "Это другой материал"}
        description={
          language === "kk"
            ? "«Ат жарыс» бөлімінен ойынды таңдаңыз."
            : "Выберите игру в разделе «Ат жарыс»."
        }
        backLabel={backLabel}
      />
    );
  }

  if (value.status !== "completed" && value.status !== "billing_error") {
    return (
      <GameMessage
        title={language === "kk" ? "Ойынды жасау мүмкін болмады" : "Не удалось создать игру"}
        description={
          language === "kk"
            ? "Монеталар қайтарылды. Параметрлерді тексеріп, қайта жасап көріңіз."
            : "Монеты возвращены. Проверьте параметры и попробуйте ещё раз."
        }
        backLabel={backLabel}
      />
    );
  }

  const gameData = restoreRaceGame(value);
  if (!gameData) {
    return (
      <GameMessage
        title={language === "kk" ? "Ойын толық сақталмаған" : "Игра сохранилась не полностью"}
        description={
          language === "kk"
            ? "Жаңа ойын жасап көріңіз. Монеталарға қатысты мәселе болса, қолдау қызметіне жазыңыз."
            : "Создайте новую игру. Если возник вопрос по монетам, напишите в поддержку."
        }
        backLabel={backLabel}
      />
    );
  }

  return <RaceArena gameData={gameData} />;
}


export default function AtZharysGamePage() {
  return (
    <Suspense fallback={<div className="min-h-96 animate-pulse rounded-3xl bg-white/70" />}>
      <AtZharysGameContent />
    </Suspense>
  );
}
