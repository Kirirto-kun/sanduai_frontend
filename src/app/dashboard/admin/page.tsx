"use client";

import { useState, useEffect, FormEvent } from "react";
import { useTranslations } from "../../../i18n/LanguageContext";
import {
  getAdminUsers,
  addTokensToUser,
  getAdminUserTransactions,
  type AdminUser,
  type AddTokensPayload,
  type TokenTransaction,
} from "../../../lib/api";

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

  // Selected user for viewing transactions
  const [selectedUserForTransactions, setSelectedUserForTransactions] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<TokenTransaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

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

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString("ru-RU");
    } catch {
      return dateString;
    }
  };

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
                    <td className="py-3 px-4 text-sm text-slate-600">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
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
    </div>
  );
}

