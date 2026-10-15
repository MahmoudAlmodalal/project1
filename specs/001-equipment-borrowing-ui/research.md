# Research & Architectural Decisions: BorrowHub Equipment Borrowing UI/UX Platform

**Feature Branch**: `001-equipment-borrowing-ui`  
**Date**: 2026-10-15  
**Status**: Completed & Resolved

---

## 1. Executive Summary & Stack Selection

BorrowHub is a high-reliability, bilingual (Arabic RTL default, English LTR mirror) university equipment borrowing management web platform. Based on the requirements in `docs/PRD.md`, `docs/design.md`, `docs/screen-specifications.md`, and the architectural mandate in `constitution.md`, the platform requires:
1. Strict transactional consistency and atomic inventory transitions.
2. Rich, vibrant UI (Card-heavy & Vibrant UI, 8pt grid, WCAG 2.1 AA).
3. Type safety, rapid iteration, and high testability across full lifecycle state machines.

### Selected Stack
- **Architecture**: Modern Full-Stack Web Application (Unified TypeScript Monorepo / Next.js Full-Stack with App Router & Server Actions / Route Handlers, or React + Node.js Express/Fastify).
- **Frontend**: Next.js 15 (React 19, TypeScript), Tailwind CSS v4 / v3.4, Radix UI / shadcn/ui primitives, Lucide Icons, `next-intl` or lightweight React RTL/i18n state manager.
- **Backend & API**: Next.js Route Handlers / Server Actions with strict Zod validation schemas and atomic transaction orchestration.
- **Database & ORM**: PostgreSQL with Prisma ORM or Drizzle ORM (native row locking `SELECT ... FOR UPDATE` support, ACID transactions, migrations matching `docs/database.dbml`).
- **Testing**: Vitest (unit & domain validation tests), Playwright (E2E browser tests for Arabic RTL/LTR and 11 screens).

---

## 2. Architectural Decisions & Rationale

### DECISION 01: Full-Stack Next.js (TypeScript) with Tailwind CSS & shadcn/ui
- **Decision**: Use Next.js App Router (TypeScript) with Tailwind CSS and Radix UI/shadcn/ui component architecture.
- **Rationale**:
  - Unifies student catalog, admin counters, and API routes in a single strongly typed codebase.
  - Matches the design specification (`docs/design.md`) citing Tailwind CSS and shadcn/ui.
  - Supports server-side rendering for catalog performance, skeleton loading states, and zero-CLS transitions.
  - Enables instant RTL/LTR switching by setting `dir="rtl"` / `dir="ltr"` on the root layout with Tailwind's native `rtl:` and `ltr:` variant utilities.
- **Alternatives Considered**:
  - *Separate SPA (Vite + React) & Express API*: Adds dual deployment overhead, CORS configurations, and duplicated type interfaces without tangible benefit for MVP.
  - *Django / Laravel with Blade*: Robust ORM, but less seamless for the vibrant, interactive micro-interactions (e.g. 1-click counter actions, 48h live countdowns, damage modals) specified in `docs/screen-specifications.md`.

### DECISION 02: Database & Concurrency Control (PostgreSQL + Prisma / Drizzle)
- **Decision**: PostgreSQL with explicit row-level locking (`FOR UPDATE`) inside Prisma/Drizzle transactions.
- **Rationale**:
  - `constitution.md` Principle IV mandates atomic state transitions to eliminate double-booking race conditions when multiple students request the last remaining unit.
  - Inventory operations (`available_quantity`, `reserved_quantity`, `borrowed_quantity`, `damaged_quantity`) are protected by transactional boundaries:
    1. Lock equipment row (`SELECT ... FOR UPDATE`).
    2. Verify `available_quantity > 0` before incrementing `reserved_quantity` on loan approval.
    3. Verify `reserved_quantity > 0` before shifting to `borrowed_quantity` on counter checkout.
    4. Verify `borrowed_quantity > 0` before shifting to `available_quantity` or `damaged_quantity` on return.
- **Alternatives Considered**:
  - *Optimistic Locking with version column*: Under high concurrency during campus rush, optimistic retries can frustrate students with failed requests; pessimistic row locks in short transactions provide deterministic FIFO allocation.

### DECISION 03: Overdue Evaluation & 48h Pickup Expiration
- **Decision**: Dynamic real-time calculation backed by lightweight periodic cron/background evaluation:
  - Any loan with status `CHECKED_OUT` where `CURRENT_TIMESTAMP > expected_return_date` is dynamically surfaced as `OVERDUE` in views and APIs.
  - Any loan with status `APPROVED` where `CURRENT_TIMESTAMP > pickup_deadline` (48 hours from approval) is marked `EXPIRED` via an automatic sweeper or on-demand transactional check, returning reserved stock to available stock.
- **Rationale**:
  - Avoids stale cron-dependent state. Even if the background job is delayed, an on-demand check whenever loans or items are queried ensures 100% real-time accuracy as required by `SC-004`.
- **Alternatives Considered**:
  - *Pure batch-only overnight cron*: Rejected because administrators need real-time overdue and expiration accuracy throughout operational counter hours.

### DECISION 04: Internationalization & Directionality (RTL / LTR)
- **Decision**: Root layout `dir` attribute driven by client state / cookies (`dir="rtl"` for Arabic, `dir="ltr"` for English) paired with logical Tailwind CSS properties (`ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`, `end-*`) and Google Fonts (`IBM Plex Sans Arabic`, `Cairo`, and `Inter`).
- **Rationale**:
  - Matches `docs/design.md` §1 & §3 requirements.
  - Logical CSS properties mirror automatically without maintaining two separate stylesheets.
- **Alternatives Considered**:
  - *Two distinct CSS bundles*: High build complexity and prone to desynchronization.

### DECISION 05: Session & Authentication Mechanics
- **Decision**: JWT / Cookie-based session authentication with HTTP-only cookies, verified through Edge middleware / server guards enforcing roles (`STUDENT`, `ADMIN`) and student status (`PENDING_APPROVAL`, `ACTIVE`, `REJECTED`).
- **Rationale**:
  - Simple, secure, and complies with `constitution.md` Technical Constraints and `docs/PRD.md`.
  - Non-active students can authenticate to see their approval status (`SCR-01`, `SCR-02`), but are blocked from creating booking requests (`FR-007`).
- **Alternatives Considered**:
  - *Third-party OAuth only (Auth0/Firebase)*: Overkill for MVP university departmental scope and conflicts with non-goal `NG-02`.

---

## 3. Best Practices & Quality Alignment

1. **Clean Domain Services**:
   - `LoanService`: Handles loan request creation, duration validation (≤ 10 days), quota check (≤ 2 active loans), eligibility check (no overdue loans), student self-cancellation.
   - `CounterService`: Handles single-click handover (`CHECKED_OUT`), return in good condition (`RETURNED` + `available + 1`), return with damage (`RETURNED` + `damaged + 1` + `DamageRecord`), and counter due date extensions.
   - `InventoryService`: Handles equipment CRUD, category assignment, stock audit reconciliations.
   - `AccountService`: Handles registration, password hashing (Argon2id/bcrypt), and admin approval/rejection.
2. **WCAG 2.1 AA Accessibility**:
   - High-contrast colors (`#4F46E5` primary, `#10B981` success, `#F43F5E` danger on `#FFFFFF` / `#F8FAFC`).
   - Visible keyboard focus rings (`focus:ring-2 focus:ring-primary-500`).
   - Skeletons for all loading states preventing CLS (`docs/design.md` §8).
