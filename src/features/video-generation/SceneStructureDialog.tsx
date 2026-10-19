"use client";
import { useState } from "react";
import { videoApi } from "./api";
import { videoError } from "./model";
import type { VideoScene } from "./types";
import { Button, Field, Icon, Modal, Spinner, fieldClass } from "./ui";

export function SceneStructureDialog({
  scene,
  prompt,
  next,
  mode,
  kk,
  save,
  onClose,
  onRefresh,
}: {
  scene: VideoScene;
  prompt: string;
  next?: VideoScene;
  mode: "split" | "merge";
  kk: boolean;
  save: () => Promise<void>;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [point, setPoint] = useState(Math.floor(prompt.length / 2));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <Modal
      title={
        mode === "split"
          ? kk
            ? "Сахнаны бөлу"
            : "Разделить сцену"
          : kk
            ? "Келесі сахнамен біріктіру"
            : "Объединить со следующей сценой"
      }
      wide
      onClose={onClose}
    >
      <p className="mb-5 text-xs leading-6 text-slate-500">
        {mode === "split"
          ? kk
            ? "Сипаттама екі бөлікке бөлінеді; екіншісі жаңа сахна болады. Дайын нұсқалар бастапқы сахнада сақталады. Репликаларды сахналарға өзіңіз бөліңіз."
            : "Описание разделится на две части; вторая станет новой сценой. Готовые версии останутся в исходной сцене. Распределите реплики между сценами вручную."
          : kk
            ? "Екі сахнаның мәтіндері ағымдағы сахнаға біріктіріледі. Келесі сахна жинақтаудан алынады; оның нұсқалары сақталады. Дайын клиптер өзгермейді."
            : "Описания двух сцен объединятся в текущей. Следующая сцена будет исключена из сборки, её версии сохранятся. Готовые клипы не меняются."}
      </p>
      {mode === "split" ? (
        <>
          <Field
            label={kk ? "Мәтіндегі бөлу орны" : "Место разделения в тексте"}
          >
            <input
              className="w-full accent-indigo-600"
              type="range"
              min="1"
              max={Math.max(1, prompt.length - 1)}
              value={point}
              onChange={(e) => setPoint(Number(e.target.value))}
            />
          </Field>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 p-4">
              <h3 className="text-xs font-semibold text-slate-500">
                {kk ? "Бірінші сахна" : "Первая сцена"}
              </h3>
              <p className="mt-2 max-h-60 overflow-auto whitespace-pre-wrap text-xs leading-6 text-slate-700">
                {prompt.slice(0, point)}
              </p>
            </div>
            <div className="rounded-2xl border border-indigo-200 bg-indigo-50/30 p-4">
              <h3 className="text-xs font-semibold text-indigo-500">
                {kk ? "Жаңа сахна" : "Новая сцена"}
              </h3>
              <p className="mt-2 max-h-60 overflow-auto whitespace-pre-wrap text-xs leading-6 text-slate-700">
                {prompt.slice(point)}
              </p>
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs font-semibold text-slate-700">
            {scene.title} + {next?.title ?? "—"}
          </p>
          <textarea
            readOnly
            className={`${fieldClass} mt-3 min-h-44`}
            value={`${prompt}\n\n${next?.prompt ?? ""}`}
          />
        </div>
      )}
      <p className="my-4 text-[11px] leading-5 text-slate-400">
        {kk
          ? "Бұл әрекет тегін. Видео генерациясын бастамайды."
          : "Это бесплатно и не запускает видеогенерацию."}
      </p>
      <Button
        variant="primary"
        className="w-full"
        disabled={
          busy ||
          (mode === "split"
            ? !prompt.slice(0, point).trim() || !prompt.slice(point).trim()
            : !next)
        }
        onClick={() => {
          setBusy(true);
          setError("");
          void save()
            .then(() =>
              mode === "split"
                ? videoApi.split(scene.id, point)
                : videoApi.merge(scene.id, next!.id),
            )
            .then(() => {
              onRefresh();
              onClose();
            })
            .catch((err) => setError(videoError(err, kk)))
            .finally(() => setBusy(false));
        }}
      >
        {busy ? <Spinner /> : <Icon name="scenes" />}
        {mode === "split"
          ? kk
            ? "Екі сахнаға бөлу"
            : "Разделить на две сцены"
          : kk
            ? "Мәтіндерді біріктіру"
            : "Объединить описания"}
      </Button>
      {error && (
        <p role="alert" className="mt-3 text-xs leading-5 text-rose-600">
          {error}
        </p>
      )}
    </Modal>
  );
}
