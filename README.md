# BorrowHub (نظام استعارة المعدات)

> A modern, web-based equipment borrowing management platform built for university environments to streamline inventory tracking, loan requests, counter handovers, and return operations.

---

## 📌 Project Overview

**BorrowHub** replaces traditional paper sign-up sheets and informal borrowing with an automated, auditable system. It empowers university students to discover and request departmental equipment online while giving laboratory and warehouse administrators real-time control over inventory, active loans, and overdue gear.

For full product specifications and user journeys, see:
- [Product Requirements Document (PRD)](file:///home/mahmoud/Desktop/portofoli01/project1/docs/PRD.md)
- [User Flow Document](file:///home/mahmoud/Desktop/portofoli01/project1/docs/user-flow.md)

---

## 🎯 Key Goals & Problem Solved

- **Eliminate Lost Assets:** Transparent lifecycle states (`PENDING_REVIEW` → `APPROVED` → `CHECKED_OUT` → `RETURNED` / `OVERDUE`).
- **Real-Time Stock Visibility:** Live aggregate counts (`available`, `reserved`, `borrowed`, `damaged`).
- **Counter Bottleneck Reduction:** 1-click physical checkout and check-in for lab staff.
- **Overdue & Delinquency Follow-Up:** Dedicated alert dashboard with student contact information.
- **Fair Allocation:** Maximum loan duration of 10 calendar days and 2 concurrent active loans per student.

---

## 👥 Target Users & Roles

| Role | Description | Key Permissions |
| :--- | :--- | :--- |
| **Student (Pending)** | Newly registered student awaiting verification | Browse catalog |
| **Student (Active)** | Verified student with campus eligibility | Browse catalog, submit requests (≤ 10 days, max 2 active), self-cancel pending requests, track loans |
| **Admin / Lab Staff** | Laboratory supervisors and warehouse managers | Verify student accounts, manage equipment catalog, approve/reject requests, execute counter checkout/return, flag damaged units, monitor overdue alerts |

---

## 🔄 Core Borrowing Lifecycle

```
[Student Submits Request]
           │
           ▼
    PENDING_REVIEW ────────── (Student Cancels / Admin Rejects) ───► CANCELLED / REJECTED
           │
     (Admin Approves) ───► Stock atomically reserved
           │
           ▼
       APPROVED
           │
   ┌───────┴──────────────────────────────┐
   │ (Pickup within 48h)                  │ (No-show > 48h)
   ▼                                      ▼
CHECKED_OUT                            EXPIRED (Stock restored)
   │
   ├──────────────────────────┐
   ▼                          ▼
(Returned On Time)     (Past Due Date)
   │                          │
   │                          ▼
   │                       OVERDUE ──► Admin Alert Dashboard
   │                          │
   └──────────┬───────────────┘
              ▼
    (Admin Checks In)
   ┌──────────┴──────────┐
   ▼                     ▼
RETURNED (Normal)     RETURNED (Damaged)
(Stock restored)      (Moved to damaged stock)
```

---

## 🚀 MVP Scope Highlights

- **Authentication:** Email & Password registration with manual Admin approval against student records.
- **Inventory Tracking:** Aggregate quantity management (`total`, `available`, `reserved`, `borrowed`, `damaged`).
- **Atomic Operations:** Transactional stock allocation to prevent race conditions.
- **Overdue Tracking:** Automatic detection when loans exceed `expected_return_date`.
- **Damage Handling:** Admin damage logging and automatic deduction from available inventory.
- **Localization:** Arabic RTL interface as primary language with clean responsive design.

---

## 📂 Project Structure

```
.
├── docs/
│   ├── PRD.md             # Full Product Requirements Document (v1.0.0)
│   └── user-flow.md       # Detailed visual & step-by-step user flows
├── .gitignore             # Standard gitignore rules
└── README.md              # Project summary & documentation guide
```

---

## 🗓️ Implementation Roadmap

- **Phase 1 (Foundation):** Schema, Migrations, RBAC Auth & Admin Student Approval, Equipment Catalog CRUD.
- **Phase 2 (Core Workflow):** Student Catalog & Booking (≤ 10 days), Admin Review, Handover (Check Out) & Return, Damage Logging.
- **Phase 3 (Monitoring & Polish):** Overdue Alert Dashboard, Arabic (RTL) UI styling, Self-Service Student Dashboard, and Acceptance Testing.