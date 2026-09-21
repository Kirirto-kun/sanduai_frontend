"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { HandLandmarker, HandLandmarkerResult } from "@mediapipe/tasks-vision";
import { getApiBase } from "@/lib/api-base";
import { BUILDER_THREE_RUNTIME_PATH, compilePreview, needsThreeRuntime } from "./preview";
import type { BuilderAsset, BuilderConsoleEntry, BuilderDevice } from "./types";

type PreviewFrameProps = {
  files: Record<string, string>;
  assets?: BuilderAsset[];
  device: BuilderDevice;
  language: "ru" | "kk";
  refreshKey: number;
  onConsole: (entry: BuilderConsoleEntry) => void;
};

type AllowedAsset = { id: string; url: string; mimeType: string };

const DEVICE_WIDTH: Record<BuilderDevice, string> = {
  mobile: "390px",
  tablet: "768px",
  desktop: "100%",
};
const MAX_ASSET_REQUESTS = 24;
const MAX_ACTIVE_ASSET_REQUESTS = 3;
const MAX_ASSET_RESPONSE_BYTES = 110 * 1024 * 1024;
const MAX_ASSET_SESSION_BYTES = 220 * 1024 * 1024;
const ASSET_TIMEOUT_MS = 30_000;
const MEDIAPIPE_WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.32/wasm";
const HAND_MODEL_URL = "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";
const MAX_THREE_RUNTIME_BYTES = 2 * 1024 * 1024;

let threeRuntimePromise: Promise<string> | null = null;

function loadThreeRuntime(): Promise<string> {
  if (!threeRuntimePromise) {
    threeRuntimePromise = fetch(BUILDER_THREE_RUNTIME_PATH, {
      cache: "force-cache",
      credentials: "same-origin",
      referrerPolicy: "no-referrer",
    }).then(async response => {
      if (!response.ok) throw new Error("Three.js runtime could not be loaded");
      const declared = Number(response.headers.get("content-length") ?? 0);
      if (declared > MAX_THREE_RUNTIME_BYTES) throw new Error("Three.js runtime is too large");
      const source = await response.text();
      if (
        source.length > MAX_THREE_RUNTIME_BYTES
        || !source.startsWith("/*! Three.js r169 (MIT)")
        || !source.includes("globalThis.THREE=Object.freeze")
      ) throw new Error("Three.js runtime failed integrity validation");
      return source;
    }).catch(error => {
      threeRuntimePromise = null;
      throw error;
    });
  }
  return threeRuntimePromise;
}

function randomChannel(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `preview-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function serializableHands(result: HandLandmarkerResult) {
  const point = (item: { x: number; y: number; z: number; visibility?: number }) => ({
    x: item.x,
    y: item.y,
    z: item.z,
    ...(typeof item.visibility === "number" ? { visibility: item.visibility } : {}),
  });
  return {
    landmarks: result.landmarks.map(hand => hand.map(point)),
    worldLandmarks: result.worldLandmarks.map(hand => hand.map(point)),
    handedness: result.handedness.map(hand => hand.map(category => ({
      index: category.index,
      score: category.score,
      categoryName: category.categoryName,
      displayName: category.displayName,
    }))),
  };
}

async function responseBlob(response: Response, limit: number): Promise<Blob> {
  const declared = Number(response.headers.get("content-length") ?? 0);
  if (declared > limit) throw new Error("Asset is too large");
  if (!response.body) {
    const blob = await response.blob();
    if (blob.size > limit) throw new Error("Asset is too large");
    return blob;
  }
  const reader = response.body.getReader();
  const chunks: ArrayBuffer[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > limit) throw new Error("Asset is too large");
      const copy = new Uint8Array(value.byteLength);
      copy.set(value);
      chunks.push(copy.buffer);
    }
  } catch (error) {
    await reader.cancel().catch(() => undefined);
    throw error;
  }
  return new Blob(chunks, { type: response.headers.get("content-type") ?? "application/octet-stream" });
}

export default function PreviewFrame({ files, assets = [], device, language, refreshKey, onConsole }: PreviewFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const portRef = useRef<MessagePort | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const frameLoopRef = useRef<number | null>(null);
  const lastFrameRef = useRef(0);
  const cameraEpochRef = useRef(0);
  const cameraStartingRef = useRef(false);
  const mountedRef = useRef(false);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const handLandmarkerPromiseRef = useRef<Promise<HandLandmarker> | null>(null);
  const assetControllersRef = useRef(new Map<string, AbortController>());
  const assetCacheRef = useRef(new Map<string, Blob>());
  const assetFetchesRef = useRef(new Map<string, Promise<Blob>>());
  const iframeLoadsRef = useRef(0);
  const onConsoleRef = useRef(onConsole);
  const [cameraPrompt, setCameraPrompt] = useState(false);
  const [cameraBusy, setCameraBusy] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [navigationBlocked, setNavigationBlocked] = useState(false);
  const [threeRuntimeSource, setThreeRuntimeSource] = useState("");
  const [threeRuntimeError, setThreeRuntimeError] = useState(false);
  const requiresThreeRuntime = useMemo(() => needsThreeRuntime(files), [files]);
  const runtimeReady = !requiresThreeRuntime || Boolean(threeRuntimeSource);
  const channel = useMemo(
    () => `${randomChannel()}-${refreshKey}-${Object.keys(files).length}-${runtimeReady ? "ready" : "pending"}`,
    [files, refreshKey, runtimeReady],
  );
  const srcDoc = useMemo(
    () => compilePreview(files, channel, requiresThreeRuntime ? threeRuntimeSource : ""),
    [channel, files, requiresThreeRuntime, threeRuntimeSource],
  );
  const apiBase = getApiBase();
  const allowedAssets = useMemo(() => {
    const result = new Map<string, AllowedAsset>();
    for (const asset of assets) {
      try {
        const entry = { id: asset.id, url: new URL(asset.storage_url, apiBase).href, mimeType: asset.mime_type };
        result.set(`sandu-asset:${asset.id}`, entry);
        // Existing projects can contain the old capability URL. It is accepted
        // only when it exactly matches a current project asset.
        result.set(entry.url, entry);
      } catch {
        // Invalid server data is never forwarded to the sandbox.
      }
    }
    return result;
  }, [apiBase, assets]);
  const allowedAssetsRef = useRef(allowedAssets);
  allowedAssetsRef.current = allowedAssets;
  onConsoleRef.current = onConsole;

  useEffect(() => {
    let active = true;
    setThreeRuntimeError(false);
    if (!requiresThreeRuntime) {
      setThreeRuntimeSource("");
      return () => { active = false; };
    }
    void loadThreeRuntime().then(source => {
      if (active) setThreeRuntimeSource(source);
    }).catch(() => {
      if (active) {
        setThreeRuntimeSource("");
        setThreeRuntimeError(true);
      }
    });
    return () => { active = false; };
  }, [requiresThreeRuntime]);

  const postToPreview = useCallback((payload: Record<string, unknown>, transfer?: Transferable[]) => {
    try {
      portRef.current?.postMessage({ ...payload, channel }, transfer ?? []);
    } catch {
      // The preview may have navigated or reloaded between two animation frames.
    }
  }, [channel]);

  const stopCamera = useCallback(() => {
    cameraEpochRef.current += 1;
    cameraStartingRef.current = false;
    if (frameLoopRef.current !== null) cancelAnimationFrame(frameLoopRef.current);
    frameLoopRef.current = null;
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    videoRef.current = null;
    setCameraActive(false);
    setCameraBusy(false);
    setCameraPrompt(false);
  }, []);

  const getHandLandmarker = useCallback(async () => {
    if (handLandmarkerRef.current) return handLandmarkerRef.current;
    if (!handLandmarkerPromiseRef.current) {
      handLandmarkerPromiseRef.current = import("@mediapipe/tasks-vision").then(async ({ FilesetResolver, HandLandmarker }) => {
        const vision = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_URL);
        const detector = await HandLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: HAND_MODEL_URL },
          runningMode: "VIDEO",
          numHands: 2,
          minHandDetectionConfidence: 0.45,
          minHandPresenceConfidence: 0.45,
          minTrackingConfidence: 0.45,
        });
        if (!mountedRef.current) {
          detector.close();
          throw new Error("Camera initialization was cancelled");
        }
        handLandmarkerRef.current = detector;
        return detector;
      }).catch(error => {
        handLandmarkerPromiseRef.current = null;
        throw error;
      });
    }
    return handLandmarkerPromiseRef.current;
  }, []);

  const beginFrameLoop = useCallback((video: HTMLVideoElement, detector: HandLandmarker) => {
    const sendFrame = (time: number) => {
      frameLoopRef.current = requestAnimationFrame(sendFrame);
      if (time - lastFrameRef.current < 66 || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;
      lastFrameRef.current = time;
      try {
        const result = serializableHands(detector.detectForVideo(video, time));
        postToPreview({
          type: "sandu-camera-frame",
          result,
          width: video.videoWidth,
          height: video.videoHeight,
          timestamp: time,
        });
      } catch {
        // A frame can be skipped while the camera or detector changes state.
      }
    };
    frameLoopRef.current = requestAnimationFrame(sendFrame);
  }, [postToPreview]);

  const enableCamera = useCallback(async () => {
    if (cameraStartingRef.current || streamRef.current) return;
    cameraStartingRef.current = true;
    const operation = cameraEpochRef.current + 1;
    cameraEpochRef.current = operation;
    const isCurrent = () => mountedRef.current && cameraEpochRef.current === operation;
    setCameraBusy(true);
    setCameraError("");
    let acquiredStream: MediaStream | null = null;
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("unsupported");
      acquiredStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      if (!isCurrent()) {
        acquiredStream.getTracks().forEach(track => track.stop());
        return;
      }
      // Take ownership immediately so every later failure stops the hardware.
      streamRef.current = acquiredStream;
      const video = document.createElement("video");
      video.muted = true;
      video.playsInline = true;
      video.srcObject = acquiredStream;
      videoRef.current = video;
      await video.play();
      if (!isCurrent()) {
        acquiredStream.getTracks().forEach(track => track.stop());
        video.srcObject = null;
        return;
      }
      const detector = await getHandLandmarker();
      if (!isCurrent()) {
        acquiredStream.getTracks().forEach(track => track.stop());
        video.srcObject = null;
        return;
      }
      setCameraPrompt(false);
      setCameraActive(true);
      postToPreview({ type: "sandu-camera-status", ok: true, width: video.videoWidth, height: video.videoHeight });
      beginFrameLoop(video, detector);
    } catch {
      acquiredStream?.getTracks().forEach(track => track.stop());
      if (streamRef.current === acquiredStream) streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
      videoRef.current = null;
      if (!isCurrent()) return;
      setCameraActive(false);
      const message = language === "kk"
        ? "Камера ашылмады. Браузер баптауларынан рұқсат беріп, қайта көріңіз."
        : "Не удалось открыть камеру. Разрешите доступ в настройках браузера и попробуйте снова.";
      setCameraError(message);
      postToPreview({ type: "sandu-camera-status", ok: false, message });
    } finally {
      if (isCurrent()) {
        cameraStartingRef.current = false;
        setCameraBusy(false);
      }
    }
  }, [beginFrameLoop, getHandLandmarker, language, postToPreview]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      cameraEpochRef.current += 1;
      handLandmarkerRef.current?.close();
      handLandmarkerRef.current = null;
      handLandmarkerPromiseRef.current = null;
    };
  }, []);

  useEffect(() => {
    const assetControllers = assetControllersRef.current;
    const assetCache = assetCacheRef.current;
    const assetFetches = assetFetchesRef.current;
    const deliveryCounts = new Map<string, number>();
    let assetRequestCount = 0;
    let cachedBytes = 0;
    let deliveredBytes = 0;
    const hostSession = randomChannel();
    iframeLoadsRef.current = 0;
    setNavigationBlocked(false);
    portRef.current?.close();
    portRef.current = null;
    assetControllers.forEach(controller => controller.abort());
    assetControllers.clear();
    assetCache.clear();
    assetFetches.clear();
    stopCamera();

    const loadAsset = (asset: AllowedAsset): Promise<Blob> => {
      const cached = assetCache.get(asset.id);
      if (cached) return Promise.resolve(cached);
      const active = assetFetches.get(asset.id);
      if (active) return active;
      if (assetControllers.size >= MAX_ACTIVE_ASSET_REQUESTS) {
        return Promise.reject(new Error("Too many concurrent asset requests"));
      }
      const controller = new AbortController();
      assetControllers.set(asset.id, controller);
      const timer = window.setTimeout(() => controller.abort(), ASSET_TIMEOUT_MS);
      const request = fetch(asset.url, {
        cache: "no-store",
        credentials: "omit",
        referrerPolicy: "no-referrer",
        signal: controller.signal,
      }).then(async response => {
        if (!response.ok) throw new Error("Asset could not be loaded");
        const blob = await responseBlob(response, MAX_ASSET_RESPONSE_BYTES);
        if (cachedBytes + blob.size > MAX_ASSET_SESSION_BYTES) {
          throw new Error("Preview asset budget exceeded");
        }
        cachedBytes += blob.size;
        assetCache.set(asset.id, blob);
        return blob;
      }).finally(() => {
        window.clearTimeout(timer);
        assetControllers.delete(asset.id);
        assetFetches.delete(asset.id);
      });
      assetFetches.set(asset.id, request);
      return request;
    };

    const proxyAsset = async (requestId: string, rawReference: unknown) => {
      try {
        assetRequestCount += 1;
        if (assetRequestCount > MAX_ASSET_REQUESTS) throw new Error("Asset request limit reached");
        const asset = allowedAssetsRef.current.get(String(rawReference));
        if (!asset) throw new Error("Asset is not part of this project");
        const blob = await loadAsset(asset);
        const delivered = deliveryCounts.get(asset.id) ?? 0;
        if (delivered >= 3) throw new Error("Asset delivery limit reached");
        if (deliveredBytes + blob.size > MAX_ASSET_SESSION_BYTES) throw new Error("Preview delivery budget exceeded");
        deliveryCounts.set(asset.id, delivered + 1);
        deliveredBytes += blob.size;
        const buffer = await blob.arrayBuffer();
        postToPreview({ type: "sandu-asset-result", requestId, ok: true, buffer }, [buffer]);
      } catch (requestError) {
        postToPreview({
          type: "sandu-asset-result",
          requestId,
          ok: false,
          message: requestError instanceof Error ? requestError.message : "Asset unavailable",
        });
      }
    };

    const onPortMessage = (message: MessageEvent, sourcePort: MessagePort) => {
      const data = message.data;
      if (!data || data.channel !== channel || typeof data.type !== "string") return;
      if (data.type === "sandu-ping" && Number.isSafeInteger(data.pingId)) {
        if (portRef.current === sourcePort) {
          sourcePort.postMessage({ type: "sandu-pong", channel, pingId: data.pingId });
        }
      } else if (data.type === "sandu-console") {
        const level = (["log", "warn", "error"].includes(data.level) ? data.level : "log") as BuilderConsoleEntry["level"];
        onConsoleRef.current({
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          level,
          message: String(data.message ?? ""),
          createdAt: Date.now(),
        });
      } else if (data.type === "sandu-camera-start") {
        setCameraError("");
        if (streamRef.current) postToPreview({ type: "sandu-camera-status", ok: true });
        else setCameraPrompt(true);
      } else if (data.type === "sandu-camera-stop") {
        stopCamera();
      } else if (data.type === "sandu-asset-request" && typeof data.requestId === "string") {
        void proxyAsset(data.requestId, data.reference);
      }
    };

    const onBootstrap = (event: MessageEvent) => {
      if (
        event.source !== iframeRef.current?.contentWindow
        || event.data?.type !== "sandu-bootstrap"
        || event.data?.channel !== channel
        || typeof event.data?.bootstrapId !== "string"
        || !event.data.bootstrapId.startsWith(`${channel}:`)
        || !/^\d{1,10}$/.test(event.data.bootstrapId.slice(channel.length + 1))
        || event.ports.length !== 1
      ) return;
      const port = event.ports[0];
      portRef.current?.close();
      portRef.current = port;
      port.onmessage = message => onPortMessage(message, port);
      port.onmessageerror = () => {
        if (portRef.current === port) {
          port.close();
          portRef.current = null;
        }
      };
      port.start();
      port.postMessage({ type: "sandu-connected", channel, bootstrapId: event.data.bootstrapId, hostSession });
    };
    const onFullscreen = () => setIsFullscreen(document.fullscreenElement === shellRef.current);
    const onVisibility = () => { if (document.hidden) stopCamera(); };
    window.addEventListener("message", onBootstrap);
    document.addEventListener("fullscreenchange", onFullscreen);
    document.addEventListener("visibilitychange", onVisibility);
    iframeRef.current?.contentWindow?.postMessage({ type: "sandu-reconnect", channel }, "*");
    return () => {
      window.removeEventListener("message", onBootstrap);
      document.removeEventListener("fullscreenchange", onFullscreen);
      document.removeEventListener("visibilitychange", onVisibility);
      portRef.current?.close();
      portRef.current = null;
      assetControllers.forEach(controller => controller.abort());
      assetControllers.clear();
      assetCache.clear();
      assetFetches.clear();
      stopCamera();
    };
  }, [channel, postToPreview, stopCamera]);

  const toggleFullscreen = async () => {
    if (!shellRef.current) return;
    if (document.fullscreenElement) await document.exitFullscreen();
    else await shellRef.current.requestFullscreen();
  };

  const onFrameLoad = () => {
    iframeLoadsRef.current += 1;
    if (iframeLoadsRef.current > 1) {
      // Chromium's Navigation API guard in the bridge cancels direct
      // self-navigation before it starts. CSP, sandboxing, and DOM guards cover
      // the remaining browser paths; this load detector is the final fallback
      // for engines that do not yet expose a cancellable navigation event.
      portRef.current?.close();
      portRef.current = null;
      stopCamera();
      setNavigationBlocked(true);
    }
  };

  const hasPreview = Boolean(files["index.html"] || Object.keys(files).some(path => path.endsWith(".html")));

  return (
    <div ref={shellRef} className={`relative flex h-full min-h-0 flex-col bg-[#eef1f5] ${isFullscreen ? "p-4" : ""}`}>
      <div className="absolute right-3 top-3 z-10 flex items-center gap-1 rounded-xl border border-slate-200 bg-white/90 p-1 shadow-sm backdrop-blur">
        {cameraActive && (
          <button
            type="button"
            onClick={stopCamera}
            className="flex h-8 items-center gap-2 rounded-lg bg-red-50 px-3 text-xs font-bold text-red-700 transition hover:bg-red-100"
            aria-label={language === "kk" ? "Камераны тоқтату" : "Остановить камеру"}
          >
            <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" aria-hidden="true" />
            {language === "kk" ? "Камераны тоқтату" : "Остановить камеру"}
          </button>
        )}
        <button
          type="button"
          onClick={toggleFullscreen}
          aria-label={language === "kk" ? "Толық экран" : "Полный экран"}
          className="grid h-8 w-8 place-items-center rounded-lg text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
        >
          {isFullscreen ? "↙" : "⛶"}
        </button>
      </div>

      <div className="flex min-h-0 flex-1 items-stretch justify-center overflow-auto p-3 pt-12 sm:p-5 sm:pt-12">
        {navigationBlocked ? (
          <div role="alert" className="m-auto max-w-md rounded-3xl border border-amber-200 bg-white p-6 text-center shadow-sm">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-amber-100 text-xl">🛡️</div>
            <p className="mt-4 text-sm font-black text-slate-900">{language === "kk" ? "Сыртқы бетке өту бұғатталды" : "Переход на внешнюю страницу заблокирован"}</p>
            <p className="mt-2 text-xs leading-5 text-slate-500">{language === "kk" ? "Preview тек осы жобаның кодын орындауы керек. Кодты түзетіп, preview-ды жаңартыңыз." : "Preview должен выполнять только код этого проекта. Исправьте переход в коде и обновите preview."}</p>
          </div>
        ) : threeRuntimeError ? (
          <div role="alert" className="m-auto max-w-md rounded-3xl border border-red-200 bg-white p-6 text-center shadow-sm">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-red-100 text-xl">3D</div>
            <p className="mt-4 text-sm font-black text-slate-900">{language === "kk" ? "3D runtime жүктелмеді" : "Не удалось загрузить 3D runtime"}</p>
            <p className="mt-2 text-xs leading-5 text-slate-500">{language === "kk" ? "Бетті жаңартып, қайта көріңіз." : "Обновите страницу и попробуйте снова."}</p>
          </div>
        ) : hasPreview && !runtimeReady ? (
          <div role="status" className="m-auto max-w-sm text-center text-slate-500">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600" aria-hidden="true" />
            <p className="mt-4 text-sm font-semibold text-slate-700">
              {language === "kk" ? "3D runtime жүктелуде…" : "Загружаем 3D runtime…"}
            </p>
          </div>
        ) : hasPreview && runtimeReady ? (
          <div
            className="h-full min-h-[440px] overflow-hidden rounded-[18px] border border-slate-300 bg-white shadow-[0_22px_60px_rgba(15,23,42,0.16)] transition-[width] duration-300"
            style={{ width: DEVICE_WIDTH[device], maxWidth: "100%" }}
          >
            <iframe
              key={channel}
              ref={iframeRef}
              title={language === "kk" ? "Жоба көрінісі" : "Предпросмотр проекта"}
              srcDoc={srcDoc}
              sandbox="allow-scripts allow-pointer-lock"
              referrerPolicy="no-referrer"
              className="h-full min-h-[440px] w-full border-0 bg-white"
              onLoad={onFrameLoad}
            />
          </div>
        ) : (
          <div className="m-auto max-w-sm text-center text-slate-500">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-white text-2xl shadow-sm">◫</div>
            <p className="mt-4 text-sm font-semibold text-slate-700">
              {language === "kk" ? "Алдын ала көрініс осында ашылады" : "Здесь появится live preview"}
            </p>
            <p className="mt-1 text-xs leading-5">
              {language === "kk" ? "Жобаны жасау үшін чатқа тапсырма жазыңыз." : "Опишите задачу в чате, чтобы собрать проект."}
            </p>
          </div>
        )}
      </div>

      {cameraPrompt && (
        <div className="absolute inset-0 z-20 grid place-items-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <section role="dialog" aria-modal="true" aria-labelledby="camera-dialog-title" className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-100 text-2xl">📷</div>
            <h2 id="camera-dialog-title" className="mt-4 text-xl font-bold text-slate-950">
              {language === "kk" ? "Камераға рұқсат керек" : "Нужен доступ к камере"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {language === "kk"
                ? "Бұл жоба қол қимылын анықтау үшін камераны қолданады. Бейне preview ішіне де, SanduAI серверіне де жіберілмейді — preview тек қол нүктелерін алады."
                : "Проект использует камеру для распознавания движений рук. Видео не передаётся ни в preview, ни на сервер SanduAI — preview получает только координаты точек рук."}
            </p>
            {cameraError && <p role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">{cameraError}</p>}
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => { setCameraPrompt(false); postToPreview({ type: "sandu-camera-status", ok: false, message: "Permission cancelled" }); }} className="min-h-11 rounded-xl px-4 text-sm font-semibold text-slate-600 hover:bg-slate-100">
                {language === "kk" ? "Бас тарту" : "Не разрешать"}
              </button>
              <button type="button" onClick={enableCamera} disabled={cameraBusy} className="min-h-11 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60">
                {cameraBusy ? (language === "kk" ? "Қосылуда…" : "Подключаем…") : (language === "kk" ? "Камераны қосу" : "Включить камеру")}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
