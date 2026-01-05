# API Документация: Система токенов

Документация для фронтенда по работе с системой токенов.

## Аутентификация

Все эндпоинты (кроме публичных) требуют JWT токен в заголовке:

```
Authorization: Bearer <your_jwt_token>
```

Токен получается при авторизации через `/auth/login` или `/auth/register`.

---

## 📊 Публичные эндпоинты (не требуют авторизации)

### Получить стоимость операций

**GET** `/api/tokens/costs`

Возвращает стоимость всех операций в токенах.

**Пример запроса:**
```javascript
const response = await fetch('http://localhost:8000/api/tokens/costs');
const data = await response.json();
console.log(data.costs);
// {
//   "article_generate": 10,
//   "article_revise": 5,
//   "bjb_generate": 15,
//   ...
// }
```

**Пример ответа:**
```json
{
  "costs": {
    "article_generate": 10,
    "article_revise": 5,
    "bjb_generate": 15,
    "quiz_generate": 12,
    "essay_generate": 8,
    "essay_revise": 4,
    "kmzh_generate": 10,
    "audio_text_to_speech": 3,
    "class_hour_generate": 12,
    "class_hour_regenerate_block": 5,
    "sciproject_generate": 15,
    "worksheet_generate": 10
  }
}
```

**Использование на фронте:**
- Можно показывать пользователю стоимость операции перед выполнением
- **ВАЖНО:** Это только для информации. Реальная проверка и списание происходит на бэкенде

---

## 👤 Эндпоинты пользователя (требуют авторизации)

### Получить баланс токенов

**GET** `/api/tokens/balance`

Возвращает текущий баланс токенов пользователя.

**Пример запроса:**
```javascript
const response = await fetch('http://localhost:8000/api/tokens/balance', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const data = await response.json();
```

**Пример ответа:**
```json
{
  "balance": 150,
  "user_id": "123e4567-e89b-12d3-a456-426614174000"
}
```

### Получить историю транзакций

**GET** `/api/tokens/transactions?limit=50&offset=0`

Возвращает историю транзакций пользователя.

**Параметры запроса:**
- `limit` (optional, default: 50, max: 100) - количество записей
- `offset` (optional, default: 0) - смещение для пагинации

**Пример запроса:**
```javascript
const response = await fetch('http://localhost:8000/api/tokens/transactions?limit=20&offset=0', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const data = await response.json();
```

**Пример ответа:**
```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "user_id": "123e4567-e89b-12d3-a456-426614174001",
    "amount": -10,
    "operation_type": "article_generate",
    "description": "Spent 10 tokens for article_generate",
    "created_at": "2026-01-05T12:00:00"
  },
  {
    "id": "123e4567-e89b-12d3-a456-426614174002",
    "user_id": "123e4567-e89b-12d3-a456-426614174001",
    "amount": 100,
    "operation_type": "admin_add_tokens",
    "description": "Added 100 tokens by admin",
    "created_at": "2026-01-05T11:00:00"
  }
]
```

**Примечания:**
- `amount` положительное = начисление токенов
- `amount` отрицательное = списание токенов
- Транзакции отсортированы по дате (новые первые)

---

## ⚡ Использование токенов в AI операциях

Все AI операции автоматически проверяют и списывают токены **на бэкенде**.

### Как это работает:

1. Фронт отправляет запрос на AI операцию (например, генерация статьи)
2. Бэкенд проверяет баланс пользователя
3. Если баланса достаточно - списывает токены и выполняет операцию
4. Если баланса недостаточно - возвращает ошибку `402 Payment Required`

### Пример: Генерация статьи

**POST** `/api/article/generate`

```javascript
try {
  const response = await fetch('http://localhost:8000/api/article/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      title: "Заголовок статьи",
      genre: "scientific",
      language: "ru",
      // ... другие параметры
    })
  });

  if (response.status === 402) {
    const error = await response.json();
    alert(`Недостаточно токенов! Требуется: ${error.detail}`);
    return;
  }

  if (!response.ok) {
    throw new Error('Ошибка генерации');
  }

  const article = await response.json();
  // Использовать статью
} catch (error) {
  console.error('Ошибка:', error);
}
```

### Обработка ошибки недостаточного баланса

Если у пользователя недостаточно токенов, API возвращает:

**Статус:** `402 Payment Required`

**Тело ответа:**
```json
{
  "detail": "Insufficient tokens. Required: 10, Available: 5"
}
```

**Рекомендации для фронта:**
- Проверять статус `402` перед обработкой результата
- Показывать пользователю понятное сообщение
- Предлагать пополнить баланс (через админа)

---

## 🔐 Админ эндпоинты (требуют роль admin)

### Получить список пользователей

**GET** `/api/admin/users?limit=50&offset=0`

Возвращает список всех пользователей с их балансами токенов.

**Параметры:**
- `limit` (optional, default: 50, max: 100)
- `offset` (optional, default: 0)

**Пример запроса:**
```javascript
const response = await fetch('http://localhost:8000/api/admin/users?limit=50', {
  headers: {
    'Authorization': `Bearer ${adminToken}`
  }
});
const data = await response.json();
```

**Пример ответа:**
```json
{
  "users": [
    {
      "user_id": "123e4567-e89b-12d3-a456-426614174000",
      "email": "user@example.com",
      "full_name": "Иван Иванов",
      "role": "user",
      "balance": 50,
      "created_at": "2026-01-05T10:00:00"
    }
  ],
  "total": 1
}
```

### Добавить токены пользователю

**POST** `/api/admin/users/{user_id}/tokens`

Начисляет токены указанному пользователю.

**Параметры пути:**
- `user_id` (UUID) - ID пользователя

**Тело запроса:**
```json
{
  "amount": 100,
  "description": "Начисление за покупку подписки"
}
```

**Пример запроса:**
```javascript
const userId = "123e4567-e89b-12d3-a456-426614174000";
const response = await fetch(`http://localhost:8000/api/admin/users/${userId}/tokens`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${adminToken}`
  },
  body: JSON.stringify({
    amount: 100,
    description: "Начисление за покупку подписки"
  })
});
const data = await response.json();
```

**Пример ответа:**
```json
{
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "balance": 150,
  "message": "Added 100 tokens successfully"
}
```

### Получить историю транзакций пользователя

**GET** `/api/admin/users/{user_id}/transactions?limit=50&offset=0`

Возвращает историю транзакций конкретного пользователя.

**Параметры пути:**
- `user_id` (UUID) - ID пользователя

**Параметры запроса:**
- `limit` (optional, default: 50, max: 100)
- `offset` (optional, default: 0)

**Пример запроса:**
```javascript
const userId = "123e4567-e89b-12d3-a456-426614174000";
const response = await fetch(`http://localhost:8000/api/admin/users/${userId}/transactions?limit=20`, {
  headers: {
    'Authorization': `Bearer ${adminToken}`
  }
});
const data = await response.json();
```

**Пример ответа:** (такой же формат, как у пользовательских транзакций)

---

## 📝 Стоимость операций

| Операция | Стоимость (токены) | Описание |
|----------|-------------------|----------|
| `article_generate` | 10 | Генерация статьи |
| `article_revise` | 5 | Редактирование статьи |
| `bjb_generate` | 15 | Генерация БЖБ/ТЖБ |
| `quiz_generate` | 12 | Генерация теста |
| `essay_generate` | 8 | Генерация эссе |
| `essay_revise` | 4 | Редактирование эссе |
| `kmzh_generate` | 10 | Генерация КМЖ |
| `audio_text_to_speech` | 3 | Текст в речь |
| `class_hour_generate` | 12 | Генерация классного часа |
| `class_hour_regenerate_block` | 5 | Регенерация блока классного часа |
| `sciproject_generate` | 15 | Генерация научного проекта |
| `worksheet_generate` | 10 | Генерация рабочего листа |

**Важно:** Операции экспорта (export/docx) **НЕ** требуют токены.

---

## 🎯 Рекомендации для фронтенда

### 1. Отображение баланса
- Показывать баланс токенов в профиле пользователя
- Обновлять баланс после каждой операции

### 2. Предварительная проверка
- Перед выполнением дорогой операции показывать стоимость
- Использовать `/api/tokens/costs` для получения актуальных цен

### 3. Обработка ошибок
- Обрабатывать статус `402 Payment Required`
- Показывать понятное сообщение пользователю
- Предлагать пополнить баланс

### 4. История транзакций
- Отображать историю транзакций в личном кабинете
- Реализовать пагинацию для больших списков

### 5. Админ панель
- Показывать список пользователей с балансами
- Форма для добавления токенов
- История транзакций каждого пользователя

---

## 📦 Примеры использования (React/TypeScript)

### Hook для работы с токенами

```typescript
import { useState, useEffect } from 'react';

interface TokenBalance {
  balance: number;
  user_id: string;
}

interface TokenCosts {
  costs: Record<string, number>;
}

export function useTokens(token: string) {
  const [balance, setBalance] = useState<number | null>(null);
  const [costs, setCosts] = useState<Record<string, number>>({});

  useEffect(() => {
    // Загружаем баланс
    fetch('/api/tokens/balance', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then((data: TokenBalance) => setBalance(data.balance));

    // Загружаем стоимость операций
    fetch('/api/tokens/costs')
      .then(res => res.json())
      .then((data: TokenCosts) => setCosts(data.costs));
  }, [token]);

  const checkBalance = async (operationType: string): Promise<boolean> => {
    const cost = costs[operationType];
    if (!cost || balance === null) return false;
    return balance >= cost;
  };

  return { balance, costs, checkBalance };
}
```

### Компонент отображения баланса

```typescript
function TokenBalanceDisplay({ token }: { token: string }) {
  const { balance, costs } = useTokens(token);

  if (balance === null) return <div>Загрузка...</div>;

  return (
    <div>
      <h3>Баланс токенов: {balance}</h3>
      <p>Стоимость генерации статьи: {costs.article_generate || 'N/A'}</p>
    </div>
  );
}
```

---

## 🔒 Безопасность

**ВАЖНО:** 
- Стоимость операций определяется **только на бэкенде**
- Фронтенд не может влиять на списание токенов
- Все проверки баланса происходят на сервере
- Используется `SELECT FOR UPDATE` для предотвращения race conditions

---

## ❓ Часто задаваемые вопросы

**Q: Можно ли изменить стоимость операции на фронте?**
A: Нет. Стоимость определяется только на бэкенде. Фронт может только читать её для отображения.

**Q: Что происходит, если операция упадет после списания токенов?**
A: Токены уже списаны. Это цена за попытку выполнения операции.

**Q: Можно ли вернуть токены, если операция не удалась?**
A: На данный момент нет механизма возврата. Это можно добавить в будущем.

**Q: Как пополнить баланс?**
A: Через админ панель. Администратор может начислить токены любому пользователю.

