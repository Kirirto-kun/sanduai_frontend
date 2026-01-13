"use client";

import Image from "next/image";

interface RaceTrackProps {
  teams: Array<{
    id: number;
    name: string;
    progress: number; // 0-100
  }>;
  className?: string;
}

export function RaceTrack({ teams, className = "" }: RaceTrackProps) {
  return (
    <div
      className={`relative w-full overflow-hidden rounded-2xl ${className}`}
      style={{ height: "100%" }}
    >
      {/* Background image */}
      <div className="absolute inset-0">
        <Image
          src="/games/at-zharys/background.JPG"
          alt="Ипподром фон"
          fill
          className="object-cover"
          priority
          unoptimized
        />
      </div>

      {/* Finish line */}
      <div className="absolute right-0 top-0 bottom-0 w-2 bg-gradient-to-r from-transparent via-yellow-400 to-yellow-500 shadow-lg" />
      <div className="absolute right-0 top-0 bottom-0 w-1 bg-black/20" />

      {/* Track lanes */}
      <div
        className="absolute inset-0"
        style={{
          display: "grid",
          gridTemplateRows: `repeat(${teams.length}, 1fr)`,
          gap: 0,
        }}
      >
        {teams.map((team, index) => {
          // Calculate position ensuring horse is always visible
          // Start from 5px (minimal offset) to show full horse at start, end at calc(100% - 125px)
          const progressValue = Math.min(team.progress, 100) / 100;
          const leftPosition = `calc(5px + ${progressValue} * (100% - 130px))`;
          
          return (
            <div
              key={team.id}
              className="relative"
              style={{
                height: "100%",
                minHeight: 0,
                borderBottom: index < teams.length - 1 ? "2px dashed rgba(255, 255, 255, 0.5)" : "none",
              }}
            >
              {/* Horse */}
              <div
                className="absolute transition-all duration-1000 ease-in-out z-10"
                style={{
                  top: "50%",
                  left: leftPosition,
                  transform: `translateY(-50%) ${team.progress >= 100 ? "scale(1.1)" : ""}`,
                  willChange: "left",
                }}
              >
                <div className="relative">
                  <Image
                    src="/games/at-zharys/horse.gif"
                    alt={`Лошадь ${team.name}`}
                    width={120}
                    height={90}
                    className="object-contain drop-shadow-lg"
                    unoptimized
                  />
                  {/* Team name label - minimal styling to avoid white background */}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-20 pointer-events-none">
                    <div className="whitespace-nowrap rounded-lg bg-black/80 px-3 py-1 text-xs font-bold text-white shadow-2xl min-w-[80px] text-center border border-white/50">
                      {team.name}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Winner indicator */}
      {teams.some((t) => t.progress >= 100) && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
          <div className="rounded-2xl bg-yellow-400/95 px-6 py-3 text-lg font-bold text-slate-900 shadow-xl">
            🏆 Финиш! 🏆
          </div>
        </div>
      )}
    </div>
  );
}

