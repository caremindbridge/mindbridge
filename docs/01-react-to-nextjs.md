# От React к Next.js 14: что нового и зачем

> Эта статья написана для разработчиков, которые уже знают React и хотят разобраться в Next.js.
> Все примеры кода взяты из реального проекта **MindBridge** -- Turborepo-монорепозиторий
> с Next.js-фронтендом (`apps/web`) и NestJS-бэкендом (`apps/api`).

---

## Содержание

1. [Что такое Next.js и зачем он нужен, если есть React](#1-что-такое-nextjs-и-зачем-он-нужен-если-есть-react)
2. [App Router vs Pages Router](#2-app-router-vs-pages-router)
3. [Server Components vs Client Components](#3-server-components-vs-client-components)
4. [Роутинг в Next.js](#4-роутинг-в-nextjs)
5. [Middleware -- перехватчик запросов](#5-middleware----перехватчик-запросов)
6. [Метаданные и SEO](#6-метаданные-и-seo)
7. [Шпаргалка: React vs Next.js](#7-шпаргалка-react-vs-nextjs)

---

## 1. Что такое Next.js и зачем он нужен, если есть React

### Короткий ответ

React -- это **библиотека** для построения пользовательских интерфейсов. Она отвечает за компоненты,
состояние, рендеринг. Но React **не решает** за тебя кучу вопросов:

- Как организовать роутинг?
- Как рендерить страницы на сервере (SSR)?
- Как оптимизировать загрузку шрифтов и картинок?
- Как настроить middleware для авторизации?
- Как работать с метаданными для SEO?

Next.js -- это **фреймворк поверх React**, который даёт ответы на все эти вопросы из коробки.

### Аналогия

Представь, что React -- это **двигатель** автомобиля. Мощный, надёжный, проверенный. Но чтобы поехать,
тебе ещё нужны колёса, руль, коробка передач, приборная панель, кузов. Можно собрать всё самому
(и многие так делают), а можно взять готовый автомобиль.

**Next.js -- это автомобиль**, в который уже встроен React-двигатель. Ты садишься и едешь.

### Что даёт Next.js

| Возможность | React (голый) | Next.js |
|---|---|---|
| Роутинг | react-router-dom (ставишь сам) | Файловый роутинг из коробки |
| SSR / SSG | Нужен свой сервер | Встроено |
| Middleware | Нет | `middleware.ts` |
| Оптимизация шрифтов | Вручную | `next/font` |
| Оптимизация картинок | Вручную | `<Image>` компонент |
| SEO метаданные | react-helmet или вручную | `export const metadata` |
| API Routes | Нет (нужен отдельный бэкенд) | Можно создать прямо в проекте |
| Code Splitting | Настраиваешь сам | Автоматически |

### В нашем проекте MindBridge

Наш фронтенд (`apps/web`) -- это Next.js-приложение. Мы используем:

- **App Router** (новый подход к роутингу, появился в Next.js 13)
- **Server Components** (по умолчанию)
- **Client Components** (для интерактивных элементов -- формы, хуки)
- **Middleware** (для защиты маршрутов)
- **next/font** (для оптимизации шрифтов)

Бэкенд у нас отдельный (NestJS), но Next.js позволяет при желании создавать API-эндпоинты
прямо внутри фронтенда через Route Handlers. Мы этого не делаем, потому что для серьёзного
бэкенда лучше использовать специализированный фреймворк.

---

## 2. App Router vs Pages Router

### Немного истории

В Next.js долгое время существовал один способ создания маршрутов -- **Pages Router**.
Файлы клались в папку `pages/`, и каждый файл автоматически становился маршрутом:

```
pages/
  index.tsx       -> /
  about.tsx       -> /about
  dashboard.tsx   -> /dashboard
```

Это было просто и понятно. Но в Next.js 13 появился **App Router** -- принципиально
новый подход. Именно его мы используем в MindBridge.

### Главное отличие: папка = маршрут

В App Router маршрут определяется не файлом, а **папкой**. Внутри папки лежит файл
`page.tsx`, который и является содержимым страницы:

```
app/
  page.tsx              -> /
  login/
    page.tsx            -> /login
  register/
    page.tsx            -> /register
  dashboard/
    page.tsx            -> /dashboard
    layout.tsx          -> обёртка для /dashboard/*
```

### Зачем папки вместо файлов?

Потому что рядом с `page.tsx` можно положить другие специальные файлы:

| Файл | Назначение |
|---|---|
| `page.tsx` | Содержимое страницы (обязательный) |
| `layout.tsx` | Обёртка, которая НЕ перемонтируется при навигации |
| `loading.tsx` | UI загрузки (показывается пока грузится `page.tsx`) |
| `error.tsx` | Обработка ошибок (Error Boundary) |
| `not-found.tsx` | Страница 404 |

Это как иметь встроенные `<Suspense>`, `<ErrorBoundary>` и лейаут-компонент,
но без необходимости писать их вручную.

### Корневой layout -- точка входа

В App Router обязательно должен быть корневой `layout.tsx` в папке `app/`.
Это аналог того, что в обычном React-проекте делает `index.html` + `App.tsx`.

Вот как выглядит наш корневой layout в MindBridge:

```typescript
// apps/web/src/app/layout.tsx

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'MindBridge',
  description: 'MindBridge - Connect, Learn, Grow',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
```

Разберём по строчкам:

1. **`import { Inter } from 'next/font/google'`** -- Next.js сам скачивает и оптимизирует
   шрифт. Никаких `<link>` в head, никаких FOUT (Flash of Unstyled Text). В чистом React
   ты бы добавлял шрифт через CSS или вручную подключал в HTML.

2. **`export const metadata`** -- метаданные страницы для SEO. Подробнее об этом ниже.

3. **`RootLayout`** принимает `children` -- это содержимое текущей страницы. Layout
   оборачивает все страницы и **не перемонтируется** при навигации. Это значит, что если
   у тебя в layout есть какой-то стейт (например, тема), он не сбросится при переходе
   между страницами.

### Вложенные layouts

А теперь самое интересное. Layouts можно вкладывать друг в друга. У нас есть
`app/dashboard/layout.tsx`, который оборачивает **все страницы внутри `/dashboard/`**:

```typescript
// apps/web/src/app/dashboard/layout.tsx

import { DashboardLayout } from '@/widgets/dashboard-layout';

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
```

Что происходит при переходе на `/dashboard`:

1. Рендерится `app/layout.tsx` (корневой layout -- `<html>`, `<body>`, шрифт)
2. Внутри него рендерится `app/dashboard/layout.tsx` (дашборд layout -- шапка, сайдбар)
3. Внутри него рендерится `app/dashboard/page.tsx` (содержимое страницы)

```
RootLayout (html, body, шрифт)
  └── DashboardLayout (шапка, сайдбар)
        └── DashboardPage (контент)
```

При переходе с `/dashboard` на `/dashboard/settings` перемонтируется только `page.tsx`.
Шапка и сайдбар остаются на месте. В React для этого тебе пришлось бы делать
вложенные `<Route>` в react-router и следить за структурой самому.

### Сравнение: Pages Router vs App Router

| Аспект | Pages Router | App Router |
|---|---|---|
| Папка | `pages/` | `app/` |
| Маршрут | Файл = маршрут | Папка + `page.tsx` = маршрут |
| Layouts | `_app.tsx` (глобальный) | Вложенные `layout.tsx` |
| Загрузка | `_loading` (нет) | `loading.tsx` |
| Ошибки | `_error.tsx` (глобальный) | `error.tsx` (на уровне маршрута) |
| Компоненты | Все клиентские | По умолчанию серверные |
| Рекомендация | Legacy | Рекомендуемый подход |

---

## 3. Server Components vs Client Components

Это, пожалуй, **самое большое отличие** Next.js от обычного React. И самая частая
причина путаницы у новичков.

### В обычном React

В стандартном React-приложении (Create React App, Vite) **все компоненты клиентские**.
Это значит, что весь JavaScript отправляется в браузер, и компоненты рендерятся на стороне
клиента. Пользователь получает пустой HTML, потом грузится JS-бандл, и только потом
появляется контент.

### В Next.js App Router

По умолчанию **все компоненты серверные** (React Server Components, RSC). Они:

- Рендерятся на сервере
- **Не** отправляют свой JavaScript в браузер
- Могут напрямую обращаться к БД, файловой системе, переменным окружения
- **Не** могут использовать хуки (`useState`, `useEffect`) и обработчики событий (`onClick`)

Чтобы сделать компонент клиентским, нужно добавить директиву `'use client'` в начало файла.

### Когда что использовать?

| Нужно | Тип компонента | Почему |
|---|---|---|
| Показать статичный контент | Server | Нет JS в бандле, быстрая загрузка |
| Получить данные из БД/API | Server | Прямой доступ, без водопада запросов |
| Layout страницы | Server | Обычно нет интерактивности |
| Форма с вводом данных | Client | Нужны useState, обработчики событий |
| Использовать useEffect | Client | Хуки работают только на клиенте |
| Использовать useRouter | Client | Хук навигации -- клиентский |
| Обработать onClick | Client | События -- это клиентская территория |

### Как это выглядит в MindBridge

Вот отличный пример из нашего проекта. Страница логина -- **серверный** компонент:

```typescript
// apps/web/src/app/login/page.tsx
// Серверный компонент (нет 'use client')

import { LoginForm } from '@/features/auth';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <LoginForm />
    </div>
  );
}
```

Обрати внимание: здесь **нет** `'use client'`. Этот компонент серверный. Он просто
оборачивает `LoginForm` в div с центрированием. Никакого интерактивного JavaScript
тут не нужно.

А вот `LoginForm` -- уже **клиентский** компонент, потому что ему нужны хуки и обработчики:

```typescript
// apps/web/src/features/auth/login-form.tsx
'use client';  // <-- Директива! Этот компонент клиентский

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Cookies from 'js-cookie';
import { Button, Input, Label, Card, /* ... */ } from '@/shared/ui';
import { login } from '@/shared/api/client';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();              // Хук -> нужен 'use client'
  const [serverError, setServerError] = useState<string | null>(null); // useState -> нужен 'use client'
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {  // Обработчик -> нужен 'use client'
    try {
      setIsSubmitting(true);
      setServerError(null);
      const response = await login(data);
      Cookies.set('token', response.access_token, { expires: 7 });
      router.push('/dashboard');
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      {/* ... форма с полями ввода и кнопкой ... */}
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Содержимое формы */}
      </form>
    </Card>
  );
}
```

Почему `LoginForm` клиентский? Потому что использует:

- `useState` -- для хранения ошибок и состояния отправки
- `useRouter` -- для навигации после успешного логина
- `useForm` -- для управления формой
- `onSubmit` -- обработчик события

### Ещё пример: DashboardLayout

Наш `DashboardLayout` -- тоже клиентский компонент:

```typescript
// apps/web/src/widgets/dashboard-layout/dashboard-layout.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/entities/user';
import { Header } from '@/widgets/header';
import { Sidebar } from '@/widgets/sidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, isLoading, error } = useUser();  // Кастомный хук -> 'use client'
  const router = useRouter();

  useEffect(() => {                               // useEffect -> 'use client'
    if (!isLoading && !user && error) {
      router.push('/login');
    }
  }, [isLoading, user, error, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />
      <Sidebar />
      <main className="pl-64 pt-16">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
```

Здесь `'use client'` нужен потому что:

1. **`useUser()`** -- кастомный хук, который внутри использует `useState` и `useEffect`
2. **`useRouter()`** -- хук навигации
3. **`useEffect()`** -- для редиректа при отсутствии пользователя

### Граница клиент-сервер

Важное правило: когда ты помечаешь компонент как `'use client'`, **все компоненты,
которые он импортирует, тоже становятся клиентскими**. Это называется "граница клиент-сервер".

```
LoginPage (server)           -- на сервере, JS не отправляется в бандл
  └── LoginForm (client)     -- на клиенте, JS в бандле
        ├── Button (client)  -- тоже клиентский (импортирован из 'use client')
        ├── Input (client)   -- тоже клиентский
        └── Card (client)    -- тоже клиентский
```

Поэтому хорошая практика -- **держать `'use client'` как можно глубже** в дереве компонентов.
Не надо ставить `'use client'` на `page.tsx`, если можно вынести интерактивную часть
в отдельный компонент.

Именно так мы и делаем в MindBridge:

- `app/login/page.tsx` -- **серверный** (просто рендерит LoginForm)
- `features/auth/login-form.tsx` -- **клиентский** (формы, хуки, интерактив)

### Мысленная модель

Думай об этом так:

- **Серверные компоненты** -- это шаблоны. Они генерируют HTML на сервере и отправляют
  готовую разметку. Как PHP-шаблоны, только на React.
- **Клиентские компоненты** -- это привычные React-компоненты. Они работают в браузере,
  реагируют на действия пользователя, хранят состояние.

Серверные компоненты -- это "оболочка", клиентские -- "начинка" с интерактивностью.

---

## 4. Роутинг в Next.js

### В обычном React

В стандартном React-приложении для роутинга ты используешь `react-router-dom`:

```tsx
// Типичный React-роутинг
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
```

Ты сам определяешь маршруты, оборачиваешь в `<BrowserRouter>`, передаёшь компоненты.
Это работает, но требует ручной настройки и не даёт SSR из коробки.

### В Next.js

В Next.js маршруты определяются **структурой файлов**. Никаких `<Route>`, никакого
`react-router-dom`:

```
apps/web/src/app/
  page.tsx            ->  /
  login/
    page.tsx          ->  /login
  register/
    page.tsx          ->  /register
  dashboard/
    layout.tsx        ->  обёртка для всех /dashboard/*
    page.tsx          ->  /dashboard
```

Создал папку, положил `page.tsx` -- маршрут готов. Готово.

### Как это выглядит у нас

Страница `/login`:

```typescript
// apps/web/src/app/login/page.tsx

import { LoginForm } from '@/features/auth';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <LoginForm />
    </div>
  );
}
```

Страница `/register`:

```typescript
// apps/web/src/app/register/page.tsx

import { RegisterForm } from '@/features/auth';

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <RegisterForm />
    </div>
  );
}
```

Страница `/dashboard`:

```typescript
// apps/web/src/app/dashboard/page.tsx

import { DashboardPage } from '@/views/dashboard';

export default function DashboardRoute() {
  return <DashboardPage />;
}
```

Корневая страница `/` -- просто редирект:

```typescript
// apps/web/src/app/page.tsx

import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/dashboard');
}
```

Заметь, как просто сделан редирект. Функция `redirect()` из `next/navigation` работает
и на сервере, и на клиенте. В React тебе бы понадобился `<Navigate>` из react-router
или `useEffect` с `useNavigate`.

### Навигация: три способа

В Next.js есть три основных способа навигации:

#### 1. Компонент `<Link>` -- для ссылок в JSX

```typescript
// apps/web/src/widgets/sidebar/sidebar.tsx
'use client';

import Link from 'next/link';          // Не react-router-dom!
import { usePathname } from 'next/navigation';

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();       // Аналог useLocation().pathname

  return (
    <aside>
      <nav>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Button key={item.href} asChild>
              <Link href={item.href}>   {/* <-- Навигация через Link */}
                <item.icon />
                {item.label}
              </Link>
            </Button>
          );
        })}
      </nav>
    </aside>
  );
}
```

**Отличия `<Link>` в Next.js от react-router:**

| react-router | Next.js |
|---|---|
| `import { Link } from 'react-router-dom'` | `import Link from 'next/link'` |
| `<Link to="/dashboard">` | `<Link href="/dashboard">` |
| `to` | `href` |

#### 2. Хук `useRouter()` -- для программной навигации

```typescript
// apps/web/src/features/auth/login-form.tsx
'use client';

import { useRouter } from 'next/navigation';  // Не next/router!

export function LoginForm() {
  const router = useRouter();

  const onSubmit = async (data: LoginFormValues) => {
    const response = await login(data);
    Cookies.set('token', response.access_token, { expires: 7 });
    router.push('/dashboard');    // Программный переход
  };

  // ...
}
```

**Важно:** импортируй `useRouter` из `next/navigation`, а не из `next/router`.
Второй -- это Pages Router, он тебе не нужен в App Router.

Методы `useRouter()`:

| Метод | Что делает |
|---|---|
| `router.push('/path')` | Переход на страницу (добавляет в историю) |
| `router.replace('/path')` | Переход без добавления в историю |
| `router.back()` | Назад в истории |
| `router.forward()` | Вперёд в истории |
| `router.refresh()` | Обновить текущий маршрут (перезапросить данные) |

#### 3. Функция `redirect()` -- для серверных редиректов

```typescript
// apps/web/src/app/page.tsx
import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/dashboard');  // Серверный редирект, работает в Server Components
}
```

`redirect()` можно вызывать в серверных компонентах, в Route Handlers и в Server Actions.
Это серверный редирект -- клиент сразу получает правильный URL.

### Хуки навигации: сравнение

| react-router-dom | Next.js (App Router) | Назначение |
|---|---|---|
| `useNavigate()` | `useRouter()` | Программная навигация |
| `useLocation()` | `usePathname()` | Текущий путь |
| `useParams()` | `useParams()` | Параметры маршрута |
| `useSearchParams()` | `useSearchParams()` | Query-параметры |
| `<Navigate to="..." />` | `redirect(...)` | Редирект |

### Специальные файлы в маршруте

Каждая папка-маршрут может содержать специальные файлы. Представь их как встроенные
обёртки, которые Next.js автоматически оборачивает вокруг `page.tsx`:

```
app/dashboard/
  layout.tsx      -- Обёртка (шапка, сайдбар, навигация)
  loading.tsx     -- Показывается пока грузится page.tsx
  error.tsx       -- Показывается при ошибке рендеринга
  not-found.tsx   -- Показывается при 404
  page.tsx        -- Собственно содержимое страницы
```

Это как если бы Next.js автоматически оборачивал твой `page.tsx` в:

```tsx
<Layout>
  <ErrorBoundary fallback={<Error />}>
    <Suspense fallback={<Loading />}>
      <Page />
    </Suspense>
  </ErrorBoundary>
</Layout>
```

В React ты бы писал всё это сам. В Next.js -- просто создаёшь файлы с правильными
именами, и фреймворк делает остальное.

---

## 5. Middleware -- перехватчик запросов

### Проблема: защита маршрутов

В любом приложении с авторизацией нужно защищать маршруты. Неавторизованный пользователь
не должен попасть на `/dashboard`, а авторизованный не должен видеть `/login`.

### Как это делается в React

В обычном React ты создаёшь компонент-обёртку:

```tsx
// Типичный React-подход
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <Spinner />;
  if (!user) return <Navigate to="/login" />;

  return children;
}

// Использование
<Route path="/dashboard" element={
  <PrivateRoute>
    <Dashboard />
  </PrivateRoute>
} />
```

Проблема в том, что сначала загружается страница, потом компонент проверяет авторизацию,
и только потом делает редирект. Пользователь может увидеть мелькание контента.

### Как это делается в Next.js: Middleware

В Next.js есть файл `middleware.ts`, который перехватывает запросы **до того, как
страница начнёт рендериться**. Он работает на Edge -- это серверная среда выполнения,
максимально близкая к пользователю.

Вот наш middleware в MindBridge:

```typescript
// apps/web/src/middleware.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // Если пользователь идёт на /dashboard без токена -> отправляем на /login
  if (pathname.startsWith('/dashboard') && !token) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Если пользователь уже залогинен и идёт на /login или /register -> отправляем на /dashboard
  if ((pathname === '/login' || pathname === '/register') && token) {
    const dashboardUrl = new URL('/dashboard', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  // Всё ок, пропускаем запрос дальше
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/register'],
};
```

### Разбор по частям

#### 1. Функция `middleware`

```typescript
export function middleware(request: NextRequest) {
```

Экспортируется функция с именем `middleware`. Она принимает объект запроса `NextRequest`,
который содержит URL, cookies, headers и другую информацию.

#### 2. Проверка токена

```typescript
const token = request.cookies.get('token')?.value;
```

Мы проверяем, есть ли cookie `token`. Наш фронтенд сохраняет JWT-токен в cookie
после успешного логина (смотри `LoginForm`).

#### 3. Логика перенаправления

```typescript
// Не авторизован + идёт на дашборд -> на логин
if (pathname.startsWith('/dashboard') && !token) {
  return NextResponse.redirect(new URL('/login', request.url));
}

// Авторизован + идёт на логин -> на дашборд
if ((pathname === '/login' || pathname === '/register') && token) {
  return NextResponse.redirect(new URL('/dashboard', request.url));
}
```

Две простые проверки:
- Нет токена и идёт на защищённую страницу -- редирект на логин
- Есть токен и идёт на страницу авторизации -- редирект на дашборд

#### 4. Matcher -- на какие маршруты срабатывает

```typescript
export const config = {
  matcher: ['/dashboard/:path*', '/login', '/register'],
};
```

Matcher определяет, для каких URL запускается middleware. Мы не хотим проверять
авторизацию для статических файлов, картинок или API. Только для:

- `/dashboard/:path*` -- дашборд и все вложенные маршруты (`/dashboard/settings` и т.д.)
- `/login` -- страница входа
- `/register` -- страница регистрации

`:path*` -- это wildcard, означающий "любой подпуть". То есть `/dashboard`,
`/dashboard/settings`, `/dashboard/profile/edit` -- всё попадает под этот паттерн.

### Аналогия

Middleware -- это **охранник на входе в здание**.

- Ты подходишь к двери (запрос на URL)
- Охранник проверяет твой пропуск (cookie с токеном)
- Если пропуск есть -- пропускает внутрь (NextResponse.next())
- Если пропуска нет -- отправляет на стойку регистрации (redirect на /login)
- Если ты уже внутри и пытаешься снова зайти через регистрацию -- говорит "ты уже внутри" (redirect на /dashboard)

И самое главное: охранник работает **до того, как ты увидишь что-либо внутри**. Никакого
мелькания контента, никакого "загрузка... ой, у вас нет доступа".

### Где лежит middleware.ts

Файл `middleware.ts` должен лежать в **корне** проекта Next.js (или в `src/`, если
используется). У нас -- `apps/web/src/middleware.ts`.

Важно: файл может быть только **один** на весь проект. Нельзя создать отдельные
middleware для разных маршрутов. Вместо этого используется matcher и условная логика
внутри функции.

### Двойная защита в MindBridge

В нашем проекте защита авторизации работает на двух уровнях:

1. **Middleware** (серверный) -- перехватывает запрос до рендеринга, проверяет наличие
   cookie. Это быстрая проверка: "есть ли токен вообще?"

2. **DashboardLayout** (клиентский) -- после рендеринга делает запрос к API (`/auth/me`),
   чтобы проверить, что токен **валидный**. Если API вернул ошибку (токен истёк или
   недействителен), перенаправляет на логин.

```typescript
// apps/web/src/widgets/dashboard-layout/dashboard-layout.tsx
'use client';

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, isLoading, error } = useUser();  // Запрос к /auth/me
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user && error) {
      router.push('/login');  // Токен невалидный -> на логин
    }
  }, [isLoading, user, error, router]);

  // ...
}
```

Middleware проверяет **наличие** токена (быстро, на edge).
DashboardLayout проверяет **валидность** токена (медленнее, но точнее).

---

## 6. Метаданные и SEO

### Проблема

В одностраничном React-приложении SEO -- это боль. Страница приходит с пустым `<head>`,
поисковые роботы не видят ни title, ни description.

Обычные решения:

```tsx
// React: react-helmet
import { Helmet } from 'react-helmet';

function MyPage() {
  return (
    <>
      <Helmet>
        <title>My Page</title>
        <meta name="description" content="My page description" />
      </Helmet>
      <div>Content</div>
    </>
  );
}
```

Это работает, но требует дополнительной библиотеки и настройки SSR для поисковых роботов.

### В Next.js

В Next.js метаданные -- это просто **экспорт объекта** из серверного компонента:

```typescript
// apps/web/src/app/layout.tsx

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'MindBridge',
  description: 'MindBridge - Connect, Learn, Grow',
};
```

Вот и всё. Никаких библиотек, никаких хуков. Next.js автоматически вставит эти данные
в `<head>` страницы при серверном рендеринге.

### Что можно указать в metadata

```typescript
export const metadata: Metadata = {
  title: 'MindBridge',
  description: 'MindBridge - Connect, Learn, Grow',

  // Open Graph (для социальных сетей)
  openGraph: {
    title: 'MindBridge',
    description: 'Connect, Learn, Grow',
    type: 'website',
  },

  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    title: 'MindBridge',
  },

  // Иконки
  icons: {
    icon: '/favicon.ico',
  },

  // Robots
  robots: {
    index: true,
    follow: true,
  },
};
```

### Метаданные на уровне страницы

Каждая страница может определить свои метаданные, которые **перезапишут** данные из layout:

```typescript
// apps/web/src/app/login/page.tsx (гипотетический пример)

export const metadata: Metadata = {
  title: 'Login | MindBridge',
  description: 'Sign in to your MindBridge account',
};

export default function LoginPage() {
  return <LoginForm />;
}
```

Next.js автоматически мерджит метаданные: берёт из layout и перезаписывает теми,
что определены на уровне страницы.

### Динамические метаданные

Для страниц, где метаданные зависят от данных (профиль пользователя, статья), есть
функция `generateMetadata`:

```typescript
// Пример для динамической страницы
export async function generateMetadata({ params }: { params: { id: string } }) {
  const article = await getArticle(params.id);

  return {
    title: `${article.title} | MindBridge`,
    description: article.excerpt,
  };
}
```

В React для этого пришлось бы городить целую инфраструктуру. В Next.js -- одна функция.

---

## 7. Шпаргалка: React vs Next.js

### Концепции

| Концепция | React (SPA) | Next.js (App Router) |
|---|---|---|
| Точка входа | `index.tsx` + `App.tsx` | `app/layout.tsx` + `app/page.tsx` |
| Роутинг | `react-router-dom` | Файловая система (`app/` папки) |
| Layout | Вручную через компоненты | `layout.tsx` (вложенные, автоматические) |
| Защита маршрутов | `PrivateRoute` HOC | `middleware.ts` |
| SEO / meta | `react-helmet` | `export const metadata` |
| Стили | CSS Modules, styled-components | CSS Modules, Tailwind (из коробки) |
| Шрифты | `<link>` в HTML | `next/font` |
| Картинки | `<img>` | `<Image>` (оптимизация) |
| Редирект | `<Navigate>` / `useNavigate` | `redirect()` / `useRouter().push()` |

### Импорты

| Откуда | React | Next.js |
|---|---|---|
| Навигация | `react-router-dom` | `next/navigation` |
| Ссылка | `import { Link } from 'react-router-dom'` | `import Link from 'next/link'` |
| Параметры URL | `useParams()` из react-router | `useParams()` из `next/navigation` |
| Query-параметры | `useSearchParams()` из react-router | `useSearchParams()` из `next/navigation` |
| Текущий путь | `useLocation().pathname` | `usePathname()` из `next/navigation` |
| Роутер | `useNavigate()` | `useRouter()` из `next/navigation` |

### Рендеринг

| Аспект | React (SPA) | Next.js |
|---|---|---|
| Где рендерится | Только в браузере | Сервер + браузер |
| Начальная загрузка | Пустой HTML + JS бандл | Готовый HTML с сервера |
| Компоненты по умолчанию | Все клиентские | Серверные (без `'use client'`) |
| JavaScript в бандле | Весь код | Только `'use client'` компоненты |
| Data fetching | useEffect + useState | Прямо в серверных компонентах |

### Структура проекта

```
React (SPA):                      Next.js (App Router):
src/                              src/
  components/                       app/
    Header.tsx                        layout.tsx        <- Корневой layout
    Sidebar.tsx                       page.tsx          <- Главная /
  pages/                              login/
    Login.tsx                           page.tsx        <- /login
    Dashboard.tsx                     dashboard/
  App.tsx         <- Роутинг            layout.tsx      <- Layout дашборда
  index.tsx       <- Точка входа        page.tsx        <- /dashboard
                                    middleware.ts       <- Перехватчик запросов
```

### Быстрые правила

1. **Файл `page.tsx` в папке `app/`** = маршрут. Не нужно нигде регистрировать.

2. **`'use client'` нужен**, если компонент использует:
   - `useState`, `useEffect`, `useRef` и другие хуки
   - `onClick`, `onChange` и другие обработчики событий
   - browser-only API (localStorage, window, document)

3. **`'use client'` НЕ нужен**, если компонент:
   - Просто рендерит JSX без интерактивности
   - Является layout-обёрткой
   - Получает и отображает данные

4. **`middleware.ts`** -- один файл на весь проект, лежит в корне `src/`.

5. **`metadata`** -- экспортируй из серверных компонентов (`page.tsx`, `layout.tsx`).

6. **`<Link href="...">`** -- не `to`, а `href`. Импорт из `next/link`, не из react-router.

7. **`useRouter()`** -- импорт из `next/navigation`, не из `next/router` (Pages Router).

---

## Заключение

Next.js -- это не замена React. Это **следующий уровень** работы с React. Ты продолжаешь
писать компоненты, использовать хуки, работать с состоянием -- но фреймворк берёт на себя
всё, что раньше приходилось настраивать вручную.

Основные идеи, которые стоит запомнить:

- **Файловый роутинг**: папка + `page.tsx` = маршрут
- **Server Components по умолчанию**: добавляй `'use client'` только когда нужно
- **Middleware**: перехватывай запросы до рендеринга
- **Layout**: используй вложенные layouts для общих обёрток
- **Metadata**: SEO из коробки, без библиотек

В следующей статье мы разберём NestJS -- бэкенд нашего проекта MindBridge. Если ты
фронтендер и никогда не писал серверный код, не переживай -- будет много аналогий
с React-концепциями.
