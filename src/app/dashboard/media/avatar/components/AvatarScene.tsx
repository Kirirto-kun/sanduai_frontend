"use client";

import React, { useRef, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, Environment, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

interface AvatarModelProps {
  audioUrl?: string | null;
  isPlaying: boolean;
}

/**
 * Компонент модели аватара
 */
function AvatarModel({ audioUrl, isPlaying }: AvatarModelProps) {
  const { scene } = useGLTF("/models/avatar.glb");
  
  const headMesh = useRef<THREE.Mesh | null>(null);
  const morphName = useRef<string | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // 1. Инициализация: Ищем "голову" и морф для рта
  useEffect(() => {
    const candidates = ["mouthOpen", "jawOpen", "mouth_open", "A05_jaw_open", "viseme_aa"];
    const preferredMeshNames = ["Head", "head", "Face", "face", "Body", "body", "Avatar", "avatar"];
    const excludedMeshNames = ["Eye", "eye", "Hair", "hair", "Glasses", "glasses"];
    
    // Сначала ищем на предпочтительных мешах
    const meshes: Array<{ mesh: THREE.Mesh; name: string; priority: number }> = [];
    
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.morphTargetDictionary && child.morphTargetInfluences) {
        const meshName = child.name.toLowerCase();
        
        // Пропускаем исключенные меши
        if (excludedMeshNames.some((excluded) => meshName.includes(excluded.toLowerCase()))) {
          return;
        }
        
        const dict = child.morphTargetDictionary;
        const match = candidates.find((name) => name in dict);
        
        if (match) {
          // Определяем приоритет меша
          const priority = preferredMeshNames.findIndex((pref) => 
            meshName.includes(pref.toLowerCase())
          );
          
          meshes.push({
            mesh: child,
            name: match,
            priority: priority >= 0 ? priority : 999, // Низкий приоритет для непредпочтительных
          });
        }
      }
    });
    
    // Сортируем по приоритету и берем первый
    if (meshes.length > 0) {
      meshes.sort((a, b) => a.priority - b.priority);
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
  return <primitive object={scene} position={[0, -1.6, 0]} scale={1.2} />;
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

  useEffect(() => {
    const handleContextLost = (event: Event) => {
      event.preventDefault();
      console.error("[Avatar] WebGL context lost");
      setError("WebGL контекст потерян. Пожалуйста, обновите страницу.");
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
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-red-50 rounded-lg">
        <div className="text-center p-4">
          <p className="text-red-700 mb-2">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Обновить страницу
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: "100%", borderRadius: "16px", overflow: "hidden" }}>
      <Canvas 
        camera={{ position: [0, 0.2, 1.5], fov: 40 }}
        gl={{ 
          preserveDrawingBuffer: true,
          antialias: true,
          alpha: true,
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
        <Environment preset="city" />

        {/* Аватар */}
        <AvatarModel audioUrl={audioUrl} isPlaying={isPlaying} />

        {/* Управление (можно убрать в продакшене) */}
        <OrbitControls enableZoom={false} minPolarAngle={Math.PI / 3} maxPolarAngle={Math.PI / 2} />
      </Canvas>
    </div>
  );
}

// Предзагрузка модели для оптимизации
useGLTF.preload("/models/avatar.glb");
