# MindBridge — Architecture & Codebase Reference

AI-платформа CBT-поддержки ментального здоровья. Пациенты ведут сессии с AI-терапевтом (Claude), получают структурированный психологический анализ. Планируется модуль психотерапевтов: пациенты, отчёты, трекер настроения.

**Текущий статус**: реализованы авторизация, AI-чат со стримингом, CBT-анализ сессий.

---

## Монорепо

```
mindbridge/
├── apps/
│   ├── api/           @mindbridge/api    NestJS 10, порт 3001
│   └── web/           @mindbridge/web    Next.js 14, порт 3000
├── packages/
│   ├── types/         @mindbridge/types  общие TypeScript типы → компилируется в dist/
│   ├── tsconfig/      базовые tsconfig
│   └── eslint-config/ базовые ESLint конфиги
├── docker-compose.yml
├── turbo.json
└── package.json       npm workspaces + Turborepo 2.x
```

**Граф сборки**: `types` собирается первым (`dependsOn: ["^build"]`), затем `api` и `web` параллельно.

```bash
npm install               # установка зависимостей
docker-compose up -d      # PostgreSQL:5432 + Redis:6379
npx turbo dev             # все приложения
npx turbo build           # сборка всего
npx turbo lint --filter=@mindbridge/web
npx turbo build --filter=@mindbridge/types
```

### Инфраструктура

`docker-compose.yml`:
- `postgres:16-alpine` — контейнер `mindbridge-db`, порт 5432, база `mindbridge`, user/pass `postgres`
- `redis:7-alpine` — контейнер `mindbridge-redis`, порт 6379

**`apps/api/.env`**:
```
DATABASE_URL=postgres://user:password@localhost:5432/mindbridge
JWT_SECRET=your-jwt-secret-here
PORT=3001
REDIS_URL=redis://localhost:6379
ANTHROPIC_API_KEY=your-anthropic-api-key-here
ANTHROPIC_MODEL=claude-sonnet-4-20250514
```

**`apps/web/.env.local`**:
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## Пакет @mindbridge/types

Компилируется через `tsc`, экспортируется из `dist/`. Все файлы реэкспортируются через `src/index.ts`.

### src/auth.ts
```typescript
interface LoginDto     { email: string; password: string }
interface RegisterDto  { email: string; password: string }
interface AuthResponse { access_token: string }
```

### src/user.ts
```typescript
interface UserDto { id: string; email: string; createdAt: string }
enum UserRole { PATIENT = 'patient', THERAPIST = 'therapist' }
```

### src/chat.ts
```typescript
enum SessionStatus { Active='active', Ended='ended', Analyzing='analyzing', Completed='completed' }
enum MessageRole   { User='user', Assistant='assistant', System='system' }

interface MessageDto { id, role: MessageRole, content, sessionId, orderIndex, createdAt }
interface SessionDto { id, status, title, userId, createdAt, updatedAt, endedAt }
interface SessionWithMessagesDto extends SessionDto { messages: MessageDto[] }

interface CognitiveDistortionDto   { type, description, example, frequency }
interface EmotionalTrackPointDto   { moment, emotion, intensity: number, trigger }
interface SessionAnalysisDto {
  id, sessionId,
  cognitiveDistortions: CognitiveDistortionDto[],
  emotionalTrack: EmotionalTrackPointDto[],
  themes: string[], triggers: string[],
  progressSummary, recommendations: string[],
  homework: string[] | null,
  therapistBrief, createdAt
}

interface SendMessageDto    { content: string }
interface ChatStreamEvent   { type: 'token'|'message_complete'|'analysis_ready'|'error'|'keepalive', data?, messageId?, analysisId? }
interface PaginatedSessionsDto { sessions: SessionDto[], total, page, limit }
```

### src/mood.ts
```typescript
enum EmotionType { ANXIETY, SADNESS, JOY, CALM, IRRITATION, FEAR, SHAME, PRIDE }

interface MoodEntry {
  id, userId,
  value: number,         // 1–10
  emotions: EmotionType[],
  note?: string,
  conversationId?: string,
  createdAt: string
}

interface MoodStats {
  average: number,
  trend: 'improving' | 'declining' | 'stable',
  totalEntries: number,
  streak: number
}
```

### src/therapist.ts
```typescript
enum PatientStatus { PENDING='pending', ACTIVE='active', INACTIVE='inactive' }
enum RiskLevel     { GREEN='green', YELLOW='yellow', RED='red' }
enum ReportStatus  { GENERATING='generating', READY='ready', ERROR='error' }

interface PatientTherapistLink {
  id, therapistId, patientId,
  status: PatientStatus,
  inviteCode?: string, connectedAt?: string, createdAt: string
}

interface PatientListItem {
  id, name, email,
  status: PatientStatus,
  lastActivity: string | null,
  avgMood: number | null,
  anxietyLevel: number | null,
  depressionLevel: number | null,
  sessionsCount: number,
  nextSession?: string
}

interface ReportContent {
  summary, moodTrend,
  keyThemes: string[], concerns: string[],
  copingStrategiesUsed: string[],
  progressNotes, suggestedFocus,
  riskFlags: string | null
}

interface TherapistReport {
  id, therapistId, patientId,
  status: ReportStatus,
  periodStart, periodEnd,
  content?: ReportContent,
  createdAt: string
}
```

### src/dashboard.ts
```typescript
interface SessionAnalysis {
  id, conversationId, userId,
  anxietyLevel: number,    // 0–10
  depressionLevel: number, // 0–10
  keyEmotions: EmotionType[],
  keyTopics: string[], copingStrategies: string[],
  riskFlags: string | null,
  insight: string, createdAt: string
}

interface PatientDashboardData {
  moodHistory: MoodEntry[],
  moodStats: MoodStats,
  recentAnalyses: SessionAnalysis[],
  weeklyInsight: string | null,
  sessionsCount: number,
  topTopics: { topic: string; count: number }[],
  topEmotions: { emotion: EmotionType; count: number }[]
}

interface TherapistDashboardData {
  patients: PatientListItem[],
  totalPatients: number,
  patientsNeedingAttention: number,
  upcomingSessions: number
}
```

---

## Backend — @mindbridge/api

**Стек**: NestJS 10, TypeORM 0.3, PostgreSQL 16, Redis (ioredis), @anthropic-ai/sdk, passport-jwt, bcrypt, class-validator, RxJS, EventEmitter2.

### Точка входа — main.ts

```typescript
app.enableCors({ origin: 'http://localhost:3000', credentials: true })
app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
app.useGlobalFilters(new HttpExceptionFilter())
// порт из config, дефолт 3001
```

### config/configuration.ts

```typescript
export default () => ({
  port: parseInt(process.env.PORT ?? '3001'),
  database: { url: process.env.DATABASE_URL },
  jwt: { secret: process.env.JWT_SECRET, expiresIn: '7d' },
  redis: { url: process.env.REDIS_URL || 'redis://localhost:6379' },
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY,
    model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514'
  }
})
```

### app.module.ts

Импортирует: `ConfigModule` (isGlobal), `EventEmitterModule`, `TypeOrmModule` (async, autoLoadEntities, **synchronize: true** — только dev), `RedisModule`, `AuthModule`, `UsersModule`, `ChatModule`.

---

### AuthModule

#### Сущность users

```typescript
@Entity('users')
class User {
  @PrimaryGeneratedColumn('uuid')        id: string
  @Column({ unique: true })              email: string
  @Column()                              password: string  // bcrypt hash, saltRounds=10
  @CreateDateColumn()                    createdAt: Date
  @UpdateDateColumn()                    updatedAt: Date
}
```

#### UsersService

```typescript
findByEmail(email: string): Promise<User | null>
findById(id: string):       Promise<User | null>
create(email, hashedPassword): Promise<User>
```

#### AuthService

```
register({ email, password })
  → ConflictException если email занят
  → bcrypt.hash(password, 10)
  → usersService.create()
  → return { access_token: JWT }

login({ email, password })
  → UnauthorizedException если не найден или неверный пароль
  → bcrypt.compare()
  → return { access_token: JWT }

getMe(userId)
  → NotFoundException если не найден
  → return { id, email, createdAt }

generateToken(user): string
  → jwtService.sign({ sub: user.id, email: user.email })
  // expires in 7d
```

#### JwtStrategy

Извлекает токен из:
1. `Authorization: Bearer <token>` заголовка
2. `?token=<token>` query-параметра (нужен для SSE-соединения через EventSource)

`validate(payload)` → `{ id: payload.sub, email: payload.email }`

#### Декоратор @CurrentUser()

Извлекает `request.user` (объект из `validate()`).

#### Эндпоинты

```
POST /auth/register  body: { email, password }  → { access_token }
POST /auth/login     body: { email, password }  → { access_token }
GET  /auth/me        [JWT]                      → { id, email, createdAt }
```

---

### ChatModule

#### Сущности

**sessions**:
```typescript
@Entity('sessions')
class Session {
  @PrimaryGeneratedColumn('uuid')   id: string
  @Column({ type: 'enum', enum: SessionStatusEnum, default: 'active' })  status
  @Column({ type: 'varchar', nullable: true })  title: string | null
  @Column()                         userId: string
  @ManyToOne(() => User, { onDelete: 'CASCADE' })  user
  @OneToMany(() => Message, m => m.session, { cascade: true })  messages
  @OneToOne(() => SessionAnalysis, a => a.session, { cascade: true })    analysis
  @CreateDateColumn()               createdAt: Date
  @UpdateDateColumn()               updatedAt: Date
  @Column({ type: 'timestamptz', nullable: true })  endedAt: Date | null
}

enum SessionStatusEnum { Active='active', Ended='ended', Analyzing='analyzing', Completed='completed' }
```

**messages**:
```typescript
@Entity('messages')
class Message {
  @PrimaryGeneratedColumn('uuid')   id: string
  @Column({ type: 'enum', enum: MessageRoleEnum })  role
  @Column({ type: 'text' })         content: string
  @Column()                         sessionId: string
  @ManyToOne(() => Session, { onDelete: 'CASCADE' })  session
  @Column({ type: 'int' })          orderIndex: number
  @CreateDateColumn()               createdAt: Date
}

enum MessageRoleEnum { User='user', Assistant='assistant', System='system' }
```

**session_analyses**:
```typescript
@Entity('session_analyses')
class SessionAnalysis {
  @PrimaryGeneratedColumn('uuid')   id: string
  @Column()                         sessionId: string
  @OneToOne(() => Session, { onDelete: 'CASCADE' }) @JoinColumn()  session
  @Column({ type: 'jsonb', default: [] })  cognitiveDistortions: CognitiveDistortionShape[]
  @Column({ type: 'jsonb', default: [] })  emotionalTrack: EmotionalTrackShape[]
  @Column({ type: 'jsonb', default: [] })  themes: string[]
  @Column({ type: 'jsonb', default: [] })  triggers: string[]
  @Column({ type: 'text' })         progressSummary: string
  @Column({ type: 'jsonb', default: [] })  recommendations: string[]
  @Column({ type: 'jsonb', nullable: true })  homework: string[] | null
  @Column({ type: 'text' })         therapistBrief: string
  @CreateDateColumn()               createdAt: Date
}
```

#### ChatService

**createSession(userId)** → Session со статусом `active`.

**getSessions(userId, page=1, limit=20, status?)** → `{ sessions, total }`, ORDER BY createdAt DESC.

**getSession(sessionId, userId)** → Session + messages (ORDER BY orderIndex ASC). 404 если не найдена.

**sendMessage(sessionId, userId, content)**:
1. Проверяет `status === active` → 400 иначе
2. `acquireStreamingLock(sessionId)` → 400 если уже занят
3. Сохраняет UserMessage в БД
4. `appendSessionMessage()` в Redis
5. Запускает `streamAssistantResponse()` **асинхронно** (без await)
6. Немедленно возвращает userMessage

**streamAssistantResponse(sessionId, orderIndex)** [private]:
1. Читает историю из Redis (`getSessionMessages`)
2. Стримит ответ через `ClaudeService.streamMessage(CBT_THERAPIST_SYSTEM_PROMPT, messages)`
3. Каждый токен → `eventEmitter.emit('chat.{sessionId}', { type: 'token', data: token })`
4. Сохраняет AssistantMessage в БД
5. Обновляет `session.title` первыми 80 символами (если title пустой)
6. `eventEmitter.emit('chat.{sessionId}', { type: 'message_complete', messageId })`
7. `releaseStreamingLock()` в `finally`

**endSession(sessionId, userId)**:
1. `status → ended`, `endedAt = now()`
2. Запускает `generateAnalysis()` **асинхронно**
3. Возвращает сессию

**generateAnalysis(sessionId)** [private]:
1. `status → analyzing`
2. Загружает все messages из БД, фильтрует `System`
3. `ClaudeService.generateAnalysis(CBT_ANALYSIS_SYSTEM_PROMPT, messages)` → JSON строка
4. Стрипает ````json` обёртку если есть, `JSON.parse()`
5. Создаёт `SessionAnalysis` запись в БД
6. `status → completed`
7. `eventEmitter.emit('chat.{sessionId}', { type: 'analysis_ready', analysisId })`
8. `clearSessionMessages()` из Redis

**getAnalysis(sessionId, userId)** → SessionAnalysis. 404 если не найдена.

**deleteSession(sessionId, userId)** → `clearSessionMessages()` + `sessionRepo.remove()`.

#### HTTP API (все под JwtAuthGuard)

```
POST   /chat/sessions                           → createSession
GET    /chat/sessions?page=&limit=&status=      → getSessions
GET    /chat/sessions/:id                       → getSession
POST   /chat/sessions/:id/messages              body: { content } → sendMessage
POST   /chat/sessions/:id/end                   → endSession
GET    /chat/sessions/:id/analysis              → getAnalysis
DELETE /chat/sessions/:id                       → { success: true }
```

#### SSE API

```
GET /chat/sessions/:id/stream   [JWT via Bearer header или ?token= query]
```

Возвращает `Observable<{ data: string }>` (RxJS `merge`):
- `fromEvent(eventEmitter, 'chat.{id}')` — события чата
- `interval(15000)` — `{ type: 'keepalive' }` каждые 15 сек

Перед подпиской вызывает `verifySessionOwnership()` — 404 если сессия не принадлежит пользователю.

---

### ClaudeModule

#### ClaudeService

```typescript
// Стриминг ответа (AsyncGenerator)
async *streamMessage(systemPrompt, messages[]):
  // client.messages.stream({ model, max_tokens: 2048, system, messages })
  // yield text_delta из content_block_delta событий

// Генерация анализа (одноразовый запрос)
async generateAnalysis(systemPrompt, messages[]): Promise<string>
  // Формирует: "ROLE: content\n\nROLE: content..."
  // client.messages.create({ model, max_tokens: 4096, system,
  //   messages: [{ role: 'user', content: `Analyze this CBT session:\n\n${text}` }] })
  // Возвращает text из первого блока
```

#### CBT_THERAPIST_SYSTEM_PROMPT

Системный промпт AI-терапевта:
- Роль: CBT-терапевт
- Методы: сократовские вопросы, валидация эмоций, когнитивное рефреймирование
- Структура: запрос темы → исследование → когнитивные искажения → рефреймирование → инсайты
- Безопасность: при суицидальных мыслях даёт ресурсы (988 Lifeline), не ставит диагнозов
- Стиль: 2–4 параграфа, один вопрос за раз; после 8–10 обменов предлагает завершить сессию
- Язык: отвечает на языке пользователя (EN/RU)

#### CBT_ANALYSIS_SYSTEM_PROMPT

Аналитический промпт. Возвращает **строго JSON** (без Markdown обёртки):

```json
{
  "cognitiveDistortions": [{ "type", "description", "example", "frequency": "low|medium|high" }],
  "emotionalTrack": [{ "moment", "emotion", "intensity": 1-10, "trigger" }],
  "themes": [],
  "triggers": [],
  "progressSummary": "",
  "recommendations": [],
  "homework": [] | null,
  "therapistBrief": ""
}
```

Язык анализа совпадает с языком сессии.

---

### RedisModule

#### RedisService

Redis ключи:
- `chat:session:{id}:messages` → JSON `{role, content}[]`, TTL 86400 сек (24ч)
- `chat:session:{id}:streaming` → лок, TTL 120 сек

```typescript
getSessionMessages(sessionId): Promise<{role, content}[]>
setSessionMessages(sessionId, messages[]):  void     // SET EX 86400
appendSessionMessage(sessionId, message):   void     // read → push → write
clearSessionMessages(sessionId):            void     // DEL
acquireStreamingLock(sessionId): Promise<boolean>    // SET NX EX 120 → true если ОК
releaseStreamingLock(sessionId):            void     // DEL
```

Конфигурация ioredis: `retryStrategy: times => Math.min(times * 200, 5000)`, `maxRetriesPerRequest: 3`. При уничтожении модуля — `client.quit()`.

---

## Frontend — @mindbridge/web

**Стек**: Next.js 14 App Router, TypeScript, Tailwind CSS 3.4, shadcn/ui (Radix UI), react-hook-form, zod, js-cookie, date-fns, lucide-react, @tanstack/react-query (установлен), next-intl (настроен).

### Конфиги

**next.config.mjs**:
```javascript
import createNextIntlPlugin from 'next-intl/plugin';
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');
const nextConfig = { transpilePackages: ['@mindbridge/types'], reactStrictMode: true };
export default withNextIntl(nextConfig);
```

**tsconfig.json** — path aliases: `"@/*" → ["./src/*"]`

**shared/config/env.ts**:
```typescript
export const env = { apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001' }
```

### Архитектура: Feature Sliced Design

```
src/
├── app/            Next.js маршруты и лейауты
├── views/          Page-level compositions
├── widgets/        Составные UI-блоки
├── features/       Пользовательские действия
├── entities/       Бизнес-сущности (хуки + модели)
├── shared/         Переиспользуемая инфра (api, ui, lib, config)
├── providers/      React Context провайдеры
└── i18n/           next-intl конфиг
```

### Роутинг

```
/                                     → redirect → /dashboard
/login                                → LoginPage → LoginForm
/register                             → RegisterPage → RegisterForm
/dashboard                            → DashboardLayout → DashboardPage
/dashboard/chat                       → DashboardLayout → ChatSessionsPage
/dashboard/chat/[sessionId]           → DashboardLayout → ChatPage
/dashboard/chat/[sessionId]/analysis  → DashboardLayout → SessionAnalysisPage
```

**middleware.ts** (`matcher: ['/dashboard/:path*', '/login', '/register']`):
- Без cookie `token` + `/dashboard/*` → редирект на `/login`
- С cookie `token` + `/login` или `/register` → редирект на `/dashboard`

**Root Layout** (`app/layout.tsx`) — Server Component:
```tsx
const messages = await getMessages(); // next-intl
<html lang="en"><body className={inter.className}>
  <NextIntlClientProvider messages={messages}>
    <QueryProvider>{children}</QueryProvider>
  </NextIntlClientProvider>
</body></html>
```

**Dashboard Layout** (`app/dashboard/layout.tsx`):
```tsx
<DashboardLayout>{children}</DashboardLayout>
```

### i18n

`src/i18n/request.ts` — без URL-роутинга (локаль не в пути URL):
```typescript
// Порядок определения локали:
// 1. cookie 'locale'
// 2. Accept-Language header
// 3. дефолт 'en'
// Доступные: ['en', 'ru']
export default getRequestConfig(async () => {
  // ...
  return { locale, messages: (await import(`../../messages/${locale}.json`)).default }
})
```

Переводы `messages/{en,ru}.json` — разделы: `common`, `auth`, `chat`, `mood`, `dashboard`, `therapist`.

### Провайдеры

**providers/query-provider.tsx** (Client Component):
```tsx
// QueryClient: staleTime 60_000ms, retry 1, refetchOnWindowFocus false
<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
```

### API Client — shared/api/client.ts

Fetch-обёртка. Все запросы добавляют `Authorization: Bearer <token>` из cookie `token`. Ошибки → `ApiError extends Error { status: number, data: unknown }`.

```typescript
apiClient.get<T>(path):             Promise<T>
apiClient.post<T>(path, body?):     Promise<T>
apiClient.put<T>(path, body?):      Promise<T>
apiClient.delete<T>(path):          Promise<T>

// Функции:
login(dto)                          → AuthResponse
register(dto)                       → AuthResponse
getMe()                             → UserDto
createSession()                     → SessionWithMessagesDto
getSessions(page, limit, status?)   → PaginatedSessionsDto
getSession(sessionId)               → SessionWithMessagesDto
sendMessage(sessionId, content)     → { id: string, content: string }
endSession(sessionId)               → void
getAnalysis(sessionId)              → SessionAnalysisDto
deleteSession(sessionId)            → void
getAuthToken()                      → string | undefined  // для SSE EventSource URL
```

### Entities слой

> Все хуки написаны вручную через `useState + useEffect + useCallback`. React Query пока не используется.

**entities/user/model.ts** — `useUser()`:
```typescript
// Читает cookie 'token'. Если нет — user=null
// Вызывает getMe() при наличии токена
{ user: UserDto | null, isLoading, error, mutate: () => void }
```

**entities/session/model.ts**:
```typescript
useSessions(page=1, limit=20): { data: PaginatedSessionsDto | null, isLoading, error, mutate }
useSession(sessionId):          { session: SessionWithMessagesDto | null, isLoading, error, mutate }
```

**entities/analysis/model.ts**:
```typescript
useAnalysis(sessionId): { analysis: SessionAnalysisDto | null, isLoading, error, mutate }
```

### Features слой

#### features/auth/

**LoginForm**: `react-hook-form + zod` схема `{ email, password }`. POST /auth/login → `Cookies.set('token', access_token, { expires: 7 })` → redirect `/dashboard`.

**RegisterForm**: аналогично. POST /auth/register → сохранить токен → redirect `/dashboard`.

**LogoutButton**: `Cookies.remove('token')` → redirect `/login`.

#### features/chat/

**StartSessionButton**: POST /chat/sessions → redirect `/dashboard/chat/{id}`.

**EndSessionButton**: кнопка с disabled во время стриминга, вызывает проброшенный `onEnd()`.

**SendMessageForm**: Textarea + кнопка Send. `Enter` = отправить, `Shift+Enter` = новая строка. Callback `onSend(content: string)`.

**useChatStream**:
```typescript
interface Options  { sessionId, initialMessages?, enabled? }
interface Returns  { messages, streamingContent, isStreaming, isConnected, analysisReady, addUserMessage }

// Открывает EventSource на /chat/sessions/{id}/stream?token={jwt}
// Обработка событий:
//   token           → накапливает streamingContent в ref, setIsStreaming(true)
//   message_complete → финализирует сообщение в messages[], сбрасывает streamingContent
//   analysis_ready  → setAnalysisReady(true)
//   error           → сбрасывает streaming
//   keepalive       → игнорирует
// Cleanup: es.close() при размонтировании
```

### Widgets слой

**DashboardLayout**:
- `useUser()` → если error и нет user → `router.push('/login')`
- Пока загружается → centered spinner
- Layout: `<Header user={user} />` (fixed top, h=16) + `<Sidebar />` (fixed left, w=64) + `<main className="pl-64 pt-16">`

**Header**: аватар (AvatarFallback = первая буква email), DropdownMenu с LogoutButton.

**Sidebar**: навигация с `Button variant="ghost"`:
- Dashboard → `/dashboard`
- CBT Sessions → `/dashboard/chat`
- Settings → `/dashboard/settings` (страницы нет)

Активный пункт: `bg-muted font-medium`.

**ChatWindow**: `ScrollArea` → `MessageBubble` список + `StreamingBubble`. Auto-scroll через `bottomRef.scrollIntoView({ behavior: 'smooth' })`.

`MessageBubble`: user — справа, primary bg; assistant — слева, muted bg. Иконки `User` / `Bot`.

`StreamingBubble`: muted bg, анимированный курсор `animate-pulse`.

**AnalysisReport**: отображает `SessionAnalysisDto`:
- Progress Summary
- Cognitive Distortions (type, description, example, frequency badge)
- Emotional Track (intensity timeline)
- Themes и Triggers (badge lists)
- Recommendations (numbered list)
- Homework (если не null)
- Therapist Brief

### Views слой

**DashboardPage**: заглушка, 3 карточки (Welcome, Getting Started, Help). Отображает `user.email`. Реальных данных нет.

**ChatSessionsPage**:
- Header + `StartSessionButton`
- Список из `useSessions()` — карточки: title, дата (date-fns), status Badge
- Клик → `/dashboard/chat/{id}`
- BarChart3 кнопка → `/dashboard/chat/{id}/analysis` (только `completed`)
- Trash2 кнопка → `deleteSession()` + mutate
- Skeleton при загрузке, empty state

**ChatPage** (`{ sessionId }`):
```
useSession(sessionId)    → session data + mutate
useChatStream(...)       → messages, streamingContent, isStreaming, analysisReady

handleSend(content):
  sendMessage(sessionId, content) → msg → addUserMessage(msg)

handleEnd():
  endSession(sessionId) → mutate()

Рендер:
  [header: title, status, EndSessionButton if active, "View Analysis" if completed|analysisReady]
  [ChatWindow messages + streamingContent]
  [SendMessageForm if active | "Session ended" banner if not active]
```

**SessionAnalysisPage**: `useAnalysis(sessionId)` → `AnalysisReport`.

### Shared UI

shadcn/ui компоненты (Radix UI + Tailwind CVA):

`Button`, `Input`, `Label`, `Textarea`, `Card` / `CardHeader` / `CardTitle` / `CardDescription` / `CardContent` / `CardFooter`, `Badge`, `Avatar` / `AvatarImage` / `AvatarFallback`, `Dialog` / `DialogContent` / `DialogHeader` / `DialogTitle`, `DropdownMenu`, `Progress`, `ScrollArea`, `Separator`, `Sheet`, `Skeleton`, `Tabs` / `TabsList` / `TabsTrigger` / `TabsContent`.

`shared/lib/utils.ts`: `cn(...inputs) = twMerge(clsx(inputs))`

---

## Кодовый стиль

**Prettier**: single quotes, trailing commas (all), 2 пробела, 100 символов, semicolons.

**ESLint**: алфавитные группы импортов:
```
builtin → external → @mindbridge/* → @/* (internal) → ../ (parent) → ./ (sibling)
```
Между группами — пустая строка. `consistent-type-imports` — обязателен `import type`. `no-console`: warn. Unused vars разрешены с `_` префиксом.

**TypeScript конфиги**:
- `tsconfig/base.json` — strict, ES2021, decoratorMetadata
- `tsconfig/nextjs.json` — extends base, JSX preserve, noEmit
- `tsconfig/nestjs.json` — extends base, CommonJS, emitDecoratorMetadata, outDir dist/

---

## Что реализовано и что нет

| Область | Статус |
|---|---|
| Регистрация / логин / JWT | ✅ Готово |
| AI-чат (CBT, streaming SSE) | ✅ Готово |
| CBT-анализ сессии | ✅ Готово |
| Dashboard UI | ⚠️ Заглушка |
| UserRole в User entity и JWT | ❌ Нет |
| MoodTracker (entity, API, UI) | ❌ Только типы |
| Therapist модуль | ❌ Только типы |
| Reports (Claude генерация) | ❌ Только типы |
| Locale switcher EN/RU | ❌ next-intl настроен, компонента нет |
| /dashboard/settings | ❌ Ссылка есть, страницы нет |
| React Query в хуках | ❌ Установлен, хуки написаны вручную |
| DB migrations | ❌ synchronize: true (dev) |
| Тесты | ❌ Отсутствуют |
