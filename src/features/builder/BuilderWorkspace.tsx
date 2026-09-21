"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  GENERATION_JOBS_UPDATED_EVENT,
  getGenerationJob,
  listGenerationJobs,
  type GenerationJob,
} from "@/lib/api";
import {
  generationJobIdFromSearchParam,
  isUnavailableGenerationJobError,
} from "@/lib/generation-history";
import { API_ERROR_CODES, ApiRequestError } from "@/lib/http-client";
import { createIdempotencyKey } from "@/lib/idempotency";
import { readIntegrationPrefill } from "@/lib/integration-prefill";
import { TOKEN_BALANCE_INVALIDATED_EVENT } from "@/lib/tokenCache";
import { currentSessionUserId } from "@/hooks/useTokens";
import BuilderHome from "./BuilderHome";
import BuilderStudio from "./BuilderStudio";
import { builderApi, downloadProject } from "./api";
import { builderErrorMessage } from "./copy";
import {
  availableBuilderContentLanguages,
  normalizeBuilderContentLanguage,
} from "./language";
import {
  BUILDER_GENERATION_KIND,
  attachJobToPendingBuilderBuild,
  builderJobBelongsToProject,
  builderProjectIdFromJob,
  builderWorkspaceHref,
  clearBuilderComposerDraft,
  clearBuilderHomeDraft,
  clearPendingBuilderBuild,
  isActiveBuilderJob,
  listPendingBuilderBuilds,
  pendingBuildRecoveryAction,
  readBuilderHomeDraft,
  readPendingBuilderBuild,
  writeBuilderComposerDraft,
  writeBuilderHomeDraft,
  writePendingBuilderBuild,
  type BuilderComposerDraft,
  type PendingBuilderBuild,
} from "./persistence";
import type {
  BuilderAsset,
  BuilderBuildMode,
  BuilderConfig,
  BuilderContentLanguage,
  BuilderProject,
  BuilderProjectSummary,
  BuilderProjectType,
  BuilderVersion,
  BuilderVisibility,
  PendingAsset,
} from "./types";

function titleFromPrompt(prompt: string, language: "ru" | "kk"): string {
  const cleaned = prompt.replace(/\s+/g, " ").trim();
  if (!cleaned) return language === "kk" ? "Жаңа жоба" : "Новый проект";
  const sentence = cleaned.split(/[.!?\n]/)[0]?.trim() || cleaned;
  return sentence.length > 72 ? `${sentence.slice(0, 69).trimEnd()}…` : sentence;
}

function uncertainTransport(error: unknown): boolean {
  return error instanceof ApiRequestError && (
    error.code === API_ERROR_CODES.TIMEOUT
    || error.code === API_ERROR_CODES.NETWORK_ERROR
    || error.code === API_ERROR_CODES.ABORTED
    || error.code === API_ERROR_CODES.INVALID_RESPONSE
    || error.status === 408
    || error.status === 425
    || error.status === 429
    || error.status >= 500
  );
}

function projectSummary(project: BuilderProject): BuilderProjectSummary {
  return {
    id: project.id,
    title: project.title,
    description: project.description,
    project_type: project.project_type,
    content_language: normalizeBuilderContentLanguage(project.content_language),
    framework: project.framework,
    assets: project.assets,
    current_version: project.current_version,
    revision: project.revision,
    visibility: project.visibility,
    deployment_url: project.deployment_url,
    published_version: project.published_version,
    share_url: project.share_url,
    token_usage: project.token_usage,
    allow_duplicate: project.allow_duplicate,
    created_at: project.created_at,
    updated_at: project.updated_at,
  };
}

export default function BuilderWorkspace() {
  const { language } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectIdFromUrl = searchParams.get("project");
  const jobIdFromUrl = generationJobIdFromSearchParam(searchParams.get("job"));
  const duplicateIdFromUrl = searchParams.get("duplicate");
  const persistenceScope = currentSessionUserId();
  const openedFromUrl = useRef<string | null>(null);
  const closingProjectRef = useRef<string | null>(null);
  const mutationLockRef = useRef(false);
  const recoveryAttemptRef = useRef<string | null>(null);
  const pollTransportErrorRef = useRef(false);
  const pendingBuildMemoryRef = useRef<PendingBuilderBuild | null>(null);
  const duplicatedFromUrlRef = useRef<string | null>(null);
  const prefillAppliedRef = useRef(false);
  const [projects, setProjects] = useState<BuilderProjectSummary[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [config, setConfig] = useState<BuilderConfig | null>(null);
  const [estimatedQuote, setEstimatedQuote] = useState<{ key: string; tokens: number } | null>(null);
  const [currentProject, setCurrentProject] = useState<BuilderProject | null>(null);
  const [versions, setVersions] = useState<BuilderVersion[]>([]);
  const [prompt, setPrompt] = useState("");
  const [selectedType, setSelectedType] = useState<BuilderProjectType>("custom");
  const [selectedContentLanguage, setSelectedContentLanguage] = useState<BuilderContentLanguage>("auto");
  const [pendingAssets, setPendingAssets] = useState<PendingAsset[]>([]);
  const [homeDraftHydrated, setHomeDraftHydrated] = useState(false);
  const [generationJob, setGenerationJob] = useState<GenerationJob | null>(null);
  const [pendingBuild, setPendingBuild] = useState<PendingBuilderBuild | null>(null);
  const [retryDraft, setRetryDraft] = useState<BuilderComposerDraft | null>(null);
  const [recoveringBuild, setRecoveringBuild] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const estimateKey = useMemo(
    () => JSON.stringify([selectedType, prompt.trim(), pendingAssets.length]),
    [pendingAssets.length, prompt, selectedType],
  );
  const estimatedCost = estimatedQuote?.key === estimateKey ? estimatedQuote.tokens : null;
  const contentLanguages = useMemo(
    () => availableBuilderContentLanguages(config?.content_languages),
    [config?.content_languages],
  );
  const generationActive = isActiveBuilderJob(generationJob);
  const billingStateUnresolved = generationJob?.status === "billing_error"
    && (generationJob.result === null || generationJob.result === undefined);
  const workspaceBusy = busy || recoveringBuild || generationActive || billingStateUnresolved;

  const rememberPendingBuild = useCallback((build: PendingBuilderBuild | null) => {
    pendingBuildMemoryRef.current = build;
    setPendingBuild(build);
  }, []);

  useEffect(() => {
    if (prefillAppliedRef.current || projectIdFromUrl || duplicateIdFromUrl) return;
    prefillAppliedRef.current = true;
    const prefill = readIntegrationPrefill(searchParams);
    const draft = readBuilderHomeDraft(persistenceScope);
    if (prefill.prompt) setPrompt(prefill.prompt);
    else if (draft?.prompt) setPrompt(draft.prompt);
    if (prefill.language) setSelectedContentLanguage(prefill.language);
    else if (draft?.contentLanguage) setSelectedContentLanguage(draft.contentLanguage);
    const supportedTypes: BuilderProjectType[] = ["website", "game", "3d", "hand_tracking", "camera", "education", "webapp", "platform", "dashboard", "custom"];
    if (prefill.type && supportedTypes.includes(prefill.type as BuilderProjectType)) {
      setSelectedType(prefill.type as BuilderProjectType);
    } else if (draft?.projectType) setSelectedType(draft.projectType);
    if (!prefill.prompt && draft?.attachmentNames.length) {
      setError(language === "kk"
        ? `Мәтін қалпына келтірілді. Қауіпсіздік үшін ${draft.attachmentNames.length} файлды қайта тіркеңіз.`
        : `Текст восстановлен. Из соображений безопасности прикрепите ${draft.attachmentNames.length} файл(а) заново.`);
    }
    setHomeDraftHydrated(true);
  }, [duplicateIdFromUrl, language, persistenceScope, projectIdFromUrl, searchParams]);

  useEffect(() => {
    if (!homeDraftHydrated || projectIdFromUrl || currentProject) return;
    writeBuilderHomeDraft({
      version: 1,
      prompt,
      projectType: selectedType,
      contentLanguage: selectedContentLanguage,
      attachmentNames: pendingAssets.map((item) => item.file.name),
      updatedAt: Date.now(),
    }, persistenceScope);
  }, [
    currentProject,
    homeDraftHydrated,
    pendingAssets,
    persistenceScope,
    projectIdFromUrl,
    prompt,
    selectedContentLanguage,
    selectedType,
  ]);

  useEffect(() => {
    setSelectedContentLanguage(current => normalizeBuilderContentLanguage(current, contentLanguages));
  }, [contentLanguages]);

  const replaceProject = useCallback((project: BuilderProject) => {
    setCurrentProject(project);
    setProjects(items => {
      const next = projectSummary(project);
      const index = items.findIndex(item => item.id === project.id);
      if (index === -1) return [next, ...items];
      return items.map(item => item.id === project.id ? next : item);
    });
  }, []);

  const loadProjects = useCallback(async () => {
    setProjectsLoading(true);
    try {
      const response = await builderApi.list();
      setProjects(response.items);
    } catch (requestError) {
      setError(builderErrorMessage(requestError, language));
    } finally {
      setProjectsLoading(false);
    }
  }, [language]);

  const loadVersions = useCallback(async (projectId: string) => {
    try {
      setVersions(await builderApi.versions(projectId));
    } catch {
      setVersions([]);
    }
  }, []);

  const openProject = useCallback(async (projectId: string, jobId?: string | null) => {
    setBusy(true);
    setError("");
    try {
      const project = await builderApi.get(projectId);
      replaceProject(project);
      await loadVersions(project.id);
      openedFromUrl.current = project.id;
      router.replace(builderWorkspaceHref(project.id, jobId), { scroll: false });
    } catch (requestError) {
      setError(builderErrorMessage(requestError, language));
    } finally {
      setBusy(false);
    }
  }, [language, loadVersions, replaceProject, router]);

  const announceGenerationUpdate = useCallback(() => {
    window.dispatchEvent(new Event(GENERATION_JOBS_UPDATED_EVENT));
    window.dispatchEvent(new Event(TOKEN_BALANCE_INVALIDATED_EVENT));
  }, []);

  const acceptBuilderJob = useCallback((projectId: string, job: GenerationJob) => {
    const stored = attachJobToPendingBuilderBuild(projectId, job.id, persistenceScope)
      ?? readPendingBuilderBuild(projectId, persistenceScope);
    const current = pendingBuildMemoryRef.current;
    rememberPendingBuild(stored ?? (
      current?.projectId === projectId ? { ...current, jobId: job.id } : null
    ));
    setGenerationJob(job);
    setRecoveringBuild(false);
    setError("");
    openedFromUrl.current = projectId;
    router.replace(builderWorkspaceHref(projectId, job.id), { scroll: false });
    announceGenerationUpdate();
  }, [announceGenerationUpdate, persistenceScope, rememberPendingBuild, router]);

  const followExistingBuilderJob = useCallback((
    projectId: string,
    job: GenerationJob,
    draft?: BuilderComposerDraft,
  ) => {
    if (draft) {
      writeBuilderComposerDraft(projectId, draft, persistenceScope);
      setRetryDraft(draft);
    }
    // A 409 active-resource conflict belongs to another enqueue (often a
    // second tab). Never bind our request/idempotency key to that job.
    clearPendingBuilderBuild(projectId, undefined, persistenceScope);
    rememberPendingBuild(null);
    setGenerationJob(job);
    setRecoveringBuild(false);
    setError(language === "kk"
      ? "Бұл жоба басқа қойындыда жасалып жатыр. Сол тапсырманы бақылап отырмыз; жаңа сұрауыңыз нобайда сақталды."
      : "Этот проект уже создаётся в другой вкладке. Мы следим за той задачей; ваш новый запрос сохранён в черновике.");
    openedFromUrl.current = projectId;
    router.replace(builderWorkspaceHref(projectId, job.id), { scroll: false });
    announceGenerationUpdate();
  }, [announceGenerationUpdate, language, persistenceScope, rememberPendingBuild, router]);

  useEffect(() => {
    let active = true;
    Promise.allSettled([builderApi.config(), builderApi.list()]).then(([configResult, projectsResult]) => {
      if (!active) return;
      if (configResult.status === "fulfilled") setConfig(configResult.value);
      if (projectsResult.status === "fulfilled") setProjects(projectsResult.value.items);
      else setError(builderErrorMessage(projectsResult.reason, language));
      setProjectsLoading(false);
    });
    return () => { active = false; };
  }, [language]);

  useEffect(() => {
    if (prompt.trim().length < 3) {
      setEstimatedQuote(null);
      return;
    }
    let active = true;
    const timer = window.setTimeout(() => {
      builderApi.estimate({
        mode: "generate",
        project_type: selectedType,
        prompt: prompt.trim(),
        media_count: pendingAssets.length,
      }).then(result => {
        if (active) setEstimatedQuote({ key: estimateKey, tokens: result.tokens });
      }).catch(() => {
        if (active) setEstimatedQuote(null);
      });
    }, 350);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [estimateKey, pendingAssets.length, prompt, selectedType]);

  useEffect(() => {
    if (!projectIdFromUrl) {
      closingProjectRef.current = null;
      openedFromUrl.current = null;
      return;
    }
    if (closingProjectRef.current === projectIdFromUrl || openedFromUrl.current === projectIdFromUrl || currentProject?.id === projectIdFromUrl) return;
    openProject(projectIdFromUrl, jobIdFromUrl);
  }, [currentProject?.id, jobIdFromUrl, openProject, projectIdFromUrl]);

  useEffect(() => {
    if (duplicateIdFromUrl || jobIdFromUrl) return;
    const signature = projectIdFromUrl ?? "builder-home";
    if (recoveryAttemptRef.current === signature) return;
    recoveryAttemptRef.current = signature;
    let active = true;

    const discoverOrReplay = async () => {
      let targetProjectId = projectIdFromUrl;
      if (!targetProjectId) {
        const localBuild = listPendingBuilderBuilds(persistenceScope)[0];
        if (localBuild) {
          router.replace(builderWorkspaceHref(localBuild.projectId, localBuild.jobId), { scroll: false });
          return;
        }
      }

      if (targetProjectId) {
        const localBuild = readPendingBuilderBuild(targetProjectId, persistenceScope);
        if (localBuild) {
          rememberPendingBuild(localBuild);
          if (localBuild.jobId) {
            router.replace(builderWorkspaceHref(targetProjectId, localBuild.jobId), { scroll: false });
            return;
          }
          setRecoveringBuild(true);
          try {
            // Reconcile the exact idempotency key before replaying. This
            // closes the lost-202 race where the worker has already advanced
            // the project version by the time the browser reloads.
            const status = await builderApi.buildStatus(
              targetProjectId,
              localBuild.payload,
              localBuild.idempotencyKey,
            );
            if (!active) return;
            const action = pendingBuildRecoveryAction(status.status);

            if (action === "apply") {
              if (!status.project) {
                throw new ApiRequestError(
                  "Completed Builder request did not include its project.",
                  502,
                  undefined,
                  API_ERROR_CODES.INVALID_RESPONSE,
                );
              }
              replaceProject(status.project);
              await loadVersions(targetProjectId);
              if (!active) return;
              clearBuilderComposerDraft(targetProjectId, persistenceScope);
              clearPendingBuilderBuild(targetProjectId, undefined, persistenceScope);
              rememberPendingBuild(null);
              setRetryDraft(null);
              setGenerationJob(null);
              setError("");
              recoveryAttemptRef.current = targetProjectId;
              router.replace(builderWorkspaceHref(targetProjectId), { scroll: false });
              announceGenerationUpdate();
              return;
            }

            if (action === "restore") {
              if (status.project) replaceProject(status.project);
              const draft: BuilderComposerDraft = {
                version: 1,
                message: localBuild.payload.prompt,
                assetIds: localBuild.payload.asset_ids,
                updatedAt: Date.now(),
              };
              writeBuilderComposerDraft(targetProjectId, draft, persistenceScope);
              clearPendingBuilderBuild(targetProjectId, undefined, persistenceScope);
              rememberPendingBuild(null);
              setRetryDraft(draft);
              setGenerationJob(null);
              setError(language === "kk"
                ? "Алдыңғы генерация аяқталмады. Сұрау қалпына келтірілді; оны өзгертіп қайта жіберуге болады."
                : "Предыдущая генерация не завершилась. Запрос восстановлен — его можно изменить и отправить снова.");
              recoveryAttemptRef.current = targetProjectId;
              router.replace(builderWorkspaceHref(targetProjectId), { scroll: false });
              announceGenerationUpdate();
              return;
            }

            if (action === "block") {
              if (!status.job_id) {
                throw new ApiRequestError(
                  "Billing-error recovery did not include its job identifier.",
                  502,
                  undefined,
                  API_ERROR_CODES.INVALID_RESPONSE,
                );
              }
              if (status.project) replaceProject(status.project);
              const terminalJob = await builderApi.buildJob(targetProjectId, status.job_id);
              if (!active) return;
              acceptBuilderJob(targetProjectId, terminalJob);
              setError(language === "kk"
                ? "Жоба мен монета есебі расталмады. Қайта жібермеңіз — әкімші тапсырма күйін тексеруі керек."
                : "Состояние проекта и учёт монет не подтверждены. Не отправляйте запрос повторно — администратору нужно проверить задачу.");
              recoveryAttemptRef.current = targetProjectId;
              return;
            }

            if (action === "wait") {
              const latest = await builderApi.latestBuild(targetProjectId, true);
              if (!active) return;
              if (latest) {
                acceptBuilderJob(targetProjectId, latest);
              } else {
                setError(language === "kk"
                  ? "Сервер алдыңғы сұраудың әлі орындалып жатқанын растады. Күйі келесі жаңартуда қалпына келеді."
                  : "Сервер подтвердил, что предыдущий запрос ещё выполняется. Статус восстановится при следующем обновлении.");
              }
              return;
            }

            const job = await builderApi.build(
              targetProjectId,
              localBuild.payload,
              localBuild.idempotencyKey,
            );
            if (active) acceptBuilderJob(targetProjectId, job);
          } catch (requestError) {
            if (active) {
              if (requestError instanceof ApiRequestError && requestError.status === 409) {
                try {
                  const latest = await builderApi.latestBuild(targetProjectId, true);
                  if (latest && active) {
                    followExistingBuilderJob(targetProjectId, latest, {
                      version: 1,
                      message: localBuild.payload.prompt,
                      assetIds: localBuild.payload.asset_ids,
                      updatedAt: Date.now(),
                    });
                    return;
                  }
                } catch {
                  // Keep the original recovery error below.
                }
              }
              setError(language === "kk"
                ? "Алдыңғы сұраудың күйін серверден нақтылау мүмкін болмады. Бетті жаңарту қауіпсіз — екінші рет ақы алынбайды."
                : "Не удалось уточнить статус предыдущего запроса. Страницу можно обновить безопасно — повторного списания не будет.");
              if (!uncertainTransport(requestError)) {
                setError(builderErrorMessage(requestError, language));
              }
            }
          } finally {
            if (active) setRecoveringBuild(false);
          }
          return;
        }

        try {
          // Include the latest terminal job as well: a refresh can race with
          // the worker finishing between the initial project GET and this call.
          const latest = await builderApi.latestBuild(targetProjectId, false);
          if (!active || !latest) return;
          if (latest.status === "failed" || latest.status === "cancelled") return;
          setGenerationJob(latest);
          router.replace(builderWorkspaceHref(targetProjectId, latest.id), { scroll: false });
        } catch {
          // Project loading still works when its latest job cannot be queried.
        }
        return;
      }

      try {
        const history = await listGenerationJobs({
          kind: BUILDER_GENERATION_KIND,
          limit: 100,
          offset: 0,
        });
        if (!active) return;
        const matchingJob = history.items.find((job) => {
          if (!isActiveBuilderJob(job)) return false;
          const jobProjectId = builderProjectIdFromJob(job);
          return targetProjectId ? jobProjectId === targetProjectId : Boolean(jobProjectId);
        });
        if (!matchingJob) return;
        targetProjectId = builderProjectIdFromJob(matchingJob);
        if (targetProjectId) {
          router.replace(builderWorkspaceHref(targetProjectId, matchingJob.id), { scroll: false });
        }
      } catch {
        // Project loading still works when history is temporarily unavailable.
      }
    };

    void discoverOrReplay();
    return () => { active = false; };
  }, [
    acceptBuilderJob,
    duplicateIdFromUrl,
    jobIdFromUrl,
    language,
    loadVersions,
    followExistingBuilderJob,
    persistenceScope,
    projectIdFromUrl,
    rememberPendingBuild,
    replaceProject,
    router,
    announceGenerationUpdate,
  ]);

  useEffect(() => {
    if (!jobIdFromUrl) {
      setGenerationJob((job) => isActiveBuilderJob(job) ? job : null);
      return;
    }
    let stopped = false;
    let timer: number | undefined;

    const poll = async () => {
      try {
        const job = await getGenerationJob(jobIdFromUrl);
        if (stopped) return;
        if (job.kind !== BUILDER_GENERATION_KIND) {
          setGenerationJob(null);
          setRecoveringBuild(false);
          setError(language === "kk"
            ? "Бұл тапсырма Vibe Coding бөліміне жатпайды."
            : "Эта задача не относится к Vibe Coding.");
          if (projectIdFromUrl) {
            recoveryAttemptRef.current = projectIdFromUrl;
            router.replace(builderWorkspaceHref(projectIdFromUrl), { scroll: false });
          } else {
            router.replace("/dashboard/ai/builder", { scroll: false });
          }
          return;
        }

        const jobProjectId = builderProjectIdFromJob(job);
        if (!jobProjectId) {
          setGenerationJob(null);
          setRecoveringBuild(false);
          setError(language === "kk"
            ? "Сервер тапсырманы тапты, бірақ жоба сілтемесі жоқ. Жобалар тізімінен ашып көріңіз."
            : "Сервер нашёл задачу, но в ней нет ссылки на проект. Откройте проект из списка.");
          if (projectIdFromUrl) {
            recoveryAttemptRef.current = projectIdFromUrl;
            router.replace(builderWorkspaceHref(projectIdFromUrl), { scroll: false });
          } else {
            router.replace("/dashboard/ai/builder", { scroll: false });
          }
          return;
        }
        if (projectIdFromUrl && !builderJobBelongsToProject(job, projectIdFromUrl)) {
          // Never let a valid job for project B drive project A merely because
          // both identifiers were combined manually in the address bar.
          setGenerationJob(null);
          setRecoveringBuild(false);
          setError(language === "kk"
            ? "Тапсырма басқа жобаға тиесілі. Дұрыс жобаға ауыстырып жатырмыз."
            : "Задача относится к другому проекту. Открываем правильный проект.");
          router.replace(builderWorkspaceHref(jobProjectId, job.id), { scroll: false });
          return;
        }

        if (pollTransportErrorRef.current) {
          pollTransportErrorRef.current = false;
          setError("");
        }

        setGenerationJob(job);
        setRecoveringBuild(false);
        const targetProjectId = jobProjectId;
        if (targetProjectId !== projectIdFromUrl) {
          router.replace(builderWorkspaceHref(targetProjectId, job.id), { scroll: false });
        }

        const memoryBuild = pendingBuildMemoryRef.current;
        const stored = readPendingBuilderBuild(targetProjectId, persistenceScope)
          ?? (memoryBuild?.projectId === targetProjectId ? memoryBuild : null);
        if (stored && (
          !memoryBuild
          || memoryBuild.projectId !== stored.projectId
          || memoryBuild.jobId !== stored.jobId
          || memoryBuild.idempotencyKey !== stored.idempotencyKey
        )) rememberPendingBuild(stored);
        if (isActiveBuilderJob(job)) {
          timer = window.setTimeout(poll, 1_500);
          return;
        }

        if (
          (job.status === "billing_error" || job.status === "completed")
          && (job.result === null || job.result === undefined)
        ) {
          setError(language === "kk"
            ? "Жобаны сақтау мен монета есебі расталмады. Қайта жібермеңіз — әкімші тапсырма күйін тексеруі керек."
            : "Сохранение проекта и учёт монет не подтверждены. Не отправляйте запрос повторно — администратору нужно проверить задачу.");
          announceGenerationUpdate();
          return;
        }

        if (job.status === "completed" || job.status === "billing_error") {
          try {
            const [latestProject, latestVersions] = await Promise.all([
              builderApi.get(targetProjectId),
              builderApi.versions(targetProjectId),
            ]);
            if (stopped) return;
            replaceProject(latestProject);
            setVersions(latestVersions);
            clearPendingBuilderBuild(targetProjectId, job.id, persistenceScope);
            rememberPendingBuild(null);
            setRetryDraft(null);
            setGenerationJob(null);
            setError(job.status === "billing_error"
              ? language === "kk"
                ? "Жоба сақталды, бірақ монета есебін әкімші тексеруі керек."
                : "Проект сохранён, но администратору нужно проверить учёт монет."
              : "");
            recoveryAttemptRef.current = targetProjectId;
            router.replace(builderWorkspaceHref(targetProjectId), { scroll: false });
            announceGenerationUpdate();
          } catch (requestError) {
            if (!stopped) setError(builderErrorMessage(requestError, language));
          }
          return;
        }

        if (stored) {
          const draft: BuilderComposerDraft = {
            version: 1,
            message: stored.payload.prompt,
            assetIds: stored.payload.asset_ids,
            updatedAt: Date.now(),
          };
          writeBuilderComposerDraft(targetProjectId, draft, persistenceScope);
          setRetryDraft(draft);
        }
        clearPendingBuilderBuild(targetProjectId, job.id, persistenceScope);
        rememberPendingBuild(null);
        setError(job.status === "cancelled"
          ? language === "kk"
            ? "Генерация тоқтатылды. Сұрау қалпына келтірілді, оны өзгертіп қайта жіберуге болады."
            : "Генерация остановлена. Запрос восстановлен — его можно изменить и отправить снова."
          : language === "kk"
            ? "Жобаны жасау аяқталмады. Монеталар автоматты түрде қайтарылады; сұрауды қайта жіберуге болады."
            : "Не удалось завершить проект. Монеты вернутся автоматически; запрос можно отправить снова.");
        announceGenerationUpdate();
      } catch (requestError) {
        if (stopped) return;
        if (isUnavailableGenerationJobError(requestError)) {
          if (projectIdFromUrl) {
            clearPendingBuilderBuild(projectIdFromUrl, jobIdFromUrl, persistenceScope);
            rememberPendingBuild(null);
            recoveryAttemptRef.current = projectIdFromUrl;
            router.replace(builderWorkspaceHref(projectIdFromUrl), { scroll: false });
          } else {
            router.replace("/dashboard/ai/builder", { scroll: false });
          }
          setGenerationJob(null);
          setRecoveringBuild(false);
          setError(language === "kk"
            ? "Бұл генерация енді қолжетімді емес. Жоба сақталған болса, ол төменде ашылады."
            : "Эта генерация больше недоступна. Если проект был сохранён, он откроется ниже.");
          return;
        }
        setError(language === "kk"
          ? "Сервермен байланыс үзілді. Генерация серверде жалғасуда; байланыс қалпына келгенде күйі жаңартылады."
          : "Связь с сервером прервалась. Генерация продолжается на сервере; статус обновится после восстановления связи.");
        pollTransportErrorRef.current = true;
        timer = window.setTimeout(poll, 3_000);
      }
    };

    void poll();
    return () => {
      stopped = true;
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [
    announceGenerationUpdate,
    jobIdFromUrl,
    language,
    persistenceScope,
    projectIdFromUrl,
    rememberPendingBuild,
    replaceProject,
    router,
  ]);

  const addPendingFiles = (files: File[]) => {
    const maxBytes = config?.max_asset_bytes ?? 100 * 1024 * 1024;
    const accepted = files.filter(file => file.size <= maxBytes);
    if (pendingAssets.length + accepted.length > 12) {
      setError(language === "kk" ? "Бір генерацияға ең көбі 12 файл тіркеуге болады." : "К одной генерации можно прикрепить не больше 12 файлов.");
    } else if (accepted.length !== files.length) {
      setError(language === "kk" ? `Файл өлшемі ${Math.round(maxBytes / 1024 / 1024)} МБ-тан аспауы керек.` : `Размер файла не должен превышать ${Math.round(maxBytes / 1024 / 1024)} МБ.`);
    } else setError("");
    setPendingAssets(existing => [
      ...existing,
      ...accepted.map(file => ({ id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2)}`, file })),
    ].slice(0, 12));
  };

  const createProject = async () => {
    const trimmed = prompt.trim();
    if (trimmed.length < 3 || estimatedCost === null || workspaceBusy || mutationLockRef.current) return;
    mutationLockRef.current = true;
    setBusy(true);
    setError("");
    let createdProject: BuilderProject | null = null;
    let buildRecord: PendingBuilderBuild | null = null;
    try {
      let project = await builderApi.create({
        title: titleFromPrompt(trimmed, language),
        description: trimmed.slice(0, 4000),
        project_type: selectedType,
        content_language: selectedContentLanguage,
      });
      createdProject = project;
      writeBuilderComposerDraft(project.id, {
        version: 1,
        message: trimmed,
        assetIds: [],
        unuploadedAttachmentNames: pendingAssets.map((item) => item.file.name),
        updatedAt: Date.now(),
      }, persistenceScope);
      replaceProject(project);
      openedFromUrl.current = project.id;
      router.replace(builderWorkspaceHref(project.id), { scroll: false });
      clearBuilderHomeDraft(persistenceScope);
      const uploadedIds: string[] = [];
      for (const [index, pending] of pendingAssets.entries()) {
        const asset = await builderApi.uploadAsset(project.id, pending.file);
        uploadedIds.push(asset.id);
        writeBuilderComposerDraft(project.id, {
          version: 1,
          message: trimmed,
          assetIds: uploadedIds,
          unuploadedAttachmentNames: pendingAssets.slice(index + 1).map((item) => item.file.name),
          updatedAt: Date.now(),
        }, persistenceScope);
      }
      if (uploadedIds.length > 0) project = await builderApi.get(project.id);
      createdProject = project;
      replaceProject(project);
      const payload = {
        prompt: trimmed,
        expected_version: project.current_version,
        expected_revision: project.revision,
        asset_ids: uploadedIds,
        mode: "generate",
        max_cost: estimatedCost,
      } as const;
      buildRecord = {
        version: 1,
        projectId: project.id,
        idempotencyKey: createIdempotencyKey(),
        payload,
        createdAt: Date.now(),
      };
      writePendingBuilderBuild(buildRecord, persistenceScope);
      rememberPendingBuild(buildRecord);
      const job = await builderApi.build(
        project.id,
        buildRecord.payload,
        buildRecord.idempotencyKey,
      );
      acceptBuilderJob(project.id, job);
      setPrompt("");
      setPendingAssets([]);
    } catch (requestError) {
      if (createdProject) {
        try {
          const latest = await builderApi.get(createdProject.id);
          replaceProject(latest);
          openedFromUrl.current = latest.id;
          router.replace(builderWorkspaceHref(latest.id, buildRecord?.jobId), { scroll: false });
          await loadVersions(latest.id);
          if (buildRecord && uncertainTransport(requestError)) {
            setError(language === "kk"
              ? "Сервер жауабы алынбады. Жоба мен сұрау сақталды: бетті жаңартуға болады, екінші рет ақы алынбайды."
              : "Ответ сервера не получен. Проект и запрос сохранены: страницу можно обновить, повторного списания не будет.");
          } else {
            if (buildRecord) {
              clearPendingBuilderBuild(latest.id, undefined, persistenceScope);
              rememberPendingBuild(null);
            }
            setError(builderErrorMessage(requestError, language));
          }
        } catch {
          setError(builderErrorMessage(requestError, language));
          await loadProjects();
        }
      } else {
        setError(builderErrorMessage(requestError, language));
        await loadProjects();
      }
    } finally {
      mutationLockRef.current = false;
      setBusy(false);
    }
  };

  const backToProjects = () => {
    if (currentProject) closingProjectRef.current = currentProject.id;
    setCurrentProject(null);
    setVersions([]);
    setError("");
    router.replace("/dashboard/ai/builder", { scroll: false });
    loadProjects();
  };

  const build = async (message: string, mode: BuilderBuildMode, assetIds: string[], runtimeErrors: string[], maxCost: number) => {
    if (!currentProject || workspaceBusy || saving || mutationLockRef.current) return false;
    mutationLockRef.current = true;
    setBusy(true);
    setError("");
    const baseline = currentProject;
    const payload = {
      prompt: message,
      expected_version: baseline.current_version,
      expected_revision: baseline.revision,
      asset_ids: assetIds,
      mode,
      errors: runtimeErrors.slice(0, 30),
      max_cost: maxCost,
    };
    const previous = readPendingBuilderBuild(baseline.id, persistenceScope);
    if (previous?.jobId) {
      router.replace(builderWorkspaceHref(baseline.id, previous.jobId), { scroll: false });
      setError(language === "kk"
        ? "Алдыңғы генерация әлі тексеріліп жатыр. Оның күйі осы бетте автоматты түрде жаңартылады."
        : "Предыдущая генерация ещё проверяется. Её статус обновится на этой странице автоматически.");
      mutationLockRef.current = false;
      setBusy(false);
      return false;
    }

    const samePendingRequest = previous
      && JSON.stringify(previous.payload) === JSON.stringify(payload);
    if (previous && !samePendingRequest) {
      setError(language === "kk"
        ? "Алдыңғы сұраудың күйі әлі расталмады. Алдымен бетті жаңартып, сол сұрауды қалпына келтіріңіз."
        : "Статус предыдущего запроса ещё не подтверждён. Сначала обновите страницу, чтобы восстановить его.");
      mutationLockRef.current = false;
      setBusy(false);
      return false;
    }

    const record: PendingBuilderBuild = previous ?? {
      version: 1,
      projectId: baseline.id,
      idempotencyKey: createIdempotencyKey(),
      payload,
      createdAt: Date.now(),
    };
    writePendingBuilderBuild(record, persistenceScope);
    rememberPendingBuild(record);

    try {
      const job = await builderApi.build(
        baseline.id,
        record.payload,
        record.idempotencyKey,
      );
      acceptBuilderJob(baseline.id, job);
      return true;
    } catch (requestError) {
      if (requestError instanceof ApiRequestError && requestError.status === 409) {
        try {
          const latest = await builderApi.latestBuild(baseline.id, true);
          if (latest) {
            followExistingBuilderJob(baseline.id, latest, {
              version: 1,
              message: payload.prompt,
              assetIds: payload.asset_ids,
              updatedAt: Date.now(),
            });
            return false;
          }
        } catch {
          // Preserve the exact pending request for refresh recovery below.
        }
      }
      if (uncertainTransport(requestError)) {
        setError(language === "kk"
          ? "Сервер жауабы алынбады. Сұрау мен төлем кілті сақталды: бетті жаңартуға болады, екінші рет ақы алынбайды."
          : "Ответ сервера не получен. Запрос и платёжный ключ сохранены: страницу можно обновить, повторного списания не будет.");
      } else {
        clearPendingBuilderBuild(baseline.id, undefined, persistenceScope);
        rememberPendingBuild(null);
        setError(builderErrorMessage(requestError, language));
      }
      return false;
    } finally {
      mutationLockRef.current = false;
      setBusy(false);
    }
  };

  const saveFiles = async (files: Record<string, string | null>, message: string): Promise<boolean> => {
    if (!currentProject || workspaceBusy || saving || mutationLockRef.current) return false;
    mutationLockRef.current = true;
    setSaving(true);
    setError("");
    try {
      const project = await builderApi.saveFiles(currentProject.id, {
        files,
        expected_version: currentProject.current_version,
        expected_revision: currentProject.revision,
        message,
      });
      replaceProject(project);
      await loadVersions(project.id);
      return true;
    } catch (requestError) {
      setError(builderErrorMessage(requestError, language));
      return false;
    } finally {
      mutationLockRef.current = false;
      setSaving(false);
    }
  };

  const restoreVersion = async (version: number) => {
    if (!currentProject || workspaceBusy || saving || mutationLockRef.current) return;
    mutationLockRef.current = true;
    setBusy(true);
    setError("");
    try {
      const project = await builderApi.restore(currentProject.id, version, currentProject.current_version, currentProject.revision);
      replaceProject(project);
      await loadVersions(project.id);
    } catch (requestError) {
      setError(builderErrorMessage(requestError, language));
    } finally {
      mutationLockRef.current = false;
      setBusy(false);
    }
  };

  const uploadAsset = async (file: File): Promise<BuilderAsset | null> => {
    if (!currentProject || workspaceBusy || saving || mutationLockRef.current) return null;
    mutationLockRef.current = true;
    setSaving(true);
    setError("");
    try {
      const asset = await builderApi.uploadAsset(currentProject.id, file);
      const project = await builderApi.get(currentProject.id);
      replaceProject(project);
      return asset;
    } catch (requestError) {
      setError(builderErrorMessage(requestError, language));
      return null;
    } finally {
      mutationLockRef.current = false;
      setSaving(false);
    }
  };

  const removeAsset = async (assetId: string) => {
    if (!currentProject || workspaceBusy || saving || mutationLockRef.current) return;
    mutationLockRef.current = true;
    setSaving(true);
    setError("");
    try {
      await builderApi.removeAsset(currentProject.id, assetId);
      replaceProject(await builderApi.get(currentProject.id));
    } catch (requestError) {
      setError(builderErrorMessage(requestError, language));
    } finally {
      mutationLockRef.current = false;
      setSaving(false);
    }
  };

  const publish = async (visibility: BuilderVisibility, allowDuplicate: boolean): Promise<BuilderProject | null> => {
    if (!currentProject || workspaceBusy || saving || mutationLockRef.current) return null;
    mutationLockRef.current = true;
    setBusy(true);
    setError("");
    try {
      const project = visibility === "private"
        ? await builderApi.update(currentProject.id, { visibility, allow_duplicate: false })
        : await builderApi.publish(currentProject.id, visibility, allowDuplicate);
      replaceProject(project);
      return project;
    } catch (requestError) {
      setError(builderErrorMessage(requestError, language));
      return null;
    } finally {
      mutationLockRef.current = false;
      setBusy(false);
    }
  };

  const updateContentLanguage = async (contentLanguage: BuilderContentLanguage): Promise<boolean> => {
    if (!currentProject || workspaceBusy || saving || mutationLockRef.current) return false;
    const normalized = normalizeBuilderContentLanguage(contentLanguage, contentLanguages);
    if (normalized === normalizeBuilderContentLanguage(currentProject.content_language, contentLanguages)) return true;
    mutationLockRef.current = true;
    setSaving(true);
    setError("");
    try {
      replaceProject(await builderApi.update(currentProject.id, { content_language: normalized }));
      return true;
    } catch (requestError) {
      setError(builderErrorMessage(requestError, language));
      return false;
    } finally {
      mutationLockRef.current = false;
      setSaving(false);
    }
  };

  const duplicateProject = async (projectId: string) => {
    if (workspaceBusy || saving || mutationLockRef.current) return;
    mutationLockRef.current = true;
    setBusy(true);
    setError("");
    try {
      const project = await builderApi.duplicate(projectId);
      replaceProject(project);
      await openProject(project.id);
    } catch (requestError) {
      setError(builderErrorMessage(requestError, language));
    } finally {
      mutationLockRef.current = false;
      setBusy(false);
    }
  };

  const deleteProject = async (projectId: string) => {
    if (workspaceBusy || saving || mutationLockRef.current) return;
    const project = projects.find(item => item.id === projectId);
    const confirmed = window.confirm(language === "kk" ? `«${project?.title ?? "Жоба"}» жобасын жою керек пе?` : `Удалить проект «${project?.title ?? "Проект"}»?`);
    if (!confirmed) return;
    mutationLockRef.current = true;
    setBusy(true);
    setError("");
    try {
      await builderApi.remove(projectId);
      setProjects(items => items.filter(item => item.id !== projectId));
    } catch (requestError) {
      setError(builderErrorMessage(requestError, language));
    } finally {
      mutationLockRef.current = false;
      setBusy(false);
    }
  };

  const handleDownload = async (format: "html" | "zip") => {
    if (!currentProject) return;
    setError("");
    try {
      await downloadProject(currentProject.id, format);
    } catch (requestError) {
      setError(builderErrorMessage(requestError, language));
    }
  };

  useEffect(() => {
    if (!duplicateIdFromUrl || duplicatedFromUrlRef.current === duplicateIdFromUrl) return;
    duplicatedFromUrlRef.current = duplicateIdFromUrl;
    let active = true;
    const duplicateSharedProject = async () => {
      if (mutationLockRef.current) return;
      mutationLockRef.current = true;
      setBusy(true);
      setError("");
      try {
        const project = await builderApi.duplicate(duplicateIdFromUrl);
        if (!active) return;
        replaceProject(project);
        openedFromUrl.current = project.id;
        router.replace(`/dashboard/ai/builder?project=${encodeURIComponent(project.id)}`, { scroll: false });
        await loadVersions(project.id);
      } catch (requestError) {
        if (active) {
          setError(builderErrorMessage(requestError, language));
          router.replace("/dashboard/ai/builder", { scroll: false });
        }
      } finally {
        mutationLockRef.current = false;
        if (active) setBusy(false);
      }
    };
    void duplicateSharedProject();
    return () => { active = false; };
  }, [duplicateIdFromUrl, language, loadVersions, replaceProject, router]);

  if (currentProject) {
    return (
      <BuilderStudio
        language={language}
        project={currentProject}
        versions={versions}
        config={config}
        busy={workspaceBusy}
        saving={saving}
        error={error}
        generationJob={generationJob}
        pendingPrompt={pendingBuild?.payload.prompt ?? ""}
        retryDraft={retryDraft}
        persistenceScope={persistenceScope}
        onBack={backToProjects}
        onBuild={build}
        onSaveFiles={saveFiles}
        onRestore={restoreVersion}
        onUploadAsset={uploadAsset}
        onRemoveAsset={removeAsset}
        onContentLanguageChange={updateContentLanguage}
        onPublish={publish}
        onDownload={handleDownload}
      />
    );
  }

  return (
    <BuilderHome
      language={language}
      projects={projects}
      projectsLoading={projectsLoading}
      config={config}
      estimatedCost={estimatedCost}
      prompt={prompt}
      selectedType={selectedType}
      selectedContentLanguage={selectedContentLanguage}
      contentLanguages={contentLanguages}
      pendingAssets={pendingAssets}
      busy={workspaceBusy}
      error={error}
      onPromptChange={setPrompt}
      onSelectType={setSelectedType}
      onSelectContentLanguage={setSelectedContentLanguage}
      onFiles={addPendingFiles}
      onRemovePending={id => setPendingAssets(items => items.filter(item => item.id !== id))}
      onCreate={createProject}
      onOpen={openProject}
      onDuplicate={duplicateProject}
      onDelete={deleteProject}
      onRefresh={loadProjects}
    />
  );
}
