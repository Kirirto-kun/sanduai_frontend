# КМЖ Frontend Spec

## Эндпоинты

| Method | URL | Описание |
|--------|-----|----------|
| POST | `/api/generate/kmzh` | Генерация плана → JSON |
| POST | `/api/generate/kmzh/docx` | JSON → DOCX файл |

---

## 1. Форма ввода → POST `/api/generate/kmzh`

### Request Body

```json
{
  "subject": "Математика",
  "grade": "4",
  "topic": "Қозғалысқа берілген есептер",
  "teacher_name": "Мукиева Оынгуль Аменовна",
  "section_name": "1(С)-бөлім Жылдамдық. Уақыт. Арақашықтық",
  "lesson_number": 29,
  "learning_objectives": [
    "4.2.1.8-бірқалыпты түзу сызықты қозғалыстағы арақашықтық формулаларын көрсету",
    "4.5.1.2-есептерді шығару үдерісінде жылдамдық шамаларын пайдалану"
  ],
  "date": "12.10.2024"
}
```

### Поля формы

| Поле | Тип | Обязательное | Placeholder/Label |
|------|-----|--------------|-------------------|
| `subject` | text | ✅ | Пәні / Предмет |
| `grade` | text | ✅ | Сынып / Класс |
| `topic` | text | ✅ | Сабақтың тақырыбы / Тема урока |
| `teacher_name` | text | ✅ | Мұғалімнің аты-жөні / Учитель |
| `section_name` | text | ✅ | Бөлім / Раздел |
| `lesson_number` | number | ✅ | Сабақ нөмірі / Номер урока |
| `learning_objectives` | textarea/chips | ✅ | Оқу мақсаттары (можно несколько, разделять Enter) |
| `date` | date/text | ❌ | Күні / Дата |

---

## 2. Response от `/api/generate/kmzh`

```json
{
  "meta": {
    "section_name": "1(С)-бөлім ...",
    "subject": "Математика",
    "teacher_name": "...",
    "date": "12.10.2024",
    "grade": "4",
    "students_present": "",
    "students_absent": "",
    "topic": "Қозғалысқа берілген есептер 29 сабақ",
    "learning_objectives": ["4.2.1.8-...", "4.5.1.2-..."],
    "lesson_objectives": ["Формулаларын көрсетеді...", "...пайдаланады"]
  },
  "flow": [
    {
      "stage_name": "Сабақтың басы",
      "time": "4 мин",
      "neuro_exercise": "«Қозғалайық» нейрожаттығу",
      "tasks": [
        {
          "work_type": "ЖЖ",
          "method_name": "Психологиялық дайындық",
          "teacher_activity": "Приветствие...",
          "student_activity": "Жаттығуларын жасайды",
          "descriptors": ["Ауызша мадақтау 1б"],
          "resources": "слайд",
          "time_marker": null
        }
      ]
    },
    {
      "stage_name": "Сабақтың ортасы",
      "time": "35 мин",
      "neuro_exercise": "Нейро жаттығулар",
      "tasks": [/* 3-5 заданий */]
    },
    {
      "stage_name": "Сабақтың соңы",
      "time": "6 мин",
      "neuro_exercise": null,
      "tasks": [/* рефлексия, д/з */]
    }
  ]
}
```

---

## 3. UI редактирования

### Шапка (meta) — редактируемые поля

| Поле | Редактируемое | Примечание |
|------|---------------|------------|
| `students_present` | ✅ | Изначально пусто |
| `students_absent` | ✅ | Изначально пусто |
| `date` | ✅ | Может быть пусто |
| `lesson_objectives` | ✅ | ИИ генерирует, можно править |
| Остальные | ✅ | Можно править всё |

### Таблица хода урока (flow)

**Структура:** 3 этапа → каждый этап имеет `tasks[]`

**Колонки таблицы:**

| Колонка | Поле |
|---------|------|
| Этап/Уақыт | `stage_name` + `time` (или `time_marker`) |
| Педагогтің әрекеті | `work_type` + `method_name` + `teacher_activity` |
| Оқушының әрекеті | `student_activity` |
| Бағалау | `descriptors[]` — список, отображать как bullet list |
| Ресурстар | `resources` |

**Редактирование:**
- Клик по ячейке → inline edit
- Все поля редактируемые
- `descriptors` — можно добавлять/удалять элементы

---

## 4. Скачивание → POST `/api/generate/kmzh/docx`

### Request Body

Отправляем **тот же JSON** что получили (с правками пользователя):

```json
{
  "meta": { /* отредактированные данные */ },
  "flow": [ /* отредактированные этапы */ ]
}
```

### Response

- Content-Type: `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- Content-Disposition: `attachment; filename="kmzh.docx"`

**Обработка:** blob → download

```js
const res = await fetch('/api/generate/kmzh/docx', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': '...' },
  body: JSON.stringify({ meta, flow })
});
const blob = await res.blob();
const url = URL.createObjectURL(blob);
// trigger download
```

---

## 5. User Flow

```
[Форма ввода] 
    ↓ POST /kmzh
[Загрузка...]
    ↓
[Предпросмотр + Редактирование]
  - Шапка документа (meta)
  - Таблица хода урока (flow)
    ↓ Кнопка "Скачать"
    ↓ POST /kmzh/docx
[Скачивание kmzh.docx]
```

---

## 6. Типы (TypeScript)

```typescript
interface KMZHRequest {
  subject: string;
  grade: string;
  topic: string;
  teacher_name: string;
  section_name: string;
  lesson_number: number;
  learning_objectives: string[];
  date?: string | null;
}

interface LessonMeta {
  section_name: string;
  subject: string;
  teacher_name: string;
  date: string;
  grade: string;
  students_present: string;
  students_absent: string;
  topic: string;
  learning_objectives: string[];
  lesson_objectives: string[];
}

interface Task {
  work_type: 'ЖЖ' | 'ТЖ';
  method_name: string;
  teacher_activity: string;
  student_activity: string;
  descriptors: string[];
  resources: string;
  time_marker: string | null;
}

interface LessonStage {
  stage_name: string;
  time: string;
  neuro_exercise: string | null;
  tasks: Task[];
}

interface KMZHResponse {
  meta: LessonMeta;
  flow: LessonStage[]; // всегда 3 элемента
}

// Для скачивания DOCX — тот же тип
type KMZHDocxRequest = KMZHResponse;
```

---

## 7. Валидация

**На форме ввода:**
- Все обязательные поля заполнены
- `lesson_number` > 0
- `learning_objectives` минимум 1 элемент

**Перед скачиванием:**
- `flow` содержит ровно 3 этапа
- Каждый этап имеет минимум 1 task
