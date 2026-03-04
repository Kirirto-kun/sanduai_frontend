"use client";

import React, { useRef, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, Environment } from "@react-three/drei";
import * as THREE from "three";

interface AvatarModelProps {
  audioUrl?: string | null;
  isPlaying: boolean;
}

/**
 * Компонент модели аватара
 */
function AvatarModel({ audioUrl, isPlaying }: AvatarModelProps) {
  const { scene } = useGLTF("/models/avatar_1.glb");
  
  const headMesh = useRef<THREE.Mesh | null>(null);
  const morphName = useRef<string | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // 1. Инициализация: Ищем "голову" и морф для рта (не брови)
  useEffect(() => {
    const mouthCandidates = [
      "jawOpen",
      "Jaw_Open",
      "mouthOpen",
      "Mouth_Open",
      "mouth_open",
      "mouthClose",
      "A05_jaw_open",
      "viseme_aa",
      "jaw_open",
    ];
    const preferredMeshNames = ["Head", "head", "Face", "face", "Body", "body", "Avatar", "avatar"];
    const excludedMeshNames = ["Eye", "eye", "Hair", "hair", "Glasses", "glasses"];
    const browSubstrings = ["brow", "eyebrow", "бров"];

    function isBrowLike(name: string): boolean {
      const lower = name.toLowerCase();
      return browSubstrings.some((sub) => lower.includes(sub));
    }

    function morphNamePriority(name: string): number {
      const lower = name.toLowerCase();
      if (lower.includes("jaw") || lower.includes("mouth")) return 0;
      if (lower.includes("viseme")) return 1;
      return 2;
    }

    const meshes: Array<{
      mesh: THREE.Mesh;
      name: string;
      meshPriority: number;
      morphPriority: number;
    }> = [];

    scene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.morphTargetDictionary && child.morphTargetInfluences) {
        const meshName = child.name.toLowerCase();

        if (process.env.NODE_ENV === "development") {
          const keys = Object.keys(child.morphTargetDictionary);
          if (keys.length > 0) {
            console.log(`[Avatar] Mesh "${child.name}" morphTargetDictionary:`, keys);
          }
        }

        if (excludedMeshNames.some((excluded) => meshName.includes(excluded.toLowerCase()))) {
          return;
        }

        const dict = child.morphTargetDictionary;
        for (const candidate of mouthCandidates) {
          if (!(candidate in dict)) continue;
          if (isBrowLike(candidate)) continue;
          const meshPriority =
            preferredMeshNames.findIndex((pref) => meshName.includes(pref.toLowerCase()));
          meshes.push({
            mesh: child,
            name: candidate,
            meshPriority: meshPriority >= 0 ? meshPriority : 999,
            morphPriority: morphNamePriority(candidate),
          });
          break;
        }
      }
    });

    if (meshes.length > 0) {
      meshes.sort(
        (a, b) =>
          a.meshPriority - b.meshPriority || a.morphPriority - b.morphPriority
      );
      const selected = meshes[0];
      headMesh.current = selected.mesh;
      morphName.current = selected.name;
      console.log(`[Avatar] Found mouth morph: ${selected.name} on mesh: ${selected.mesh.name}`);
    } else {
      console.warn("[Avatar] No mouth morph found on any suitable mesh");
    }
  }, [scene]);

  // 2. Инициализация Аудио: Создаем анализатор
  useEffect(() => {
    if (audioUrl && isPlaying) {
      const audio = new Audio(audioUrl);
      audio.crossOrigin = "anonymous"; // Важно для CORS
      audioRef.current = audio;
      
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContext();
      const source = ctx.createMediaElementSource(audio);
      const analyser = ctx.createAnalyser();
      
      analyser.fftSize = 64; // Минимальный размер для производительности
      source.connect(analyser);
      analyser.connect(ctx.destination);
      
      analyserRef.current = analyser;
      audioContextRef.current = ctx;
      
      audio.play().catch((e) => console.error("Auto-play prevented:", e));
      
      return () => {
        audio.pause();
        audio.src = "";
        if (audioContextRef.current && audioContextRef.current.state !== "closed") {
          audioContextRef.current.close();
        }
      };
    } else {
      // Остановка аудио при isPlaying = false
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close();
      }
      analyserRef.current = null;
    }
  }, [audioUrl, isPlaying]);

  // 3. Анимация (Loop): Обновляем рот каждый кадр
  useFrame(() => {
    if (!headMesh.current || !analyserRef.current || !morphName.current) return;
    
    // Проверяем, что меш все еще валиден
    if (!headMesh.current.morphTargetDictionary || !headMesh.current.morphTargetInfluences) {
      return;
    }

    try {
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);
      
      // Берем среднюю частоту голоса и нормализуем
      // Множитель 2.0 - для усиления амплитуды открытия рта
      let volume = (dataArray[5] / 255) * 2.0; 
      volume = Math.min(Math.max(volume, 0), 1); // Clamp 0..1

      const idx = headMesh.current.morphTargetDictionary[morphName.current];
      if (idx !== undefined && idx < headMesh.current.morphTargetInfluences.length) {
        const currentVal = headMesh.current.morphTargetInfluences[idx] || 0;
        
        // Плавная интерполяция (Lerp), чтобы рот не дергался
        headMesh.current.morphTargetInfluences[idx] = THREE.MathUtils.lerp(currentVal, volume, 0.5);
      }
    } catch (error) {
      // Игнорируем ошибки анимации, чтобы не ломать рендеринг
      console.warn("[Avatar] Error in lip-sync animation:", error);
    }
  });

  // Настройка позиции (опустить модель пониже и увеличить)
  return <primitive object={scene} position={[0, -2.0, 0]} scale={1.2} />;
}

interface AvatarSceneProps {
  audioUrl?: string | null;
  isPlaying: boolean;
}

/**
 * Основная сцена
 */
export function AvatarScene({ audioUrl, isPlaying }: AvatarSceneProps) {
  const [error, setError] = useState<string | null>(null);
  const [canvasKey, setCanvasKey] = useState(0);

  useEffect(() => {
    const handleContextLost = (event: Event) => {
      event.preventDefault();
      console.warn("[Avatar] WebGL context lost");
      setError("WebGL контекст потерян. Пожалуйста, попробуйте снова.");
    };

    const handleContextRestored = () => {
      console.log("[Avatar] WebGL context restored");
      setError(null);
    };

    // Добавляем обработчики для восстановления контекста
    const canvas = document.querySelector("canvas");
    if (canvas) {
      canvas.addEventListener("webglcontextlost", handleContextLost);
      canvas.addEventListener("webglcontextrestored", handleContextRestored);
    }

    return () => {
      if (canvas) {
        canvas.removeEventListener("webglcontextlost", handleContextLost);
        canvas.removeEventListener("webglcontextrestored", handleContextRestored);
      }
    };
  }, [canvasKey]);

  const handleRetry = () => {
    setError(null);
    setCanvasKey((k) => k + 1);
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-red-50 rounded-lg">
        <div className="text-center p-4">
          <p className="text-red-700 mb-2">{error}</p>
          <button
            onClick={handleRetry}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: "100%", borderRadius: "16px", overflow: "hidden" }}>
      <Canvas
        key={canvasKey}
        camera={{ position: [0, 0.2, 1.5], fov: 40 }}
        gl={{
          preserveDrawingBuffer: true,
          antialias: true,
          alpha: true,
          powerPreference: "low-power",
        }}
        onCreated={({ gl }) => {
          // Настройка для предотвращения потери контекста
          gl.domElement.addEventListener("webglcontextlost", (e) => {
            e.preventDefault();
          });
        }}
      >
        {/* Свет */}
        <ambientLight intensity={0.7} />
        <directionalLight position={[2, 2, 5]} intensity={1.5} />
        <spotLight position={[-2, 4, 2]} intensity={1} />

        {/* Окружение (красивые блики на очках) */}
        <Environment preset="studio" />

        {/* Аватар */}
        <AvatarModel audioUrl={audioUrl} isPlaying={isPlaying} />
      </Canvas>
    </div>
  );
}

// Предзагрузка модели для оптимизации
useGLTF.preload("/models/avatar_1.glb");
