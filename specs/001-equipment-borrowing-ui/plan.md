# Implementation Plan: BorrowHub Equipment Borrowing Management UI/UX Platform

**Branch**: `001-equipment-borrowing-ui` | **Date**: 2026-10-15 | **Spec**: [specs/001-equipment-borrowing-ui/spec.md](specs/001-equipment-borrowing-ui/spec.md)

**Input**: Feature specification from `specs/001-equipment-borrowing-ui/spec.md`

---

## Summary

BorrowHub is a high-reliability, bilingual (Arabic RTL default, English LTR mirror) university equipment borrowing management web platform. It addresses departmental asset tracking, eliminates phantom inventory through atomic stock transitions, streamlines counter operations via 1-click checkouts and returns, and provides delinquency monitoring with automated student eligibility reinstatement.

The technical architecture uses a modern full-stack TypeScript approach (Next.js App Router, Tailwind CSS, shadcn/ui, PostgreSQL with Prisma/Drizzle ORM) adhering strictly to the five core principles of the BorrowHub Constitution.

---

## Technical Context

**Language/Version**: TypeScript 5.x / Node.js 22.x LTS  
**Primary Dependencies**: Next.js 15 (React 19), Tailwind CSS v4 / v3.4, Radix UI / shadcn/ui primitives, Lucide Icons, Zod (runtime validation), `date-fns`  
**Storage**: PostgreSQL 15+ with Prisma ORM / Drizzle ORM (native row-level locking `FOR UPDATE` in ACID transactions)  
**Testing**: Vitest (domain validation & state machine unit tests), Playwright (E2E browser tests for 11 screens & RTL/LTR)  
**Target Platform**: Web (Modern desktop and mobile browsers: Chrome, Firefox, Safari, Edge)  
**Project Type**: Full-stack web application (Monorepo / App Router)  
**Performance Goals**: 
- Page load < 1.2s, Zero Cumulative Layout Shift (CLS via Skeleton Placeholders)
- 1-click counter checkout and return operations executed in < 3 seconds
- 60 fps smooth micro-interactions and dialog animations
**Constraints**: 
- WCAG 2.1 AA color contrast (≥ 4.5:1)
- Seamless RTL/LTR dynamic flipping
- 10-day maximum loan duration, 2 active loan quota per student
- 48-hour pickup window before automatic reservation expiration
- **Scope Boundary**: External standalone backend microservices are OUT OF SCOPE. The system operates via lightweight Next.js route handlers/actions directly invoking internal domain services.
**Scale/Scope**: ~10,000 university students, 1,000+ laboratory inventory assets, 11 dedicated screens (`SCR-01` through `SCR-11`)

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Requirement | Compliance Status | Justification / Notes |
|---|---|---|---|
| **I. Code Quality & Simplicity** | Readability, strong typing, YAGNI, domain/service layer separation | ✅ PASS | Explicit domain services (`LoanService`, `CounterService`, `InventoryService`, `AccountService`) separating presentation from transactional rules. |
| **II. Comprehensive Testing Discipline** | Automated test pyramid, independent testability for all stories | ✅ PASS | Vitest unit tests for validation rules (10-day ceiling, quota checks, state machine) + Playwright E2E for UI journeys. |
| **III. Maintainability & Modularity** | Self-documenting, minimal coupling, clean docstrings | ✅ PASS | Standardized schemas, OpenAPI/REST contracts, and direct alignment with `docs/PRD.md` and `docs/user-flow.md`. |
| **IV. Transactional Integrity & Data Consistency** | Atomic state transitions, explicit lifecycle state machine, row locks | ✅ PASS | PostgreSQL `SELECT ... FOR UPDATE` row-level locks prevent stock allocation race conditions; strict state transition matrix enforced. |
| **V. Observability & Actionable Error Handling** | Structured audit logging, localized user-facing error banners | ✅ PASS | Structured lifecycle logging without credentials; localized Arabic/English error responses for all screen states. |

*Result*: **ALL GATES PASSED** (No violations detected, no complexity exceptions required).

---

## Project Structure

### Documentation (this feature)

```text
specs/001-equipment-borrowing-ui/
├── plan.md              # This implementation plan
├── research.md          # Phase 0 architectural decisions & technology choices
├── data-model.md        # Phase 1 data entities, state machine, and concurrency rules
├── quickstart.md        # Phase 1 runnable end-to-end validation scenarios
├── contracts/           # Phase 1 interface contracts
│   └── api-endpoints.md # REST API contracts for auth, catalog, loans, and admin operations
└── tasks.md             # Phase 2 output (/speckit-tasks command)
```

### Source Code Layout

```text
src/
├── app/                                 # Next.js App Router
│   ├── (auth)/
│   │   ├── login/page.tsx               # SCR-01: تسجيل الدخول
│   │   └── register/page.tsx            # SCR-02: تسجيل حساب طالب جديد
│   ├── (student)/
│   │   ├── portal/page.tsx              # SCR-03: لوحة طلبات واستعارات الطالب
│   │   ├── catalog/page.tsx             # SCR-04: كتالوج المعدات المتاحة
│   │   └── catalog/[id]/page.tsx        # SCR-05: تفاصيل المعدة ومواصفاتها
│   ├── (admin)/
│   │   ├── admin/queue/page.tsx         # SCR-06: طابور مراجعة الطلبات
│   │   ├── admin/pickups/page.tsx       # SCR-07: شباك تسليم العتاد المعتمد
│   │   ├── admin/returns/page.tsx       # SCR-08: شباك الإرجاع والفحص والتلف
│   │   ├── admin/overdue/page.tsx       # SCR-09: لوحة إنذارات العتاد المتأخر
│   │   ├── admin/inventory/page.tsx     # SCR-10: إدارة كتالوج ومخزون المعدات
│   │   └── admin/users/page.tsx         # SCR-11: إدارة واعتماد حسابات الطلاب
│   ├── api/v1/                          # API Route Handlers
│   │   ├── auth/
│   │   ├── equipment/
│   │   ├── loans/
│   │   └── admin/
│   ├── layout.tsx                       # Root Layout with RTL/LTR dynamic dir
│   └── globals.css                      # Tailwind CSS v4 & theme variables
├── components/                          # UI & Domain Components
│   ├── ui/                              # shadcn/ui primitives (Button, Dialog, Badge, Input, Card)
│   ├── layout/                          # Header, Sidebar, LanguageSwitcher, Nav
│   ├── catalog/                         # ItemCard, FilterBar, RequestModal (SCR-04-M)
│   ├── admin/                           # DamageModal, QuickReturnDialog, RejectModal
│   └── shared/                          # SkeletonLoader, EmptyState, ErrorBanner
├── lib/                                 # Utilities & Infrastructure
│   ├── db/                              # Prisma / Drizzle client instance
│   ├── auth/                            # Session & JWT token verification
│   └── utils/                           # Formatters, date calculation, RTL helpers
├── services/                            # Core Business Domain Services (Constitution Rule I)
│   ├── loan.service.ts                  # Booking logic, quota check, duration limits
│   ├── counter.service.ts               # Checkout, healthy/damaged return, extensions
│   ├── inventory.service.ts             # Atomic stock decrement/increment, CRUD
│   └── account.service.ts               # Student registration, admin verification
└── types/                               # TypeScript Data Interfaces & Enums
    ├── models.ts
    └── api.ts

prisma/                                  # Database Schema & Migrations
├── schema.prisma
└── seed.ts

tests/
├── unit/                                # Vitest unit tests (business invariants)
│   ├── loan-service.test.ts
│   ├── counter-service.test.ts
│   └── concurrency.test.ts
└── e2e/                                 # Playwright E2E browser tests
    ├── student-booking.spec.ts
    ├── admin-counter.spec.ts
    └── rtl-ltr-layout.spec.ts
```

**Structure Decision**: Selected the Full-Stack Next.js unified project layout because it encapsulates the entire 11-screen responsive UI, localized RTL layouts, and atomic database service operations within a strongly typed, maintainable architecture without distributed microservice or CORS bloat.

---

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

*No violations detected. Zero unnecessary abstractions.*
