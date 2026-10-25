"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ApiRequestError } from "@/lib/http-client";
import { videoApi } from "./api";
import { PrivateMedia } from "./PrivateMedia";
import { Button, Icon, Modal, Spinner } from "./ui";
import { videoError } from "./model";
import type { VideoAsset } from "./types";

export function ImageInput({
  projectId,
  assetId,
  aspectRatio,
  projectExpiresAt,
  limitMb = 20,
  kk = false,
  onChange,
}: {
  projectId: string;
  assetId?: string | null;
  aspectRatio: string;
  projectExpiresAt?: string;
  limitMb?: number;
  kk?: boolean;
  onChange: (id: string | null, asset?: VideoAsset) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [fit, setFit] = useState<"contain" | "crop">("contain");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);
  function choose(candidate?: File) {
    if (!candidate) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(candidate.type)) {
      setError(
        kk ? "JPG, PNG немесе WEBP таңдаңыз." : "Выберите JPG, PNG или WEBP.",
      );
      return;
    }
    if (candidate.size > limitMb * 1024 * 1024) {
      setError(
        `${kk ? "Ең үлкен өлшем" : "Максимальный размер"}: ${limitMb} МБ`,
      );
      return;
    }
    setError("");
    setFit("contain");
    setFile(candidate);
    setPreview(URL.createObjectURL(candidate));
  }
  return (
    <div className="space-y-3">
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(e) => {
          choose(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      {assetId ? (
        <div className="relative rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <PrivateMedia
            key={assetId}
            assetId={assetId}
            projectExpiresAt={projectExpiresAt}
            image
            compact
            kk={kk}
          />
          <div className="mt-3 flex justify-between gap-2">
            <Button onClick={() => input.current?.click()}>
              <Icon name="image" />
              {kk ? "Ауыстыру" : "Заменить"}
            </Button>
            <Button variant="ghost" onClick={() => onChange(null)}>
              <Icon name="trash" />
              {kk ? "Алып тастау" : "Убрать"}
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => input.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            choose(e.dataTransfer.files[0]);
          }}
          className="flex min-h-36 w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/40 p-5 text-center transition hover:border-indigo-400 hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-indigo-200"
        >
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-indigo-500 shadow-sm">
            <Icon name="image" className="h-5 w-5" />
          </span>
          <span className="text-xs font-semibold text-slate-700">
            {kk
              ? "Суретті сүйреңіз немесе таңдаңыз"
              : "Перетащите или выберите изображение"}
          </span>
          <span className="text-[11px] text-slate-400">
            JPG, PNG, WEBP · {kk ? "дейін" : "до"} {limitMb} МБ
          </span>
        </button>
      )}
      {error && (
        <p role="alert" className="text-xs leading-5 text-rose-600">
          {error}
        </p>
      )}
      {file && (
        <Modal
          title={kk ? "Кадрға дайындау" : "Подготовка кадра"}
          onClose={() => {
            if (!busy) setFile(null);
          }}
        >
          <p className="mb-4 text-xs leading-5 text-slate-500">
            {kk
              ? "Нәтиже пішімін тексеріңіз. Қию бетті немесе маңызды нысанды алып тастамауы тиіс."
              : "Проверьте композицию. Обрезка не должна скрыть лицо или важный объект."}
          </p>
          <div
            className="overflow-hidden rounded-2xl bg-slate-950"
            style={{ aspectRatio: aspectRatio.replace(":", "/") }}
          >
            <Image
              unoptimized
              width={1024}
              height={768}
              src={preview}
              alt={kk ? "Кадрды алдын ала қарау" : "Предпросмотр кадрирования"}
              className="h-full w-full"
              style={{ objectFit: fit === "crop" ? "cover" : "contain" }}
            />
          </div>
          <div className="my-4 grid grid-cols-2 gap-2">
            <Button
              variant={fit === "contain" ? "primary" : "secondary"}
              onClick={() => setFit("contain")}
            >
              {kk ? "Барлығын сақтау" : "Сохранить целиком"}
            </Button>
            <Button
              variant={fit === "crop" ? "primary" : "secondary"}
              onClick={() => setFit("crop")}
            >
              {kk ? "Ортасынан қию" : "Обрезать по центру"}
            </Button>
          </div>
          <p className="mb-4 text-[11px] leading-5 text-slate-400">
            {kk
              ? "«Барлығын сақтау» суретті қиылмайтын өрістермен орналастырады."
              : "«Сохранить целиком» добавит поля и сохранит изображение без обрезки."}
          </p>
          {error && (
            <p
              role="alert"
              className="mb-4 rounded-xl bg-rose-50 p-3 text-xs leading-6 text-rose-700"
            >
              {error}
            </p>
          )}
          <Button
            variant="primary"
            className="w-full"
            disabled={busy || !preview}
            onClick={() => {
              if (!file) return;
              setBusy(true);
              setError("");
              void videoApi
                .upload(projectId, file, fit, aspectRatio)
                .then((asset) => {
                  onChange(asset.id, asset);
                  setFile(null);
                })
                .catch((err) =>
                  setError(
                    err instanceof ApiRequestError &&
                      [400, 413, 422].includes(err.status)
                      ? err.message
                          .replace(/[\u0000-\u001f]/g, " ")
                          .slice(0, 600)
                      : videoError(err, kk),
                  ),
                )
                .finally(() => setBusy(false));
            }}
          >
            {busy ? <Spinner /> : <Icon name="check" />}
            {kk ? "Осы кадрды пайдалану" : "Использовать этот кадр"}
          </Button>
        </Modal>
      )}
    </div>
  );
}
