# КМЖ API - Документация для Frontend

## 🎯 Два шага для генерации КМЖ

### Шаг 1: Получить JSON плана от AI

**POST** `/api/generate/kmzh`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json
```

**Body:**
```json
{
  "subject": "Қазақ әдебиеті",
  "grade": "7 сынып",
  "period": "3-тоқсан",
  "hours_total": 20,
  "teacher_name": "Айгүл Омарова",
  "user_input": "Темы: Абай Құнанбаев, Ескендір поэмасы"
}
```

**Response 200:**
```json
{
  "lessons": [
    {
      "lesson_topic": "Абай Құнанбаев: өмірі",
      "learning_objective": "7.1.2.1 - Автордың өмірбаяны",
      "hours": 2,
      "date": "2025-01-15",
      "adal_azamat_value": "Білімге құштарлық"
    },
    {
      "lesson_topic": "Абай өлеңдері",
      "learning_objective": "7.2.1.1 - Тақырып пен идея",
      "hours": 3,
      "date": "2025-01-20",
      "adal_azamat_value": "Патриотизм"
    }
  ]
}
```

⏱️ **Время:** 10-30 секунд

---

### Шаг 2: Скачать DOCX документ

**POST** `/api/generate/kmzh/docx`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json
```

**Body:**
```json
{
  "subject": "Қазақ әдебиеті",
  "grade": "7 сынып",
  "period": "3-тоқсан",
  "teacher_name": "Айгүл Омарова",
  "lessons": [
    {
      "lesson_topic": "Абай Құнанбаев: өмірі",
      "learning_objective": "7.1.2.1 - Автордың өмірбаяны",
      "hours": 2,
      "date": "2025-01-15",
      "adal_azamat_value": "Білімге құштарлық"
    }
  ]
}
```

**Response 200:**
- Файл `kmzh.docx` для скачивания
- Content-Type: `application/vnd.openxmlformats-officedocument.wordprocessingml.document`

⏱️ **Время:** 1-3 секунды

---

## 💻 Пример кода (JavaScript)

```javascript
// 1. Генерация JSON
async function generatePlan(formData) {
  const response = await fetch('http://localhost:8000/api/generate/kmzh', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      subject: formData.subject,
      grade: formData.grade,
      period: formData.period,
      hours_total: formData.hoursTotal,
      teacher_name: formData.teacherName,
      user_input: formData.userInput
    })
  });
  
  const data = await response.json();
  return data.lessons; // Показать пользователю
}

// 2. Скачать DOCX
async function downloadDocx(subject, grade, period, teacher, lessons) {
  const response = await fetch('http://localhost:8000/api/generate/kmzh/docx', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      subject: subject,
      grade: grade,
      period: period,
      teacher_name: teacher,
      lessons: lessons // Те же данные из шага 1
    })
  });
  
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'kmzh.docx';
  a.click();
  window.URL.revokeObjectURL(url);
}
```

---

## 🎨 UX Flow

```
1. Пользователь заполняет форму
   ↓
2. Нажимает "Сгенерировать план"
   ↓
3. Показывать Loading (10-30 сек)
   ↓
4. Показать JSON в редактируемой таблице
   ↓
5. Пользователь может изменить уроки
   ↓
6. Нажимает "Скачать DOCX"
   ↓
7. Файл скачивается (1-3 сек)
```

---

## ⚠️ Ошибки

| Код | Причина | Что делать |
|-----|---------|------------|
| 401 | Токен невалиден | Перелогиниться |
| 400 | Неправильные данные | Проверить форму |
| 502 | AI не ответил | Попробовать снова |

---

## 📝 TypeScript типы

```typescript
interface LessonItem {
  lesson_topic: string;
  learning_objective: string;
  hours: number;
  date: string; // "YYYY-MM-DD"
  adal_azamat_value: string;
}

interface GenerateRequest {
  subject: string;
  grade: string;
  period: string;
  hours_total: number;
  teacher_name: string;
  user_input: string;
}

interface DocxRequest {
  subject: string;
  grade: string;
  period: string;
  teacher_name: string;
  lessons: LessonItem[];
}
```

---

## ✅ Готово!

Все что нужно - два POST запроса с токеном в header.

