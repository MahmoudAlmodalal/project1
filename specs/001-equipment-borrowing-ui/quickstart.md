# Quickstart & Feature Validation Guide: BorrowHub Platform

**Feature Branch**: `001-equipment-borrowing-ui`  
**Date**: 2026-10-15  
**Spec Reference**: `specs/001-equipment-borrowing-ui/spec.md`

This guide outlines runnable end-to-end scenarios to validate the implementation of the BorrowHub platform across the 11 user screens and backend state machines.

---

## Prerequisites & Environment Setup

1. **System Requirements**:
   - Node.js >= 20.x (Current LTS: v22.23.1)
   - pnpm >= 9.x or npm >= 10.x
   - PostgreSQL 15+ (local instance or Docker container)

2. **Setup Commands**:
```bash
# Clone and enter repo
git checkout 001-equipment-borrowing-ui

# Install dependencies
pnpm install

# Setup local database & run schema migrations
pnpm db:migrate
pnpm db:seed # Seeds initial admin, student, and equipment categories

# Start local development server
pnpm dev
# App listens on http://localhost:3000
```

---

## End-to-End Validation Scenarios

### Scenario 1: Student Registration & Admin Verification Flow
- **Goal**: Verify account onboarding from registration through verification (`SCR-02` → `SCR-11` → `SCR-01`).
- **Steps**:
  1. Open browser to `http://localhost:3000/register` (`SCR-02`).
  2. Enter student details (Full name, university email, Student ID, Department, Phone, Password).
  3. Submit the form. Confirm the confirmation banner indicates account is in `PENDING_APPROVAL`.
  4. Attempt to log in immediately at `http://localhost:3000/login` (`SCR-01`). Confirm system displays the amber notification that approval is pending.
  5. Log in with admin credentials (`admin@university.edu.sa`) and navigate to `http://localhost:3000/admin/users` (`SCR-11`).
  6. Click "Approve" on the new student row.
  7. Log out and log back in with the student credentials. Confirm student reaches the active portal / catalog (`SCR-04`).

---

### Scenario 2: Catalog Discovery, Booking, & Concurrency Lock
- **Goal**: Verify item catalog filtering, request validation (≤ 10 days, max 2 active quota), and stock reservation (`SCR-04`, `SCR-04-M`, `SCR-03`, `SCR-06`).
- **Steps**:
  1. As an active student on `SCR-04`, search for "Sony Alpha" or filter by category.
  2. Click "Request Loan" on an available item.
  3. In the booking modal (`SCR-04-M`):
     - Try submitting 12 days → Verify validation rejects (maximum 10 days).
     - Enter 5 days and academic justification → Submit.
  4. Navigate to `SCR-03` ("My Loans"). Verify request is listed with status `PENDING_REVIEW`.
  5. As Admin, navigate to `SCR-06` ("Review Queue").
  6. Click "Approve" on the request.
  7. Verify:
     - Request status updates to `APPROVED` with 48h pickup window countdown.
     - Equipment available quantity decreases by 1, and reserved quantity increases by 1.

---

### Scenario 3: Counter Handover & Healthy Return
- **Goal**: Verify counter physical handover and 1-click return (`SCR-07`, `SCR-08`).
- **Steps**:
  1. As Admin, open `SCR-07` ("Approved Pickups Counter").
  2. Locate the approved student loan.
  3. Click "Confirm Handover" (1-click checkout).
  4. Verify:
     - Status updates to `CHECKED_OUT`.
     - Reserved stock decrements by 1, borrowed stock increments by 1.
     - Official return due date is locked to current time + 5 days.
  5. Navigate to `SCR-08` ("Returns Counter").
  6. Click "Return in Good Condition" (1-click return).
  7. Verify:
     - Loan status changes to `RETURNED`.
     - Borrowed stock decrements by 1, available stock increments by 1.
     - Student's active loan quota drops back by 1.

---

### Scenario 4: Counter Damaged Equipment Processing
- **Goal**: Verify defect recording and damaged stock routing (`SCR-08`).
- **Steps**:
  1. With a checked-out loan on `SCR-08`, click "Mark as Damaged".
  2. In the damage modal, enter defect description ("Tripod leg lock broken") and select severity `MODERATE`.
  3. Submit return.
  4. Verify:
     - Loan status changes to `RETURNED`.
     - Stock moves from `borrowed` to `damaged_quantity` (available stock is NOT incremented).
     - Damage inspection record is linked to the loan and equipment.

---

### Scenario 5: Overdue Detection & Auto-Reinstatement
- **Goal**: Verify delinquency tracking and automatic eligibility reinstatement (`SCR-09`, `SCR-04`).
- **Steps**:
  1. Using a checked-out loan, adjust `expected_return_date` to past in DB or advance system time.
  2. Navigate to `SCR-09` ("Overdue Alerts Dashboard").
  3. Verify the loan is highlighted in red with calculated days overdue and student contact details.
  4. As the student, attempt to request a new item on `SCR-04`. Verify booking is blocked with the delinquency warning.
  5. As Admin on `SCR-09`, click the "Immediate Return" action on the overdue row.
  6. Return to the student session and attempt a loan request. Verify borrowing eligibility is immediately reinstated.

---

### Scenario 6: RTL/LTR Language Switching
- **Goal**: Verify seamless layout mirroring without CLS (`docs/design.md` §1).
- **Steps**:
  1. View `SCR-04` in default Arabic (`dir="rtl"`). Confirm catalog cards, typography (IBM Plex Sans Arabic/Cairo), and sidebar/header alignment follow right-to-left.
  2. Click the language toggle in the header to switch to English (`EN`).
  3. Confirm the layout instantly switches to `dir="ltr"` with mirrored grid, navigation, and English typography (Inter).
