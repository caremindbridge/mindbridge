# Feature Sliced Design: архитектура фронтенда, которая масштабируется

> Практическое руководство на примере проекта MindBridge (Next.js 14 + App Router)

---

## Содержание

1. [Проблема: почему обычная структура не масштабируется](#1-проблема-почему-обычная-структура-не-масштабируется)
2. [Что такое Feature Sliced Design](#2-что-такое-feature-sliced-design)
3. [Слои FSD -- снизу вверх](#3-слои-fsd--снизу-вверх)
4. [Правило импортов -- ключевой принцип FSD](#4-правило-импортов--ключевой-принцип-fsd)
5. [FSD + Next.js App Router: как совместить](#5-fsd--nextjs-app-router-как-совместить)
6. [Как добавлять новые фичи по FSD](#6-как-добавлять-новые-фичи-по-fsd)
7. [Частые ошибки](#7-частые-ошибки)
8. [Шпаргалка](#8-шпаргалка)

---

## 1. Проблема: почему обычная структура не масштабируется

### Типичная структура React-проекта

Когда вы начинаете новый проект на React, структура обычно выглядит так:

```
src/
  components/
    Button.tsx
    Header.tsx
    Sidebar.tsx
    LoginForm.tsx
    UserAvatar.tsx
    DashboardCard.tsx
    SettingsPanel.tsx
    ... ещё 80 компонентов ...
  pages/
    Dashboard.tsx
    Login.tsx
    Settings.tsx
  hooks/
    useAuth.ts
    useUser.ts
    useFetch.ts
  utils/
    formatDate.ts
    cn.ts
    validators.ts
  services/
    api.ts
    authService.ts
  types/
    user.ts
    api.ts
```

На старте это работает отлично. Проект маленький, команда -- один-два человека, все помнят,
где что лежит.

### Что происходит через 6 месяцев

Проект растет. Приходят новые разработчики. И начинаются проблемы:

**"God components" -- компоненты-монстры.**
`Dashboard.tsx` на 500 строк, который сам загружает данные, управляет состоянием,
рендерит 10 секций и знает о 15 других файлах. Чтобы понять, что он делает, нужно
полчаса. Чтобы изменить -- час и молитва.

**Папка `components/` -- свалка.**
80 файлов в одной директории. `Button.tsx` (переиспользуемый UI) лежит рядом с
`InvoiceTable.tsx` (бизнес-логика). Нет разделения между общими компонентами и
доменными. Нет подсказок, что от чего зависит.

**Запутанные импорты.**
`LoginForm` импортирует `useAuth` из `hooks/`, `api` из `services/`, `Button` из
`components/`, типы из `types/`. А `useAuth` сам импортирует из `services/` и `utils/`.
Получается клубок зависимостей, где изменение одного файла может сломать десять других.

**Три главных вопроса**, на которые невозможно ответить:

1. **"Где этот компонент?"** -- в `components/`? В `pages/`? Может, внутри другого
   компонента?
2. **"Кто это использует?"** -- нужен полнотекстовый поиск по проекту, и даже он не
   всегда поможет.
3. **"Могу ли я безопасно это удалить/изменить?"** -- никто не знает. Обычно узнают
   после деплоя.

### Корневая причина

Проблема не в React и не в разработчиках. Проблема в отсутствии **правил организации
кода**. Папки `components/`, `hooks/`, `utils/` группируют файлы по _технической роли_
(это компонент, это хук, это утилита), а не по _бизнес-смыслу_ (это авторизация, это
дашборд, это настройки).

FSD решает именно эту проблему.

---

## 2. Что такое Feature Sliced Design

**Feature Sliced Design (FSD)** -- это методология организации фронтенд-кода. Не
библиотека, не фреймворк, а набор соглашений о том, _куда класть код_ и _что может от
чего зависеть_.

### Три ключевые идеи

#### 1. Слои (Layers) -- вертикальная иерархия

Весь код проекта разделен на слои, расположенные друг над другом. Каждый слой имеет
четкую зону ответственности:

```
app          -- инициализация приложения, роутинг
  pages      -- композиция целых страниц
    widgets  -- составные блоки интерфейса
      features  -- пользовательские действия
        entities  -- бизнес-сущности
          shared   -- фундамент (UI-кит, утилиты, API-клиент)
```

#### 2. Правило импортов -- направление зависимостей

Слой может импортировать **только из нижестоящих слоев**. Это главный закон FSD:

- `widgets` может импортировать из `features`, `entities`, `shared`
- `features` может импортировать из `entities`, `shared`
- `entities` может импортировать только из `shared`
- `shared` не импортирует ни из кого

Это правило делает архитектуру **предсказуемой**. Вы всегда знаете: если я меняю
`shared`, это может затронуть всех. Если я меняю `features/auth`, это затронет только
виджеты и страницы, которые используют авторизацию.

#### 3. Слайсы (Slices) и сегменты (Segments)

Внутри каждого слоя код группируется по **слайсам** -- доменным модулям:

```
features/
  auth/           <-- слайс "авторизация"
  profile/        <-- слайс "профиль"
  notifications/  <-- слайс "уведомления"
```

А внутри слайса код делится по **сегментам** -- техническому назначению:

```
features/auth/
  ui/        -- React-компоненты фичи
  model/     -- состояние, хуки, бизнес-логика
  api/       -- запросы к серверу
  lib/       -- вспомогательные утилиты
  config/    -- конфигурация
  index.ts   -- публичный API слайса
```

> **Примечание.** Не все сегменты обязательны. В небольших слайсах можно обойтись одним
> файлом вместо папки. В нашем проекте MindBridge мы используем плоскую структуру внутри
> слайсов -- файлы `login-form.tsx`, `model.ts` и так далее, без вложенных папок по
> сегментам.

### Структура проекта MindBridge

Вот как это выглядит в реальном проекте:

```
apps/web/src/
  app/                          -- Next.js App Router (роутинг)
    layout.tsx
    page.tsx                    -- redirect на /dashboard
    login/page.tsx              -- рендерит LoginForm из features
    register/page.tsx           -- рендерит RegisterForm из features
    dashboard/
      layout.tsx                -- рендерит DashboardLayout из widgets
      page.tsx                  -- рендерит DashboardPage из views

  views/                        -- FSD "pages" слой (композиция страниц)
    dashboard/
      dashboard-page.tsx        -- использует useUser() из entities, Card из shared
      index.ts

  widgets/                      -- составные блоки интерфейса
    header/
      header.tsx                -- Avatar, DropdownMenu из shared/ui + LogoutButton из features
      index.ts
    sidebar/
      sidebar.tsx               -- Button из shared/ui, навигация
      index.ts
    dashboard-layout/
      dashboard-layout.tsx      -- компонует Header + Sidebar + useUser
      index.ts

  features/                     -- пользовательские действия
    auth/
      login-form.tsx            -- react-hook-form + zod + shadcn
      register-form.tsx
      logout-button.tsx
      index.ts

  entities/                     -- бизнес-сущности
    user/
      model.ts                  -- хук useUser(), работа с API
      index.ts

  shared/                       -- переиспользуемый фундамент
    ui/                         -- shadcn/ui компоненты
    api/                        -- API-клиент, login(), register(), getMe()
    lib/                        -- утилита cn()
    config/                     -- переменные окружения
```

> **Почему `views/` а не `pages/`?** В нашем проекте FSD-слой композиции страниц
> называется `views/`, чтобы избежать путаницы с Next.js `app/` (App Router) или
> устаревшим `pages/` (Pages Router). По сути это тот же FSD-слой "pages", просто
> с другим именем директории.

---

## 3. Слои FSD -- снизу вверх

Разберем каждый слой на реальном коде проекта MindBridge.

### shared -- фундамент

**Назначение:** переиспользуемый код, который не знает о бизнес-логике приложения.
UI-компоненты, HTTP-клиент, утилиты, конфигурация.

**Главное правило:** `shared` ни от кого не зависит. Он не импортирует из `entities`,
`features` или других верхних слоев.

В нашем проекте `shared` состоит из четырех сегментов:

#### shared/ui -- библиотека компонентов

Мы используем [shadcn/ui](https://ui.shadcn.com/) -- набор компонентов на базе Radix UI
и Tailwind CSS. Все компоненты реэкспортируются через единый `index.ts`:

```typescript
// shared/ui/index.ts

export { Button, buttonVariants } from './button';
export type { ButtonProps } from './button';
export { Input } from './input';
export type { InputProps } from './input';
export { Label } from './label';
export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from './card';
export { Avatar, AvatarImage, AvatarFallback } from './avatar';
export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  // ... остальные части DropdownMenu
} from './dropdown-menu';
export {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  // ... остальные части Sheet
} from './sheet';
```

**Зачем единый index.ts?** Все остальные слои импортируют компоненты из одной точки:

```typescript
// Так -- хорошо (одна точка входа)
import { Button, Card, CardTitle } from '@/shared/ui';

// Так -- плохо (прямой импорт из внутренностей)
import { Button } from '@/shared/ui/button';
```

Это называется **публичный API слайса**. Если мы решим переименовать внутренний файл
`button.tsx` в `base-button.tsx`, все потребители продолжат работать, потому что импорт
идет через `index.ts`.

#### shared/api -- HTTP-клиент

Единый API-клиент для всего приложения:

```typescript
// shared/api/client.ts

import Cookies from 'js-cookie';
import type { AuthResponse, LoginDto, RegisterDto, UserDto } from '@mindbridge/types';
import { env } from '@/shared/config/env';

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function getAuthHeaders(): Record<string, string> {
  const token = Cookies.get('token');
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let data: unknown;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    const message =
      data && typeof data === 'object' && 'message' in data
        ? String((data as { message: string }).message)
        : `Request failed with status ${response.status}`;

    throw new ApiError(message, response.status, data);
  }

  return response.json() as Promise<T>;
}

export const apiClient = {
  async get<T>(path: string): Promise<T> {
    const response = await fetch(`${env.apiUrl}${path}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    });
    return handleResponse<T>(response);
  },

  async post<T>(path: string, body?: unknown): Promise<T> {
    const response = await fetch(`${env.apiUrl}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return handleResponse<T>(response);
  },

  // put и delete -- по аналогии
};

// Доменные API-функции
export async function login(dto: LoginDto): Promise<AuthResponse> {
  return apiClient.post<AuthResponse>('/auth/login', dto);
}

export async function register(dto: RegisterDto): Promise<AuthResponse> {
  return apiClient.post<AuthResponse>('/auth/register', dto);
}

export async function getMe(): Promise<UserDto> {
  return apiClient.get<UserDto>('/auth/me');
}
```

Обратите внимание на несколько важных деталей:

1. **`ApiError`** -- кастомный класс ошибки, чтобы верхние слои могли обработать код
   статуса.
2. **`getAuthHeaders()`** -- автоматически добавляет токен из cookies ко всем запросам.
3. **Доменные функции** (`login`, `register`, `getMe`) -- обертки над `apiClient`
   с типизацией. Верхние слои вызывают `login(dto)`, а не `apiClient.post('/auth/login', dto)`.

#### shared/lib -- утилиты

```typescript
// shared/lib/utils.ts

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

Функция `cn()` -- стандартная утилита для проектов с Tailwind CSS. Объединяет классы
с правильным разрешением конфликтов.

#### shared/config -- конфигурация

```typescript
// shared/config/env.ts

export const env = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
} as const;
```

Все переменные окружения собраны в одном месте с дефолтными значениями. Если завтра нужно
добавить `NEXT_PUBLIC_WS_URL`, мы знаем, где это сделать.

---

### entities -- бизнес-сущности

**Назначение:** данные предметной области и методы работы с ними. Пользователь, заказ,
товар, комментарий -- все это entities.

**Главное правило:** entity -- это данные + логика работы с ними, **без привязки к UI**.
Entity не содержит форм, кнопок или модальных окон. Она предоставляет хуки, типы и
вспомогательные функции, которые используют верхние слои.

**Зависимости:** может импортировать только из `shared`.

В нашем проекте пока одна entity -- `user`:

```typescript
// entities/user/model.ts

'use client';

import { useState, useEffect, useCallback } from 'react';
import type { UserDto } from '@mindbridge/types';
import Cookies from 'js-cookie';
import { getMe } from '@/shared/api/client';

interface UseUserReturn {
  user: UserDto | null;
  isLoading: boolean;
  error: string | null;
  mutate: () => void;
}

export function useUser(): UseUserReturn {
  const [user, setUser] = useState<UserDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    const token = Cookies.get('token');

    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await getMe();
      setUser(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch user');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return { user, isLoading, error, mutate: fetchUser };
}
```

Публичный API entity:

```typescript
// entities/user/index.ts

export { useUser } from './model';
```

**Разбор кода:**

- Хук `useUser()` загружает текущего пользователя через `getMe()` из `shared/api`.
- Возвращает `user`, `isLoading`, `error` и функцию `mutate` для ручного обновления.
- Сам хук не рендерит UI -- он только предоставляет данные. Как их показать, решают
  верхние слои.

**Направление импортов:** `entities/user` -> `shared/api/client` (getMe). Правило
соблюдено: entity импортирует только из shared.

---

### features -- пользовательские действия

**Назначение:** одно конкретное действие пользователя. "Войти в аккаунт", "Зарегистрироваться",
"Выйти из системы", "Сменить пароль" -- каждое действие оформляется как отдельная фича.

**Главное правило:** одна фича = одно действие. Фича содержит UI (форму, кнопку) и логику
этого действия (валидация, API-вызов, обработка результата).

**Зависимости:** может импортировать из `entities` и `shared`.

В нашем проекте слайс `features/auth` содержит три фичи:

#### LoginForm -- форма входа

```typescript
// features/auth/login-form.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Cookies from 'js-cookie';
import {
  Button,
  Input,
  Label,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/shared/ui';
import { login } from '@/shared/api/client';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
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
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Sign in</CardTitle>
        <CardDescription>
          Enter your credentials to access your account
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {serverError && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              {serverError}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="--------"
              {...register('password')}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link href="/register" className="text-primary underline-offset-4 hover:underline">
              Register
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
```

**Разбор зависимостей LoginForm:**

```
LoginForm (features/auth)
  |-- Button, Input, Label, Card, ...  из  shared/ui      -- OK
  |-- login()                          из  shared/api      -- OK
  |-- react-hook-form, zod, js-cookie  из  node_modules    -- OK
```

Все импорты идут из `shared` или внешних библиотек. Правило FSD соблюдено.

#### LogoutButton -- кнопка выхода

```typescript
// features/auth/logout-button.tsx

'use client';

import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { LogOut } from 'lucide-react';
import { Button } from '@/shared/ui';

export function LogoutButton() {
  const router = useRouter();

  const handleLogout = () => {
    Cookies.remove('token');
    router.push('/login');
  };

  return (
    <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
      <LogOut className="h-4 w-4" />
      Logout
    </Button>
  );
}
```

Простая фича: одна кнопка, одно действие. Удаляет токен из cookies и перенаправляет
на страницу входа.

#### Публичный API фичи

```typescript
// features/auth/index.ts

export { LoginForm } from './login-form';
export { RegisterForm } from './register-form';
export { LogoutButton } from './logout-button';
```

Внешний мир (виджеты, страницы) видит только то, что мы экспортируем через `index.ts`.
Внутренние детали (схема валидации, вспомогательные функции) остаются приватными.

---

### widgets -- составные блоки интерфейса

**Назначение:** крупные, самодостаточные блоки интерфейса. Header, Sidebar, Footer,
комментарии с формой добавления -- все это виджеты. Виджет компонует фичи и entities
в готовый блок.

**Зависимости:** может импортировать из `features`, `entities`, `shared`.

#### Header -- шапка приложения

```typescript
// widgets/header/header.tsx

'use client';

import type { UserDto } from '@mindbridge/types';
import {
  Avatar,
  AvatarFallback,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui';
import { LogoutButton } from '@/features/auth';

interface HeaderProps {
  user: UserDto | null;
}

export function Header({ user }: HeaderProps) {
  const initials = user?.email?.charAt(0).toUpperCase() ?? '?';

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between border-b bg-background px-6">
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-bold tracking-tight">MindBridge</h1>
      </div>

      <div className="flex items-center gap-4">
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-full ...">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden text-sm font-medium md:inline-block">
                  {user.email}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user.email}</p>
                  <p className="text-xs text-muted-foreground">Signed in</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <LogoutButton />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
```

**Зависимости Header:**

```
Header (widgets)
  |-- Avatar, DropdownMenu, ...  из  shared/ui        -- OK (shared ниже widgets)
  |-- LogoutButton               из  features/auth    -- OK (features ниже widgets)
```

Header -- классический виджет: он берет UI-компоненты из `shared` и фичу `LogoutButton`
из `features`, компонуя их в готовый блок интерфейса.

#### Sidebar -- боковая панель навигации

```typescript
// widgets/sidebar/sidebar.tsx

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Settings } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui';

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] w-64 border-r bg-background">
      <nav className="flex flex-col gap-1 p-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Button
              key={item.href}
              variant="ghost"
              asChild
              className={cn('justify-start gap-3', isActive && 'bg-muted font-medium')}
            >
              <Link href={item.href}>
                <item.icon className="h-4 w-4" />
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

Sidebar использует только `shared` (Button, cn), поэтому формально мог бы быть и фичей.
Но по смыслу это составной блок интерфейса, а не действие пользователя, поэтому он
в `widgets`.

#### DashboardLayout -- компоновка всего рабочего пространства

```typescript
// widgets/dashboard-layout/dashboard-layout.tsx

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
  const { user, isLoading, error } = useUser();
  const router = useRouter();

  useEffect(() => {
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

**Зависимости DashboardLayout:**

```
DashboardLayout (widgets)
  |-- useUser()   из  entities/user      -- OK (entities ниже widgets)
  |-- Header      из  widgets/header     -- (!) виджет импортирует виджет
  |-- Sidebar     из  widgets/sidebar    -- (!) виджет импортирует виджет
```

> **Обратите внимание:** `DashboardLayout` импортирует другие виджеты (`Header`,
> `Sidebar`). Строго по FSD, горизонтальные импорты внутри одного слоя нежелательны.
> На практике для layout-виджетов это допустимо -- они по своей природе являются
> компоновщиками. Если хочется строгости, `DashboardLayout` можно поднять на уровень
> `views/` (pages).

---

### views (pages) -- композиция страницы

**Назначение:** слой, который собирает виджеты и фичи в готовую страницу. В каноническом
FSD этот слой называется `pages`, но в нашем проекте мы назвали его `views`, чтобы
избежать конфликта имен с Next.js.

**Зависимости:** может импортировать из `widgets`, `features`, `entities`, `shared`.

```typescript
// views/dashboard/dashboard-page.tsx

'use client';

import { useUser } from '@/entities/user';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/shared/ui';

export function DashboardPage() {
  const { user } = useUser();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome back{user ? `, ${user.email}` : ''}!
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Welcome to MindBridge</CardTitle>
            <CardDescription>Your workspace is ready</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              This is your personal dashboard. Start building something amazing.
            </p>
          </CardContent>
        </Card>
        {/* ... остальные карточки */}
      </div>
    </div>
  );
}
```

```typescript
// views/dashboard/index.ts

export { DashboardPage } from './dashboard-page';
```

**Зависимости DashboardPage:**

```
DashboardPage (views)
  |-- useUser()      из  entities/user    -- OK
  |-- Card и другие  из  shared/ui        -- OK
```

Страница собирает данные (через `useUser`) и UI (через `Card` из `shared`) в готовое
представление. Layout (Header + Sidebar) уже обеспечен виджетом `DashboardLayout`
на уровне Next.js layout.

---

### app -- Next.js App Router (слой инициализации)

**Назначение:** роутинг и глобальные layouts. В FSD-терминологии это самый верхний слой --
`app`. В Next.js 14 этот слой совпадает с директорией `app/`.

**Главное правило:** `app/` должен быть максимально тонким. Никакой бизнес-логики,
никаких сложных компонентов. Только импорт и делегирование.

```typescript
// app/page.tsx -- корневая страница, просто редирект

import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/dashboard');
}
```

```typescript
// app/login/page.tsx -- страница входа

import { LoginForm } from '@/features/auth';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <LoginForm />
    </div>
  );
}
```

```typescript
// app/dashboard/layout.tsx -- layout дашборда

import { DashboardLayout } from '@/widgets/dashboard-layout';

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
```

```typescript
// app/dashboard/page.tsx -- страница дашборда

import { DashboardPage } from '@/views/dashboard';

export default function DashboardRoute() {
  return <DashboardPage />;
}
```

Посмотрите, как просты файлы в `app/`. Каждый -- 3-10 строк. Они только:

1. Импортируют готовый компонент из нижнего слоя
2. Оборачивают его в минимальный layout (если нужен)
3. Экспортируют как `default` (требование Next.js)

---

## 4. Правило импортов -- ключевой принцип FSD

Это самое важное правило, которое делает FSD работающей архитектурой, а не просто
красивым набором папок.

### Правило простым языком

**Слой может импортировать только из слоев, расположенных ниже него.**

### ASCII-диаграмма зависимостей

```
  +--------------------------------------------------+
  |  app (Next.js App Router)                        |
  |  Может импортировать: все нижние слои             |
  +--------+-----------------------------------------+
           |
           v
  +--------------------------------------------------+
  |  views (pages)                                    |
  |  Может импортировать: widgets, features,          |
  |                       entities, shared            |
  +--------+-----------------------------------------+
           |
           v
  +--------------------------------------------------+
  |  widgets                                          |
  |  Может импортировать: features, entities, shared  |
  +--------+-----------------------------------------+
           |
           v
  +--------------------------------------------------+
  |  features                                         |
  |  Может импортировать: entities, shared            |
  +--------+-----------------------------------------+
           |
           v
  +--------------------------------------------------+
  |  entities                                         |
  |  Может импортировать: shared                      |
  +--------+-----------------------------------------+
           |
           v
  +--------------------------------------------------+
  |  shared                                           |
  |  Не импортирует ни из одного слоя FSD             |
  +--------------------------------------------------+
```

### Что можно и что нельзя

```
МОЖНО (сверху вниз):
  widget  -->  feature  -->  entity  -->  shared

НЕЛЬЗЯ (снизу вверх):
  shared  -X->  feature     (нижний слой не импортирует из верхнего)

НЕЛЬЗЯ (горизонтально между слайсами одного слоя):
  entities/user  -X->  entities/order    (entity не импортирует другую entity)
  features/auth  -X->  features/profile  (фича не импортирует другую фичу)
```

> **Горизонтальные импорты** (между слайсами одного слоя) -- один из самых спорных
> моментов в FSD. Строгая интерпретация запрещает их полностью. На практике в `widgets`
> иногда допускаются исключения (как наш `DashboardLayout`, который импортирует `Header`
> и `Sidebar`). Но для `features` и `entities` это правило стоит соблюдать строго.

### Пример цепочки зависимостей в MindBridge

Проследим путь от верхнего до нижнего слоя:

```
app/dashboard/page.tsx          (app)
  |
  |-- import { DashboardPage } from '@/views/dashboard'
  |
  v
views/dashboard/dashboard-page.tsx   (views)
  |
  |-- import { useUser } from '@/entities/user'
  |-- import { Card, ... } from '@/shared/ui'
  |
  v
entities/user/model.ts               (entities)
  |
  |-- import { getMe } from '@/shared/api/client'
  |
  v
shared/api/client.ts                 (shared)
  |
  |-- import { env } from '@/shared/config/env'   (внутри shared -- OK)
  |
  v
shared/config/env.ts                 (shared -- дно, дальше некуда)
```

Каждый шаг идет вниз. Ни одной стрелки вверх. Это означает:

- Изменение в `shared/api/client.ts` может затронуть `entities/user` и все, кто
  от него зависит.
- Изменение в `views/dashboard` затрагивает только `app/dashboard/page.tsx`.
- Изменение в `features/auth/login-form.tsx` не затрагивает `entities` или `shared`.

Зная эти правила, вы всегда можете ответить на вопрос "что сломается, если я изменю
этот файл?".

### Как автоматизировать проверку

Можно настроить ESLint-плагин `eslint-plugin-boundaries` для автоматической проверки
правила импортов:

```javascript
// .eslintrc.js (упрощенный пример)
module.exports = {
  plugins: ['boundaries'],
  settings: {
    'boundaries/elements': [
      { type: 'shared',   pattern: 'shared/*'   },
      { type: 'entities', pattern: 'entities/*'  },
      { type: 'features', pattern: 'features/*'  },
      { type: 'widgets',  pattern: 'widgets/*'   },
      { type: 'views',    pattern: 'views/*'     },
      { type: 'app',      pattern: 'app/*'       },
    ],
  },
  rules: {
    'boundaries/element-types': [
      'error',
      {
        default: 'disallow',
        rules: [
          { from: 'app',      allow: ['views', 'widgets', 'features', 'entities', 'shared'] },
          { from: 'views',    allow: ['widgets', 'features', 'entities', 'shared'] },
          { from: 'widgets',  allow: ['features', 'entities', 'shared'] },
          { from: 'features', allow: ['entities', 'shared'] },
          { from: 'entities', allow: ['shared'] },
          { from: 'shared',   allow: [] },
        ],
      },
    ],
  },
};
```

---

## 5. FSD + Next.js App Router: как совместить

Это один из самых частых вопросов при внедрении FSD: "У Next.js есть свой `app/`
с `page.tsx` и `layout.tsx`. У FSD есть свои слои. Как их подружить?"

### Проблема

Next.js App Router требует:

- Файлы `page.tsx` и `layout.tsx` внутри `app/`
- Вложенность папок в `app/` определяет URL-маршруты
- `app/` -- это одновременно и роутер, и место для UI

FSD требует:

- Разделение кода на слои (`shared`, `entities`, `features`, `widgets`, `views`)
- Правило импортов: сверху вниз
- Бизнес-логика -- не в роутинге

### Решение: app/ как тонкий адаптер

Наш подход в MindBridge:

1. **`app/`** -- только роутинг. Файлы в 3-10 строк. Без бизнес-логики, без сложных
   компонентов.
2. **`views/`** -- FSD-слой для композиции страниц. Сюда идет все, что "больше, чем
   роутинг".
3. **Остальные FSD-слои** (`widgets`, `features`, `entities`, `shared`) -- как обычно.

### Паттерн "app/ -> views/"

Каждый `page.tsx` в `app/` -- это однострочный адаптер:

```
app/dashboard/page.tsx:
  import { DashboardPage } from '@/views/dashboard';
  export default function DashboardRoute() {
    return <DashboardPage />;
  }

app/login/page.tsx:
  import { LoginForm } from '@/features/auth';
  export default function LoginPage() {
    return (
      <div className="...">
        <LoginForm />
      </div>
    );
  }
```

Для простых страниц (как Login) можно импортировать фичу напрямую. Для сложных страниц
(Dashboard, Settings) -- через `views/`.

### Паттерн "app/layout.tsx -> widgets/"

Layouts в `app/` делегируют виджетам:

```
app/dashboard/layout.tsx:
  import { DashboardLayout } from '@/widgets/dashboard-layout';
  export default function Layout({ children }) {
    return <DashboardLayout>{children}</DashboardLayout>;
  }
```

### Итоговая схема

```
URL /dashboard
       |
       v
app/dashboard/layout.tsx  ----->  widgets/dashboard-layout (Header + Sidebar + useUser)
       |
       v
app/dashboard/page.tsx    ----->  views/dashboard/dashboard-page (карточки, контент)
```

Пользователь заходит по URL `/dashboard`. Next.js находит `app/dashboard/page.tsx`.
Этот файл рендерит `DashboardPage` из `views/`. Layout `DashboardLayout` из `widgets/`
добавляет шапку и боковую панель. Вся логика -- в FSD-слоях, `app/` -- только маршрутизация.

---

## 6. Как добавлять новые фичи по FSD

Допустим, нужно добавить функцию "смена пароля". Пройдем по шагам.

### Шаг 1: DTO (типы данных)

Добавляем типы в общий пакет типов (в monorepo) или в `shared`:

```typescript
// packages/types/src/auth.ts (или shared/api/types.ts)

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}
```

### Шаг 2: API-метод в shared/api

```typescript
// shared/api/client.ts -- добавляем функцию

export async function changePassword(dto: ChangePasswordDto): Promise<void> {
  return apiClient.put<void>('/auth/change-password', dto);
}
```

Почему здесь? Потому что API-клиент -- это `shared`: он не знает о бизнес-логике,
просто отправляет запрос.

### Шаг 3: UI-форма в features

```typescript
// features/auth/change-password-form.tsx

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input, Label, Card, CardHeader, CardTitle, CardContent } from '@/shared/ui';
import { changePassword } from '@/shared/api/client';

const changePasswordSchema = z.object({
  currentPassword: z.string().min(6, 'Minimum 6 characters'),
  newPassword: z.string().min(6, 'Minimum 6 characters'),
  confirmPassword: z.string().min(6, 'Minimum 6 characters'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

export function ChangePasswordForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onSubmit = async (data: ChangePasswordValues) => {
    try {
      setIsSubmitting(true);
      setServerError(null);
      await changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      setSuccess(true);
      reset();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Change Password</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {serverError && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              {serverError}
            </div>
          )}
          {success && (
            <div className="rounded-md bg-green-500/15 p-3 text-sm text-green-600">
              Password changed successfully!
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <Input id="currentPassword" type="password" {...register('currentPassword')} />
            {errors.currentPassword && (
              <p className="text-sm text-destructive">{errors.currentPassword.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input id="newPassword" type="password" {...register('newPassword')} />
            {errors.newPassword && (
              <p className="text-sm text-destructive">{errors.newPassword.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input id="confirmPassword" type="password" {...register('confirmPassword')} />
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Changing...' : 'Change Password'}
          </Button>
        </CardContent>
      </form>
    </Card>
  );
}
```

Не забываем обновить публичный API:

```typescript
// features/auth/index.ts

export { LoginForm } from './login-form';
export { RegisterForm } from './register-form';
export { LogoutButton } from './logout-button';
export { ChangePasswordForm } from './change-password-form';  // <-- новый экспорт
```

### Шаг 4: Добавить на страницу настроек (views)

```typescript
// views/settings/settings-page.tsx

'use client';

import { ChangePasswordForm } from '@/features/auth';

export function SettingsPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
      <ChangePasswordForm />
    </div>
  );
}
```

```typescript
// views/settings/index.ts

export { SettingsPage } from './settings-page';
```

### Шаг 5: Создать маршрут в app/

```typescript
// app/dashboard/settings/page.tsx

import { SettingsPage } from '@/views/settings';

export default function SettingsRoute() {
  return <SettingsPage />;
}
```

### Итого: что мы сделали

| Шаг | Слой | Файл | Что делали |
|-----|------|------|------------|
| 1 | types | `ChangePasswordDto` | Описали контракт |
| 2 | shared | `client.ts` | Добавили API-метод |
| 3 | features | `change-password-form.tsx` | Создали UI + логику |
| 4 | views | `settings-page.tsx` | Скомпоновали страницу |
| 5 | app | `settings/page.tsx` | Привязали к маршруту |

Каждый шаг затрагивает ровно один слой. Зависимости идут строго вниз. Если завтра
понадобится другая форма смены пароля (например, для мобильной версии), мы создадим
новый файл в `features/auth` и подключим его в нужном `views/`.

---

## 7. Частые ошибки

### Ошибка 1: путать FSD pages и Next.js app/

```
НЕПРАВИЛЬНО:
app/dashboard/page.tsx -- 200 строк с формами, запросами, состоянием

ПРАВИЛЬНО:
app/dashboard/page.tsx -- 5 строк, импорт из views/
views/dashboard/dashboard-page.tsx -- вся композиция
```

`app/` в Next.js -- это роутер. Он определяет URL и layouts, но не должен содержать
бизнес-логику. Вся содержательная работа -- в FSD-слоях.

### Ошибка 2: класть бизнес-логику в shared

```typescript
// НЕПРАВИЛЬНО -- бизнес-логика в shared
// shared/hooks/useAuth.ts
export function useAuth() {
  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    Cookies.set('token', res.access_token);
    router.push('/dashboard');
    // ... ещё 50 строк бизнес-логики
  };
}
```

`shared` -- это утилиты и инфраструктура. Если в файле есть слова `login`, `dashboard`,
`redirect` -- скорее всего, ему место в `features` или `entities`, а не в `shared`.

Правильное разделение:

- `shared/api/client.ts` -- HTTP-запрос `login(dto)`, просто отправляет данные на сервер
- `features/auth/login-form.tsx` -- форма, валидация, сохранение токена, навигация

### Ошибка 3: "толстые" entities с UI

```typescript
// НЕПРАВИЛЬНО -- entity содержит UI-компонент
// entities/user/UserCard.tsx
export function UserCard({ user }: { user: UserDto }) {
  return (
    <Card>
      <Avatar src={user.avatar} />
      <h3>{user.name}</h3>
      <Button onClick={() => followUser(user.id)}>Follow</Button>  {/* UI + action */}
    </Card>
  );
}
```

Entity предоставляет данные и методы работы с ними, но **не UI**. Если вам нужна
карточка пользователя с кнопкой "Follow" -- это виджет или фича.

```typescript
// ПРАВИЛЬНО -- entity предоставляет данные
// entities/user/model.ts
export function useUser() { ... }
export function formatUserName(user: UserDto): string { ... }

// widgets/user-card/user-card.tsx -- UI для отображения пользователя
// features/follow-user/follow-button.tsx -- действие "подписаться"
```

### Ошибка 4: циклические зависимости

```
features/auth/login-form.tsx
  --> import { useUser } from '@/entities/user'      -- OK

entities/user/model.ts
  --> import { isLoggedIn } from '@/features/auth'   -- НЕЛЬЗЯ!
```

Entity не может импортировать из features. Если entity нужна информация из фичи, значит,
архитектура спроектирована неправильно. Обычно решение -- вынести общую логику вниз,
в `shared`.

### Ошибка 5: один гигантский слайс

```
features/
  auth/
    login-form.tsx
    register-form.tsx
    logout-button.tsx
    change-password-form.tsx
    reset-password-form.tsx
    two-factor-setup.tsx
    social-login.tsx
    email-verification.tsx
    ... ещё 15 файлов ...
```

Если слайс вырастает до 15-20 файлов, подумайте о разделении. Например:

```
features/
  login/          -- вход
  registration/   -- регистрация
  password/       -- смена и восстановление пароля
  two-factor/     -- двухфакторная аутентификация
```

Каждый слайс должен быть достаточно маленьким, чтобы умещаться в голове.

---

## 8. Шпаргалка

### Таблица: "Куда положить этот код?"

| Что у вас | Куда в FSD | Пример из MindBridge |
|---|---|---|
| UI-кит (Button, Input, Card) | `shared/ui` | shadcn/ui компоненты |
| HTTP-клиент, API-функции | `shared/api` | `apiClient`, `login()`, `getMe()` |
| Утилиты (`cn()`, `formatDate()`) | `shared/lib` | `cn()` из clsx + tailwind-merge |
| Переменные окружения | `shared/config` | `env.apiUrl` |
| Хук для работы с entity (данные) | `entities/[name]/model` | `useUser()` |
| Форма (пользовательское действие) | `features/[name]` | `LoginForm`, `RegisterForm` |
| Кнопка с действием | `features/[name]` | `LogoutButton` |
| Шапка, сайдбар, футер | `widgets/[name]` | `Header`, `Sidebar` |
| Layout с навигацией | `widgets/[name]` | `DashboardLayout` |
| Готовая страница (композиция) | `views/[name]` | `DashboardPage` |
| Next.js роут (`page.tsx`) | `app/[route]` | `app/dashboard/page.tsx` |
| Next.js layout (`layout.tsx`) | `app/[route]` | `app/dashboard/layout.tsx` |
| Глобальные стили | `app/` | `globals.css` |
| Типы, DTO | `packages/types` или `shared` | `@mindbridge/types` |

### Быстрый тест: правильный ли слой?

Задайте три вопроса:

1. **Этот код знает о бизнес-домене?**
   - Нет -> `shared`
   - Да -> продолжаем

2. **Это данные/сущность или действие пользователя?**
   - Данные -> `entities`
   - Действие -> `features`

3. **Это самодостаточный блок интерфейса из нескольких компонентов?**
   - Да -> `widgets`
   - Это целая страница -> `views`

### Чеклист для code review по FSD

```
[ ] Импорты идут только сверху вниз (слой не импортирует из верхнего слоя)
[ ] Нет горизонтальных импортов между слайсами одного слоя
    (features/auth не импортирует features/profile)
[ ] Каждый слайс имеет index.ts с публичным API
[ ] Импорт идет через index.ts, а не напрямую во внутренний файл
    (import from '@/features/auth', НЕ from '@/features/auth/login-form')
[ ] В shared нет бизнес-логики (нет слов login, dashboard, order...)
[ ] Entities не содержат UI-компоненты (формы, кнопки с действиями)
[ ] Features -- это одно конкретное действие, а не "все про авторизацию"
[ ] Файлы в app/ максимально тонкие (3-10 строк)
[ ] Новая фича не ломает существующие -- зависимости направлены вниз
```

### Диаграмма для печати

```
+-----------------------------------------------------------------------+
|                        ПРАВИЛО ИМПОРТОВ FSD                           |
+-----------------------------------------------------------------------+
|                                                                       |
|   app/          <-- только роутинг, 3-10 строк на файл                |
|     |                                                                 |
|     v                                                                 |
|   views/        <-- композиция страниц                                |
|     |                                                                 |
|     v                                                                 |
|   widgets/      <-- Header, Sidebar, DashboardLayout                  |
|     |                                                                 |
|     v                                                                 |
|   features/     <-- LoginForm, LogoutButton, ChangePasswordForm       |
|     |                                                                 |
|     v                                                                 |
|   entities/     <-- useUser(), данные и бизнес-логика                  |
|     |                                                                 |
|     v                                                                 |
|   shared/       <-- UI-кит, API-клиент, утилиты, конфиг               |
|                                                                       |
|   Стрелка вниз = МОЖНО импортировать                                  |
|   Стрелка вверх = НЕЛЬЗЯ                                              |
|   Горизонтально (между слайсами) = НЕЖЕЛАТЕЛЬНО                       |
|                                                                       |
+-----------------------------------------------------------------------+
```

---

## Заключение

Feature Sliced Design -- это не серебряная пуля и не единственный способ организовать
код. Но это проверенный подход, который решает реальную проблему: через 6 месяцев после
старта проекта вы (и ваши коллеги) все ещё понимаете, где что лежит и что от чего
зависит.

Ключевые идеи, которые стоит запомнить:

1. **Слои** -- вертикальная иерархия с четкими зонами ответственности
2. **Правило импортов** -- зависимости идут только сверху вниз
3. **Публичный API** -- каждый слайс экспортирует только то, что нужно внешним потребителям
4. **app/ -- тонкий адаптер** -- вся логика в FSD-слоях, Next.js только маршрутизирует

Начните с малого: создайте `shared/`, `features/`, `entities/`. Перенесите существующий
код. Добавьте `widgets/` и `views/` по мере роста. Настройте ESLint для проверки импортов.
И через месяц вы заметите, что вопрос "куда положить этот код?" перестал быть вопросом.

---

> **Дополнительные материалы:**
> - [Официальная документация FSD](https://feature-sliced.design/)
> - [FSD на GitHub](https://github.com/feature-sliced/documentation)
> - Исходный код проекта MindBridge -- живой пример всего, что описано в этой статье
