# Ybyrai Avatar Components

## Компоненты

- **YbyraiScene**: Three.js сцена с настройками освещения и камеры
- **YbyraiAvatar**: 3D модель аватара с анимациями (idle, speaking, lip sync)
- **AudioRecorder**: Компонент для записи аудио через MediaRecorder API
- **SpeechBubble**: Компонент для отображения субтитров ответа

## Интеграция Ready Player Me

Для полноценной работы с lip sync необходимо:

1. Загрузить GLB модель аватара из Ready Player Me
2. Использовать библиотеку для анализа аудио и генерации visemes (например, `ovr-lipsync` или аналогичную)
3. Применить visemes к blendshapes аватара

Пример интеграции:

```typescript
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

function YbyraiAvatar({ audioUrl, isSpeaking }) {
  const { scene } = useGLTF("/ybyrai-avatar.glb");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const visemeDataRef = useRef<Float32Array | null>(null);

  useEffect(() => {
    if (audioUrl && isSpeaking) {
      // Load audio and analyze for visemes
      // Apply visemes to avatar blendshapes
      // This requires a lip sync library compatible with Ready Player Me
    }
  }, [audioUrl, isSpeaking]);

  return <primitive object={scene} />;
}
```

**Примечание:** Для production рекомендуется использовать специализированные библиотеки для lip sync, такие как:
- OVR LipSync (если доступна JS версия)
- Rhubarb Lip Sync
- Или другие решения, совместимые с Ready Player Me blendshapes

## Текущая реализация

Сейчас используется placeholder-геометрия с базовой симуляцией lip sync.
Для production необходимо заменить на реальную модель Ready Player Me.
