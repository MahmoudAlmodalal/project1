# Feature Specification: BorrowHub Equipment Borrowing Management UI/UX Platform

**Feature Branch**: `001-equipment-borrowing-ui`  
**Created**: 2026-10-15  
**Status**: Ready for Planning  
**Input**: User description: "/speckit-specify docs/screen-specifications.md docs/design.md using uiux pro max"

## Clarifications

### Session 2026-10-15
- Q: How should student borrowing eligibility be managed when an item becomes overdue? → A: Option A: Automatic Block & Auto-Reinstatement (blocked while any item is `OVERDUE`; automatically reinstated immediately upon return check-in).
- Q: How are loan extensions handled if a student needs more time? → A: Option C: Admin-Only Counter Extension (only counter staff can manually adjust `expected_return_date` during in-person counter inquiry, subject to the 10-day cumulative limit).

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Equipment Discovery & Booking Request (Priority: P1)

As an active university student, I want to explore available departmental laboratory equipment in a responsive, visual catalog and submit a borrowing request specifying loan duration (up to 10 days) and academic justification, so that I can secure necessary equipment for my coursework without paper forms.

**Why this priority**: Core value proposition for students. Without catalog discovery and request submission, no equipment can be allocated or tracked.

**Independent Test**: An active student can browse items in the catalog (`SCR-04`), filter by category, open item details or request modal (`SCR-04-M`), fill loan duration (≤ 10 days) and academic justification, and submit. The request immediately appears under their personal portal (`SCR-03`) with status `PENDING_REVIEW` while atomic inventory changes into `reserved` upon approval.

**Acceptance Scenarios**:
1. **Given** an authenticated student with an `ACTIVE` account and fewer than 2 active loans, **When** they view the catalog (`SCR-04`) and click "Request Loan" on an item with `available_quantity > 0`, **Then** the booking dialog opens with item details, duration slider/stepper (1–10 days), and mandatory academic justification field.
2. **Given** a student filling the booking dialog, **When** they submit a duration of 1 to 10 days with non-empty justification, **Then** the request is saved in `PENDING_REVIEW` state, a confirmation alert displays, and the loan appears on `SCR-03`.
3. **Given** a student already possessing 2 active loans (`PENDING_REVIEW`, `APPROVED`, or `CHECKED_OUT`), **When** they attempt to request another item, **Then** the booking action is disabled with an informative visual warning explaining the concurrent limit.
4. **Given** a student with a pending request on `SCR-03`, **When** the student clicks "Cancel Request", **Then** the request state changes directly to `CANCELLED` without requiring administrative action.

---

### User Story 2 - Lab Staff Review & Queue Processing (Priority: P1)

As a lab supervisor or warehouse admin, I want to review incoming loan requests with immediate visibility into available stock and student eligibility, and approve or reject them with a single click, so that equipment allocation decisions happen rapidly and prevent double-booking.

**Why this priority**: Essential administrative gate. Controls the atomic reservation and stock validation before physical equipment leaves the counter.

**Independent Test**: An administrator accesses the review queue (`SCR-06`), views pending student requests, and clicks "Approve". The item inventory automatically reserves stock, changes status to `APPROVED`, and sets a 48-hour pickup expiration countdown. Alternatively, clicking "Reject" prompts for a mandatory reason and marks status `REJECTED`.

**Acceptance Scenarios**:
1. **Given** a request in `PENDING_REVIEW` with available stock ≥ 1, **When** the admin clicks "Approve" in `SCR-06`, **Then** the request transitions to `APPROVED`, available stock decreases by 1, reserved stock increases by 1, and a 48-hour pickup window starts.
2. **Given** a request in `PENDING_REVIEW`, **When** the admin clicks "Reject", **Then** a modal requires an explanation and upon submission transitions the request to `REJECTED` without altering stock counts.
3. **Given** an approved loan not picked up within 48 hours, **When** the system evaluates expiration, **Then** the status transitions to `EXPIRED` and reserved stock is automatically restored to available stock.

---

### User Story 3 - Counter Handover & Return Inspection (Priority: P2)

As a lab counter administrator, I want a dedicated operational interface to execute physical checkouts upon student arrival and process equipment returns (including quick damage classification), so that physical handovers match digital inventory in real time.

**Why this priority**: Directly solves physical equipment loss and counter bottlenecks, ensuring inventory accuracy.

**Independent Test**: The admin accesses the Pickup Counter (`SCR-07`) to confirm handovers (`CHECKED_OUT`), and uses the Returns Counter (`SCR-08`) to execute 1-click returns into available stock or route damaged goods to the damaged inventory pool.

**Acceptance Scenarios**:
1. **Given** an `APPROVED` request when a student presents university credentials at the counter (`SCR-07`), **When** the admin clicks "Confirm Handover", **Then** status updates to `CHECKED_OUT`, stock shifts from `reserved` to `borrowed_quantity`, and the return due date is locked.
2. **Given** an active checked-out loan on `SCR-08`, **When** the admin clicks "Return in Good Condition", **Then** status updates to `RETURNED`, stock shifts from `borrowed` to `available_quantity`, and the loan is closed.
3. **Given** an item returned with defects on `SCR-08`, **When** the admin clicks "Mark as Damaged", writes technical defect notes in the damage modal, and submits, **Then** status updates to `RETURNED`, stock shifts from `borrowed` to `damaged_quantity` (not available), and defect logs are recorded.

---

### User Story 4 - Overdue Loans & Delinquency Tracking (Priority: P2)

As a lab administrator, I want an alert dashboard displaying all overdue loans with direct student contact details, so that staff can proactively recover overdue departmental assets and enforce borrowing rules.

**Why this priority**: Prevents asset loss and ensures high turnover of limited laboratory equipment across academic terms.

**Independent Test**: View `SCR-09` displaying filtered loans past their `expected_return_date`, highlighted with days overdue, student contact details (phone, email), and an inline "Immediate Return" action.

**Acceptance Scenarios**:
1. **Given** a checked-out loan past its scheduled return date, **When** viewing `SCR-09`, **Then** the loan is prominently displayed with red alert badges indicating exact days overdue.
2. **Given** an overdue loan record, **When** staff needs to follow up, **Then** 1-click communication actions (call phone, launch mailto) and immediate check-in actions are available on the row.

---

### User Story 5 - Student Registration & Role Verification (Priority: P3)

As a prospective student borrower, I want to register an account using my institutional email and student ID, and as an administrator, I want to verify student identity before approving borrowing privileges, so that only authenticated, authorized university members access equipment.

**Why this priority**: Baseline governance and security gate ensuring accountability for physical assets.

**Independent Test**: A student registers via `SCR-02` entering academic credentials and agreeing to borrower policies; account is placed in `PENDING_APPROVAL`. An admin visits `SCR-11` and approves the account, enabling `SCR-01` login with full booking capabilities.

**Acceptance Scenarios**:
1. **Given** a non-registered student on `SCR-02`, **When** they fill academic details, agree to policy terms, and submit, **Then** their account is created in `PENDING_APPROVAL` status with clear instructions that approval takes up to 24 hours.
2. **Given** an administrator on `SCR-11`, **When** they review pending student accounts and click "Approve", **Then** the student's status changes to `ACTIVE` and they can log in to access the booking catalog.

---

### User Story 6 - Inventory Catalog Management (Priority: P3)

As a lab administrator, I want to manage equipment items, categories, images, and total quantities, so that the department's equipment catalog remains accurate and up to date.

**Why this priority**: Administrative upkeep required to reflect acquisitions, disposals, and specification updates.

**Independent Test**: Admin navigates to `SCR-10`, adds an item with specifications and quantity counts, and edits existing items. Changes immediately propagate to the student-facing catalog (`SCR-04` and `SCR-05`).

**Acceptance Scenarios**:
1. **Given** an administrator on `SCR-10`, **When** they add a new equipment item with title, category, description, and total stock, **Then** the item appears in both administrative inventory tables and the student catalog.

---

### Edge Cases

- **Concurrent Booking Race Conditions**: If multiple students submit requests for the last remaining unit simultaneously, the system MUST process requests atomically; the first approved request reserves the unit, and subsequent requests are alerted of stock depletion.
- **Unclaimed Reservations (No-show)**: If an approved item is not picked up within 48 hours, the system MUST automatically expire the reservation and return the reserved unit to `available_quantity`.
- **Delinquent Student Booking Attempts**: A student who currently has an `OVERDUE` item or 2 concurrent active loans MUST be prevented from initiating new loan requests across all catalog screens.
- **Network Glitches / Offline Counter Use**: If network latency occurs during counter checkout or check-in, UI buttons MUST show loading spinners and disable duplicate submissions to avoid multiple stock decrement/increment operations.
- **RTL/LTR Dynamic Flipping**: When toggling between Arabic (default RTL) and English (LTR), layout grids, navigation drawers, tables, and badge alignments MUST mirror without layout breakage or text overlapping.

---

## Requirements *(mandatory)*

### Functional Requirements

#### User Interface & Experience (UI/UX Pro Max Standards)
- **FR-001**: System MUST provide an interface adhering to the "Card-heavy & Vibrant UI" design specification, utilizing an 8pt spacing grid, responsive card layouts, and semantic state indicators.
- **FR-002**: System MUST default to Arabic language with native Right-to-Left (RTL) layout, and provide an instant header switch to English Left-to-Right (LTR) with mirrored layouts.
- **FR-003**: System MUST comply with WCAG 2.1 AA contrast standards (minimum 4.5:1 text/background contrast), keyboard navigation with visible focus rings, and accessible ARIA attributes.
- **FR-004**: System MUST render feedback for all screen states: loading skeleton placeholders (no cumulative layout shift), empty state illustrations with action triggers, and inline contextual error banners.

#### Authentication & Account Lifecycle
- **FR-005**: System MUST authenticate users via university email and password (`SCR-01`), distinguishing between Students and Administrators.
- **FR-006**: System MUST enforce student account verification lifecycle: `PENDING_APPROVAL` → `ACTIVE` or `REJECTED`, managed by administrators via `SCR-11`.
- **FR-007**: System MUST prevent unverified students (`PENDING_APPROVAL`) from submitting loan requests, displaying an explanatory amber badge on login and catalog views.

#### Equipment Catalog & Booking
- **FR-008**: System MUST display an equipment catalog (`SCR-04`) with multi-column responsive grid (1 col mobile, 2 cols tablet, 3-4 cols desktop), search filter bar, and category chips.
- **FR-009**: System MUST display accurate live inventory availability chips (`available`, `reserved`, `borrowed`, `damaged`) on catalog cards and item detail pages (`SCR-05`).
- **FR-010**: System MUST provide a booking modal dialog (`SCR-04-M`) restricting loan durations to a maximum of 10 calendar days with mandatory academic purpose input.
- **FR-011**: System MUST enforce a maximum quota of 2 active concurrent loans per student, and MUST automatically block loan requests if the student has any `OVERDUE` item, automatically reinstating eligibility immediately once the overdue item is checked in.
- **FR-012**: System MUST permit students to self-cancel any loan that remains in `PENDING_REVIEW` state from their portal (`SCR-03`).

#### Administrative Queue & Counter Operations
- **FR-013**: System MUST provide an administrative review queue (`SCR-06`) enabling 1-click approvals (moving stock atomically from `available` to `reserved`) and rejections with mandatory reason logging.
- **FR-014**: System MUST maintain a 48-hour pickup window for approved loans, automatically releasing unclaimed stock to `available` if expired.
- **FR-015**: System MUST provide a counter handover screen (`SCR-07`) allowing 1-click checkouts (`CHECKED_OUT`), shifting stock from `reserved` to `borrowed_quantity`. Staff at the counter (`SCR-07`/`SCR-08`) MUST have the ability to manually adjust the `expected_return_date` (loan extension) up to the 10-calendar-day cumulative limit upon in-person counter inquiry.
- **FR-016**: System MUST provide a return and inspection counter (`SCR-08`) with two explicit actions:
  - 1-click "Return in Good Condition" (restoring stock to `available_quantity`).
  - "Mark as Damaged" opening a damage modal to record notes and route stock to `damaged_quantity`.
- **FR-017**: System MUST provide an overdue alert dashboard (`SCR-09`) showing delinquent loans, days past due, direct student contact channels, and an instant check-in action.
- **FR-018**: System MUST provide inventory management CRUD (`SCR-10`) with total stock tracking and equipment archiving.

---

### Key Entities

- **User**: Represents campus actors (`id`, `full_name`, `email`, `student_id`, `department`, `phone`, `role` [STUDENT, ADMIN], `status` [PENDING_APPROVAL, ACTIVE, REJECTED]).
- **Equipment**: Represents physical laboratory gear (`id`, `name`, `category`, `description`, `image_url`, `total_quantity`, `available_quantity`, `reserved_quantity`, `borrowed_quantity`, `damaged_quantity`).
- **Loan**: Represents an equipment checkout transaction (`id`, `user_id`, `equipment_id`, `duration_days`, `academic_justification`, `status` [PENDING_REVIEW, APPROVED, CHECKED_OUT, RETURNED, CANCELLED, REJECTED, EXPIRED, OVERDUE], `requested_at`, `approved_at`, `pickup_deadline`, `checked_out_at`, `expected_return_date`, `returned_at`, `rejection_reason`, `damage_notes`).
- **DamageRecord**: Represents defect inspection logs when items return compromised (`id`, `loan_id`, `equipment_id`, `reported_by`, `severity`, `notes`, `created_at`).

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Students can locate an item and complete a borrowing request in under 60 seconds from landing on the catalog.
- **SC-002**: Lab staff can execute counter handover (check out) or healthy return (check in) in a single click in under 3 seconds.
- **SC-003**: 100% of stock transitions between available, reserved, borrowed, and damaged are atomically consistent with zero double-booking occurrences.
- **SC-004**: Overdue equipment visibility is 100% real-time on `SCR-09`, highlighting every item exceeding its scheduled return date without manual batch jobs.
- **SC-005**: 100% of user-facing screens meet WCAG 2.1 AA color contrast (≥ 4.5:1) and provide seamless RTL/LTR layout transitions.
- **SC-006**: Student onboarding drop-off remains under 5%, facilitated by clear status indicators and policy disclosure on `SCR-02`.

---

## Assumptions

- **Target Audience**: University students, laboratory technicians, and faculty equipment managers with modern desktop and mobile web browsers.
- **Language Priority**: Primary operational language is Arabic (RTL); English (LTR) is supported via instantaneous interface flipping.
- **Physical Verification**: University student identification cards are verified physically at counter handover, matching digital student records.
- **Stock Model**: Inventory quantities are tracked by aggregate item model counts (`total`, `available`, `reserved`, `borrowed`, `damaged`) rather than serialized barcodes for MVP phase.
