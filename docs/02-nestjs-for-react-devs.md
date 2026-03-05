# NestJS для фронтендера: бэкенд на TypeScript без боли

> Эта статья написана для React-разработчиков, которые хотят понять бэкенд.
> Все примеры кода взяты из реального проекта **MindBridge** -- Turborepo-монорепозиторий
> с NestJS-бэкендом (`apps/api`) и Next.js-фронтендом (`apps/web`).

---

## Содержание

1. [Зачем NestJS, если есть Express](#1-зачем-nestjs-если-есть-express)
2. [Модули -- основа всего](#2-модули----основа-всего)
3. [Контроллеры -- обработка HTTP-запросов](#3-контроллеры----обработка-http-запросов)
4. [Сервисы и Dependency Injection](#4-сервисы-и-dependency-injection)
5. [Guards -- защита маршрутов](#5-guards----защита-маршрутов)
6. [Декораторы -- суперсила NestJS](#6-декораторы----суперсила-nestjs)
7. [Pipes и Validation](#7-pipes-и-validation)
8. [TypeORM и база данных](#8-typeorm-и-база-данных)
9. [Конфигурация](#9-конфигурация)
10. [Шпаргалка: React concepts -> NestJS](#10-шпаргалка-react-concepts---nestjs)

---

## 1. Зачем NestJS, если есть Express

### Короткий ответ

Express -- это минималистичный HTTP-фреймворк. Он даёт тебе `req`, `res`, `next` и говорит:
"дальше сам". Нет стандартной архитектуры, нет организации кода, нет встроенной валидации.
Каждый проект на Express выглядит по-своему.

NestJS -- это **полноценный фреймворк** поверх Express (или Fastify), который задаёт
чёткую архитектуру приложения. Он вдохновлён Angular: модули, декораторы, dependency
injection, чёткое разделение ответственности.

### Аналогия

- **Express** -- это набор LEGO **без инструкции**. Куча деталей, собирай что хочешь.
  Можно построить шедевр, а можно -- бесформенную кучу.

- **NestJS** -- это набор LEGO **с инструкцией**. Те же детали, но есть понятная
  структура: вот сюда кладётся контроллер, вот сюда -- сервис, вот так подключается
  база данных.

### Почему это важно для фронтендера

Ты пишешь на React. React тоже не навязывает архитектуру -- но ты наверняка уже привык
к определённым паттернам: компоненты, хуки, контекст, разделение на features/widgets/shared.

NestJS даёт **такой же порядок**, но для бэкенда. Если ты когда-нибудь видел Angular --
многое покажется знакомым. Если нет -- не страшно, мы всё разберём.

### Express vs NestJS: сравнение

```javascript
// Express: простой эндпоинт
const express = require('express');
const app = express();

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  // Валидация? Сам пиши.
  // Бизнес-логика? Тут же или в отдельном файле -- сам решай.
  // Обработка ошибок? try-catch, сам оборачивай.
  const user = await findUser(email);
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });
  const token = generateToken(user);
  res.json({ access_token: token });
});
```

```typescript
// NestJS: тот же эндпоинт
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() body: LoginBodyDto) {
    return this.authService.login({
      email: body.email,
      password: body.password,
    });
  }
}
```

Во втором примере:

- **Валидация** -- автоматическая через `LoginBodyDto` и `class-validator`
- **Бизнес-логика** -- вынесена в `AuthService`
- **Обработка ошибок** -- через глобальные фильтры
- **Маршрут** -- определяется декоратором `@Post('login')` + префиксом `@Controller('auth')`

### Главные преимущества NestJS

| Фича | Подробности |
|---|---|
| TypeScript | Написан на TS, полная типизация из коробки |
| Архитектура | Модули, контроллеры, сервисы -- чёткая структура |
| DI (Dependency Injection) | Фреймворк сам управляет зависимостями |
| Валидация | `class-validator` + `ValidationPipe` |
| Декораторы | Мощный механизм метаданных |
| Тестируемость | DI делает юнит-тестирование простым |
| Экосистема | Готовые модули для JWT, TypeORM, GraphQL, WebSockets и т.д. |

---

## 2. Модули -- основа всего

### Что такое модуль

Модуль в NestJS -- это **контейнер**, который объединяет связанные между собой
контроллеры, сервисы и другие провайдеры. Каждый модуль -- это отдельная "фича"
приложения.

### Аналогия из React

Представь, что модуль NestJS -- это **feature-папка** в твоём React-проекте с
собственным контекстом (Context API).

В React-проекте MindBridge у нас есть:

```
src/features/auth/         -- фича авторизации
src/entities/user/         -- сущность пользователя
src/widgets/dashboard-layout/  -- виджет дашборда
```

В NestJS у нас есть модули, которые делают ровно то же самое:

```
src/modules/auth/          -- модуль авторизации
src/modules/users/         -- модуль пользователей
```

### AppModule -- корневой модуль

Каждое NestJS-приложение начинается с корневого модуля. Это как `App.tsx` в React --
точка, где всё собирается вместе.

```typescript
// apps/api/src/app.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import configuration from './config/configuration';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    // Конфигурация (переменные окружения)
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),

    // Подключение к базе данных
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres' as const,
        url: configService.get<string>('database.url'),
        autoLoadEntities: true,
        synchronize: true,
      }),
    }),

    // Наши модули
    AuthModule,
    UsersModule,
  ],
})
export class AppModule {}
```

Разберём декоратор `@Module`:

#### `imports` -- что подключаем

Это как `import` в React-компоненте, но на уровне модуля. Мы подключаем:

- **`ConfigModule`** -- модуль конфигурации (чтение `.env`)
- **`TypeOrmModule`** -- модуль для работы с базой данных
- **`AuthModule`** -- наш модуль авторизации
- **`UsersModule`** -- наш модуль пользователей

#### Аналогия с React

Представь `AppModule` как `App.tsx`, где ты подключаешь провайдеры:

```tsx
// React аналог
function App() {
  return (
    <ConfigProvider>          {/* ConfigModule */}
      <DatabaseProvider>      {/* TypeOrmModule */}
        <AuthProvider>        {/* AuthModule */}
          <UsersProvider>     {/* UsersModule */}
            <Routes>...</Routes>
          </UsersProvider>
        </AuthProvider>
      </DatabaseProvider>
    </ConfigProvider>
  );
}
```

### AuthModule -- модуль фичи

Посмотрим на модуль авторизации:

```typescript
// apps/api/src/modules/auth/auth.module.ts

import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { UsersModule } from '../users/users.module';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    UsersModule,                                    // Нужен UsersService
    PassportModule.register({ defaultStrategy: 'jwt' }),  // Passport для JWT
    JwtModule.registerAsync({                       // Модуль JWT-токенов
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
        signOptions: {
          expiresIn: configService.get<string>('jwt.expiresIn', '7d'),
        },
      }),
    }),
  ],
  controllers: [AuthController],    // Контроллеры этого модуля
  providers: [AuthService, JwtStrategy],  // Сервисы этого модуля
  exports: [AuthService],          // Что доступно другим модулям
})
export class AuthModule {}
```

#### Разбор полей `@Module`

| Поле | Назначение | Аналогия из React |
|---|---|---|
| `imports` | Модули, от которых зависит этот модуль | `import` + Provider-обёртки |
| `controllers` | Контроллеры (обрабатывают HTTP-запросы) | Компоненты-страницы (маршруты) |
| `providers` | Сервисы и другие провайдеры (бизнес-логика) | Хуки, утилиты, контексты |
| `exports` | Что можно использовать в других модулях | Публичный API модуля (`export` в index.ts) |

### UsersModule -- чистый модуль данных

```typescript
// apps/api/src/modules/users/users.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User])],  // Регистрируем User-сущность
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],                      // Экспортируем для AuthModule
})
export class UsersModule {}
```

Обрати внимание на `exports: [UsersService]`. Это позволяет `AuthModule` использовать
`UsersService` (через `imports: [UsersModule]`). Без экспорта -- сервис виден только
внутри своего модуля.

Это как `export` в `index.ts` фичи в React:

```typescript
// React: features/auth/index.ts
export { LoginForm } from './login-form';     // Публичный API фичи
export { RegisterForm } from './register-form';
// Внутренние компоненты не экспортируются
```

---

## 3. Контроллеры -- обработка HTTP-запросов

### Что такое контроллер

Контроллер -- это класс, который **принимает HTTP-запросы** и **возвращает ответы**.
Каждый метод контроллера -- это отдельный эндпоинт.

### Аналогия из React

Контроллер -- это как **Route** в React Router, только для API. В React маршрут
определяет, какой компонент показать. В NestJS контроллер определяет, какой код
выполнить при запросе на определённый URL.

```
React:   Route path="/login" -> LoginPage компонент
NestJS:  POST /auth/login   -> AuthController.login() метод
```

### AuthController -- наш контроллер авторизации

```typescript
// apps/api/src/modules/auth/auth.controller.ts

import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';

// DTO -- Data Transfer Object (что приходит в запросе)
class RegisterBodyDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}

class LoginBodyDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(1)
  password!: string;
}

@Controller('auth')     // Все маршруты начинаются с /auth
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')     // POST /auth/register
  async register(@Body() body: RegisterBodyDto) {
    return this.authService.register({
      email: body.email,
      password: body.password,
    });
  }

  @Post('login')        // POST /auth/login
  async login(@Body() body: LoginBodyDto) {
    return this.authService.login({
      email: body.email,
      password: body.password,
    });
  }

  @Get('me')            // GET /auth/me
  @UseGuards(JwtAuthGuard)   // Только для авторизованных
  async getMe(@CurrentUser() user: { id: string; email: string }) {
    return this.authService.getMe(user.id);
  }
}
```

### Разбор по частям

#### `@Controller('auth')` -- префикс маршрута

```typescript
@Controller('auth')
export class AuthController { ... }
```

Все маршруты внутри этого контроллера будут начинаться с `/auth`. Это как `path`
в React Router:

```tsx
// React аналог
<Route path="/auth/*">
  {/* Все дочерние маршруты начинаются с /auth */}
</Route>
```

#### `@Post('register')` -- HTTP-метод и путь

```typescript
@Post('register')    // POST /auth/register
async register(@Body() body: RegisterBodyDto) { ... }
```

Декоратор `@Post('register')` говорит: "Этот метод обрабатывает POST-запрос на `/auth/register`".

Доступные декораторы HTTP-методов:

| Декоратор | HTTP-метод | Пример |
|---|---|---|
| `@Get('path')` | GET | Получить данные |
| `@Post('path')` | POST | Создать ресурс |
| `@Put('path')` | PUT | Обновить ресурс |
| `@Patch('path')` | PATCH | Частично обновить |
| `@Delete('path')` | DELETE | Удалить ресурс |

#### `@Body()` -- получение тела запроса

```typescript
async register(@Body() body: RegisterBodyDto) {
  return this.authService.register({
    email: body.email,
    password: body.password,
  });
}
```

`@Body()` -- это декоратор, который извлекает тело HTTP-запроса и кладёт его в параметр
`body`. Тип `RegisterBodyDto` определяет, какие поля ожидаются.

**Аналогия с React:** `@Body()` -- это как `props`, только для HTTP-запроса.

```tsx
// React: данные приходят через props
function LoginForm({ email, password }: LoginFormProps) { ... }

// NestJS: данные приходят через @Body()
async login(@Body() body: LoginBodyDto) { ... }
```

Другие полезные декораторы для извлечения данных:

| Декоратор | Откуда берёт данные | Пример URL |
|---|---|---|
| `@Body()` | Тело запроса (POST/PUT) | -- |
| `@Param('id')` | URL-параметр | `/users/:id` |
| `@Query('page')` | Query-параметр | `/users?page=2` |
| `@Headers('authorization')` | HTTP-заголовок | -- |
| `@Cookies('token')` | Cookie | -- |

#### `@UseGuards(JwtAuthGuard)` -- защита маршрута

```typescript
@Get('me')
@UseGuards(JwtAuthGuard)       // Требует авторизацию
async getMe(@CurrentUser() user: { id: string; email: string }) {
  return this.authService.getMe(user.id);
}
```

`@UseGuards` добавляет проверку перед выполнением метода. Подробнее о guards -- ниже.

#### Что возвращает контроллер

Метод контроллера возвращает данные, и NestJS автоматически:

1. Сериализует их в JSON
2. Устанавливает `Content-Type: application/json`
3. Отправляет с кодом 200 (или 201 для `@Post`)

```typescript
// Контроллер возвращает объект
return this.authService.login({ email, password });
// NestJS автоматически отправит: { "access_token": "eyJhbGciOi..." }
```

В Express тебе бы пришлось вручную вызывать `res.json()`. В NestJS -- просто `return`.

### Как фронтенд вызывает эти эндпоинты

Посмотрим на наш API-клиент на фронтенде:

```typescript
// apps/web/src/shared/api/client.ts

export async function login(dto: LoginDto): Promise<AuthResponse> {
  return apiClient.post<AuthResponse>('/auth/login', dto);
  //                                   ^^^^^^^^^^^^^
  //                   POST /auth/login -> AuthController.login()
}

export async function register(dto: RegisterDto): Promise<AuthResponse> {
  return apiClient.post<AuthResponse>('/auth/register', dto);
  //                                   ^^^^^^^^^^^^^^^^
  //                   POST /auth/register -> AuthController.register()
}

export async function getMe(): Promise<UserDto> {
  return apiClient.get<UserDto>('/auth/me');
  //                             ^^^^^^^^
  //                   GET /auth/me -> AuthController.getMe()
}
```

Каждый вызов на фронтенде соответствует конкретному методу контроллера на бэкенде.
Полная цепочка:

```
Фронтенд                          Бэкенд
LoginForm.onSubmit()
  -> login({ email, password })
    -> POST /auth/login            -> AuthController.login(@Body() body)
                                      -> AuthService.login(body)
                                        -> UsersService.findByEmail(email)
                                        -> bcrypt.compare(password)
                                        -> jwtService.sign(payload)
                                      <- { access_token: "..." }
  <- { access_token: "..." }
  -> Cookies.set('token', ...)
  -> router.push('/dashboard')
```

---

## 4. Сервисы и Dependency Injection

### Самая непривычная концепция

Dependency Injection (DI) -- это, пожалуй, **самая необычная** вещь для фронтендера.
В React ты привык импортировать функции напрямую или использовать `useContext`.
В NestJS зависимости **инжектируются** через конструктор.

### Что такое сервис

Сервис -- это класс с декоратором `@Injectable()`, который содержит **бизнес-логику**.
Контроллеры не должны содержать бизнес-логику -- только принимать запросы и
вызывать сервисы.

### AuthService -- наш сервис авторизации

```typescript
// apps/api/src/modules/auth/auth.service.ts

import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { User } from '../users/user.entity';

@Injectable()
export class AuthService {
  // DI: NestJS сам создаёт и передаёт эти зависимости
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: {
    email: string;
    password: string;
  }): Promise<{ access_token: string }> {
    // Проверяем, нет ли уже пользователя с таким email
    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('A user with this email already exists');
    }

    // Хэшируем пароль
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Создаём пользователя
    const user = await this.usersService.create(dto.email, hashedPassword);

    // Возвращаем JWT-токен
    return {
      access_token: this.generateToken(user),
    };
  }

  async login(dto: {
    email: string;
    password: string;
  }): Promise<{ access_token: string }> {
    // Ищем пользователя
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Проверяем пароль
    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return {
      access_token: this.generateToken(user),
    };
  }

  async getMe(
    userId: string,
  ): Promise<{ id: string; email: string; createdAt: Date }> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
    };
  }

  private generateToken(user: User): string {
    return this.jwtService.sign({
      sub: user.id,
      email: user.email,
    });
  }
}
```

### Разбор DI на примере

Ключевой момент -- конструктор:

```typescript
constructor(
  private readonly usersService: UsersService,    // NestJS создаёт и передаёт
  private readonly jwtService: JwtService,        // NestJS создаёт и передаёт
) {}
```

Ты **нигде** не пишешь:

```typescript
// Ты НЕ делаешь так:
const usersService = new UsersService(repository);
const jwtService = new JwtService(config);
const authService = new AuthService(usersService, jwtService);
```

NestJS делает это **за тебя**. Ты просто говоришь: "Мне нужен `UsersService`" -- и
фреймворк:

1. Находит класс `UsersService`
2. Смотрит, что ему нужно для создания (его зависимости)
3. Создаёт все зависимости рекурсивно
4. Создаёт `UsersService` и передаёт в конструктор `AuthService`

### Аналогия с React

В React ближайший аналог DI -- это **Context API**:

```tsx
// React: получение зависимости через useContext
function LoginForm() {
  const authService = useContext(AuthContext);    // React "инжектирует" из контекста
  const result = await authService.login(data);
}
```

```typescript
// NestJS: получение зависимости через конструктор
@Injectable()
export class AuthController {
  constructor(private readonly authService: AuthService) {}  // NestJS инжектирует

  async login(@Body() body: LoginBodyDto) {
    return this.authService.login(body);
  }
}
```

Но есть важное отличие:

- В React ты **сам** создаёшь Provider и оборачиваешь в него компоненты
- В NestJS ты **просто объявляешь** зависимость в конструкторе, а фреймворк всё делает сам

### Аналогия: ресторан

Представь ресторан:

- **Без DI (Express):** Ты сам идёшь на кухню, берёшь ингредиенты, готовишь блюдо,
  приносишь на стол. Полный контроль, но много ручной работы.

- **С DI (NestJS):** Ты просто заказываешь "стейк с картошкой" (объявляешь зависимость
  в конструкторе). Официант (DI-контейнер NestJS) передаёт заказ на кухню, повар
  (фабрика) готовит, и тебе приносят готовое блюдо. Ты не знаешь и не заботишься
  о том, как именно он приготовлен.

### Зачем DI нужен

1. **Тестируемость.** При тестировании можно подставить mock-объекты вместо реальных
   зависимостей:

```typescript
// Тест: подставляем фейковый UsersService
const mockUsersService = {
  findByEmail: jest.fn().mockResolvedValue(null),
  create: jest.fn().mockResolvedValue({ id: '1', email: 'test@test.com' }),
};

const authService = new AuthService(
  mockUsersService as any,    // Подставляем mock
  mockJwtService as any,
);
```

2. **Слабая связанность.** `AuthService` не знает, как создаётся `UsersService`. Он
   просто знает, что у `UsersService` есть методы `findByEmail`, `findById`, `create`.
   Если завтра мы изменим реализацию (например, перейдём с PostgreSQL на MongoDB) --
   `AuthService` не нужно менять.

3. **Единственный экземпляр.** По умолчанию NestJS создаёт один экземпляр сервиса
   (singleton) и переиспользует его. Это экономит память.

### Обработка ошибок

Обрати внимание на то, как AuthService бросает ошибки:

```typescript
throw new ConflictException('A user with this email already exists');  // 409
throw new UnauthorizedException('Invalid email or password');          // 401
throw new NotFoundException('User not found');                        // 404
```

NestJS предоставляет **готовые классы HTTP-исключений**:

| Класс | HTTP-код | Когда использовать |
|---|---|---|
| `BadRequestException` | 400 | Некорректный запрос |
| `UnauthorizedException` | 401 | Не авторизован |
| `ForbiddenException` | 403 | Нет прав |
| `NotFoundException` | 404 | Ресурс не найден |
| `ConflictException` | 409 | Конфликт (дублирование) |
| `InternalServerErrorException` | 500 | Внутренняя ошибка |

Бросаешь исключение -- NestJS автоматически формирует HTTP-ответ с правильным статус-кодом
и сообщением. Никаких `res.status(401).json(...)`.

---

## 5. Guards -- защита маршрутов

### Что такое Guard

Guard -- это класс, который решает, **пропустить** запрос к эндпоинту или **отклонить**.
Он выполняется **до** контроллера.

### Аналогия из React

В React ты, скорее всего, делал компонент `PrivateRoute`:

```tsx
// React: защита маршрута
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  return children;
}

<Route path="/dashboard" element={
  <PrivateRoute>         {/* Guard */}
    <Dashboard />        {/* Контроллер */}
  </PrivateRoute>
} />
```

В NestJS Guard работает точно так же, но для API:

```typescript
// NestJS: защита эндпоинта
@Get('me')
@UseGuards(JwtAuthGuard)         // Guard (как PrivateRoute)
async getMe(@CurrentUser() user) {    // Контроллер
  return this.authService.getMe(user.id);
}
```

### Аналогия: вышибала в клубе

Guard -- это **вышибала** на входе в клуб:

- Ты подходишь к двери (HTTP-запрос к эндпоинту)
- Вышибала проверяет, есть ли ты в списке (есть ли валидный JWT-токен)
- Если есть -- пропускает (Guard возвращает `true`)
- Если нет -- не пускает (Guard выбрасывает `UnauthorizedException`)

### JwtAuthGuard в нашем проекте

```typescript
// apps/api/src/modules/auth/jwt-auth.guard.ts

import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

Удивительно коротко, правда? Всего одна строка кода. Это потому что вся логика
проверки JWT-токена спрятана в `AuthGuard` из `@nestjs/passport` и в нашей стратегии.

### JwtStrategy -- как проверяется токен

Guard использует **стратегию** для проверки токена:

```typescript
// apps/api/src/modules/auth/jwt.strategy.ts

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

interface JwtPayload {
  sub: string;
  email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      // Откуда брать токен: из заголовка Authorization: Bearer <token>
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),

      // Не принимать истёкшие токены
      ignoreExpiration: false,

      // Секрет для проверки подписи
      secretOrKey: configService.get<string>('jwt.secret'),
    });
  }

  // Этот метод вызывается после успешной проверки токена.
  // Результат будет доступен через request.user
  validate(payload: JwtPayload) {
    return {
      id: payload.sub,
      email: payload.email,
    };
  }
}
```

Цепочка работы:

```
Запрос с заголовком "Authorization: Bearer eyJhbGciOi..."
  -> JwtAuthGuard: "Нужно проверить токен"
    -> JwtStrategy.jwtFromRequest: "Извлекаю токен из заголовка"
    -> passport-jwt: "Проверяю подпись и срок действия"
    -> JwtStrategy.validate(): "Токен валидный, возвращаю { id, email }"
  -> Guard пропускает запрос
    -> Контроллер получает user через @CurrentUser()
```

### Использование Guards

Guard можно повесить на:

```typescript
// На отдельный метод
@Get('me')
@UseGuards(JwtAuthGuard)
async getMe() { ... }

// На весь контроллер
@Controller('users')
@UseGuards(JwtAuthGuard)    // Все методы контроллера защищены
export class UsersController { ... }

// Глобально (в main.ts) -- для всего приложения
app.useGlobalGuards(new JwtAuthGuard());
```

---

## 6. Декораторы -- суперсила NestJS

### Что такое декораторы

Декораторы -- это специальный синтаксис TypeScript, который позволяет **добавлять
метаданные или поведение** к классам, методам, свойствам и параметрам. Это `@` перед
именем -- не просто комментарий, а реальный код.

### В React нет декораторов?

В React декораторов нет (хотя есть proposal). Ближайший аналог -- **HOC** (Higher Order
Component):

```tsx
// React HOC -- обёртка, добавляющая поведение
const withAuth = (Component) => {
  return (props) => {
    const { user } = useAuth();
    if (!user) return <Navigate to="/login" />;
    return <Component {...props} user={user} />;
  };
};

// Использование
export default withAuth(Dashboard);
```

В NestJS декоратор делает то же самое, но синтаксис компактнее:

```typescript
// NestJS декоратор
@UseGuards(JwtAuthGuard)        // аналог withAuth
@Get('me')                      // определяет маршрут
async getMe(@CurrentUser() user) { ... }  // извлекает данные
```

### Кастомный декоратор @CurrentUser

В нашем проекте есть кастомный декоратор `@CurrentUser()`:

```typescript
// apps/api/src/common/decorators/current-user.decorator.ts

import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
```

### Как это работает

Функция `createParamDecorator` создаёт декоратор для **параметров метода**.
Когда ты пишешь:

```typescript
async getMe(@CurrentUser() user: { id: string; email: string }) {
  // user = { id: "...", email: "..." }
}
```

NestJS:

1. Вызывает функцию внутри `createParamDecorator`
2. Она достаёт `request.user` (который был установлен Guard/Strategy)
3. И передаёт результат как параметр `user` в метод `getMe`

### Без декоратора

Без `@CurrentUser()` пришлось бы работать с объектом запроса напрямую:

```typescript
// Без декоратора -- менее читаемо
@Get('me')
@UseGuards(JwtAuthGuard)
async getMe(@Req() request: Request) {
  const user = (request as any).user;     // Нет типизации, некрасиво
  return this.authService.getMe(user.id);
}

// С декоратором -- чисто и типизированно
@Get('me')
@UseGuards(JwtAuthGuard)
async getMe(@CurrentUser() user: { id: string; email: string }) {
  return this.authService.getMe(user.id);  // Типы на месте
}
```

### Декораторы, которые мы используем

| Декоратор | Тип | Назначение |
|---|---|---|
| `@Module()` | Класс | Определяет модуль |
| `@Controller('auth')` | Класс | Определяет контроллер с префиксом |
| `@Injectable()` | Класс | Делает класс инжектируемым |
| `@Get()`, `@Post()` | Метод | HTTP-метод и путь |
| `@UseGuards()` | Метод/Класс | Добавляет Guard |
| `@Body()` | Параметр | Извлекает тело запроса |
| `@Param()` | Параметр | Извлекает URL-параметр |
| `@CurrentUser()` | Параметр | Извлекает текущего пользователя |
| `@IsEmail()` | Свойство | Валидация: должен быть email |
| `@MinLength()` | Свойство | Валидация: минимальная длина |

Декораторы -- это не магия. Это паттерн, который позволяет **декларативно** описывать
поведение. Вместо императивного "сделай это, потом это" ты пишешь "этот метод
обрабатывает POST-запрос, требует авторизацию, и тело запроса имеет вот такую структуру".

---

## 7. Pipes и Validation

### Проблема: валидация входных данных

Когда пользователь отправляет данные на сервер, нужно проверить:

- Email -- это правда email?
- Пароль достаточно длинный?
- Все обязательные поля заполнены?

### Валидация в React vs NestJS

На фронтенде ты, скорее всего, используешь **zod** или **yup**:

```typescript
// apps/web/src/features/auth/login-form.tsx (фронтенд)

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
```

На бэкенде NestJS использует **class-validator** -- это библиотека валидации через
декораторы:

```typescript
// apps/api/src/modules/auth/auth.controller.ts (бэкенд)

class RegisterBodyDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}

class LoginBodyDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(1)
  password!: string;
}
```

### Как работает автоматическая валидация

Валидация работает через **ValidationPipe**, который мы подключаем глобально в `main.ts`:

```typescript
// apps/api/src/main.ts

import { ValidationPipe, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true,
  });

  // Глобальная валидация
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,     // Удаляет поля, которых нет в DTO
      transform: true,     // Автоматически преобразует типы
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port', 3001);

  await app.listen(port);
  logger.log(`Application is running on http://localhost:${port}`);
}

bootstrap();
```

### Что делает ValidationPipe

Цепочка обработки запроса:

```
POST /auth/register
Body: { "email": "not-an-email", "password": "123", "hack": "malicious" }

1. ValidationPipe получает тело запроса
2. Создаёт экземпляр RegisterBodyDto
3. Проверяет декораторы:
   - @IsEmail() на email -> "not-an-email" -- не email! ОШИБКА
   - @MinLength(6) на password -> "123" -- меньше 6 символов! ОШИБКА
4. whitelist: true -> поле "hack" отброшено (его нет в DTO)
5. Возвращает ответ с ошибками 400 Bad Request:
   {
     "statusCode": 400,
     "message": [
       "email must be an email",
       "password must be longer than or equal to 6 characters"
     ],
     "error": "Bad Request"
   }
```

Контроллер вообще не вызывается! Запрос отклоняется на уровне Pipe.

### Опция `whitelist: true`

Это важная защита. Если кто-то отправит:

```json
{
  "email": "user@example.com",
  "password": "123456",
  "role": "admin"
}
```

Поле `role` будет **автоматически удалено**, потому что его нет в DTO. Без `whitelist`
это поле могло бы попасть в базу данных.

### Популярные декораторы class-validator

| Декоратор | Проверка |
|---|---|
| `@IsEmail()` | Строка -- валидный email |
| `@IsString()` | Значение -- строка |
| `@IsNumber()` | Значение -- число |
| `@IsBoolean()` | Значение -- boolean |
| `@MinLength(n)` | Строка длиной >= n |
| `@MaxLength(n)` | Строка длиной <= n |
| `@IsOptional()` | Поле необязательное |
| `@IsNotEmpty()` | Строка не пустая |
| `@IsUUID()` | Строка -- валидный UUID |
| `@IsDate()` | Значение -- дата |
| `@Matches(regex)` | Строка соответствует регулярке |

### Сравнение: zod vs class-validator

| Аспект | zod (фронтенд) | class-validator (бэкенд) |
|---|---|---|
| Подход | Функциональный, цепочки | Декораторы на классах |
| Типизация | Генерирует типы (`z.infer`) | Класс является типом |
| Интеграция | react-hook-form, формы | NestJS ValidationPipe |
| Синтаксис | `z.string().email()` | `@IsEmail()` |

Оба подхода делают одно и то же -- валидируют данные. Просто используют разный синтаксис,
подходящий для своей среды.

---

## 8. TypeORM и база данных

### Зачем ORM

На фронтенде ты обычно не работаешь с базой данных напрямую. Ты отправляешь HTTP-запрос
к API, а бэкенд сам разбирается с БД.

На бэкенде нужно как-то хранить данные. Можно писать SQL-запросы вручную, а можно
использовать **ORM** (Object-Relational Mapping) -- библиотеку, которая позволяет
работать с базой данных через TypeScript-объекты.

**TypeORM** -- это ORM для TypeScript, которую мы используем в MindBridge.

### Entity -- модель таблицы

Entity -- это класс, который описывает **таблицу** в базе данных. Каждый экземпляр
Entity -- это **строка** в таблице.

```typescript
// apps/api/src/modules/users/user.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')       // Имя таблицы в БД
export class User {
  @PrimaryGeneratedColumn('uuid')     // Первичный ключ, UUID, генерируется автоматически
  id!: string;

  @Column({ unique: true })           // Столбец, уникальный
  email!: string;

  @Column()                           // Обычный столбец
  password!: string;

  @CreateDateColumn()                 // Автоматически заполняется при создании
  createdAt!: Date;

  @UpdateDateColumn()                 // Автоматически обновляется при изменении
  updatedAt!: Date;
}
```

Это описание создаёт такую таблицу в PostgreSQL:

```sql
CREATE TABLE "users" (
  "id"        UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  "email"     VARCHAR UNIQUE NOT NULL,
  "password"  VARCHAR NOT NULL,
  "createdAt" TIMESTAMP DEFAULT now(),
  "updatedAt" TIMESTAMP DEFAULT now()
);
```

Тебе **не нужно** писать SQL. TypeORM генерирует таблицу из класса.

### Аналогия из React

Если провести аналогию с фронтендом, Entity -- это как **тип/интерфейс данных**,
которые ты получаешь от API:

```typescript
// Фронтенд: описание данных (интерфейс)
// packages/types/src/user.ts
export interface UserDto {
  id: string;
  email: string;
  createdAt: string;
}

// Бэкенд: описание данных + привязка к БД (Entity)
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  // ...
}
```

Фронтендовский `UserDto` описывает "как выглядят данные". Бэкендовский `User` (Entity)
описывает "как выглядят данные **и** как они хранятся в базе".

### Repository -- работа с данными

Для работы с Entity используется **Repository** -- объект с готовыми методами для CRUD
(Create, Read, Update, Delete).

```typescript
// apps/api/src/modules/users/users.service.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)                           // DI: инжектируем репозиторий
    private readonly usersRepository: Repository<User>,  // Готовые методы для работы с User
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
    //     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    //     SELECT * FROM users WHERE email = $1 LIMIT 1
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
    //     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    //     SELECT * FROM users WHERE id = $1 LIMIT 1
  }

  async create(email: string, hashedPassword: string): Promise<User> {
    const user = this.usersRepository.create({
      email,
      password: hashedPassword,
    });
    //     ^^^^^^^^^^^^^^^^^^^^
    //     Создаёт объект User в памяти (но НЕ сохраняет в БД)

    return this.usersRepository.save(user);
    //     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    //     INSERT INTO users (email, password) VALUES ($1, $2) RETURNING *
  }
}
```

### Методы Repository

| Метод | SQL-аналог | Что делает |
|---|---|---|
| `find()` | `SELECT * FROM users` | Найти все записи |
| `findOne({ where: { id } })` | `SELECT ... WHERE id = ?` | Найти одну запись |
| `create({ email })` | -- | Создать объект в памяти |
| `save(user)` | `INSERT / UPDATE` | Сохранить в БД |
| `remove(user)` | `DELETE FROM users WHERE ...` | Удалить запись |
| `count()` | `SELECT COUNT(*) FROM users` | Посчитать записи |

### Подключение TypeORM

TypeORM подключается в `AppModule`:

```typescript
// apps/api/src/app.module.ts

TypeOrmModule.forRootAsync({
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => ({
    type: 'postgres' as const,               // Тип БД -- PostgreSQL
    url: configService.get<string>('database.url'),  // URL подключения из конфига
    autoLoadEntities: true,                  // Автоматически загружать Entity
    synchronize: true,                       // Синхронизировать схему (только для dev!)
  }),
}),
```

А конкретная Entity регистрируется в модуле:

```typescript
// apps/api/src/modules/users/users.module.ts

@Module({
  imports: [TypeOrmModule.forFeature([User])],  // Регистрируем User Entity
  // ...
})
export class UsersModule {}
```

`forFeature([User])` создаёт Repository для Entity `User`, который потом можно
инжектировать через `@InjectRepository(User)`.

### Полная цепочка: от фронтенда до БД

Проследим путь данных при регистрации:

```
1. Фронтенд: пользователь заполняет форму
   RegisterForm -> { email: "user@test.com", password: "123456" }

2. HTTP-запрос
   POST /auth/register
   Body: { "email": "user@test.com", "password": "123456" }

3. Бэкенд: ValidationPipe
   Проверяет RegisterBodyDto: email валидный? password >= 6 символов? OK.

4. Бэкенд: AuthController.register()
   Получает провалидированный body, передаёт в AuthService.

5. Бэкенд: AuthService.register()
   - Проверяет: нет ли уже пользователя с таким email? (UsersService.findByEmail)
   - Хэширует пароль: bcrypt.hash("123456", 10) -> "$2b$10$..."
   - Создаёт пользователя: UsersService.create(email, hashedPassword)

6. Бэкенд: UsersService.create()
   - usersRepository.create({ email, password }) -> создаёт объект User
   - usersRepository.save(user) -> INSERT INTO users ... (запись в PostgreSQL)

7. Бэкенд: AuthService
   - Генерирует JWT-токен: jwtService.sign({ sub: user.id, email: user.email })
   - Возвращает: { access_token: "eyJhbGciOi..." }

8. HTTP-ответ
   201 Created
   Body: { "access_token": "eyJhbGciOi..." }

9. Фронтенд: LoginForm.onSubmit()
   - Cookies.set('token', response.access_token)
   - router.push('/dashboard')
```

---

## 9. Конфигурация

### Проблема: чувствительные данные

Пароли от базы данных, секреты JWT, ключи API -- всё это нельзя хардкодить в коде.
На фронтенде ты знаком с `.env` файлами и `NEXT_PUBLIC_*` переменными. На бэкенде
работает похожий подход.

### В React/Next.js

```typescript
// apps/web/src/shared/config/env.ts

export const env = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
} as const;
```

Просто, но без типизации и валидации. Если забыл задать переменную -- узнаешь
только в рантайме.

### В NestJS: @nestjs/config

В нашем проекте конфигурация определяется в отдельном файле:

```typescript
// apps/api/src/config/configuration.ts

export default () => ({
  port: parseInt(process.env.PORT ?? '3001', 10),
  database: {
    url: process.env.DATABASE_URL,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: '7d',
  },
});
```

Это функция, которая возвращает объект конфигурации. Она:

- Читает переменные окружения (`process.env.*`)
- Задаёт значения по умолчанию (`'3001'`, `'7d'`)
- Преобразует типы (`parseInt`)
- Группирует связанные настройки (`database`, `jwt`)

### Подключение ConfigModule

```typescript
// apps/api/src/app.module.ts

ConfigModule.forRoot({
  isGlobal: true,          // Доступен во всех модулях без дополнительного импорта
  load: [configuration],   // Загружаем нашу функцию конфигурации
}),
```

`isGlobal: true` означает, что `ConfigService` можно инжектировать **в любом модуле**
без дополнительного `imports: [ConfigModule]`.

### Использование ConfigService

После подключения `ConfigModule` можно инжектировать `ConfigService` в любой сервис:

```typescript
// apps/api/src/modules/auth/jwt.strategy.ts

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {      // DI инжектирует ConfigService
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret'),  // Читаем из конфига
    });
  }
}
```

```typescript
// apps/api/src/modules/auth/auth.module.ts

JwtModule.registerAsync({
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => ({
    secret: configService.get<string>('jwt.secret'),       // Секрет для JWT
    signOptions: {
      expiresIn: configService.get<string>('jwt.expiresIn', '7d'),  // Время жизни токена
    },
  }),
}),
```

### Доступ к вложенным значениям

Обрати внимание на точечную нотацию:

```typescript
configService.get<string>('jwt.secret')      // -> process.env.JWT_SECRET
configService.get<string>('database.url')    // -> process.env.DATABASE_URL
configService.get<number>('port', 3001)      // -> process.env.PORT || 3001
```

Конфигурация -- это вложенный объект, и ты обращаешься к значениям через точку.

### Аналогия с React

| React/Next.js | NestJS |
|---|---|
| `.env.local` | `.env` |
| `process.env.NEXT_PUBLIC_API_URL` | `configService.get('key')` |
| Нет типизации | `configService.get<string>('key')` |
| Нет валидации | Можно добавить Joi / class-validator |
| Доступ напрямую | Доступ через DI (ConfigService) |

---

## 10. Шпаргалка: React concepts -> NestJS

### Основные соответствия

| React концепция | NestJS аналог | Комментарий |
|---|---|---|
| Компонент | Контроллер + Сервис | Контроллер = вид, сервис = логика |
| `App.tsx` | `AppModule` | Корневая точка сборки |
| Feature-папка | Module | Группировка связанного кода |
| `index.ts` (exports) | `exports` в `@Module()` | Публичный API модуля |
| Context API / Provider | Dependency Injection | Передача зависимостей |
| `useContext()` | Constructor injection | Получение зависимости |
| HOC / `PrivateRoute` | Guard | Защита маршрутов |
| Props | `@Body()`, `@Param()`, `@Query()` | Получение входных данных |
| `react-router` Route | `@Get()`, `@Post()` декораторы | Определение маршрутов |
| zod / yup | class-validator + ValidationPipe | Валидация данных |
| TypeScript interface | Entity (class + декораторы) | Описание структуры данных |
| `.env` + `NEXT_PUBLIC_*` | ConfigModule + ConfigService | Конфигурация |
| `react-helmet` / metadata | -- (не нужно, это API) | На бэкенде нет SEO |
| `useState` / `useReducer` | Сервис с состоянием / БД | Хранение данных |
| `useEffect` (fetch) | Контроллер (обработка запроса) | Они на разных сторонах |
| Error Boundary | ExceptionFilter | Глобальная обработка ошибок |
| Middleware (Next.js) | Guard / Middleware (NestJS) | Перехват запросов |

### Структура проекта: фронтенд vs бэкенд

```
Frontend (apps/web):                Backend (apps/api):
src/                                src/
  app/                                app.module.ts         <- Корневой модуль
    layout.tsx                        main.ts               <- Точка входа
    page.tsx                          config/
    login/                              configuration.ts    <- Конфигурация
      page.tsx                        common/
    dashboard/                          decorators/         <- Кастомные декораторы
      layout.tsx                        filters/            <- Фильтры ошибок
      page.tsx                        modules/
  features/                             auth/
    auth/                                 auth.module.ts    <- Модуль
      login-form.tsx                      auth.controller.ts <- Контроллер
      register-form.tsx                   auth.service.ts   <- Сервис
      logout-button.tsx                   jwt.strategy.ts   <- Стратегия
  entities/                               jwt-auth.guard.ts <- Guard
    user/                               users/
      model.ts                            users.module.ts
  shared/                                 users.service.ts
    api/                                  users.controller.ts
      client.ts                           user.entity.ts    <- Entity (модель БД)
    config/
      env.ts
```

### Жизненный цикл запроса

```
React/Next.js (Фронтенд)              NestJS (Бэкенд)

1. Пользователь нажимает кнопку
2. onSubmit вызывает API-клиент
3. fetch('POST /auth/login', body)  -> 4. Middleware (CORS, logging)
                                    -> 5. Guard (авторизация, если нужна)
                                    -> 6. Pipe (валидация body)
                                    -> 7. Controller.login(body)
                                    -> 8. Service.login(body)
                                    -> 9. Repository (запрос к БД)
                                    <- 10. Service возвращает данные
                                    <- 11. Controller возвращает ответ
                                    <- 12. ExceptionFilter (если ошибка)
13. Получаем ответ
14. Обновляем UI
```

### Быстрые правила NestJS

1. **Один модуль = одна фича.** `AuthModule` -- для авторизации, `UsersModule` -- для
   пользователей.

2. **Контроллеры не содержат бизнес-логику.** Они только принимают запрос и вызывают
   сервис. Вся логика -- в сервисах.

3. **Не создавай зависимости вручную (`new Service()`).** Используй DI -- объяви
   зависимость в конструкторе, и NestJS сам создаст и передаст её.

4. **Декоратор `@Injectable()`** нужен на каждом сервисе, guard, strategy и pipe.
   Без него DI не будет работать.

5. **Валидация через DTO + class-validator.** Не проверяй данные вручную в контроллере.
   Создай DTO-класс с декораторами валидации.

6. **Используй встроенные исключения.** `throw new NotFoundException()` вместо
   `res.status(404).json(...)`.

7. **`forRoot()` vs `forFeature()`.** `forRoot()` -- глобальная настройка модуля
   (подключение к БД). `forFeature()` -- настройка для конкретного модуля
   (регистрация Entity).

8. **`exports`** -- не забывай экспортировать сервисы, которые нужны другим модулям.
   Если `AuthModule` использует `UsersService`, то `UsersModule` должен
   экспортировать `UsersService`.

9. **`isGlobal: true`** -- делает модуль доступным везде без дополнительного импорта.
   Используй для `ConfigModule` и подобных инфраструктурных модулей.

10. **Файл `main.ts`** -- точка входа приложения. Здесь подключаются глобальные Pipes,
    Filters, CORS и запускается сервер.

---

## Заключение

NestJS может показаться непривычным после React: декораторы, DI, модули, guards --
всё это новые концепции. Но если присмотреться, многие идеи знакомы:

- **Модули** -- это feature-папки с публичным API
- **DI** -- это Context API, только мощнее
- **Guards** -- это PrivateRoute для API
- **Pipes** -- это zod, только с декораторами
- **Entity** -- это TypeScript-интерфейс, привязанный к БД

Главное преимущество NestJS -- это **предсказуемость**. Каждый NestJS-проект выглядит
похоже: модули, контроллеры, сервисы. Зная структуру одного проекта, ты легко разберёшься
в другом.

В нашем проекте MindBridge весь бэкенд -- это два модуля (`AuthModule` и `UsersModule`),
два контроллера, два сервиса и одна Entity. Но эта структура легко масштабируется:
добавляешь новый модуль -- и он встраивается в существующую архитектуру без хаоса.

Если ты дочитал до сюда -- ты уже понимаешь 80% того, что нужно для работы с NestJS.
Остальные 20% придут с практикой. Открывай код MindBridge (`apps/api/src/`) и
экспериментируй.
