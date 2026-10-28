# My Monorepo

A React + Node.js monorepo built with **pnpm workspaces** and **Turborepo**. The frontend, the backend and the shared TypeScript types all live in one Git repository.

## Why a monorepo?

- **Code sharing:** the React app and the Node.js API import the same TypeScript types. You don't publish them to a registry or use `../../` paths.
- **Atomic commits:** change an API endpoint and the frontend code that calls it in one commit.
- **Unified tooling:** one set of build, lint and dev commands for every project.
- **Aligned dependencies:** one lockfile, so versions don't drift between projects.

## Project structure

```
MonoRepo/
├── apps/
│   ├── web/            React frontend (Vite, port 5173)
│   └── api/            Node.js backend (Express, port 4000)
├── packages/
│   └── shared-types/   Shared TypeScript interfaces
├── package.json        Root scripts (call Turborepo)
├── pnpm-workspace.yaml Workspace folders + allowed build scripts
├── turbo.json          Turborepo task configuration
└── .gitignore
```

## Quick start

Requirements: Node.js and pnpm (`npm install -g pnpm`).

```bash
pnpm install   # install all workspace dependencies
pnpm dev       # start the API and the web app together
```

Then open http://localhost:5173. The page lists the users returned by the API at http://localhost:4000/api/users.

| Command      | What it does                                         |
| ------------ | ---------------------------------------------------- |
| `pnpm dev`   | Runs every app in watch mode (API + web)             |
| `pnpm build` | Builds every app (`apps/api/dist`, `apps/web/dist`)  |
| `pnpm lint`  | Type-checks every app with `tsc --noEmit`            |

To run one app only, filter by package name, for example `pnpm --filter @my-monorepo/api dev`.

---

## How this repo was built, step by step

### Step 1: Initialize the workspace

Create the root `package.json` (`pnpm init`), then `pnpm-workspace.yaml` to tell pnpm where packages live:

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

### Step 2: Create the folder structure

```bash
mkdir -p apps/api apps/web packages/shared-types
```

### Step 3: Install and configure Turborepo

```bash
pnpm add turbo -wD
```

Create `turbo.json`:

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", "build/**"]
    },
    "lint": {
      "dependsOn": ["^lint"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

### Step 4: Create the shared types package

`packages/shared-types/package.json`:

```json
{
  "name": "@my-monorepo/shared-types",
  "version": "1.0.0",
  "private": true,
  "main": "index.ts",
  "types": "index.ts"
}
```

`packages/shared-types/index.ts`:

```ts
export interface User {
  id: string;
  name: string;
  email: string;
}
```

### Step 5: Create the Node.js backend (`apps/api`)

Install the dependencies and link the shared package:

```bash
pnpm --filter @my-monorepo/api add express cors "@my-monorepo/shared-types@workspace:*"
pnpm --filter @my-monorepo/api add -D typescript tsx @types/express @types/cors @types/node
```

Scripts in `apps/api/package.json`:

```json
"scripts": {
  "dev": "tsx watch src/index.ts",
  "build": "tsc",
  "start": "node dist/index.js",
  "lint": "tsc --noEmit"
}
```

`apps/api/src/index.ts` starts an Express server on port 4000 with one endpoint, `GET /api/users`, typed with the shared `User` interface. `apps/api/tsconfig.json` compiles `src/` to `dist/`.

### Step 6: Create the React frontend (`apps/web`)

```bash
pnpm --filter @my-monorepo/web add react react-dom "@my-monorepo/shared-types@workspace:*"
pnpm --filter @my-monorepo/web add -D vite @vitejs/plugin-react typescript @types/react @types/react-dom
```

`src/App.tsx` fetches `/api/users` and lists the results. `vite.config.ts` forwards every `/api` request to the backend, so the frontend doesn't need the API's URL:

```ts
server: {
  port: 5173,
  proxy: { "/api": "http://localhost:4000" },
},
```

### Step 7: Allow esbuild's install script

Vite and tsx depend on **esbuild**, which runs a script when it installs. pnpm blocks these scripts by default and fails with `ERR_PNPM_IGNORED_BUILDS`. Approve it once:

```bash
pnpm approve-builds esbuild
```

This adds the following to `pnpm-workspace.yaml`:

```yaml
allowBuilds:
  esbuild: true
```

### Step 8: Add the root scripts

Root `package.json`:

```json
{
  "name": "my-monorepo",
  "private": true,
  "packageManager": "pnpm@12.15.0",
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "lint": "turbo run lint"
  },
  "devDependencies": {
    "turbo": "^2.11.10"
  }
}
```

Turborepo needs the `packageManager` field to run. If you use a different pnpm version, set it here; `pnpm -v` shows yours.

### Step 9: Add a `.gitignore`

Ignores `node_modules`, `dist`, `build`, `.turbo`, log files and `.env`.

### Step 10: Run it

```bash
pnpm build   # builds the api and web apps
pnpm lint    # type-checks them
pnpm dev     # starts both apps together
```
# MonoRepo
