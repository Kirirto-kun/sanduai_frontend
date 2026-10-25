"use client";

import { useEffect, useRef, useState } from "react";
import { videoApi } from "./api";
import { videoError } from "./model";
import { Button, Field, Icon, Modal, Spinner, fieldClass } from "./ui";

const PROMPT_LIMIT = 12000;

export function PromptAssistantDialog({
  initialPrompt,
  language,
  speechLanguage,
  duration,
  kk,
  onClose,
  onApply,
}: {
  initialPrompt: string;
  language: "ru" | "kk";
  speechLanguage: string;
  duration: number;
  kk: boolean;
  onClose: () => void;
  onApply: (prompt: string, originalPrompt: string) => void;
}) {
  const [idea, setIdea] = useState(initialPrompt);
  const [source, setSource] = useState("");
  const [proposal, setProposal] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const requestId = useRef(0);
  const submitLock = useRef(false);
  const videoLanguage =
    { ru: "Русский", kk: "Қазақша", en: "English" }[speechLanguage] ||
    speechLanguage ||
    (kk ? "Сипаттамадан анықтау" : "Как в описании");

  useEffect(
    () => () => {
      requestId.current += 1;
    },
    [],
  );

  async function prepare() {
    const submitted = idea.trim();
    if (submitLock.current || !submitted || idea.length > PROMPT_LIMIT) return;
    submitLock.current = true;
    const id = ++requestId.current;
    setBusy(true);
    setError("");
    try {
      const result = await videoApi.enhance(
        submitted,
        language,
        speechLanguage,
        duration,
      );
      if (requestId.current !== id) return;
      const prepared = (result.enhanced_prompt ?? result.prompt).trim();
      if (!prepared || prepared.length > PROMPT_LIMIT) {
        setError(
          kk
            ? "ЖИ жарамды промпт ұсынбады. Қайта көріңіз немесе өз мәтініңізді қалдырыңыз."
            : "ИИ не вернул подходящий промпт. Попробуйте ещё раз или оставьте свой текст.",
        );
        return;
      }
      setSource(submitted);
      setProposal(prepared);
    } catch (err) {
      if (requestId.current === id) setError(videoError(err, kk));
    } finally {
      submitLock.current = false;
      if (requestId.current === id) setBusy(false);
    }
  }

  return (
    <Modal
      title={
        kk ? "ЖИ көмегімен сценарий және промпт" : "Сценарий и промпт с ИИ"
      }
      onClose={onClose}
      wide
    >
      <div className="space-y-4">
        <p className="text-xs leading-5 text-slate-500">
          {proposal === null
            ? kk
              ? "Кейіпкерлер мен оқиғаны сипаттаңыз. ЖИ ойыңызға сүйеніп, видеоға арналған толық промпт ұсынады."
              : "Опишите героев и действие. ИИ предложит подробный промпт для видео на основе вашего замысла."
            : kk
              ? "Кейіпкерлерді, әрекеттер мен репликаларды тексеріп, мәтінді қажет болса өңдеңіз."
              : "Проверьте героев, действия и реплики. Текст можно отредактировать перед применением."}
        </p>
        <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
          <span className="font-semibold">
            {kk ? "Видео тілі" : "Язык видео"}:
          </span>{" "}
          {videoLanguage} · {duration} {kk ? "сек" : "сек"}
        </p>
        {proposal === null ? (
          <Field
            label={
              kk ? "Идея немесе өз сценарийіңіз" : "Идея или свой сценарий"
            }
          >
            <textarea
              className={`${fieldClass} min-h-48`}
              rows={7}
              value={idea}
              readOnly={busy}
              maxLength={PROMPT_LIMIT}
              onChange={(e) => setIdea(e.target.value)}
              placeholder={
                kk
                  ? "Тірі құлпынай мен банан көшеде нан жеп келе жатып, той туралы сөйлеседі. Құлпынай сәнді той өткізгісі келеді…"
                  : "Живые клубника и банан идут по улице, едят хлеб и обсуждают свадьбу. Клубника мечтает о шикарной свадьбе…"
              }
            />
          </Field>
        ) : (
          <>
            <Field label={kk ? "Сіздің идеяңыз" : "Ваша идея"}>
              <textarea
                className={`${fieldClass} bg-slate-50 text-slate-500`}
                rows={3}
                value={source}
                readOnly
              />
            </Field>
            <Field label={kk ? "Видеоға арналған промпт" : "Промпт для видео"}>
              <textarea
                className={`${fieldClass} min-h-56`}
                rows={9}
                value={proposal}
                maxLength={PROMPT_LIMIT}
                onChange={(e) => setProposal(e.target.value)}
              />
            </Field>
          </>
        )}
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
          <p>
            {kk
              ? "Видеоны жасау бөлек батырмамен іске қосылады."
              : "Генерация видео запускается отдельной кнопкой."}
          </p>
          <span>{(proposal ?? idea).length.toLocaleString()} / 12 000</span>
        </div>
        {error && (
          <p
            role="alert"
            className="rounded-xl bg-rose-50 p-3 text-xs leading-5 text-rose-700"
          >
            {error}
          </p>
        )}
        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:flex-wrap sm:justify-end">
          {proposal !== null && (
            <Button
              variant="ghost"
              onClick={() => {
                setProposal(null);
                setError("");
              }}
            >
              {kk ? "Идеяны өзгерту" : "Изменить идею"}
            </Button>
          )}
          <Button onClick={onClose}>
            {kk ? "Өз мәтінімді қалдыру" : "Оставить свой текст"}
          </Button>
          {proposal === null ? (
            <Button
              variant="primary"
              disabled={busy || !idea.trim() || idea.length > PROMPT_LIMIT}
              onClick={() => void prepare()}
            >
              {busy ? <Spinner /> : <Icon name="sparkles" />}
              {busy
                ? kk
                  ? "Промпт дайындалып жатыр…"
                  : "Готовим промпт…"
                : kk
                  ? "ЖИ көмегімен промпт дайындау"
                  : "Подготовить промпт с ИИ"}
            </Button>
          ) : (
            <Button
              variant="primary"
              disabled={!proposal.trim() || proposal.length > PROMPT_LIMIT}
              onClick={() => {
                onApply(proposal.trim(), source);
                onClose();
              }}
            >
              <Icon name="check" />
              {kk ? "Промптты қолдану" : "Применить промпт"}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
