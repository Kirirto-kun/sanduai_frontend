"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "../../../../i18n/LanguageContext";
import { useTokens } from "../../../../hooks/useTokens";
import { getVideos, getVideoWatchToken, type Video, type VideoWatchTokenResponse } from "../../../../lib/api";
import { formatVideoDuration, isTokenExpired } from "../../../../lib/utils";
import { VideoPlayer } from "../../../../components/VideoPlayer";

export default function CoursesPage() {
  const t = useTranslations();
  const { hasSubscription } = useTokens();
  const [videos, setVideos] = useState<Video[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [limit] = useState(12);
  const [offset, setOffset] = useState(0);

  // Selected video for watching
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [watchToken, setWatchToken] = useState<VideoWatchTokenResponse | null>(null);
  const [loadingToken, setLoadingToken] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);

  useEffect(() => {
    if (hasSubscription) {
      fetchVideos();
    } else {
      setLoading(false);
    }
  }, [hasSubscription, offset]);

  const fetchVideos = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getVideos(limit, offset);
      setVideos(data.videos);
      setTotal(data.total);
    } catch (err: any) {
      if (err.message?.includes("403") || err.response?.status === 403) {
        setError("subscription_required");
      } else {
        setError(err.message || "Ошибка загрузки видео");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleWatchVideo = async (video: Video) => {
    setSelectedVideo(video);
    setLoadingToken(true);
    setTokenError(null);
    setWatchToken(null);

    try {
      const tokenData = await getVideoWatchToken(video.id);
      console.log("Video watch token received:", {
        bunny_video_id: tokenData.bunny_video_id,
        playback_url: tokenData.playback_url?.substring(0, 100) + "...",
        playback_url_length: tokenData.playback_url?.length,
        expiration_time: new Date(tokenData.expiration_time).toISOString(),
        has_playback_url: !!tokenData.playback_url,
      });
      setWatchToken(tokenData);
    } catch (err: any) {
      if (err.response?.status === 403) {
        setTokenError("subscription_required");
      } else if (err.response?.status === 400) {
        setTokenError("video_not_ready");
      } else if (err.response?.status === 404) {
        setTokenError("video_not_found");
      } else {
        setTokenError(err.message || "Ошибка загрузки токена просмотра");
      }
    } finally {
      setLoadingToken(false);
    }
  };

  const handleClosePlayer = () => {
    setSelectedVideo(null);
    setWatchToken(null);
    setTokenError(null);
  };

  const handleTokenExpired = () => {
    if (selectedVideo) {
      handleWatchVideo(selectedVideo);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("ru-RU", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  // Check subscription
  if (hasSubscription === false) {
    return (
      <div className="glass-card rounded-3xl border border-white/60 px-6 py-12 shadow-md sm:px-8">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-slate-900">
            {t.videos?.subscriptionRequired || "Требуется подписка"}
          </h2>
          <p className="mt-4 text-sm text-slate-600">
            {t.videos?.subscriptionRequiredMessage ||
              "Для просмотра видео необходима активная подписка. Обратитесь к администратору для оформления подписки."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          {t.videos?.title || "Видео курсы"}
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          {t.videos?.subtitle || "Просмотр обучающих видео"}
        </p>
      </div>

      {error && error !== "subscription_required" && (
        <div className="rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[color:var(--primary)] border-r-transparent"></div>
          <p className="mt-2 text-sm text-slate-600">{t.videos?.loading || "Загрузка..."}</p>
        </div>
      ) : videos.length === 0 ? (
        <div className="glass-card rounded-3xl border border-white/60 px-6 py-12 shadow-md sm:px-8">
          <div className="text-center">
            <p className="text-slate-500">{t.videos?.noVideos || "Видео не найдены"}</p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {videos.map((video) => (
              <button
                key={video.id}
                onClick={() => handleWatchVideo(video)}
                className="glass-card rounded-2xl border border-white/60 p-4 shadow-sm transition hover:shadow-md text-left"
              >
                {video.thumbnail_url ? (
                  <img
                    src={video.thumbnail_url}
                    alt={video.title}
                    className="w-full rounded-xl mb-3 aspect-video object-cover"
                  />
                ) : (
                  <div className="w-full rounded-xl mb-3 aspect-video bg-slate-200 flex items-center justify-center">
                    <svg
                      className="w-12 h-12 text-slate-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                )}
                <h3 className="text-sm font-semibold text-slate-900 mb-1 line-clamp-2">
                  {video.title}
                </h3>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  {video.duration !== null && (
                    <span>{formatVideoDuration(video.duration)}</span>
                  )}
                  <span>•</span>
                  <span>{formatDate(video.created_at)}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Pagination */}
          {total > limit && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setOffset(Math.max(0, offset - limit))}
                disabled={offset === 0}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t.admin?.previous || "Назад"}
              </button>
              <span className="text-sm text-slate-600">
                {offset + 1} - {Math.min(offset + limit, total)} из {total}
              </span>
              <button
                type="button"
                onClick={() => setOffset(offset + limit)}
                disabled={offset + limit >= total}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t.admin?.next || "Вперед"}
              </button>
            </div>
          )}
        </>
      )}

      {/* Video Player Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="relative w-full max-w-6xl bg-white rounded-3xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">{selectedVideo.title}</h2>
              <button
                type="button"
                onClick={handleClosePlayer}
                className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="p-4">
              {loadingToken ? (
                <div className="flex items-center justify-center py-12">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[color:var(--primary)] border-r-transparent"></div>
                  <p className="ml-3 text-sm text-slate-600">
                    {t.videos?.loading || "Загрузка..."}
                  </p>
                </div>
              ) : tokenError ? (
                <div className="rounded-2xl bg-red-50 border border-red-200 px-4 py-8 text-center">
                  <p className="text-sm font-semibold text-red-700">
                    {tokenError === "subscription_required"
                      ? t.videos?.subscriptionRequiredMessage ||
                        "Требуется активная подписка"
                      : tokenError === "video_not_ready"
                      ? "Видео обрабатывается, попробуйте позже"
                      : tokenError === "video_not_found"
                      ? "Видео не найдено"
                      : tokenError}
                  </p>
                </div>
              ) : watchToken ? (
                watchToken.playback_url ? (
                  <VideoPlayer
                    playbackUrl={watchToken.playback_url}
                    expirationTime={watchToken.expiration_time}
                    onTokenExpired={handleTokenExpired}
                    className="w-full"
                  />
                ) : (
                  <div className="rounded-2xl bg-yellow-50 border border-yellow-200 px-4 py-8 text-center">
                    <p className="text-sm font-semibold text-yellow-700">
                      URL для воспроизведения видео не получен от сервера
                    </p>
                    <p className="mt-2 text-xs text-yellow-600">
                      Проверьте, что API возвращает поле playback_url. Получены данные: {JSON.stringify({ bunny_video_id: watchToken.bunny_video_id, has_playback_url: !!watchToken.playback_url })}
                    </p>
                  </div>
                )
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
