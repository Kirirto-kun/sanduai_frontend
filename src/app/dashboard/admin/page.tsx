"use client";

import { useState, useEffect, FormEvent } from "react";
import { useTranslations } from "../../../i18n/LanguageContext";
import {
  getAdminUsers,
  addTokensToUser,
  getAdminUserTransactions,
  addSubscriptionToUser,
  uploadVideoToken,
  uploadVideoToBunny,
  getVideos,
  type AdminUser,
  type AddTokensPayload,
  type AddSubscriptionPayload,
  type TokenTransaction,
  type UploadVideoTokenPayload,
  type Video,
} from "../../../lib/api";
import { formatSubscriptionDate } from "../../../lib/utils";

export default function AdminPage() {
  const t = useTranslations();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [limit] = useState(50);
  const [offset, setOffset] = useState(0);

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

  // Selected user for viewing transactions
  const [selectedUserForTransactions, setSelectedUserForTransactions] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<TokenTransaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  // Video upload state
  const [activeTab, setActiveTab] = useState<"users" | "videos">("users");
  const [videoTitle, setVideoTitle] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedVideos, setUploadedVideos] = useState<Video[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [offset]);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminUsers(limit, offset);
      setUsers(data.users);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка загрузки пользователей");
    } finally {
      setLoading(false);
    }
  };

  const handleAddTokens = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !tokensAmount) {
      setError("Заполните все поля");
      return;
    }

    const amount = parseInt(tokensAmount, 10);
    if (isNaN(amount) || amount <= 0) {
      setError("Количество токенов должно быть положительным числом");
      return;
    }

    setAddingTokens(true);
    setError(null);
    try {
      const payload: AddTokensPayload = {
        amount,
        description: tokensDescription || "Начисление токенов администратором",
      };
      await addTokensToUser(selectedUser.user_id, payload);
      setShowAddTokensModal(false);
      setTokensAmount("");
      setTokensDescription("");
      setSelectedUser(null);
      fetchUsers(); // Refresh users list
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка начисления токенов");
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
      setError(err instanceof Error ? err.message : "Ошибка загрузки транзакций");
    } finally {
      setLoadingTransactions(false);
    }
  };

  const handleAddSubscription = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedUserForSubscription || !subscriptionDays) {
      setError("Заполните все поля");
      return;
    }

    const days = parseInt(subscriptionDays, 10);
    if (isNaN(days) || days <= 0) {
      setError("Количество дней должно быть положительным числом");
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
      setError(err instanceof Error ? err.message : "Ошибка выдачи подписки");
    } finally {
      setAddingSubscription(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString("ru-RU");
    } catch {
      return dateString;
    }
  };

  const handleUploadVideo = async (e: FormEvent) => {
    e.preventDefault();
    if (!videoTitle.trim() || !selectedFile) {
      setError("Заполните все поля");
      return;
    }

    if (videoTitle.length > 255) {
      setError("Название видео не должно превышать 255 символов");
      return;
    }

    setUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      // Step 1: Get upload token
      const payload: UploadVideoTokenPayload = {
        title: videoTitle.trim(),
      };
      const tokenData = await uploadVideoToken(payload);

      // Step 2: Upload file to Bunny CDN
      await uploadVideoToBunny(
        tokenData.presigned_upload_url,
        selectedFile,
        tokenData.authorization_header,
        (progress) => {
          setUploadProgress(progress);
        }
      );

      // Step 3: Reset form and refresh videos list
      setVideoTitle("");
      setSelectedFile(null);
      setUploadProgress(0);
      fetchVideos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка загрузки видео");
    } finally {
      setUploading(false);
    }
  };

  const fetchVideos = async () => {
    setLoadingVideos(true);
    setError(null);
    try {
      const data = await getVideos(100, 0); // Get all videos for admin
      setUploadedVideos(data.videos);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка загрузки списка видео");
    } finally {
      setLoadingVideos(false);
    }
  };

  useEffect(() => {
    if (activeTab === "videos") {
      fetchVideos();
      // Poll for status updates every 10 seconds
      const interval = setInterval(() => {
        fetchVideos();
      }, 10000);
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          {t.admin?.title || "Админ панель"}
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          {t.admin?.subtitle || "Управление пользователями и токенами"}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
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
      </div>

      {/* Users Tab Content */}
      {activeTab === "users" && (
        <>
          {error && (
            <div className="rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Users List */}
      <div className="glass-card rounded-3xl border border-white/60 p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">
            {t.admin?.usersList || "Список пользователей"}
          </h2>
          <div className="text-sm text-slate-600">
            Всего: {total}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[color:var(--primary)] border-r-transparent"></div>
            <p className="mt-2 text-sm text-slate-600">Загрузка...</p>
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
                          className="rounded-lg bg-[color:var(--primary)] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:opacity-90"
                        >
                          {t.admin?.addTokens || "Добавить токены"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedUserForSubscription(user);
                            setShowAddSubscriptionModal(true);
                          }}
                          className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:opacity-90"
                        >
                          {t.admin?.addSubscription || "Выдать подписку"}
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
              <p className="mt-2 text-sm text-slate-600">Загрузка...</p>
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
                    ? "Подписка будет продлена от текущей даты окончания"
                    : "Будет создана новая подписка на указанное количество дней"}
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
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {t.admin?.videos?.selectFile || "Выберите видеофайл"}
                </label>
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  required
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
                />
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
                      setUploading(false);
                      setUploadProgress(0);
                    }}
                    className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                  >
                    {t.admin?.videos?.cancel || "Отмена"}
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
              <button
                type="button"
                onClick={fetchVideos}
                disabled={loadingVideos}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
              >
                {t.admin?.videos?.refresh || "Обновить"}
              </button>
            </div>

            {loadingVideos ? (
              <div className="text-center py-8">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[color:var(--primary)] border-r-transparent"></div>
                <p className="mt-2 text-sm text-slate-600">Загрузка...</p>
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
                        Название
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                        {t.admin?.videos?.status || "Статус"}
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                        Дата создания
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {uploadedVideos.map((video) => (
                      <tr key={video.id} className="border-b border-slate-100">
                        <td className="py-3 px-4 text-sm text-slate-900">{video.title}</td>
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
