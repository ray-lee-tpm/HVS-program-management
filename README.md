# HVS Program Management System

A web application for managing automation equipment projects from RFQ through engineering, production, and delivery.

## Features

- Dashboard for projects, tasks, and customer records
- Project details, PM / ME / EE / SW assignments, and submission dates
- Milestones, task progress, risk levels, and Gantt timelines
- Task predecessors and optional predecessor completion gates
- Team rosters and project chat restricted to linked roster accounts
- Admin, member, customer, and executive access roles
- Customer contacts and meeting minutes
- Rich text, drag-and-drop attachments, and protected downloads
- Document search with source excerpts from readable PDFs, Office documents, and text files
- Vertical results, lessons, and goals sections, plus a newest-first status update feed
- Expiring read-only share links and owner-only access history
- Login IP addresses, approximate location, network provider, and reported browser details when available
- Dark gray interface with pink primary text

Search currently returns source excerpts. It does not call a conversational AI service.

## Technology

TypeScript, React 19, Next.js App Router APIs through Vinext, Vite, Cloudflare Workers, D1 (SQLite), R2, Drizzle migrations, and Zod validation.

## Project structure

- `app/`: pages and server API routes
- `components/`: task tables, editors, roster, chat, search, and dashboard UI
- `lib/`: validation, permissions, scheduling, authentication, and document extraction
- `db/` and `drizzle/`: database schema and migrations
- `public/`: application branding

## Development

Use Node.js 22.13 or newer and the pnpm version specified in `package.json`.

```sh
corepack enable
pnpm install
pnpm dev
```

```sh
pnpm exec tsc --noEmit
pnpm build
```

The app requires a Worker environment with the logical D1 `DB` and R2 `BUCKET` bindings. Apply the migrations in `drizzle/` to an empty development database before using the data routes. Real Cloudflare resource identifiers and a production Site ID are not included in this export.

## Account setup

Account creation is invitation-based. In a new environment, provision an initial owner account with the password-hashing format in `lib/auth.ts`, configure `HVS_OWNER_USER_ID` and `HVS_OWNER_USERNAME`, and create an initial invitation using that account. There is no public first-owner registration bypass. Hosting-specific bootstrap and database setup are required before a fresh deployment can accept users.

Usernames do not need a company keyword. Registration still requires a valid invitation and a password of at least 12 characters.

## Portfolio notes

This is a source-code snapshot of the application. It includes no customer records, chat messages, uploaded documents, passwords, sessions, or production account identifiers. It does not include Git history. The hosted application remains separate and requires app sign-in. For a recruiter-facing interactive demo, deploy a separate environment with synthetic data and demo accounts.

The application source documents the workflow and implementation. No open-source license is granted by this export; review project and branding ownership before distributing it publicly.
