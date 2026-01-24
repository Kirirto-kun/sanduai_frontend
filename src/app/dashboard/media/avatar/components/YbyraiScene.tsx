"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { YbyraiAvatar } from "./YbyraiAvatar";

interface YbyraiSceneProps {
  isSpeaking: boolean;
  responseText: string | null;
  audioUrl?: string | null;
}

export function YbyraiScene({ isSpeaking, responseText, audioUrl }: YbyraiSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<any>(null);
  const avatarGroupRef = useRef<THREE.Group | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setIsClient(true);

    if (!containerRef.current) return;

    // Initialize Three.js scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f4f8);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      50,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 1.6, 3);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight1.position.set(5, 5, 5);
    scene.add(directionalLight1);

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
    directionalLight2.position.set(-5, 5, -5);
    scene.add(directionalLight2);

    // Avatar group
    const avatarGroup = new THREE.Group();
    scene.add(avatarGroup);
    avatarGroupRef.current = avatarGroup;

    // Create placeholder avatar
    const createAvatar = () => {
      // Head
      const headGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
      const headMaterial = new THREE.MeshStandardMaterial({ color: 0xd4a574 });
      const head = new THREE.Mesh(headGeometry, headMaterial);
      head.position.set(0, 1.6, 0);
      avatarGroup.add(head);

      // Body
      const bodyGeometry = new THREE.BoxGeometry(0.5, 0.6, 0.3);
      const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x4a5568 });
      const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.position.set(0, 1.2, 0);
      avatarGroup.add(body);

      // Eyes
      const eyeGeometry = new THREE.SphereGeometry(0.03, 16, 16);
      const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
      
      const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
      leftEye.position.set(-0.08, 1.65, 0.16);
      avatarGroup.add(leftEye);

      const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
      rightEye.position.set(0.08, 1.65, 0.16);
      avatarGroup.add(rightEye);

      // Mouth
      const mouthGeometry = new THREE.BoxGeometry(0.08, 0.02, 0.01);
      const mouthMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
      const mouth = new THREE.Mesh(mouthGeometry, mouthMaterial);
      mouth.position.set(0, 1.55, 0.16);
      avatarGroup.add(mouth);

      // Glasses
      const glassesGeometry = new THREE.BoxGeometry(0.2, 0.08, 0.01);
      const glassesMaterial = new THREE.MeshStandardMaterial({
        color: 0x2d3748,
        opacity: 0.3,
        transparent: true,
      });
      const glasses = new THREE.Mesh(glassesGeometry, glassesMaterial);
      glasses.position.set(0, 1.65, 0.15);
      avatarGroup.add(glasses);

      return { head, mouth, leftEye, rightEye };
    };

    const avatarParts = createAvatar();

    // Simple orbit controls (manual implementation)
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      avatarGroup.rotation.y += deltaX * 0.01;
      camera.position.y += deltaY * 0.01;
      camera.position.y = Math.max(1, Math.min(2.5, camera.position.y));

      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY * 0.01;
      const distance = camera.position.distanceTo(new THREE.Vector3(0, 1.6, 0));
      const newDistance = Math.max(2, Math.min(5, distance + delta));
      camera.position.normalize().multiplyScalar(newDistance);
      camera.position.y = Math.max(1, Math.min(2.5, camera.position.y));
    };

    renderer.domElement.addEventListener("mousedown", onMouseDown);
    renderer.domElement.addEventListener("mousemove", onMouseMove);
    renderer.domElement.addEventListener("mouseup", onMouseUp);
    renderer.domElement.addEventListener("wheel", onWheel);

    // Animation loop
    const clock = new THREE.Clock();
    let mouthOpen = 0;

    const animate = () => {
      const elapsedTime = clock.getElapsedTime();

      // Breathing effect
      if (avatarParts.head) {
        const breathing = Math.sin(elapsedTime * 1.5) * 0.02;
        avatarParts.head.scale.y = 1 + breathing;
      }

      // Idle head movement
      avatarGroup.rotation.y = Math.sin(elapsedTime * 0.5) * 0.1;

      // Mouth animation during speaking
      if (isSpeaking && avatarParts.mouth) {
        mouthOpen = Math.sin(elapsedTime * 8) * 0.1 + 0.05;
        avatarParts.mouth.scale.y = 1 + mouthOpen;
        avatarParts.mouth.position.y = 1.55 + mouthOpen * 0.05;
      } else if (avatarParts.mouth) {
        avatarParts.mouth.scale.y = 1;
        avatarParts.mouth.position.y = 1.55;
      }

      // Blinking
      if (avatarParts.leftEye && avatarParts.rightEye) {
        const blink = Math.sin(elapsedTime * 0.5) < -0.9 ? 0.01 : 0.03;
        avatarParts.leftEye.scale.y = blink;
        avatarParts.rightEye.scale.y = blink;
      }

      renderer.render(scene, camera);
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current || !camera || !renderer) return;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };

    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      renderer.domElement.removeEventListener("mousedown", onMouseDown);
      renderer.domElement.removeEventListener("mousemove", onMouseMove);
      renderer.domElement.removeEventListener("mouseup", onMouseUp);
      renderer.domElement.removeEventListener("wheel", onWheel);
      window.removeEventListener("resize", handleResize);
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [isSpeaking, isClient]);

  if (!isClient) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-slate-600">Загрузка 3D сцены...</div>
      </div>
    );
  }

  return <div ref={containerRef} className="w-full h-full" />;
}
