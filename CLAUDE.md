# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
# Install dependencies
npm install

# Start PostgreSQL (required before running API)
docker-compose up -d

# Start all dev servers (web on :3000, API on :3001)
npx turbo dev

# Build all apps and packages
npx turbo build

# Lint all
npx turbo lint

# Type-check all
npx turbo typecheck

# Format all files
npm run format
```

### Running individual apps

```bash
# API only
cd apps/api && npm run dev

# Web only
cd apps/web && npm run dev

# Lint a single workspace
npx turbo lint --filter=@mindbridge/api
npx turbo lint --filter=@mindbridge/web

# Build shared types (needed if types change)
npx turbo build --filter=@mindbridge/types
```

## Architecture

This is a Turborepo monorepo with npm workspaces. Three workspace packages (`@mindbridge/types`, `@mindbridge/eslint-config`, `@mindbridge/tsconfig`) are shared by two apps (`@mindbridge/api`, `@mindbridge/web`).

### Backend — `apps/api/` (NestJS)

NestJS app with modular structure under `src/modules/`. Currently two modules:

- **AuthModule** — JWT auth with Passport.js. `AuthController` handles `/auth/register`, `/auth/login`, `/auth/me`. `JwtStrategy` validates Bearer tokens from the Authorization header. `JwtAuthGuard` protects routes; `@CurrentUser()` decorator extracts the user from the request.
- **UsersModule** — `User` TypeORM entity (uuid PK, email, hashed password, timestamps). `UsersService` wraps the TypeORM repository. Exported for use by AuthModule.

Global setup in `main.ts`: CORS for `localhost:3000`, `ValidationPipe` with whitelist+transform, `HttpExceptionFilter`.

Config (`src/config/configuration.ts`) reads `DATABASE_URL`, `JWT_SECRET`, `PORT` from env. TypeORM is configured with `synchronize: true` (auto-schema sync, not for production).

### Frontend — `apps/web/` (Next.js 14, App Router)

Follows **Feature Sliced Design (FSD)** under `src/`:

- **app/** — Next.js routes and layouts. Routes: `/` (redirects to dashboard), `/login`, `/register`, `/dashboard`.
- **views/** — Page-level compositions (e.g., `DashboardPage`).
- **widgets/** — Composite layout components: `DashboardLayout` (auth check + redirect), `Header` (avatar + logout dropdown), `Sidebar` (nav links).
- **features/** — `auth/` contains `LoginForm`, `RegisterForm`, `LogoutButton`. Forms use react-hook-form + zod validation.
- **entities/** — `user/model.ts` exports `useUser()` hook that fetches `/auth/me` and manages auth state.
- **shared/** — `api/client.ts` (fetch-based API client with Bearer token from cookies), `ui/` (shadcn/ui components built on Radix UI), `lib/utils.ts` (`cn()` for Tailwind class merging), `config/env.ts`.

Auth flow: JWT stored in a cookie via `js-cookie`. `middleware.ts` redirects unauthenticated users away from `/dashboard` and authenticated users away from `/login` and `/register`.

### Shared Packages — `packages/`

- **types/** — Shared DTOs: `UserDto`, `LoginDto`, `RegisterDto`, `AuthResponse`. Must be built (`tsc`) before apps can consume them; Turbo handles this via `dependsOn: ["^build"]`.
- **eslint-config/** — Base ESLint config: TypeScript + Prettier + import ordering. Warns on `no-console`, enforces `consistent-type-imports`, allows `_`-prefixed unused vars.
- **tsconfig/** — Three configs: `base.json` (strict, ES2021), `nextjs.json` (JSX preserve, noEmit), `nestjs.json` (CommonJS, decorators, emit to dist).

## Code Style

- Prettier: single quotes, trailing commas, 2-space indent, 100 char print width, semicolons.
- ESLint enforces alphabetized import groups (builtin → external → internal → parent → sibling → index).
- Prefer `type` imports for type-only imports (`consistent-type-imports` rule).

## Environment Variables

Backend requires `apps/api/.env` with `DATABASE_URL`, `JWT_SECRET`, `PORT`. Frontend requires `apps/web/.env.local` with `NEXT_PUBLIC_API_URL`. See `.env.example` files for defaults.
