# Turborepo и монорепо: один репозиторий, чтобы править всеми

## Зачем вообще монорепо?

Представь типичную ситуацию: у тебя фронтенд в одном репозитории, бэкенд — в другом, общие типы — в третьем (или, что чаще, продублированы в обоих). Нужно поменять формат ответа API? Вот что происходит:

1. Меняешь DTO на бэке → коммит → PR → мердж
2. Публикуешь новую версию пакета типов (если он есть) → npm publish
3. Обновляешь зависимость на фронте → меняешь код → коммит → PR → мердж

Три репозитория. Три PR. Куча ожидания. А если что-то пошло не так — откатывай всё по отдельности.

**Монорепо решает это просто: весь код живёт в одном репозитории.**

```
mindbridge/                ← один репозиторий
├── apps/
│   ├── web/               ← Next.js фронтенд
│   └── api/               ← NestJS бэкенд
├── packages/
│   ├── types/             ← общие TypeScript типы
│   ├── eslint-config/     ← общая конфигурация линтера
│   └── tsconfig/          ← общие настройки TypeScript
├── package.json           ← корневой, управляет всем
└── turbo.json             ← конфигурация Turborepo
```

Поменял DTO? Один коммит, один PR — и фронт, и бэк, и типы обновлены атомарно.

---

## Monorepo ≠ Monoлит

Важное уточнение: монорепо — это **не** монолит.

| | Монолит | Монорепо |
|---|---------|----------|
| Деплой | Всё вместе | Каждый app отдельно |
| Зависимости | Общие | У каждого app свои |
| Кодовая база | Одно приложение | Несколько независимых приложений |
| Связанность | Высокая | Низкая (через пакеты) |

В нашем MindBridge: `apps/web` и `apps/api` — полностью независимые приложения. Они связаны только через `packages/types`. Деплоить их можно отдельно.

---

## npm Workspaces — как пакеты "видят" друг друга

В корневом `package.json` проекта:

```json
{
  "name": "mindbridge",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ]
}
```

Директива `workspaces` говорит npm: "Все папки в `apps/` и `packages/` — это отдельные пакеты. Свяжи их между собой."

### Как это работает

Каждый пакет имеет свой `package.json` со своим именем:

```
packages/types/package.json     → "@mindbridge/types"
packages/eslint-config/         → "@mindbridge/eslint-config"
packages/tsconfig/              → "@mindbridge/tsconfig"
apps/web/package.json           → "@mindbridge/web"
apps/api/package.json           → "@mindbridge/api"
```

Чтобы фронтенд использовал общие типы, он указывает зависимость:

```json
// apps/web/package.json
{
  "dependencies": {
    "@mindbridge/types": "*"
  }
}
```

`"*"` означает "бери ту версию, что есть в монорепе". Не нужен npm publish. Не нужен npm link. Просто работает.

### Одна команда `npm install`

При запуске `npm install` в корне:

1. npm видит все workspaces
2. Устанавливает зависимости **каждого** пакета
3. Создаёт симлинки между локальными пакетами
4. Общие зависимости поднимает в корневой `node_modules` (hoisting)

```bash
npm install    # ← один раз, в корне проекта
```

После этого `import { UserDto } from '@mindbridge/types'` просто работает — и на фронте, и на бэке.

---

## Turborepo — умный оркестратор задач

npm workspaces решают проблему связи пакетов. Но кто будет запускать `build`, `lint`, `dev` для всех пакетов? Тут приходит **Turborepo**.

### Проблема без Turborepo

```bash
# Нужно собрать всё:
cd packages/types && npm run build
cd apps/api && npm run build
cd apps/web && npm run build
```

А если `apps/web` зависит от `packages/types`, то types нужно собрать **первым**. А если пакетов 20? Руками уже не справиться.

### Turbo делает за тебя

```bash
npx turbo build    # ← собирает ВСЁ в правильном порядке
```

Turborepo:
1. Строит граф зависимостей между пакетами
2. Определяет правильный порядок (topological sort)
3. Запускает параллельно то, что не зависит друг от друга
4. Кэширует результаты — если код не менялся, повторно не собирает

### turbo.json — конфигурация

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "typecheck": {
      "dependsOn": ["^build"]
    },
    "clean": {
      "cache": false
    }
  }
}
```

Разберём каждый параметр:

### `"dependsOn": ["^build"]`

Символ `^` означает: "сначала выполни эту задачу во **всех зависимостях**".

Для `apps/web` → `build` это значит:
1. Сначала собери `@mindbridge/types` (зависимость)
2. Потом собирай `@mindbridge/web`

Без `^` Turbo запустил бы задачи параллельно, и `web` мог бы упасть, потому что types ещё не собрался.

### `"outputs"`

Что кэшировать. Turbo создаёт хэш от исходников. Если код не менялся — берёт результат из кэша.

```json
"outputs": [".next/**", "!.next/cache/**", "dist/**"]
```

- `.next/**` — билд Next.js
- `!.next/cache/**` — исключить кэш Next.js (он и так восстановится)
- `dist/**` — билд NestJS и пакетов

### `"cache": false`

Для `dev` и `clean` кэш не нужен — эти задачи всегда должны запускаться заново.

### `"persistent": true`

`dev` — это долгоживущий процесс (dev сервер). `persistent: true` говорит Turbo не ждать его завершения.

---

## Команда `turbo dev` — магия одной строки

```bash
npx turbo dev
```

Что происходит:

1. Turbo находит все пакеты со скриптом `dev`
2. В нашем случае: `@mindbridge/web` и `@mindbridge/api`
3. Запускает оба **параллельно**:
   - `next dev -p 3000` для фронтенда
   - `nest start --watch` для бэкенда
4. Выводит логи обоих серверов с цветной маркировкой

```
web:dev:  ▲ Next.js 14.1.0
web:dev:  - Local: http://localhost:3000
api:dev:  [Nest] LOG [NestApplication] Nest application successfully started
api:dev:  Application is running on http://localhost:3001
```

Одна команда — два сервера. Оба с hot-reload.

---

## Общие пакеты — зачем и как

### packages/types — общие TypeScript типы

Главная ценность монорепо: **одни типы на фронт и бэк**.

```typescript
// packages/types/src/auth.ts
export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
}
```

На бэкенде:
```typescript
// apps/api/src/modules/auth/auth.service.ts
import type { AuthResponse } from '@mindbridge/types';  // ← те же типы

async login(dto: LoginDto): Promise<AuthResponse> { ... }
```

На фронтенде:
```typescript
// apps/web/src/shared/api/client.ts
import type { LoginDto, AuthResponse } from '@mindbridge/types';  // ← те же типы

export async function login(dto: LoginDto): Promise<AuthResponse> { ... }
```

Изменил `AuthResponse` → TypeScript сразу покажет ошибки **и на фронте, и на бэке**. Никаких рассинхронов.

### packages/tsconfig — единые настройки TypeScript

Три базовых конфигурации:

```
packages/tsconfig/
├── base.json       ← общая строгая конфигурация
├── nextjs.json     ← расширяет base для Next.js (jsx, noEmit, DOM libs)
└── nestjs.json     ← расширяет base для NestJS (CommonJS, decorators)
```

Каждый app расширяет нужную:

```json
// apps/web/tsconfig.json
{ "extends": "@mindbridge/tsconfig/nextjs.json" }

// apps/api/tsconfig.json
{ "extends": "@mindbridge/tsconfig/nestjs.json" }
```

Поменял настройку strict в `base.json` → обновилось везде.

### packages/eslint-config — единый линтер

Одинаковый стиль кода во всех пакетах:

```javascript
// packages/eslint-config/index.js
module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier',
  ],
  // ...
};
```

```javascript
// apps/api/.eslintrc.js
module.exports = {
  extends: ['@mindbridge/eslint-config'],
};

// apps/web/.eslintrc.js — тоже
module.exports = {
  extends: ['next/core-web-vitals', '@mindbridge/eslint-config'],
};
```

---

## Кэширование — суперсила Turborepo

Turbo кэширует результаты задач. Демонстрация:

```bash
# Первый запуск — всё собирается с нуля
$ npx turbo build
 Tasks:    3 successful, 3 total
 Cached:   0 cached, 3 total
 Time:     45.2s

# Второй запуск — ничего не менялось
$ npx turbo build
 Tasks:    3 successful, 3 total
 Cached:   3 cached, 3 total        ← ВСЁ из кэша!
 Time:     0.8s                      ← 45 секунд → 0.8 секунды
```

### Как это работает

1. Turbo создаёт хэш от: исходного кода + зависимостей + environment variables
2. Результат сборки сохраняется в `.turbo/cache/`
3. При повторном запуске сравнивает хэши
4. Если совпадают — восстанавливает из кэша мгновенно

### Remote Caching (продвинутое)

Turbo поддерживает удалённый кэш — результаты сборки одного разработчика доступны всем в команде:

```bash
npx turbo login        # авторизация в Vercel
npx turbo link         # привязка проекта
```

После этого: коллега собрал → ты запускаешь build → Turbo скачивает результат из облака. Никакой повторной сборки.

---

## Скрипты в корневом package.json

```json
{
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "lint": "turbo lint",
    "typecheck": "turbo typecheck",
    "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,md}\"",
    "clean": "turbo clean && rm -rf node_modules"
  }
}
```

| Команда | Что делает |
|---------|-----------|
| `npm run dev` | Запускает dev-серверы всех приложений параллельно |
| `npm run build` | Собирает всё в правильном порядке с кэшированием |
| `npm run lint` | Линтит все пакеты |
| `npm run typecheck` | Проверяет типы во всех пакетах |
| `npm run format` | Форматирует Prettier-ом весь код |
| `npm run clean` | Удаляет все артефакты сборки и node_modules |

---

## Фильтрация — запуск для одного пакета

Не хочешь собирать всё? Фильтруй:

```bash
# Только фронтенд
npx turbo build --filter=@mindbridge/web

# Только бэкенд
npx turbo dev --filter=@mindbridge/api

# Только пакеты (не apps)
npx turbo build --filter='./packages/*'

# Конкретный пакет и его зависимости
npx turbo build --filter=@mindbridge/web...
```

`--filter=@mindbridge/web...` (с тремя точками) — собрать web **и все его зависимости** (types).

---

## Как добавить новый пакет в монорепо

Допустим, нужен общий пакет утилит:

```bash
mkdir packages/utils
```

```json
// packages/utils/package.json
{
  "name": "@mindbridge/utils",
  "version": "0.0.0",
  "private": true,
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "typecheck": "tsc --noEmit"
  }
}
```

```bash
npm install    # npm увидит новый workspace
```

Теперь в любом app:
```json
{
  "dependencies": {
    "@mindbridge/utils": "*"
  }
}
```

Turbo автоматически подхватит новый пакет и включит его в граф задач.

---

## Как добавить новый app

Аналогично — создаёшь папку в `apps/`:

```bash
mkdir apps/admin    # второй фронтенд — admin-панель
```

Создаёшь `package.json` с нужными скриптами (`dev`, `build`, `lint`, `typecheck`), и Turbo автоматически включит его во все пайплайны.

---

## Типичные ошибки

### 1. Установка зависимостей в подпакете
```bash
# ❌ Неправильно
cd apps/web && npm install axios

# ✅ Правильно — из корня
npm install axios --workspace=@mindbridge/web
```

### 2. Забыть `"*"` для локальных зависимостей
```json
// ❌ Неправильно — будет искать в npm registry
"@mindbridge/types": "^1.0.0"

// ✅ Правильно — берёт из монорепы
"@mindbridge/types": "*"
```

### 3. Не указать `outputs` в turbo.json
Без `outputs` Turbo не знает что кэшировать, и кэширование не работает.

### 4. Циклические зависимости между пакетами
`A` зависит от `B`, `B` зависит от `A` → Turbo не сможет определить порядок сборки. Решение: вынести общее в третий пакет.

---

## Шпаргалка

| Задача | Команда |
|--------|---------|
| Установить всё | `npm install` (в корне) |
| Запустить dev | `npx turbo dev` |
| Собрать всё | `npx turbo build` |
| Добавить зависимость | `npm install <pkg> --workspace=@mindbridge/web` |
| Запустить только один app | `npx turbo dev --filter=@mindbridge/web` |
| Очистить кэш | `npx turbo clean` |
| Посмотреть граф | `npx turbo build --graph` |

---

## Полезные ссылки

- [Turborepo Documentation](https://turbo.build/repo/docs)
- [npm Workspaces](https://docs.npmjs.com/cli/using-npm/workspaces)
- [Монорепо — это не страшно (habr)](https://habr.com/ru/articles/)
