<!-- Sync Impact Report
Version change: template -> 1.0.0
List of modified principles:
  - [PRINCIPLE_1_NAME] -> I. Code Quality & Simplicity (NON-NEGOTIABLE)
  - [PRINCIPLE_2_NAME] -> II. Comprehensive Testing Discipline
  - [PRINCIPLE_3_NAME] -> III. Maintainability & Modularity
  - [PRINCIPLE_4_NAME] -> IV. Transactional Integrity & Data Consistency
  - [PRINCIPLE_5_NAME] -> V. Observability & Actionable Error Handling
Added sections:
  - Technical Constraints & Standards
  - Quality Gates & Review Process
Removed sections:
  - None (unfilled template placeholders replaced)
Templates requiring updates:
  - .specify/templates/plan-template.md: ✅ verified aligned (Constitution Check gate matches principles)
  - .specify/templates/spec-template.md: ✅ verified aligned
  - .specify/templates/tasks-template.md: ✅ verified aligned
Follow-up TODOs:
  - None
-->

# BorrowHub Constitution

## Core Principles

### I. Code Quality & Simplicity (NON-NEGOTIABLE)
All code written for BorrowHub MUST prioritize readability, strong typing, and simplicity over clever abstractions.
- **YAGNI & DRY with Moderation**: Build for immediate, concrete requirements. Do not introduce speculative interfaces, generic wrappers, or unneeded design patterns before a second distinct use case emerges.
- **Clean Architecture & Explicit Contracts**: Separate concerns cleanly between presentation, business domain logic, and data access. Business rules (e.g., loan duration checks, stock allocation rules) MUST reside in domain/service layers, never scattered in HTTP handlers or UI views.
- **Static Analysis & Formatting**: Code MUST adhere strictly to configured linter and formatter rules without warnings or suppressed checks. Code reviews MUST reject stylistic inconsistencies or bypasses.
- *Rationale*: A university borrowing platform must be easy to audit, refactor, and extend across semester transitions without hidden cognitive overhead.

### II. Comprehensive Testing Discipline
Testing is an integral gate of development, not an afterthought. Every feature slice MUST include automated tests before merging.
- **Automated Test Pyramid**: Unit tests MUST validate business validation rules (10-day limit, active loan quota, state transition tables). Integration tests MUST validate API endpoints and database transaction boundaries.
- **Independent Testability**: Each user story and state machine path (approval, cancelation, overdue detection, return/damage) MUST be verifiable via repeatable automated test suites.
- **Regression Safety**: Any bug fix MUST introduce a regression test that reliably reproduces the defect prior to fix application.
- *Rationale*: Flaky or missing tests lead directly to equipment double-booking, unrecorded returns, or silent state corruption during peak semester equipment rush.

### III. Maintainability & Modularity
The codebase MUST remain modular, documented, and approachable for continuous evolution.
- **Self-Documenting Code & Living Specs**: Public interfaces, domain models, and workflow transitions MUST feature concise inline docstrings and maintain alignment with `docs/PRD.md` and `docs/user-flow.md`.
- **Minimal External Coupling**: Restrict third-party dependencies to battle-tested, actively maintained packages. Avoid pulling heavyweight packages for trivial utilities that the language standard library provides.
- **Sensible Refactoring**: Refactoring passes MUST accompany feature changes (Boy Scout Rule), keeping tech debt low and removing dead code promptly.
- *Rationale*: High maintainability prevents degradation of the platform and ensures onboarding future maintainers is friction-free.

### IV. Transactional Integrity & Data Consistency
Inventory state and reservation mechanics MUST be strictly consistent under concurrent student operations.
- **Atomic State Transitions**: Stock mutations (`available`, `reserved`, `borrowed`, `damaged`) MUST execute within atomic database transactions or lock-protected boundaries to eliminate race conditions.
- **Explicit Lifecycle State Machine**: Loan records MUST only transition along valid lifecycle paths (`PENDING_REVIEW` -> `APPROVED` -> `CHECKED_OUT` -> `RETURNED` / `OVERDUE`). Invalid transitions MUST fail fast with explicit errors.
- *Rationale*: Preventing ghost inventory and concurrent over-borrowing is fundamental to the core purpose of BorrowHub.

### V. Observability & Actionable Error Handling
Failures and administrative actions MUST be auditable, diagnosable, and transparent.
- **Structured Logging**: Log lifecycle transitions, administrative overrides, and critical operations with structured contextual fields (user ID, item ID, status change) without recording sensitive credentials.
- **User-Facing vs Internal Errors**: External error responses MUST be user-friendly, localized (supporting Arabic RTL UX), and actionable, while server-side logs preserve diagnostic stack traces and error details.
- *Rationale*: Rapid diagnosis of counter handover issues or student verification roadblocks is essential during busy counter hours.

## Technical Constraints & Standards

- **Localization**: Primary user-facing interface MUST support Arabic RTL layout conventions natively and preserve date/time accuracy across campus operational calendars.
- **Authentication & RBAC**: Strict role-based authorization MUST be enforced on all routes and mutations, distinguishing between Students (Pending vs Active) and Lab Staff/Admins.
- **Platform Portability**: Service configurations and secrets MUST follow standard 12-factor principles, injecting configuration via environment variables.

## Quality Gates & Review Process

1. **Local Pre-Check**: Before opening a pull request, all automated unit and integration tests MUST pass, and linter/formatter suites MUST execute cleanly.
2. **Review Criteria**: Pull requests require at least one approving peer review verifying adherence to the Five Core Principles, test coverage adequacy, and no introduction of dead abstractions.
3. **Continuous Integration**: Merges to primary branches are blocked if automated test execution or lint validations fail.

## Governance

- **Supremacy**: This Constitution represents the highest standard for architectural and development standards in BorrowHub. Project plans, specifications, and code implementations MUST comply with its principles.
- **Amendment Procedure**: Proposals to amend this Constitution require documentation of the proposed change, impact evaluation on active features and templates, and consensus among core maintainers.
- **Version Policy**: Follows Semantic Versioning:
  - **MAJOR**: Incompatible principle removals or foundational governance overhauls.
  - **MINOR**: Addition of new principles or material expansions of existing guidelines.
  - **PATCH**: Non-semantic clarifications, corrections, and typographical fixes.

**Version**: 1.0.0 | **Ratified**: 2026-10-15 | **Last Amended**: 2026-10-15
