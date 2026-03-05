# MindBridge

Full-stack monorepo with Next.js 14 frontend and NestJS backend, managed by Turborepo.

## Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: NestJS, TypeScript, TypeORM, PostgreSQL
- **Monorepo**: Turborepo with npm workspaces
- **Auth**: JWT with Passport.js, bcrypt password hashing

## Project Structure

```
apps/
  web/          → Next.js frontend (Feature Sliced Design)
  api/          → NestJS backend
packages/
  types/        → Shared TypeScript types (DTOs, API contracts)
  eslint-config → Shared ESLint configuration
  tsconfig/     → Shared TypeScript configurations
```

## Prerequisites

- Node.js >= 18
- npm >= 10
- Docker & Docker Compose

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Start the database

```bash
docker-compose up -d
```

### 3. Start development servers

```bash
npx turbo dev
```

This starts both apps simultaneously:
- **Web**: http://localhost:3000
- **API**: http://localhost:3001

## Available Scripts

| Command | Description |
|---------|-------------|
| `npx turbo dev` | Start all dev servers |
| `npx turbo build` | Build all apps and packages |
| `npx turbo lint` | Lint all apps and packages |
| `npx turbo typecheck` | Type-check all apps and packages |

## Environment Variables

### Backend (`apps/api/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgres://postgres:postgres@localhost:5432/mindbridge` |
| `JWT_SECRET` | Secret key for JWT signing | — |
| `PORT` | API server port | `3001` |

### Frontend (`apps/web/.env.local`)

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:3001` |

## API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/auth/register` | Register a new user | No |
| POST | `/auth/login` | Login and receive JWT | No |
| GET | `/auth/me` | Get current user | Yes |

## Frontend Architecture (Feature Sliced Design)

```
src/
  app/        → Next.js App Router (pages & layouts)
  pages/      → FSD page compositions
  widgets/    → Composite UI blocks (Header, Sidebar, DashboardLayout)
  features/   → User interactions (LoginForm, RegisterForm, LogoutButton)
  entities/   → Business entities (User model/hook)
  shared/     → UI kit, API client, utilities, config
```
