# RBAC App — Architecture

> Stack: **Bun** · **Express** · **Prisma + SQLite** · **React + Vite** · **TypeScript** · **Zod**

---

## Monorepo Structure

```
rbac-app/
├── package.json                   # root — bun workspaces + dev script
├── packages/
│   └── shared/                    # shared between server and client
│       ├── src/
│       │   ├── roles.ts           # Role type, canManage(), getManageableRoles()
│       │   ├── schemas.ts         # Zod schemas + inferred TS types
│       │   └── index.ts           # re-exports everything
│       ├── tsconfig.json
│       └── package.json           # name: "@rbac/shared"
├── server/
│   ├── src/
│   │   ├── index.ts               # Express app, session middleware, CORS
│   │   ├── lib/
│   │   │   └── seed.ts            # seeds 4 test users
│   │   ├── middleware/
│   │   │   └── auth.ts            # requireAuth, requireRole
│   │   └── routes/
│   │       ├── auth.ts            # login, logout, me
│   │       └── users.ts           # CRUD — all gated by canManage()
│   ├── prisma/
│   │   └── schema.prisma          # User model with self-relation
│   ├── tsconfig.json
│   └── package.json
└── client/
    ├── src/
    │   ├── main.tsx
    │   ├── App.tsx                # router + Protected/PublicOnly wrappers
    │   ├── lib/
    │   │   └── api.ts             # typed fetch wrapper (credentials: include)
    │   ├── hooks/
    │   │   └── useAuth.tsx        # AuthContext — user, login(), logout()
    │   ├── pages/
    │   │   ├── Login.tsx
    │   │   └── Dashboard.tsx      # user list grouped by role, search + filter
    │   └── components/
    │       └── UserModal.tsx      # create/edit — role dropdown scoped by actor
    ├── index.html
    ├── vite.config.ts             # proxies /api → localhost:4000
    ├── tsconfig.json
    └── package.json
```

---

## Workspaces

**Root `package.json`:**

```json
{
  "name": "rbac-app",
  "private": true,
  "workspaces": ["packages/*", "server", "client"],
  "scripts": {
    "dev": "bun run --filter '*' dev"
  }
}
```

Both `server/package.json` and `client/package.json` declare:

```json
{
  "dependencies": {
    "@rbac/shared": "*"
  }
}
```

Bun workspaces symlinks `@rbac/shared` automatically — no publishing, no path aliases.

---

## Shared Package

Single source of truth for roles, business logic, and every request/response shape.

### `packages/shared/src/roles.ts`

```ts
export const ROLES = ['employee', 'team_lead', 'manager', 'admin'] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Admin',
  manager: 'Manager',
  team_lead: 'Team Lead',
  employee: 'Employee',
};

export function getRoleLevel(role: Role): number {
  return ROLES.indexOf(role);
}

export function canManage(actor: Role, target: Role): boolean {
  return getRoleLevel(actor) > getRoleLevel(target);
}

export function getManageableRoles(role: Role): Role[] {
  return ROLES.slice(0, getRoleLevel(role)) as unknown as Role[];
}
```

### `packages/shared/src/schemas.ts`

```ts
import { z } from 'zod';
import { ROLES } from './roles';

// Core entity
export const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  role: z.enum(ROLES),
  managedBy: z.number().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type User = z.infer<typeof UserSchema>;

// Auth
export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const LoginResponseSchema = z.object({ user: UserSchema });
export type LoginResponse = z.infer<typeof LoginResponseSchema>;

// Users CRUD
export const CreateUserRequestSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(ROLES),
  managedBy: z.number().optional(),
});
export type CreateUserRequest = z.infer<typeof CreateUserRequestSchema>;

export const UpdateUserRequestSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: z.enum(ROLES).optional(),
  managedBy: z.number().nullable().optional(),
});
export type UpdateUserRequest = z.infer<typeof UpdateUserRequestSchema>;

export const UserWithManagerSchema = UserSchema.extend({
  manager: z
    .object({
      id: z.number(),
      name: z.string(),
      role: z.enum(ROLES),
    })
    .nullable(),
});
export type UserWithManager = z.infer<typeof UserWithManagerSchema>;

export const UsersListResponseSchema = z.array(UserWithManagerSchema);
export type UsersListResponse = z.infer<typeof UsersListResponseSchema>;

export const ManageableRolesResponseSchema = z.object({
  roles: z.array(z.enum(ROLES)),
});
export type ManageableRolesResponse = z.infer<
  typeof ManageableRolesResponseSchema
>;

export const ErrorResponseSchema = z.object({ error: z.string() });
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
```

---

## Database Schema

```prisma
// server/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

model User {
  id        Int      @id @default(autoincrement())
  name      String
  email     String   @unique
  password  String
  role      String   // "admin" | "manager" | "team_lead" | "employee"
  managedBy Int?
  manager   User?    @relation("ManagedBy", fields: [managedBy], references: [id])
  reports   User[]   @relation("ManagedBy")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

Self-referential relation — `managedBy` points to another User's `id`.

---

## Server

### `server/package.json`

```json
{
  "name": "rbac-server",
  "scripts": {
    "dev": "bun --hot src/index.ts",
    "start": "bun src/index.ts",
    "seed": "bun src/lib/seed.ts"
  },
  "dependencies": {
    "@rbac/shared": "*",
    "express": "^4.19.2",
    "express-session": "^1.18.0",
    "bcryptjs": "^2.4.3",
    "@prisma/client": "^5.14.0",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "prisma": "^5.14.0",
    "bun-types": "latest",
    "@types/express": "^4.17.21",
    "@types/express-session": "^1.18.0",
    "@types/bcryptjs": "^2.4.6",
    "@types/cors": "^2.8.17"
  }
}
```

No `tsx`, no `ts-node`, no `nodemon` — Bun runs TypeScript natively.

### `server/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "esModuleInterop": true,
    "types": ["bun-types"]
  },
  "references": [{ "path": "../packages/shared" }]
}
```

### `src/index.ts` — app setup

```ts
import express from 'express';
import session from 'express-session';
import cors from 'cors';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';

const app = express();

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(
  session({
    secret: 'change-in-prod',
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, secure: false, maxAge: 1000 * 60 * 60 * 8 },
  }),
);

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

app.listen(4000, () => console.log('Server on http://localhost:4000'));
```

### `src/middleware/auth.ts`

```ts
import type { Request, Response, NextFunction } from 'express';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.userId)
    return res.status(401).json({ error: 'Not authenticated' });
  next();
}
```

### `src/routes/auth.ts`

```
POST /api/auth/login    → validate with LoginRequestSchema → set session
POST /api/auth/logout   → destroy session
GET  /api/auth/me       → return user from session.userId
```

### `src/routes/users.ts`

```
GET    /api/users            → list users below actor's role
POST   /api/users            → validate CreateUserRequestSchema → canManage check → create
PATCH  /api/users/:id        → validate UpdateUserRequestSchema → canManage check → update
DELETE /api/users/:id        → canManage check → delete
GET    /api/users/meta/roles → return getManageableRoles(session.role)
```

Every route validates with `schema.safeParse(req.body)` — hard 400 if it fails.
Every mutation calls `canManage(session.role, target.role)` — hard 403 if it fails.

---

## Client

### `client/vite.config.ts`

```ts
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': { target: 'http://localhost:4000', changeOrigin: true },
    },
  },
});
```

All fetch calls use `/api/...` — no hardcoded ports, no CORS in dev.

### `src/lib/api.ts`

Typed wrapper — return types come directly from `@rbac/shared`:

```ts
import type {
  LoginRequest,
  LoginResponse,
  CreateUserRequest,
  UpdateUserRequest,
  User,
  UsersListResponse,
  ManageableRolesResponse,
} from '@rbac/shared';

async function req<Res>(path: string, options?: RequestInit): Promise<Res> {
  const res = await fetch(`/api${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Request failed');
  return data;
}

export const api = {
  auth: {
    login: (body: LoginRequest) =>
      req<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    logout: () => req<{ ok: true }>('/auth/logout', { method: 'POST' }),
    me: () => req<LoginResponse>('/auth/me'),
  },
  users: {
    list: () => req<UsersListResponse>('/users'),
    create: (body: CreateUserRequest) =>
      req<User>('/users', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: number, body: UpdateUserRequest) =>
      req<User>(`/users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    delete: (id: number) =>
      req<{ ok: true }>(`/users/${id}`, { method: 'DELETE' }),
    manageableRoles: () => req<ManageableRolesResponse>('/users/meta/roles'),
  },
};
```

### `src/hooks/useAuth.tsx`

```
AuthContext  →  { user: User | null, loading: boolean, login(), logout() }
```

Calls `api.auth.me()` on mount to rehydrate from session. Wrap `<App>` with `<AuthProvider>`.

### Pages & Components

| File            | Responsibility                                                                                               |
| --------------- | ------------------------------------------------------------------------------------------------------------ |
| `Login.tsx`     | email + password form, calls `login()`, redirects to `/`                                                     |
| `Dashboard.tsx` | fetches user list, groups by role, search/filter bar, edit/delete buttons                                    |
| `UserModal.tsx` | create + edit form, fetches `/meta/roles` on mount for scoped role dropdown                                  |
| `App.tsx`       | `<Protected>` wrapper redirects to `/login` if no session; `<PublicOnly>` redirects to `/` if already authed |

---

## RBAC Rules

| Actor       | Can create / edit / delete         |
| ----------- | ---------------------------------- |
| `admin`     | `manager`, `team_lead`, `employee` |
| `manager`   | `team_lead`, `employee`            |
| `team_lead` | `employee`                         |
| `employee`  | —                                  |

Rule is enforced in **one place**: `canManage(actorRole, targetRole)` from `@rbac/shared`.
The server enforces it on every mutation. The client uses it to hide/show UI controls.

---

## TypeScript Config — Shared Package

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "declaration": true,
    "composite": true,
    "strict": true
  }
}
```

`"composite": true` enables project references so `server` and `client` both point to it via:

```json
"references": [{ "path": "../packages/shared" }]
```

---

## Setup Commands

```bash
# 1. Install all dependencies
bun install

# 2. Generate Prisma client + run migrations
cd server
bunx prisma migrate dev --name init
cd ..

# 3. Seed test users
bun run seed -F rbac-server

# 4. Start both servers
bun run dev
```

### Seed credentials

| Email             | Password    | Role      |
| ----------------- | ----------- | --------- |
| admin@rbac.dev    | admin123    | Admin     |
| manager@rbac.dev  | manager123  | Manager   |
| lead@rbac.dev     | lead123     | Team Lead |
| employee@rbac.dev | employee123 | Employee  |

---

## Data Flow Summary

```
User submits form (client)
  → api.ts  [typed as CreateUserRequest from @rbac/shared]
    → POST /api/users
      → requireAuth middleware
        → CreateUserRequestSchema.safeParse(req.body)  [Zod — 400 if invalid]
          → canManage(session.role, body.role)          [roles.ts — 403 if denied]
            → prisma.user.create(...)
              → 201 User  [typed as User from @rbac/shared]
```

One schema change in `packages/shared/src/schemas.ts` surfaces as a TypeScript error
in both the server handler and the client form — immediately, at compile time.
