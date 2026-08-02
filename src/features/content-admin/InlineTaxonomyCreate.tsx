"use client";

import { useMutation } from "@tanstack/react-query";
import { useRef, useState, type KeyboardEvent } from "react";
import type { TaxonomyOption } from "@/features/content-library/types";

export type TaxonomyCreateInput = {
  name: string;
  name_kk?: string;
};

type InlineTaxonomyCreateProps = {
  kind: "subject" | "category";
  language: "ru" | "kk";
  onCreate: (input: TaxonomyCreateInput) => Promise<TaxonomyOption>;
  onCreated: (created: TaxonomyOption) => void;
  onConflict?: () => void | Promise<void>;
  onPendingChange?: (pending: boolean) => void;
  disabled?: boolean;
};

function errorStatus(error: unknown): number | undefined {
  if (!error || typeof error !== "object" || !("status" in error)) return undefined;
  const status = (error as { status?: unknown }).status;
  return typeof status === "number" ? status : undefined;
}

export function InlineTaxonomyCreate({
  kind,
  language,
  onCreate,
  onCreated,
  onConflict,
  onPendingChange,
  disabled = false,
}: InlineTaxonomyCreateProps) {
  const [expanded, setExpanded] = useState(false);
  const [name, setName] = useState("");
  const [nameKk, setNameKk] = useState("");
  const nameInputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const pendingRef = useRef(false);
  const isSubject = kind === "subject";

  const mutation = useMutation({
    mutationFn: onCreate,
    onSuccess: (created) => {
      onCreated(created);
      setName("");
      setNameKk("");
      setExpanded(false);
      window.setTimeout(() => triggerRef.current?.focus(), 0);
    },
    onError: async (error) => {
      if (errorStatus(error) === 409) await onConflict?.();
    },
    onSettled: () => {
      pendingRef.current = false;
      onPendingChange?.(false);
    },
  });

  const open = () => {
    if (disabled) return;
    mutation.reset();
    setExpanded(true);
    window.setTimeout(() => nameInputRef.current?.focus(), 0);
  };

  const cancel = () => {
    if (pendingRef.current) return;
    mutation.reset();
    setName("");
    setNameKk("");
    setExpanded(false);
    window.setTimeout(() => triggerRef.current?.focus(), 0);
  };

  const create = () => {
    const trimmedName = name.trim();
    if (!trimmedName || disabled || pendingRef.current) return;
    pendingRef.current = true;
    onPendingChange?.(true);
    mutation.mutate({ name: trimmedName, name_kk: nameKk.trim() || undefined });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      cancel();
      return;
    }
    if (event.key === "Enter" && event.target instanceof HTMLInputElement) {
      event.preventDefault();
      event.stopPropagation();
      create();
    }
  };

  const conflict = errorStatus(mutation.error) === 409;
  const fallbackError = language === "kk"
    ? `${isSubject ? "Пәнді" : "Санатты"} жасау мүмкін болмады. Қайталап көріңіз.`
    : `Не удалось создать ${isSubject ? "предмет" : "категорию"}. Попробуйте ещё раз.`;

  if (!expanded) {
    return (
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={open}
        className="rounded-lg px-2 py-1 text-xs font-semibold text-orange-700 transition hover:bg-orange-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 disabled:cursor-not-allowed disabled:text-slate-400 disabled:hover:bg-transparent"
      >
        + {language === "kk"
          ? `Жаңа ${isSubject ? "пән" : "санат"}`
          : isSubject ? "Новый предмет" : "Новая категория"}
      </button>
    );
  }

  return (
    <div
      onKeyDown={handleKeyDown}
      className="rounded-xl border border-orange-200 bg-orange-50/70 p-3"
      aria-label={language === "kk"
        ? `Жаңа ${isSubject ? "пән" : "санат"} жасау`
        : `Создание: ${isSubject ? "предмет" : "категория"}`}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold text-slate-800">
          {language === "kk"
            ? `Жаңа ${isSubject ? "пән" : "санат"}`
            : isSubject ? "Новый предмет" : "Новая категория"}
        </p>
        <button
          type="button"
          disabled={mutation.isPending}
          onClick={cancel}
          aria-label={language === "kk" ? "Жабу" : "Закрыть"}
          className="rounded p-1 text-slate-400 hover:bg-white hover:text-slate-700 disabled:opacity-40"
        >
          ×
        </button>
      </div>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-[11px] font-medium text-slate-600">
            {language === "kk" ? "Негізгі атауы" : "Основное название"} *
          </span>
          <input
            ref={nameInputRef}
            type="text"
            maxLength={100}
            value={name}
            disabled={mutation.isPending || disabled}
            onChange={(event) => {
              setName(event.target.value);
              if (mutation.isError) mutation.reset();
            }}
            className="w-full rounded-lg border border-orange-200 bg-white px-2.5 py-2 text-xs text-slate-800 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 disabled:opacity-60"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-medium text-slate-600">
            {language === "kk" ? "Қазақша атауы" : "Название на казахском"}
          </span>
          <input
            type="text"
            maxLength={100}
            value={nameKk}
            disabled={mutation.isPending || disabled}
            onChange={(event) => {
              setNameKk(event.target.value);
              if (mutation.isError) mutation.reset();
            }}
            className="w-full rounded-lg border border-orange-200 bg-white px-2.5 py-2 text-xs text-slate-800 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 disabled:opacity-60"
          />
        </label>
      </div>

      {mutation.isError && (
        <p role="alert" className="mt-2 rounded-lg bg-red-50 px-2.5 py-2 text-xs font-medium text-red-700">
          {conflict
            ? language === "kk"
              ? `Мұндай ${isSubject ? "пән" : "санат"} бұрыннан бар. Оны жоғарыдағы тізімнен іздеп таңдаңыз.`
              : isSubject
                ? "Предмет с таким названием уже существует. Найдите и выберите его в списке выше."
                : "Такая категория уже существует. Найдите и выберите её в списке выше."
            : fallbackError}
        </p>
      )}

      <div className="mt-3 flex flex-wrap justify-end gap-2">
        <button
          type="button"
          disabled={mutation.isPending}
          onClick={cancel}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
        >
          {language === "kk" ? "Бас тарту" : "Отмена"}
        </button>
        <button
          type="button"
          disabled={mutation.isPending || disabled || !name.trim()}
          onClick={create}
          className="rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-700 disabled:cursor-wait disabled:opacity-50"
        >
          {mutation.isPending
            ? language === "kk" ? "Жасалуда…" : "Создание…"
            : language === "kk" ? "Жасау және таңдау" : "Создать и выбрать"}
        </button>
      </div>
    </div>
  );
}
