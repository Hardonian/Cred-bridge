# ADR 0001: Modular monorepo

CredBridge uses pnpm workspaces with domain packages and a Next.js App Router application. Domain rules are isolated from presentation so a later PostgreSQL or hosted provider implementation can replace the deterministic reference adapters.
