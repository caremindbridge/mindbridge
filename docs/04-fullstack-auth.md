# Аутентификация от А до Я: как работает auth в Next.js + NestJS

Если ты знаешь React, но никогда не делал аутентификацию в полноценном full-stack
приложении -- эта статья для тебя. Мы разберём каждый шаг: от клика по кнопке
"Войти" до того, как сервер понимает, кто именно прислал запрос. Все примеры --
реальный код проекта MindBridge.

---

## 1. Что такое аутентификация и авторизация

Эти два слова часто путают, но они про разное.

**Аутентификация** -- это ответ на вопрос **"Кто ты?"**.
Пользователь вводит email и пароль, система проверяет их и говорит:
"Ок, ты -- Вася Иванов, я тебя узнал."

**Авторизация** -- это ответ на вопрос **"Что тебе можно?"**.
Вася Иванов -- обычный пользователь, ему нельзя удалять чужие записи.
А вот администратору -- можно.

В нашем проекте MindBridge сейчас реализована **аутентификация**: мы проверяем,
кто пользователь, и выдаём ему токен для доступа к защищённым маршрутам.
Авторизация (роли, права доступа) -- тема для следующего этапа.

---

## 2. Обзор: полный путь запроса

Прежде чем погружаться в код, давай посмотрим на весь flow целиком.
Вот что происходит, когда пользователь логинится и попадает в дашборд:

```
[Пользователь]
      |
      v
[Форма логина]  -- Zod валидация на клиенте
      |
      v
[POST /auth/login]  -- fetch-запрос к API
      |
      v
[AuthController]  -- class-validator проверяет тело запроса
      |
      v
[AuthService.login()]  -- ищет пользователя в БД, сравнивает пароль
      |
      v
[JWT токен создан]  -- jwtService.sign({ sub: userId, email })
      |
      v
[Ответ: { access_token: "eyJhbG..." }]
      |
      v
[Клиент сохраняет токен в cookie]  -- Cookies.set('token', ...)
      |
      v
[router.push('/dashboard')]  -- редирект на дашборд
      |
      v
[Next.js middleware]  -- проверяет наличие cookie 'token'
      |
      v
[DashboardLayout монтируется]  -- вызывает useUser()
      |
      v
[GET /auth/me + Bearer token]  -- apiClient добавляет токен из cookie
      |
      v
[JwtAuthGuard]  -- Passport проверяет подпись токена
      |
      v
[AuthService.getMe()]  -- достаёт пользователя из БД
      |
      v
[Dashboard отрисован с данными пользователя]
```

Теперь разберём каждый шаг подробно.

---

## 3. Шаг 1: Регистрация -- от клика до записи в БД

### 3.1. Форма регистрации на клиенте

Форма регистрации живёт в `apps/web/src/features/auth/register-form.tsx`.
Она использует **react-hook-form** для управления состоянием формы и **zod**
для валидации данных до отправки на сервер.

Вот схема валидации:

```typescript
// apps/web/src/features/auth/register-form.tsx

const registerSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type RegisterFormValues = z.infer<typeof registerSchema>;
```

Что здесь происходит:

- `z.string().email()` -- проверяет, что введена валидная электронная почта
- `z.string().min(6)` -- пароль должен быть не короче 6 символов
- `z.infer<typeof registerSchema>` -- автоматически выводит TypeScript-тип из схемы

Схема подключается к форме через `zodResolver`:

```typescript
const {
  register,
  handleSubmit,
  formState: { errors },
} = useForm<RegisterFormValues>({
  resolver: zodResolver(registerSchema),
});
```

Когда пользователь нажимает "Create account", `handleSubmit` сначала прогоняет
данные через zod-схему. Если валидация не прошла -- форма покажет ошибки
прямо под полями ввода, и запрос на сервер **не уйдёт**. Это важно:
мы экономим и время пользователя, и ресурсы сервера.

### 3.2. Отправка запроса на сервер

Если валидация прошла, вызывается `onSubmit`:

```typescript
// apps/web/src/features/auth/register-form.tsx

const onSubmit = async (data: RegisterFormValues) => {
  try {
    setIsSubmitting(true);
    setServerError(null);
    const response = await registerApi(data);
    Cookies.set('token', response.access_token, { expires: 7 });
    router.push('/dashboard');
  } catch (err) {
    setServerError(err instanceof Error ? err.message : 'Registration failed');
  } finally {
    setIsSubmitting(false);
  }
};
```

Функция `registerApi` -- это обёртка над `fetch`:

```typescript
// apps/web/src/shared/api/client.ts

export async function register(dto: RegisterDto): Promise<AuthResponse> {
  return apiClient.post<AuthResponse>('/auth/register', dto);
}
```

Она отправляет POST-запрос на `/auth/register` с телом `{ email, password }`.

### 3.3. Серверная валидация (class-validator)

Запрос приходит в `AuthController`. NestJS автоматически валидирует тело запроса
через **class-validator**, потому что DTO описан с декораторами:

```typescript
// apps/api/src/modules/auth/auth.controller.ts

class RegisterBodyDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() body: RegisterBodyDto) {
    return this.authService.register({
      email: body.email,
      password: body.password,
    });
  }
}
```

Зачем дублировать валидацию? Потому что клиентскую валидацию легко обойти --
достаточно открыть DevTools и отправить запрос напрямую. Серверная валидация --
это **обязательный** рубеж обороны.

### 3.4. Проверка уникальности email

Контроллер передаёт данные в `AuthService.register()`:

```typescript
// apps/api/src/modules/auth/auth.service.ts

async register(dto: {
  email: string;
  password: string;
}): Promise<{ access_token: string }> {
  const existingUser = await this.usersService.findByEmail(dto.email);
  if (existingUser) {
    throw new ConflictException('A user with this email already exists');
  }
  // ...
}
```

Первым делом проверяем: а нет ли уже пользователя с таким email?
Если есть -- кидаем `ConflictException` (HTTP 409).

`findByEmail` -- это простой запрос к базе через TypeORM:

```typescript
// apps/api/src/modules/users/users.service.ts

async findByEmail(email: string): Promise<User | null> {
  return this.usersRepository.findOne({ where: { email } });
}
```

### 3.5. Хэширование пароля (bcrypt)

Если email свободен, хэшируем пароль:

```typescript
const hashedPassword = await bcrypt.hash(dto.password, 10);
```

**Зачем хэшировать?** Если злоумышленник получит доступ к базе данных (а такое,
увы, случается), он увидит не `"myPassword123"`, а что-то вроде
`"$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"`.
Восстановить исходный пароль из хэша практически невозможно.

Число `10` -- это **salt rounds** (раунды соли). Чем больше число, тем дольше
вычисляется хэш и тем сложнее его подобрать перебором. Значение 10 -- хороший
баланс между безопасностью и скоростью. При значении 10 хэширование занимает
около 100 мс, при 12 -- уже около 300 мс.

**Что такое соль?** Bcrypt автоматически генерирует случайную строку (соль)
и добавляет её к паролю перед хэшированием. Это значит, что два пользователя
с одинаковым паролем получат **разные** хэши. Без соли злоумышленник мог бы
использовать заранее вычисленные таблицы хэшей (rainbow tables).

### 3.6. Сохранение в базу данных

После хэширования создаём пользователя:

```typescript
const user = await this.usersService.create(dto.email, hashedPassword);
```

В `UsersService`:

```typescript
// apps/api/src/modules/users/users.service.ts

async create(email: string, hashedPassword: string): Promise<User> {
  const user = this.usersRepository.create({
    email,
    password: hashedPassword,
  });
  return this.usersRepository.save(user);
}
```

Сущность `User` описана как TypeORM-entity:

```typescript
// apps/api/src/modules/users/user.entity.ts

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
```

Обрати внимание: `id` генерируется как UUID (а не автоинкремент). Это безопаснее:
пользователь не может угадать id другого пользователя, перебирая числа 1, 2, 3...

### 3.7. Генерация JWT-токена

После сохранения пользователя генерируем токен:

```typescript
// apps/api/src/modules/auth/auth.service.ts

return {
  access_token: this.generateToken(user),
};

// ...

private generateToken(user: User): string {
  return this.jwtService.sign({
    sub: user.id,
    email: user.email,
  });
}
```

`jwtService.sign()` создаёт JWT-токен с payload `{ sub: userId, email }`.
Подробнее о JWT поговорим в разделе 5.

### 3.8. Сохранение токена на клиенте

Сервер вернул `{ access_token: "eyJhbG..." }`. Клиент сохраняет его в cookie:

```typescript
Cookies.set('token', response.access_token, { expires: 7 });
```

`expires: 7` -- cookie будет жить 7 дней. После этого -- срок истечёт, и
пользователю нужно будет войти заново.

Почему cookie, а не localStorage? Потому что cookies автоматически отправляются
с каждым запросом, а ещё Next.js middleware (который работает на сервере) может
их прочитать. localStorage доступен только из JavaScript в браузере.

### 3.9. Редирект на дашборд

```typescript
router.push('/dashboard');
```

Пользователь зарегистрирован, токен сохранён -- перенаправляем на дашборд.

---

## 4. Шаг 2: Логин -- в чём отличие от регистрации

Процесс логина очень похож на регистрацию, но с ключевыми отличиями.

### 4.1. Форма логина

Форма живёт в `apps/web/src/features/auth/login-form.tsx` и использует
ту же схему валидации:

```typescript
// apps/web/src/features/auth/login-form.tsx

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
```

### 4.2. AuthService.login() -- find вместо create, compare вместо hash

Вот метод `login` на сервере:

```typescript
// apps/api/src/modules/auth/auth.service.ts

async login(dto: {
  email: string;
  password: string;
}): Promise<{ access_token: string }> {
  const user = await this.usersService.findByEmail(dto.email);
  if (!user) {
    throw new UnauthorizedException('Invalid email or password');
  }

  const isPasswordValid = await bcrypt.compare(dto.password, user.password);
  if (!isPasswordValid) {
    throw new UnauthorizedException('Invalid email or password');
  }

  return {
    access_token: this.generateToken(user),
  };
}
```

Сравни с `register`:

| Регистрация | Логин |
|---|---|
| `findByEmail` -- проверяем, что email **свободен** | `findByEmail` -- проверяем, что email **существует** |
| `bcrypt.hash()` -- создаём хэш пароля | `bcrypt.compare()` -- сравниваем пароль с хэшем |
| `usersService.create()` -- создаём запись | Не создаём ничего |
| `ConflictException` если email занят | `UnauthorizedException` если данные неверны |

### 4.3. Одинаковое сообщение об ошибке -- это не лень, а безопасность

Обрати внимание: и при несуществующем email, и при неправильном пароле сервер
возвращает **одно и то же сообщение**: `"Invalid email or password"`.

Зачем? Представь, что мы отвечали бы по-разному:

- "User not found" -- злоумышленник теперь знает, что такого email нет в системе
- "Wrong password" -- а теперь знает, что email **есть**, и можно подбирать пароль

С одинаковым сообщением злоумышленник не может определить, какая часть данных
неверна. Это называется **предотвращение перечисления пользователей**
(user enumeration prevention).

---

## 5. Шаг 3: JWT -- что это и как работает

### 5.1. Что такое JWT

JWT (JSON Web Token) -- это строка, состоящая из трёх частей, разделённых точками:

```
eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyLWlkIiwiZW1haWwiOiJ0ZXN0QG1haWwuY29tIn0.SIGNATURE
|____ Header ____|     |_________________ Payload ________________|                |_ Signature _|
```

**Header** -- информация об алгоритме подписи:

```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

**Payload** -- полезные данные. В нашем проекте:

```json
{
  "sub": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "iat": 1700000000,
  "exp": 1700604800
}
```

- `sub` (subject) -- id пользователя
- `email` -- email пользователя
- `iat` (issued at) -- время создания токена (добавляется автоматически)
- `exp` (expiration) -- время истечения (7 дней, настроено в конфигурации)

**Signature** -- подпись, созданная с помощью секретного ключа.

### 5.2. Как создаётся подпись

Сервер берёт Header + Payload, кодирует их в Base64, и подписывает с помощью
секретного ключа (`JWT_SECRET` из `.env`):

```
HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  JWT_SECRET
)
```

Это настроено в конфигурации проекта:

```typescript
// apps/api/src/config/configuration.ts

export default () => ({
  // ...
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: '7d',
  },
});
```

### 5.3. Как проверяется токен

Когда сервер получает токен в запросе, он:

1. Берёт Header и Payload из токена
2. Заново вычисляет подпись, используя свой `JWT_SECRET`
3. Сравнивает вычисленную подпись с подписью в токене

Если подписи совпадают -- токен валиден, данные не были изменены.
Если не совпадают -- токен отклоняется.

**Ключевой момент**: серверу не нужно обращаться к базе данных для проверки
токена! Достаточно знать секретный ключ. Это делает JWT очень быстрым.

### 5.4. JWT НЕ шифрует данные

Это важно понять: Header и Payload просто закодированы в Base64.
Любой может декодировать их и прочитать содержимое:

```bash
echo "eyJzdWIiOiJ1c2VyLWlkIn0" | base64 -d
# Результат: {"sub":"user-id"}
```

JWT **подписывает**, но **не шифрует**. Подпись гарантирует, что данные
не были изменены, но не скрывает их.

**Аналогия**: представь пропуск в бизнес-центр с голограммой. На пропуске
написано твоё имя и должность -- это видно всем. Но голограмму нельзя подделать,
поэтому охранник уверен, что пропуск настоящий.

Именно поэтому нельзя хранить в JWT чувствительные данные (пароли, номера карт).
У нас в payload только `sub` (id) и `email` -- это безопасно.

### 5.5. Срок жизни токена

В нашем проекте токен живёт **7 дней** (`expiresIn: '7d'`). После этого
`JwtStrategy` отклонит его (настройка `ignoreExpiration: false`), и пользователю
нужно будет залогиниться заново.

---

## 6. Шаг 4: Защита маршрутов на бэкенде

### 6.1. JwtStrategy -- стратегия Passport.js

Passport.js -- библиотека для аутентификации в Node.js. NestJS интегрируется
с ней через `@nestjs/passport`. Наша стратегия описана так:

```typescript
// apps/api/src/modules/auth/jwt.strategy.ts

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret'),
    });
  }

  validate(payload: JwtPayload) {
    return {
      id: payload.sub,
      email: payload.email,
    };
  }
}
```

Разберём настройки в `super()`:

- **`jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()`** -- указывает,
  где искать токен. В нашем случае -- в заголовке `Authorization: Bearer <token>`
- **`ignoreExpiration: false`** -- не принимать просроченные токены
- **`secretOrKey`** -- секретный ключ для проверки подписи. Берётся из конфигурации

Метод **`validate()`** вызывается, если подпись и срок жизни токена валидны.
Он получает расшифрованный payload и возвращает объект, который Passport
положит в `request.user`. Обрати внимание на маппинг: `payload.sub` становится
`id` -- так удобнее работать в контроллерах.

### 6.2. JwtAuthGuard -- применение защиты

Guard -- это "охранник" маршрута. Наш guard очень лаконичен:

```typescript
// apps/api/src/modules/auth/jwt-auth.guard.ts

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

Он наследуется от `AuthGuard('jwt')`, который автоматически использует нашу
`JwtStrategy`. Вся логика проверки уже реализована в Passport.

Применяется guard через декоратор `@UseGuards`:

```typescript
// apps/api/src/modules/auth/auth.controller.ts

@Get('me')
@UseGuards(JwtAuthGuard)
async getMe(@CurrentUser() user: { id: string; email: string }) {
  return this.authService.getMe(user.id);
}
```

Что происходит, когда приходит запрос `GET /auth/me`:

1. `JwtAuthGuard` перехватывает запрос
2. Passport извлекает токен из заголовка `Authorization`
3. Проверяет подпись и срок жизни через `JwtStrategy`
4. Вызывает `validate()`, результат кладёт в `request.user`
5. Если всё ок -- запрос проходит дальше, в контроллер
6. Если токен невалиден -- возвращается ошибка 401 Unauthorized

### 6.3. @CurrentUser() -- удобный доступ к пользователю

Чтобы не писать каждый раз `request.user`, у нас есть кастомный декоратор:

```typescript
// apps/api/src/common/decorators/current-user.decorator.ts

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
```

Теперь в контроллере можно просто написать:

```typescript
@Get('me')
@UseGuards(JwtAuthGuard)
async getMe(@CurrentUser() user: { id: string; email: string }) {
  return this.authService.getMe(user.id);
}
```

Вместо:

```typescript
async getMe(@Req() request: Request) {
  const user = request.user as { id: string; email: string };
  return this.authService.getMe(user.id);
}
```

Мелочь, но код становится чище и понятнее.

---

## 7. Шаг 5: Защита маршрутов на фронтенде

### 7.1. Next.js Middleware

На фронтенде маршруты защищает **Next.js middleware**:

```typescript
// apps/web/src/middleware.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // Redirect to login if accessing dashboard without a token
  if (pathname.startsWith('/dashboard') && !token) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect to dashboard if accessing auth pages with a token
  if ((pathname === '/login' || pathname === '/register') && token) {
    const dashboardUrl = new URL('/dashboard', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/register'],
};
```

### 7.2. Как это работает

Middleware в Next.js выполняется **на edge** (до рендеринга страницы!).
Это значит:

1. Пользователь заходит на `/dashboard`
2. **До того как страница начнёт рендериться**, middleware проверяет cookie
3. Если cookie `token` нет -- мгновенный редирект на `/login`
4. Пользователь даже не увидит мерцания дашборда

Это важно для UX: без middleware пользователь увидел бы страницу дашборда
на долю секунды, потом редирект. С middleware -- сразу попадёт на логин.

Middleware работает и в обратную сторону: если залогиненный пользователь
заходит на `/login` или `/register`, его перенаправит на `/dashboard`.
Зачем показывать форму логина тому, кто уже вошёл?

### 7.3. Важный нюанс: middleware НЕ проверяет валидность токена

Middleware смотрит только **наличие** cookie. Он не проверяет:

- Не истёк ли срок токена
- Валидна ли подпись
- Существует ли пользователь

Это **осознанное решение**. Middleware работает на edge-уровне и должен быть
максимально быстрым. Полная валидация -- задача API (JwtAuthGuard).
Middleware -- это первый, быстрый фильтр. API -- надёжная проверка.

### 7.4. Matcher -- на каких путях работает middleware

```typescript
export const config = {
  matcher: ['/dashboard/:path*', '/login', '/register'],
};
```

Middleware активируется только на указанных маршрутах:

- `/dashboard/:path*` -- дашборд и все вложенные пути (`/dashboard/settings`,
  `/dashboard/profile` и т.д.)
- `/login` -- страница логина
- `/register` -- страница регистрации

На остальных страницах (например, на главной `/`) middleware не запускается.
Это экономит ресурсы.

---

## 8. Шаг 6: Получение текущего пользователя

### 8.1. Хук useUser()

После того как пользователь попал на дашборд, нужно загрузить его данные.
Для этого есть хук `useUser()`:

```typescript
// apps/web/src/entities/user/model.ts

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

Что он делает:

1. При монтировании компонента проверяет наличие cookie `token`
2. Если токена нет -- сразу возвращает `user: null` (не тратит время на запрос)
3. Если токен есть -- отправляет `GET /auth/me`
4. Если запрос успешен -- сохраняет данные пользователя в state
5. Если ошибка (например, токен истёк) -- устанавливает `error`
6. Возвращает `mutate` для ручного обновления данных

### 8.2. Как apiClient добавляет токен к запросам

Функция `getMe()` вызывает `apiClient.get('/auth/me')`.
Посмотрим, как apiClient добавляет авторизацию:

```typescript
// apps/web/src/shared/api/client.ts

function getAuthHeaders(): Record<string, string> {
  const token = Cookies.get('token');
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}

// ...

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
```

`getAuthHeaders()` читает токен из cookie и формирует заголовок
`Authorization: Bearer eyJhbG...`. Этот заголовок добавляется к **каждому**
запросу через spread-оператор `...getAuthHeaders()`.

Если токена в cookie нет, возвращается пустой объект, и заголовок не добавляется.

### 8.3. DashboardLayout -- связывание всего вместе

Хук `useUser()` вызывается в `DashboardLayout`, который оборачивает все
страницы дашборда:

```typescript
// apps/web/src/widgets/dashboard-layout/dashboard-layout.tsx

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

Тут три состояния:

1. **Загрузка** (`isLoading`) -- показываем "Loading..."
2. **Ошибка** (`!user && error`) -- токен невалиден, редирект на `/login`
3. **Успех** (`user` есть) -- рисуем дашборд с данными пользователя

Это создаёт двойную защиту:
- **Middleware** -- быстрый редирект, если нет cookie (до рендеринга)
- **DashboardLayout** -- редирект, если токен есть, но невалиден (после запроса к API)

---

## 9. Шаг 7: Логаут

### 9.1. LogoutButton

Выход из системы реализован удивительно просто:

```typescript
// apps/web/src/features/auth/logout-button.tsx

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

Всего два действия:

1. Удалить cookie с токеном -- `Cookies.remove('token')`
2. Перенаправить на страницу логина -- `router.push('/login')`

### 9.2. Почему на бэкенде ничего не нужно делать

JWT -- это **stateless** (без состояния) механизм. Сервер не хранит список
активных токенов. Он просто проверяет подпись и срок жизни при каждом запросе.

Поэтому для "выхода" достаточно удалить токен на клиенте. Без токена клиент
не сможет отправлять авторизованные запросы -- фактически, он "вышел".

### 9.3. Ограничение: токен остаётся валидным

Есть один нюанс. Если злоумышленник перехватил токен до выхода пользователя,
этот токен останется валидным до истечения срока (до 7 дней). Удаление cookie
на клиенте не делает сам токен невалидным.

Это известное ограничение stateless JWT. Способы борьбы с ним мы обсудим
в разделе 10.

---

## 10. Безопасность: что можно улучшить

Наша текущая реализация -- хорошая отправная точка, но в продакшне стоит
добавить дополнительные меры защиты.

### 10.1. httpOnly cookies

Сейчас мы сохраняем токен через `js-cookie` -- это обычная cookie, доступная
из JavaScript. Если на сайте найдётся XSS-уязвимость, злоумышленник сможет
прочитать токен через `document.cookie`.

**Решение**: пусть сервер сам устанавливает cookie с флагом `httpOnly`.
Такая cookie недоступна из JavaScript -- её можно отправить только с HTTP-запросом.

```typescript
// Вместо ответа { access_token: "..." }
// Сервер устанавливает cookie через заголовок:
response.cookie('token', jwt, {
  httpOnly: true,     // Недоступна из JS
  secure: true,       // Только через HTTPS
  sameSite: 'strict', // Не отправляется с кросс-доменных запросов
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 дней
});
```

### 10.2. Refresh tokens

Сейчас у нас один токен, который живёт 7 дней. Если его украдут --
у злоумышленника есть целая неделя. Это много.

**Решение**: разделить на два токена:

- **Access token** -- живёт 15 минут, используется для запросов
- **Refresh token** -- живёт 7 дней, используется только для обновления
  access token

Если access token украдут, у злоумышленника будет всего 15 минут.
А refresh token можно хранить в httpOnly cookie, что затрудняет кражу.

### 10.3. CSRF protection

CSRF (Cross-Site Request Forgery) -- атака, при которой злоумышленник
заставляет браузер пользователя отправить запрос от его имени. При использовании
httpOnly cookies нужна дополнительная CSRF-защита (например, CSRF-токены или
проверка заголовка `Origin`).

### 10.4. Rate limiting

Сейчас ничто не мешает злоумышленнику отправлять тысячи запросов на `/auth/login`,
подбирая пароль. Нужно добавить ограничение: например, не более 5 попыток
входа в минуту с одного IP.

В NestJS это делается через `@nestjs/throttler`:

```typescript
@Throttle({ default: { limit: 5, ttl: 60000 } })
@Post('login')
async login(@Body() body: LoginBodyDto) { ... }
```

### 10.5. Хранение refresh token в БД (отзыв токенов)

Если хранить refresh tokens в базе данных, появляется возможность их **отзывать**:

- Пользователь нажал "Выйти на всех устройствах" -- удаляем все refresh tokens
- Администратор заблокировал пользователя -- удаляем его refresh tokens
- Обнаружена подозрительная активность -- отзываем конкретный токен

Это решает проблему "токен остаётся валидным после выхода", описанную в разделе 9.3.

---

## 11. Шпаргалка: весь flow в одной таблице

### Регистрация / Логин

| Этап | Где происходит | Файл | Что делает |
|------|---------------|------|------------|
| 1. Ввод данных | Браузер | `register-form.tsx` / `login-form.tsx` | Пользователь заполняет email и пароль |
| 2. Валидация (клиент) | Браузер | `register-form.tsx` / `login-form.tsx` | Zod проверяет формат email и длину пароля |
| 3. POST-запрос | Браузер -> Сервер | `client.ts` | `fetch('/auth/register')` или `fetch('/auth/login')` |
| 4. Валидация (сервер) | Сервер | `auth.controller.ts` | class-validator проверяет DTO |
| 5. Бизнес-логика | Сервер | `auth.service.ts` | Hash/compare пароля, поиск/создание пользователя |
| 6. Генерация JWT | Сервер | `auth.service.ts` | `jwtService.sign({ sub, email })` |
| 7. Ответ клиенту | Сервер -> Браузер | `auth.service.ts` | `{ access_token: "eyJ..." }` |
| 8. Сохранение токена | Браузер | `register-form.tsx` / `login-form.tsx` | `Cookies.set('token', ...)` |
| 9. Редирект | Браузер | `register-form.tsx` / `login-form.tsx` | `router.push('/dashboard')` |

### Доступ к защищённому маршруту

| Этап | Где происходит | Файл | Что делает |
|------|---------------|------|------------|
| 1. Переход на /dashboard | Браузер | -- | Пользователь открывает страницу |
| 2. Middleware | Edge (сервер) | `middleware.ts` | Проверяет наличие cookie, редирект если нет |
| 3. Рендеринг layout | Браузер | `dashboard-layout.tsx` | Монтирует DashboardLayout |
| 4. useUser() | Браузер | `model.ts` | Вызывает `getMe()` |
| 5. GET /auth/me | Браузер -> Сервер | `client.ts` | Запрос с `Authorization: Bearer token` |
| 6. JwtAuthGuard | Сервер | `jwt-auth.guard.ts` | Passport проверяет подпись JWT |
| 7. JwtStrategy.validate() | Сервер | `jwt.strategy.ts` | Извлекает `{ id, email }` из payload |
| 8. AuthService.getMe() | Сервер | `auth.service.ts` | Достаёт пользователя из БД по id |
| 9. Ответ | Сервер -> Браузер | `auth.service.ts` | `{ id, email, createdAt }` |
| 10. Рендеринг | Браузер | `dashboard-layout.tsx` | Показывает Header, Sidebar и контент |

### Логаут

| Этап | Где происходит | Файл | Что делает |
|------|---------------|------|------------|
| 1. Клик "Logout" | Браузер | `logout-button.tsx` | Пользователь нажимает кнопку |
| 2. Удаление cookie | Браузер | `logout-button.tsx` | `Cookies.remove('token')` |
| 3. Редирект | Браузер | `logout-button.tsx` | `router.push('/login')` |

---

## Итоги

Аутентификация в full-stack приложении -- это цепочка, где каждое звено важно:

1. **Клиентская валидация** (zod) -- быстрая обратная связь для пользователя
2. **Серверная валидация** (class-validator) -- защита от обхода клиента
3. **Хэширование паролей** (bcrypt) -- защита данных в БД
4. **JWT** -- stateless аутентификация без хранения сессий
5. **Backend guards** (Passport + JwtAuthGuard) -- защита API-эндпоинтов
6. **Frontend middleware** -- быстрый UX без мерцания
7. **useUser()** -- загрузка данных пользователя с проверкой токена

Каждый компонент решает свою задачу, и вместе они создают надёжную систему
аутентификации. Конечно, всегда есть что улучшить (httpOnly cookies, refresh
tokens, rate limiting), но текущая реализация -- это солидная основа, которую
можно развивать по мере роста проекта.
