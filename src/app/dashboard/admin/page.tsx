"use client";

import { useState, useEffect, FormEvent, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useLanguage, useTranslations } from "../../../i18n/LanguageContext";
import { useAuth } from "../../../contexts/AuthContext";
import {
  getAdminUsers,
  addTokensToUser,
  getAdminUserTransactions,
  addSubscriptionToUser,
  revokeSubscriptionFromUser,
  resetUserTokens,
  deleteAdminUser,
  uploadAdminVideo,
  uploadVideoThumbnail,
  getAllVideos,
  syncAllVideoStatuses,
  importYouTubeVideo,
  deleteVideo,
  type AdminUser,
  type AddTokensPayload,
  type AddSubscriptionPayload,
  type TokenTransaction,
  type Video,
} from "../../../lib/api";
import { formatSubscriptionDate } from "../../../lib/utils";
import { teacherFacingErrorMessage } from "../../../lib/teacher-facing-error";
import {
  adminUserActionErrorMessage,
  applyAdminUserAction,
  isAdminUserNotFoundError,
  isAmbiguousAdminUserDeleteError,
  isExactEmailConfirmation,
  isProtectedAdminUser,
  reconciledDeletedAdminUserResult,
  type AdminUserActionKind,
  type AdminUserActionResult,
} from "../../../lib/admin-user-management";
import { canRestoreDialogFocus, focusTrapTargetIndex } from "../../../lib/dialog-focus";
import { LocalFilePreview } from "../../../components/uploads/LocalFilePreview";

function SavedVideoThumbnail({ url, title }: { url: string | null; title: string }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const failed = Boolean(url && failedUrl === url);

  if (!url || failed) {
    return (
      <div
        className="flex h-14 w-24 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400"
        aria-label={`${title}: preview unavailable`}
      >
        <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
      </div>
    );
  }

  return (
    <Image
      src={url}
      alt={title}
      width={192}
      height={108}
      unoptimized
      onError={() => setFailedUrl(url)}
      className="h-14 w-24 shrink-0 rounded-lg bg-slate-100 object-cover"
    />
  );
}

export default function AdminPage() {
  const t = useTranslations();
  const { language } = useLanguage();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [limit] = useState(50);
  const [offset, setOffset] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Selected user for adding tokens
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [showAddTokensModal, setShowAddTokensModal] = useState(false);
  const [tokensAmount, setTokensAmount] = useState("");
  const [tokensDescription, setTokensDescription] = useState("");
  const [addingTokens, setAddingTokens] = useState(false);

  // Selected user for adding subscription
  const [selectedUserForSubscription, setSelectedUserForSubscription] = useState<AdminUser | null>(null);
  const [showAddSubscriptionModal, setShowAddSubscriptionModal] = useState(false);
  const [subscriptionDays, setSubscriptionDays] = useState("");
  const [addingSubscription, setAddingSubscription] = useState(false);

  // Destructive account actions are confirmed in one focused dialog.
  const [pendingUserAction, setPendingUserAction] = useState<{
    kind: AdminUserActionKind;
    user: AdminUser;
  } | null>(null);
  const [userActionBusy, setUserActionBusy] = useState(false);
  const [userActionError, setUserActionError] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const userActionDialogRef = useRef<HTMLDivElement | null>(null);
  const deleteConfirmationInputRef = useRef<HTMLInputElement | null>(null);
  const cancelUserActionButtonRef = useRef<HTMLButtonElement | null>(null);
  const userActionTriggerRef = useRef<HTMLElement | null>(null);
  const userActionBusyRef = useRef(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const usersRequestSequenceRef = useRef(0);
  const usersRequestAbortRef = useRef<AbortController | null>(null);

  // Selected user for viewing transactions
  const [selectedUserForTransactions, setSelectedUserForTransactions] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<TokenTransaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  // Video upload state
  const [activeTab, setActiveTab] = useState<"users" | "videos" | "visuals" | "materials" | "library">("users");
  const [videoTitle, setVideoTitle] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedThumbnail, setSelectedThumbnail] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const uploadAbortRef = useRef<AbortController | null>(null);
  const videoFileInputRef = useRef<HTMLInputElement | null>(null);
  const videoThumbnailInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadedVideos, setUploadedVideos] = useState<Video[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [syncingStatuses, setSyncingStatuses] = useState(false);

  // YouTube import state
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [youtubeTitle, setYoutubeTitle] = useState("");
  const [youtubeThumbnail, setYoutubeThumbnail] = useState<File | null>(null);
  const youtubeThumbnailInputRef = useRef<HTMLInputElement | null>(null);
  const [importingYouTube, setImportingYouTube] = useState(false);

  // Video deletion state
  const [videoToDelete, setVideoToDelete] = useState<Video | null>(null);
  const [deletingVideo, setDeletingVideo] = useState(false);

  const fetchUsers = useCallback(async (showLoading = true, reportError = true) => {
    const requestSequence = ++usersRequestSequenceRef.current;
    usersRequestAbortRef.current?.abort();
    const controller = new AbortController();
    usersRequestAbortRef.current = controller;
    setLoading(showLoading);
    setError(null);
    try {
      const data = await getAdminUsers(
        limit,
        offset,
        debouncedSearch || undefined,
        controller.signal,
      );
      if (requestSequence !== usersRequestSequenceRef.current || controller.signal.aborted) {
        return null;
      }
      setUsers(data.users);
      setTotal(data.total);
      return data;
    } catch (err) {
      if (requestSequence !== usersRequestSequenceRef.current || controller.signal.aborted) {
        return null;
      }
      if (reportError) {
        setError(teacherFacingErrorMessage(err, language, {
          fallback: t.admin?.loadUsersError || "Ошибка загрузки пользователей",
        }));
      }
      return null;
    } finally {
      if (requestSequence === usersRequestSequenceRef.current) {
        setLoading(false);
        if (usersRequestAbortRef.current === controller) usersRequestAbortRef.current = null;
      }
    }
  }, [debouncedSearch, language, limit, offset, t.admin?.loadUsersError]);

  // Redirect non-admin users
  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) {
      router.replace("/dashboard");
    }
  }, [user, authLoading, router]);

  useEffect(() => () => {
    uploadAbortRef.current?.abort();
    usersRequestAbortRef.current?.abort();
  }, []);

  useEffect(() => {
    userActionBusyRef.current = userActionBusy;
  }, [userActionBusy]);

  useEffect(() => {
    if (!pendingUserAction) return;

    const dialog = userActionDialogRef.current;
    if (!dialog) return;
    const previouslyFocused = userActionTriggerRef.current;
    const fallbackFocus = searchInputRef.current;
    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusFrame = window.requestAnimationFrame(() => {
      const initialFocus = pendingUserAction.kind === "delete-user"
        ? deleteConfirmationInputRef.current
        : cancelUserActionButtonRef.current;
      initialFocus?.focus();
    });

    const handleDialogKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (userActionBusyRef.current) return;
        event.preventDefault();
        setPendingUserAction(null);
        setDeleteConfirmation("");
        setUserActionError(null);
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(
        "a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])",
      )).filter((element) => element.getClientRects().length > 0);
      const currentIndex = focusable.indexOf(document.activeElement as HTMLElement);
      const targetIndex = focusTrapTargetIndex(currentIndex, focusable.length, event.shiftKey);
      if (targetIndex === null) return;
      event.preventDefault();
      focusable[targetIndex]?.focus();
    };

    document.addEventListener("keydown", handleDialogKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", handleDialogKeyDown);
      document.body.style.overflow = previousBodyOverflow;
      if (previouslyFocused && canRestoreDialogFocus({
        connected: previouslyFocused.isConnected,
        disabled: previouslyFocused.matches(":disabled"),
        tabIndex: previouslyFocused.tabIndex,
        visible: previouslyFocused.getClientRects().length > 0,
      })) {
        previouslyFocused.focus();
      } else {
        fallbackFocus?.focus();
      }
      userActionTriggerRef.current = null;
    };
  }, [pendingUserAction]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset offset when search changes
  useEffect(() => {
    setOffset(0);
  }, [debouncedSearch]);

  useEffect(() => {
    if (user?.role === "admin") {
      fetchUsers();
    }
  }, [fetchUsers, user?.role]);

  const handleAddTokens = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !tokensAmount) {
      setError(t.admin?.fillAllFields || "Заполните все поля");
      return;
    }

    const amount = parseInt(tokensAmount, 10);
    if (isNaN(amount) || amount <= 0) {
      setError(t.admin?.tokensPositiveNumber || "Количество токенов должно быть положительным числом");
      return;
    }

    setAddingTokens(true);
    setError(null);
    try {
      const payload: AddTokensPayload = {
        amount,
        description: tokensDescription || t.admin?.defaultTokenDescription || "Начисление токенов администратором",
      };
      await addTokensToUser(selectedUser.user_id, payload);
      setShowAddTokensModal(false);
      setTokensAmount("");
      setTokensDescription("");
      setSelectedUser(null);
      fetchUsers(); // Refresh users list
    } catch (err) {
      setError(teacherFacingErrorMessage(err, language, {
        fallback: t.admin?.addTokensError || "Ошибка начисления токенов",
      }));
    } finally {
      setAddingTokens(false);
    }
  };

  const handleViewTransactions = async (userId: string) => {
    if (selectedUserForTransactions === userId) {
      setSelectedUserForTransactions(null);
      setTransactions([]);
      return;
    }

    setSelectedUserForTransactions(userId);
    setLoadingTransactions(true);
    try {
      const data = await getAdminUserTransactions(userId, 50, 0);
      setTransactions(data);
    } catch (err) {
      setError(teacherFacingErrorMessage(err, language, {
        fallback: t.admin?.loadTransactionsError || "Ошибка загрузки транзакций",
      }));
    } finally {
      setLoadingTransactions(false);
    }
  };

  const handleAddSubscription = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedUserForSubscription || !subscriptionDays) {
      setError(t.admin?.fillAllFields || "Заполните все поля");
      return;
    }

    const days = parseInt(subscriptionDays, 10);
    if (isNaN(days) || days <= 0) {
      setError(t.admin?.daysPositiveNumber || "Количество дней должно быть положительным числом");
      return;
    }

    setAddingSubscription(true);
    setError(null);
    try {
      const payload: AddSubscriptionPayload = {
        days,
      };
      await addSubscriptionToUser(selectedUserForSubscription.user_id, payload);
      setShowAddSubscriptionModal(false);
      setSubscriptionDays("");
      setSelectedUserForSubscription(null);
      fetchUsers(); // Refresh users list
    } catch (err) {
      setError(teacherFacingErrorMessage(err, language, {
        fallback: t.admin?.subscriptionError || "Ошибка выдачи подписки",
      }));
    } finally {
      setAddingSubscription(false);
    }
  };

  const openUserAction = (kind: AdminUserActionKind, targetUser: AdminUser) => {
    if (userActionBusy || isProtectedAdminUser(targetUser, user?.userId)) return;
    userActionTriggerRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    setPendingUserAction({ kind, user: targetUser });
    setDeleteConfirmation("");
    setUserActionError(null);
    setError(null);
    setNotice(null);
  };

  const closeUserAction = () => {
    if (userActionBusy) return;
    setPendingUserAction(null);
    setDeleteConfirmation("");
    setUserActionError(null);
  };

  const handleAdminUserAction = async () => {
    if (!pendingUserAction || userActionBusy) return;

    const { kind, user: targetUser } = pendingUserAction;
    if (
      kind === "delete-user" &&
      !isExactEmailConfirmation(deleteConfirmation, targetUser.email)
    ) {
      return;
    }

    userActionBusyRef.current = true;
    setUserActionBusy(true);
    setUserActionError(null);
    setError(null);

    try {
      let result: AdminUserActionResult;
      if (kind === "revoke-subscription") {
        result = await revokeSubscriptionFromUser(targetUser.user_id);
      } else if (kind === "reset-tokens") {
        result = await resetUserTokens(targetUser.user_id);
      } else {
        try {
          result = await deleteAdminUser(targetUser.user_id);
        } catch (firstError) {
          if (!isAmbiguousAdminUserDeleteError(firstError)) throw firstError;

          // DELETE may have committed before the connection was interrupted.
          // Retry once; a 404 now proves the requested end state was reached.
          try {
            result = await deleteAdminUser(targetUser.user_id);
          } catch (retryError) {
            if (isAdminUserNotFoundError(retryError)) {
              result = reconciledDeletedAdminUserResult(targetUser.user_id);
            } else if (isAmbiguousAdminUserDeleteError(retryError)) {
              const refreshed = await fetchUsers(false, false);
              if (refreshed && !refreshed.users.some(
                (candidate) => candidate.user_id === targetUser.user_id,
              )) {
                result = reconciledDeletedAdminUserResult(targetUser.user_id);
              } else {
                throw retryError;
              }
            } else {
              throw retryError;
            }
          }
        }
      }

      setUsers((current) => applyAdminUserAction(current, kind, result));
      if (kind === "delete-user") setTotal((current) => Math.max(0, current - 1));

      const successMessage = {
        "revoke-subscription": t.admin?.revokeSubscriptionSuccess || "Подписка снята",
        "reset-tokens": t.admin?.resetTokensSuccess || "Баланс токенов обнулён",
        "delete-user": t.admin?.deleteUserSuccess || "Пользователь удалён",
      } satisfies Record<AdminUserActionKind, string>;
      setNotice(`${successMessage[kind]}: ${targetUser.email}`);
      setPendingUserAction(null);
      setDeleteConfirmation("");

      if (kind === "delete-user" && users.length === 1 && offset > 0) {
        setOffset((current) => Math.max(0, current - limit));
      } else {
        await fetchUsers(false);
      }
    } catch (err) {
      setUserActionError(adminUserActionErrorMessage(err, language, kind));
    } finally {
      userActionBusyRef.current = false;
      setUserActionBusy(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString("ru-RU");
    } catch {
      return dateString;
    }
  };

  const handleDeleteVideo = async () => {
    if (!videoToDelete) return;

    setDeletingVideo(true);
    setError(null);

    try {
      await deleteVideo(videoToDelete.id);
      setVideoToDelete(null);
      fetchVideos(); // Обновляем список
    } catch (err) {
      setError(teacherFacingErrorMessage(err, language, {
        fallback: t.admin?.deleteVideoError || "Ошибка удаления видео",
      }));
    } finally {
      setDeletingVideo(false);
    }
  };

  const handleImportYouTube = async (e: FormEvent) => {
    e.preventDefault();
    if (!youtubeUrl.trim() || !youtubeTitle.trim()) {
      setError(t.admin?.fillAllFields || "Заполните все обязательные поля");
      return;
    }

    if (youtubeTitle.length > 255) {
      setError(t.admin?.videoTitleMaxLength || "Название видео не должно превышать 255 символов");
      return;
    }

    setImportingYouTube(true);
    setError(null);

    try {
      await importYouTubeVideo(youtubeUrl.trim(), youtubeTitle.trim(), youtubeThumbnail || undefined);

      // Reset form
      setYoutubeUrl("");
      setYoutubeTitle("");
      setYoutubeThumbnail(null);
      if (youtubeThumbnailInputRef.current) youtubeThumbnailInputRef.current.value = "";
      
      // Refresh videos list
      fetchVideos();
    } catch (err) {
      setError(teacherFacingErrorMessage(err, language, {
        fallback: t.admin?.videos?.youtubeImportError || "Ошибка импорта видео с YouTube",
      }));
    } finally {
      setImportingYouTube(false);
    }
  };

  const handleUploadVideo = async (e: FormEvent) => {
    e.preventDefault();
    if (!videoTitle.trim() || !selectedFile) {
      setError(t.admin?.fillAllFields || "Заполните все поля");
      return;
    }

    if (videoTitle.length > 255) {
      setError(t.admin?.videoTitleMaxLength || "Название видео не должно превышать 255 символов");
      return;
    }

    setUploading(true);
    setError(null);
    setUploadProgress(0);
    const uploadController = new AbortController();
    uploadAbortRef.current = uploadController;

    try {
      const uploadedVideo = await uploadAdminVideo(
        videoTitle.trim(),
        selectedFile,
        (progress) => {
          setUploadProgress(progress);
        },
        uploadController.signal,
      );

      if (selectedThumbnail) {
        try {
          await uploadVideoThumbnail(uploadedVideo.video_db_id, selectedThumbnail);
        } catch (thumbnailError) {
          setError(teacherFacingErrorMessage(thumbnailError, language, {
            fallback: language === "kk"
              ? "Видео жүктелді, бірақ мұқаба суретін сақтау мүмкін болмады."
              : "Видео загружено, но не удалось сохранить обложку.",
          }));
        }
      }

      setVideoTitle("");
      setSelectedFile(null);
      setSelectedThumbnail(null);
      if (videoFileInputRef.current) videoFileInputRef.current.value = "";
      if (videoThumbnailInputRef.current) videoThumbnailInputRef.current.value = "";
      setUploadProgress(0);
      fetchVideos();
    } catch (err) {
      if (err instanceof Error && err.message === "Upload aborted") {
        setError(null);
      } else {
        setError(teacherFacingErrorMessage(err, language, {
          fallback: t.admin?.videoUploadError || "Ошибка загрузки видео",
        }));
      }
    } finally {
      if (uploadAbortRef.current === uploadController) uploadAbortRef.current = null;
      setUploading(false);
    }
  };

  const fetchVideos = async () => {
    setLoadingVideos(true);
    setError(null);
    try {
      const data = await getAllVideos(); // Get all videos for admin (regardless of status)
      setUploadedVideos(data.videos);
    } catch (err) {
      setError(teacherFacingErrorMessage(err, language, {
        fallback: t.admin?.videoListLoadError || "Ошибка загрузки списка видео",
      }));
    } finally {
      setLoadingVideos(false);
    }
  };

  const handleSyncStatuses = async () => {
    setSyncingStatuses(true);
    setError(null);
    try {
      await syncAllVideoStatuses();
      // Refresh videos list after sync
      await fetchVideos();
    } catch (err) {
      setError(teacherFacingErrorMessage(err, language, {
        fallback: t.admin?.syncError || "Ошибка синхронизации статусов",
      }));
    } finally {
      setSyncingStatuses(false);
    }
  };

  useEffect(() => {
    if (activeTab === "videos") {
      fetchVideos();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Show loading or nothing while checking auth
  if (authLoading || !user || user.role !== "admin") {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-[color:var(--primary)] border-r-transparent"></div>
          <p className="text-sm font-semibold text-slate-700">{t.admin?.loading || "Загрузка..."}</p>
        </div>
      </div>
    );
  }

  const currentAdminUserId = user.userId;
  const pendingActionCopy = pendingUserAction ? {
    "revoke-subscription": {
      title: t.admin?.revokeSubscriptionTitle || "Снять подписку?",
      message: t.admin?.revokeSubscriptionMessage || "Пользователь потеряет доступ к разделам по подписке. Баланс токенов не изменится.",
    },
    "reset-tokens": {
      title: t.admin?.resetTokensTitle || "Обнулить токены?",
      message: t.admin?.resetTokensMessage || "Баланс пользователя станет равен нулю. Подписка останется без изменений.",
    },
    "delete-user": {
      title: t.admin?.deleteUserTitle || "Удалить пользователя?",
      message: t.admin?.deleteUserMessage || "Аккаунт и связанные с ним данные будут удалены.",
    },
  }[pendingUserAction.kind] : null;
  const deleteConfirmationMatches = pendingUserAction?.kind !== "delete-user" ||
    isExactEmailConfirmation(deleteConfirmation, pendingUserAction.user.email);

  return (
    <>
    <div
      className="space-y-6"
      aria-hidden={pendingUserAction ? true : undefined}
      inert={Boolean(pendingUserAction)}
    >
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          {t.admin?.title || "Админ панель"}
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          {t.admin?.subtitle || "Управление пользователями и токенами"}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab("users")}
          className={`px-4 py-2 text-sm font-semibold transition ${
            activeTab === "users"
              ? "text-[color:var(--primary)] border-b-2 border-[color:var(--primary)]"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          {t.admin?.usersList || "Пользователи"}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("videos")}
          className={`px-4 py-2 text-sm font-semibold transition ${
            activeTab === "videos"
              ? "text-[color:var(--primary)] border-b-2 border-[color:var(--primary)]"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          {t.admin?.videos?.title || "Видео"}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("visuals")}
          className={`px-4 py-2 text-sm font-semibold transition ${
            activeTab === "visuals"
              ? "text-[color:var(--primary)] border-b-2 border-[color:var(--primary)]"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          {t.admin?.visuals?.title || "Визуальные материалы"}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("materials")}
          className={`px-4 py-2 text-sm font-semibold transition ${
            activeTab === "materials"
              ? "text-[color:var(--primary)] border-b-2 border-[color:var(--primary)]"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          {t.admin?.materials?.title || t.presentationsAdmin?.title || "Интерактивные презентации"}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("library")}
          className={`whitespace-nowrap px-4 py-2 text-sm font-semibold transition ${
            activeTab === "library"
              ? "text-[color:var(--primary)] border-b-2 border-[color:var(--primary)]"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          {language === "kk" ? "Материалдар кітапханасы" : "Библиотека материалов"}
        </button>
      </div>

      {/* Users Tab Content */}
      {activeTab === "users" && (
        <>
          {error && (
            <div className="rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          {notice && (
            <div
              role="status"
              className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"
            >
              {notice}
            </div>
          )}

          {/* Users List */}
      <div className="glass-card rounded-3xl border border-white/60 p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">
            {t.admin?.usersList || "Список пользователей"}
          </h2>
          <div className="text-sm text-slate-600">
            {t.admin?.total || "Всего"}: {total}
          </div>
        </div>

        {/* Search Input */}
        <div className="mb-4">
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.admin?.searchPlaceholder || "Поиск по email или номеру телефона..."}
            className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)] focus:border-transparent"
          />
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[color:var(--primary)] border-r-transparent"></div>
            <p className="mt-2 text-sm text-slate-600">{t.admin?.loading || "Загрузка..."}</p>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            {t.admin?.noUsers || "Пользователи не найдены"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                    {t.admin?.email || "Email"}
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                    {t.admin?.phone || "Телефон"}
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                    {t.admin?.fullName || "Имя"}
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                    {t.admin?.role || "Роль"}
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                    {t.admin?.balance || "Баланс"}
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                    {t.admin?.subscription || "Подписка"}
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                    {t.admin?.createdAt || "Дата регистрации"}
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                    {t.admin?.actions || "Действия"}
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.user_id} className="border-b border-slate-100">
                    <td className="py-3 px-4 text-sm text-slate-900">{user.email}</td>
                    <td className="py-3 px-4 text-sm text-slate-900">{user.phone || "—"}</td>
                    <td className="py-3 px-4 text-sm text-slate-900">{user.full_name || "—"}</td>
                    <td className="py-3 px-4 text-sm text-slate-600">{user.role}</td>
                    <td className="py-3 px-4 text-sm font-semibold text-[color:var(--primary)]">
                      {user.balance}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                              user.has_subscription
                                ? "bg-green-100 text-green-700"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {user.has_subscription
                              ? t.admin?.subscriptionActive || "Активна"
                              : t.admin?.subscriptionInactive || "Неактивна"}
                          </span>
                          <span className="text-xs text-slate-600">
                            {user.subscription_plan === "premium"
                              ? t.tokens?.premium || "Премиум"
                              : t.tokens?.free || "Бесплатная"}
                          </span>
                        </div>
                        {user.subscription_end && (
                          <div className="text-xs text-slate-500">
                            {t.admin?.subscriptionEnd || "Окончание"}: {formatSubscriptionDate(user.subscription_end)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedUser(user);
                            setShowAddTokensModal(true);
                          }}
                          disabled={userActionBusy}
                          className="rounded-lg bg-[color:var(--primary)] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {t.admin?.addTokens || "Добавить токены"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedUserForSubscription(user);
                            setShowAddSubscriptionModal(true);
                          }}
                          disabled={userActionBusy}
                          className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {t.admin?.addSubscription || "Выдать подписку"}
                        </button>
                        <button
                          type="button"
                          onClick={() => openUserAction("revoke-subscription", user)}
                          disabled={
                            userActionBusy ||
                            !user.has_subscription ||
                            isProtectedAdminUser(user, currentAdminUserId)
                          }
                          title={isProtectedAdminUser(user, currentAdminUserId)
                            ? t.admin?.protectedAdminAction || "Аккаунты администраторов защищены"
                            : !user.has_subscription
                              ? language === "kk" ? "Жазылым белсенді емес" : "Подписка уже неактивна"
                              : undefined}
                          className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 shadow-sm transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {t.admin?.revokeSubscription || "Снять подписку"}
                        </button>
                        <button
                          type="button"
                          onClick={() => openUserAction("reset-tokens", user)}
                          disabled={
                            userActionBusy ||
                            user.balance <= 0 ||
                            isProtectedAdminUser(user, currentAdminUserId)
                          }
                          title={isProtectedAdminUser(user, currentAdminUserId)
                            ? t.admin?.protectedAdminAction || "Аккаунты администраторов защищены"
                            : user.balance <= 0
                              ? language === "kk" ? "Токен балансы нөлге тең" : "Баланс уже равен нулю"
                              : undefined}
                          className="rounded-lg border border-orange-300 bg-white px-3 py-1.5 text-xs font-semibold text-orange-700 shadow-sm transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {t.admin?.resetTokens || "Обнулить токены"}
                        </button>
                        <button
                          type="button"
                          onClick={() => openUserAction("delete-user", user)}
                          disabled={userActionBusy || isProtectedAdminUser(user, currentAdminUserId)}
                          title={isProtectedAdminUser(user, currentAdminUserId)
                            ? t.admin?.protectedAdminAction || "Аккаунты администраторов защищены"
                            : undefined}
                          className="rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 shadow-sm transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {t.admin?.deleteUser || "Удалить"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleViewTransactions(user.user_id)}
                          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                        >
                          {t.admin?.viewTransactions || "Транзакции"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {total > limit && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setOffset(Math.max(0, offset - limit))}
              disabled={offset === 0}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t.admin?.previous || "Назад"}
            </button>
            <span className="text-sm text-slate-600">
              {offset + 1} - {Math.min(offset + limit, total)} {t.presentationsPage?.paginationOf || "из"} {total}
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
      </div>

      {/* Transactions for selected user */}
      {selectedUserForTransactions && (
        <div className="glass-card rounded-3xl border border-white/60 p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">
              {t.admin?.transactions || "История транзакций"}
            </h2>
            <button
              type="button"
              onClick={() => {
                setSelectedUserForTransactions(null);
                setTransactions([]);
              }}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              {t.admin?.close || "Закрыть"}
            </button>
          </div>

          {loadingTransactions ? (
            <div className="text-center py-8">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[color:var(--primary)] border-r-transparent"></div>
              <p className="mt-2 text-sm text-slate-600">{t.admin?.loading || "Загрузка..."}</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              {t.admin?.noTransactions || "Транзакций нет"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                      {t.admin?.date || "Дата"}
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                      {t.admin?.operation || "Операция"}
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                      {t.admin?.amount || "Сумма"}
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                      {t.admin?.description || "Описание"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="border-b border-slate-100">
                      <td className="py-3 px-4 text-sm text-slate-600">
                        {formatDate(tx.created_at)}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-900">{tx.operation_type}</td>
                      <td
                        className={`py-3 px-4 text-sm font-semibold ${
                          tx.amount >= 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {tx.amount >= 0 ? "+" : ""}
                        {tx.amount}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600">{tx.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add Tokens Modal */}
      {showAddTokensModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="glass-card rounded-3xl border border-white/60 p-6 shadow-xl max-w-md w-full">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              {t.admin?.addTokensTo || "Добавить токены"} {selectedUser.email}
            </h3>
            <form onSubmit={handleAddTokens} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {t.admin?.amount || "Количество токенов"}
                </label>
                <input
                  type="number"
                  value={tokensAmount}
                  onChange={(e) => setTokensAmount(e.target.value)}
                  required
                  min="1"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {t.admin?.description || "Описание (необязательно)"}
                </label>
                <textarea
                  value={tokensDescription}
                  onChange={(e) => setTokensDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
                />
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={addingTokens}
                  className="flex-1 rounded-2xl bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--secondary)] px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:opacity-90 disabled:opacity-50"
                >
                  {addingTokens
                    ? t.admin?.adding || "Добавление..."
                    : t.admin?.add || "Добавить"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddTokensModal(false);
                    setSelectedUser(null);
                    setTokensAmount("");
                    setTokensDescription("");
                  }}
                  className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  {t.admin?.cancel || "Отмена"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Subscription Modal */}
      {showAddSubscriptionModal && selectedUserForSubscription && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="glass-card rounded-3xl border border-white/60 p-6 shadow-xl max-w-md w-full">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              {t.admin?.addSubscription || "Выдать подписку"} {selectedUserForSubscription.email}
            </h3>
            <form onSubmit={handleAddSubscription} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {t.admin?.subscriptionDays || "Количество дней"}
                </label>
                <input
                  type="number"
                  value={subscriptionDays}
                  onChange={(e) => setSubscriptionDays(e.target.value)}
                  required
                  min="1"
                  placeholder={t.admin?.subscriptionDaysPlaceholder || "30"}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
                />
                <p className="mt-1 text-xs text-slate-500">
                  {selectedUserForSubscription.has_subscription
                    ? t.admin?.subscriptionExtendNote || "Подписка будет продлена от текущей даты окончания"
                    : t.admin?.subscriptionNewNote || "Будет создана новая подписка на указанное количество дней"}
                </p>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={addingSubscription}
                  className="flex-1 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:opacity-90 disabled:opacity-50"
                >
                  {addingSubscription
                    ? t.admin?.adding || "Добавление..."
                    : t.admin?.add || "Добавить"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddSubscriptionModal(false);
                    setSelectedUserForSubscription(null);
                    setSubscriptionDays("");
                  }}
                  className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  {t.admin?.cancel || "Отмена"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

        </>
      )}

      {/* Videos Tab Content */}
      {activeTab === "videos" && (
        <div className="space-y-6">
          {/* Upload Video Form */}
          <div className="glass-card rounded-3xl border border-white/60 p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              {t.admin?.videos?.uploadVideo || "Загрузить видео"}
            </h2>
            <form onSubmit={handleUploadVideo} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {t.admin?.videos?.videoTitle || "Название видео"}
                </label>
                <input
                  type="text"
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                  required
                  maxLength={255}
                  placeholder={t.admin?.videos?.videoTitlePlaceholder || "Введите название видео"}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
                />
              </div>
              <div>
                <label htmlFor="admin-video-file" className="block text-sm font-medium text-slate-700 mb-1">
                  {t.admin?.videos?.selectFile || "Выберите видеофайл"}
                </label>
                <input
                  id="admin-video-file"
                  ref={videoFileInputRef}
                  type="file"
                  accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  required
                  disabled={uploading}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)] disabled:cursor-wait disabled:bg-slate-100"
                />
                {selectedFile && (
                  <LocalFilePreview
                    file={selectedFile}
                    language={language}
                    onRemove={uploading ? undefined : () => {
                      setSelectedFile(null);
                      if (videoFileInputRef.current) videoFileInputRef.current.value = "";
                    }}
                    className="mt-3 max-w-md"
                  />
                )}
              </div>
              <div>
                <label htmlFor="admin-video-thumbnail" className="block text-sm font-medium text-slate-700 mb-1">
                  {t.admin?.videos?.selectThumbnail || "Выберите обложку (необязательно)"}
                </label>
                <input
                  id="admin-video-thumbnail"
                  ref={videoThumbnailInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => setSelectedThumbnail(e.target.files?.[0] || null)}
                  disabled={uploading}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)] disabled:cursor-wait disabled:bg-slate-100"
                />
                {selectedThumbnail && (
                  <LocalFilePreview
                    file={selectedThumbnail}
                    language={language}
                    onRemove={uploading ? undefined : () => {
                      setSelectedThumbnail(null);
                      if (videoThumbnailInputRef.current) videoThumbnailInputRef.current.value = "";
                    }}
                    className="mt-3 max-w-md"
                  />
                )}
              </div>
              {uploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">
                      {t.admin?.videos?.uploadProgress || "Загрузка"}...
                    </span>
                    <span className="font-semibold text-slate-900">{Math.round(uploadProgress)}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--secondary)] transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 rounded-2xl bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--secondary)] px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:opacity-90 disabled:opacity-50"
                >
                  {uploading
                    ? t.admin?.videos?.uploading || "Загрузка..."
                    : t.admin?.videos?.upload || "Загрузить"}
                </button>
                {uploading && (
                  <button
                    type="button"
                    onClick={() => {
                      uploadAbortRef.current?.abort();
                    }}
                    className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                  >
                    {t.admin?.videos?.cancel || "Отмена"}
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Import YouTube Video Form */}
          <div className="glass-card rounded-3xl border border-white/60 p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              {t.admin?.videos?.youtubeImportTitle || "Импорт видео с YouTube"}
            </h2>
            <form onSubmit={handleImportYouTube} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {t.admin?.videos?.youtubeUrlLabel || "Ссылка на YouTube"}
                </label>
                <input
                  type="url"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  required
                  placeholder={t.admin?.videos?.youtubeUrlPlaceholder || "https://www.youtube.com/watch?v=... или https://youtu.be/..."}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {t.admin?.videos?.youtubeVideoTitle || "Название видео"}
                </label>
                <input
                  type="text"
                  value={youtubeTitle}
                  onChange={(e) => setYoutubeTitle(e.target.value)}
                  required
                  maxLength={255}
                  placeholder={t.admin?.videos?.youtubeVideoTitlePlaceholder || "Введите название видео"}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
                />
              </div>
              <div>
                <label htmlFor="admin-youtube-thumbnail" className="block text-sm font-medium text-slate-700 mb-1">
                  {t.admin?.videos?.youtubeThumbnailLabel || "Превью (необязательно)"}
                </label>
                <input
                  id="admin-youtube-thumbnail"
                  ref={youtubeThumbnailInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => setYoutubeThumbnail(e.target.files?.[0] || null)}
                  disabled={importingYouTube}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)] disabled:cursor-wait disabled:bg-slate-100"
                />
                {youtubeThumbnail && (
                  <LocalFilePreview
                    file={youtubeThumbnail}
                    language={language}
                    onRemove={importingYouTube ? undefined : () => {
                      setYoutubeThumbnail(null);
                      if (youtubeThumbnailInputRef.current) youtubeThumbnailInputRef.current.value = "";
                    }}
                    className="mt-3 max-w-md"
                  />
                )}
              </div>
              {importingYouTube && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-[color:var(--primary)] border-r-transparent"></div>
                    <span>{t.admin?.videos?.youtubeImporting || "Импорт видео с YouTube..."}</span>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={importingYouTube}
                  className="flex-1 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:opacity-90 disabled:opacity-50"
                >
                  {importingYouTube ? (t.admin?.videos?.youtubeImporting || "Импорт...") : (t.admin?.videos?.youtubeImportButton || "Импортировать с YouTube")}
                </button>
                {importingYouTube && (
                  <button
                    type="button"
                    onClick={() => {
                      setImportingYouTube(false);
                    }}
                    className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                  >
                    {t.admin?.cancel || "Отмена"}
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Videos List */}
          <div className="glass-card rounded-3xl border border-white/60 p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">
                {t.admin?.videos?.videosList || "Список видео"}
              </h2>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSyncStatuses}
                  disabled={syncingStatuses || loadingVideos}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
                >
                  {syncingStatuses
                    ? t.admin?.videos?.syncing || "Синхронизация..."
                    : t.admin?.videos?.syncStatuses || "Синхронизировать статусы"}
                </button>
                <button
                  type="button"
                  onClick={fetchVideos}
                  disabled={loadingVideos || syncingStatuses}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
                >
                  {t.admin?.videos?.refresh || "Обновить"}
                </button>
              </div>
            </div>

            {loadingVideos ? (
              <div className="text-center py-8">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[color:var(--primary)] border-r-transparent"></div>
                <p className="mt-2 text-sm text-slate-600">{t.admin?.loading || "Загрузка..."}</p>
              </div>
            ) : uploadedVideos.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                {t.admin?.videos?.noVideos || "Видео не найдены"}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                        {t.admin?.videos?.tableName || "Название"}
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                        {t.admin?.videos?.status || "Статус"}
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                        {t.admin?.videos?.tableCreatedAt || "Дата создания"}
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                        {t.admin?.videos?.tableActions || "Действия"}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {uploadedVideos.map((video) => (
                      <tr key={video.id} className="border-b border-slate-100">
                        <td className="py-3 px-4 text-sm text-slate-900">
                          <div className="flex min-w-60 items-center gap-3">
                            <SavedVideoThumbnail url={video.thumbnail_url} title={video.title} />
                            <span className="line-clamp-2 font-medium">{video.title}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                              video.status === "ready"
                                ? "bg-green-100 text-green-700"
                                : video.status === "processing"
                                ? "bg-blue-100 text-blue-700"
                                : video.status === "uploading"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {video.status === "ready"
                              ? t.admin?.videos?.ready || "Готово"
                              : video.status === "processing"
                              ? t.admin?.videos?.processing || "Обработка"
                              : video.status === "uploading"
                              ? t.admin?.videos?.uploading || "Загрузка"
                              : t.admin?.videos?.error || "Ошибка"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-600">
                          {formatDate(video.created_at)}
                        </td>
                        <td className="py-3 px-4">
                          <button
                            type="button"
                            onClick={() => setVideoToDelete(video)}
                            className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-red-700"
                          >
                            {t.admin?.videos?.delete || "Удалить"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Video Confirmation Modal */}
      {videoToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="glass-card rounded-3xl border border-white/60 p-6 shadow-xl max-w-md w-full mx-4">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              {t.admin?.videos?.deleteConfirmTitle || "Подтверждение удаления"}
            </h2>
            <p className="text-sm text-slate-600 mb-6">
              {t.admin?.videos?.deleteConfirmMessage || "Вы уверены, что хотите удалить видео"} &quot;{videoToDelete.title}&quot;?
              <br />
              <span className="text-xs text-slate-500 mt-2 block">
                {t.admin?.videos?.deleteConfirmWarning || "Это действие нельзя отменить. Видео будет удалено из Bunny CDN и базы данных."}
              </span>
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleDeleteVideo}
                disabled={deletingVideo}
                className="flex-1 rounded-2xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-red-700 disabled:opacity-50"
              >
                {deletingVideo ? (t.admin?.videos?.deleting || "Удаление...") : (t.admin?.videos?.delete || "Удалить")}
              </button>
              <button
                type="button"
                onClick={() => setVideoToDelete(null)}
                disabled={deletingVideo}
                className="flex-1 rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
              >
                {t.admin?.cancel || "Отмена"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Visuals Tab Content */}
      {activeTab === "visuals" && (
        <div className="space-y-6">
          <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm">
            <div className="text-center space-y-4">
              <h2 className="text-xl font-semibold text-slate-900">
                {t.admin?.visuals?.title || "Визуальные материалы"}
              </h2>
              <p className="text-sm text-slate-600">
                {t.admin?.visuals?.subtitle || "Управление визуальными материалами и категориями"}
              </p>
              <a
                href="/dashboard/admin/library"
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--secondary)] px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/30 transition hover:shadow-xl hover:shadow-emerald-500/30"
              >
                {t.admin?.visuals?.goToPage || "Перейти к управлению"}
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Materials Tab Content */}
      {activeTab === "materials" && (
        <div className="space-y-6">
          <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm">
            <div className="text-center space-y-4">
              <h2 className="text-xl font-semibold text-slate-900">
                {t.admin?.materials?.title || t.presentationsAdmin?.title || "Интерактивные презентации"}
              </h2>
              <p className="text-sm text-slate-600">
                {t.admin?.materials?.subtitle || t.presentationsAdmin?.subtitle || "Загрузка интерактивных презентаций"}
              </p>
              <a
                href="/dashboard/admin/library"
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--secondary)] px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/30 transition hover:shadow-xl hover:shadow-emerald-500/30"
              >
                {t.admin?.materials?.goToPage || "Перейти к загрузке"}
              </a>
            </div>
          </div>
        </div>
      )}

      {activeTab === "library" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="space-y-4 text-center">
              <h2 className="text-xl font-semibold text-slate-900">
                {language === "kk" ? "Дайын материалдар кітапханасы" : "Библиотека готовых материалов"}
              </h2>
              <p className="text-sm text-slate-600">
                {language === "kk"
                  ? "Көрнекіліктерді, ойындарды, ашық сабақтарды және іс-шараларды бір жерден басқарыңыз."
                  : "Единое управление наглядными материалами, играми, открытыми уроками и мероприятиями."}
              </p>
              <a
                href="/dashboard/admin/library"
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--secondary)] px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/30 transition hover:shadow-xl hover:shadow-emerald-500/30"
              >
                {language === "kk" ? "Кітапхананы ашу" : "Открыть библиотеку"}
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
    {pendingUserAction && pendingActionCopy && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4">
        <div
          ref={userActionDialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-user-action-title"
          aria-describedby="admin-user-action-description"
          aria-busy={userActionBusy}
          className="w-full max-w-md rounded-3xl border border-white/70 bg-white p-6 shadow-2xl"
        >
          <h3 id="admin-user-action-title" className="text-xl font-semibold text-slate-950">
            {pendingActionCopy.title}
          </h3>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void handleAdminUserAction();
            }}
          >
            <p id="admin-user-action-description" className="mt-2 text-sm leading-6 text-slate-600">
              {pendingActionCopy.message}
            </p>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="break-all text-sm font-semibold text-slate-900">
                {pendingUserAction.user.email}
              </p>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
                <span>{t.admin?.balance || "Баланс"}: {pendingUserAction.user.balance}</span>
                <span>
                  {t.admin?.subscription || "Подписка"}: {pendingUserAction.user.has_subscription
                    ? t.admin?.subscriptionActive || "Активна"
                    : t.admin?.subscriptionInactive || "Неактивна"}
                </span>
              </div>
            </div>

            {pendingUserAction.kind === "delete-user" && (
              <div className="mt-4">
                <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-800">
                  {t.admin?.deleteUserWarning || "Это действие нельзя отменить."}
                </p>
                <label htmlFor="delete-user-confirmation" className="mt-4 block text-sm font-medium text-slate-800">
                  {t.admin?.deleteUserConfirmationLabel || "Для подтверждения введите email пользователя"}
                </label>
                <input
                  ref={deleteConfirmationInputRef}
                  id="delete-user-confirmation"
                  type="email"
                  value={deleteConfirmation}
                  onChange={(event) => setDeleteConfirmation(event.target.value)}
                  disabled={userActionBusy}
                  autoComplete="off"
                  spellCheck={false}
                  placeholder={t.admin?.deleteUserConfirmationPlaceholder || "Введите email точно как указано"}
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                />
              </div>
            )}

            {userActionError && (
              <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                {userActionError}
              </div>
            )}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row">
              <button
                ref={cancelUserActionButtonRef}
                type="button"
                onClick={closeUserAction}
                disabled={userActionBusy}
                className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t.admin?.cancel || "Отмена"}
              </button>
              <button
                type="submit"
                disabled={userActionBusy || !deleteConfirmationMatches}
                aria-busy={userActionBusy}
                className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${
                  pendingUserAction.kind === "delete-user"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-amber-600 hover:bg-amber-700"
                }`}
              >
                {userActionBusy
                  ? t.admin?.actionInProgress || "Выполняется..."
                  : t.admin?.confirmAction || "Подтвердить"}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
    </>
  );
}
