# Product Requirements Document (PRD)

## Project: BorrowHub — نظام استعارة المعدات
**Document Version:** 1.0.0  
**Status:** Approved for MVP  
**Target Delivery:** Minimum Viable Product (MVP)  
**Author:** Senior Product Manager & Business Analyst  

---

## 1. Product Overview
**BorrowHub** is a web-based equipment borrowing management platform built for university environments. The platform streamlines how university students request, borrow, track, and return physical academic and extracurricular equipment (such as laptops, cameras, projectors, cables, and lab kits), while providing warehouse/lab administrators (Admins/Staff) with complete visibility over inventory levels, active loans, and overdue equipment.

---

## 2. Problem Statement
In university departments and labs, equipment lending has traditionally relied on paper sign-up sheets, informal chat messages, or ad-hoc verbal agreements. This causes several critical operational issues:
- **Lack of Inventory Visibility:** Students cannot easily see whether equipment is available or currently checked out.
- **Lost and Unreturned Gear:** No centralized record of loan durations or overdue tracking.
- **Administrative Friction:** Lab supervisors spend excessive time manually following up on borrowed items without audit trails.
- **Inaccurate Stock Counts:** Unreported hardware damage or loss leads to phantom inventory.

---

## 3. Product Goals
- **G-01:** Centralize all departmental equipment loans into a single accessible web platform.
- **G-02:** Eliminate lost/unaccounted-for hardware through clear borrowing lifecycle states (Requested $\rightarrow$ Approved $\rightarrow$ Checked Out $\rightarrow$ Returned).
- **G-03:** Provide administrators with real-time stock availability and alert dashboards for overdue returns.
- **G-04:** Provide students with a transparent self-service portal to request equipment and track return deadlines.

---

## 4. Non-Goals (Explicitly Out of Scope for MVP)
- **NG-01:** No serialized / asset-tag tracking per single unit (Dell Laptop #SN-001 vs #SN-002) — tracking is batch/quantity-based for MVP.
- **NG-02:** No automated University Single Sign-On (SSO / LDAP / SAML / Active Directory integration).
- **NG-03:** No automated financial penalties, fines calculation, or payment gateway integrations.
- **NG-04:** No automated account lockouts or automated borrowing bans upon overdue items (admin handles follow-up manually).
- **NG-05:** No automated barcode / QR code scanning hardware integrations.
- **NG-06:** No native mobile applications (iOS/Android) — web application only.

---

## 5. Target Users
1. **University Students:** Enrolled students requiring equipment for class projects, graduation assignments, or university activities.
2. **Equipment / Lab Administrators (Admin / Staff):** Laboratory supervisors, department technicians, or facility staff responsible for managing physical gear, approving requests, handing over items, and checking in returns.

---

## 6. User Personas

### Persona 1: Omar — The Media & Engineering Student
- **Profile:** 3rd-year student working on weekly multimedia and lab assignments.
- **Pain Points:** Arrives at the department lab only to find all cameras or projectors already checked out.
- **Goal:** Check equipment availability in advance, submit a reservation request online, pick up the item quickly, and know the exact return date.

### Persona 2: Mona — The Department Equipment Administrator
- **Profile:** Department lab coordinator in charge of 50+ laptops, cameras, and audio sets.
- **Pain Points:** Uses paper logbooks; students keep items past deadlines; cannot immediately answer faculty questions about current inventory counts.
- **Goal:** Review pending student requests, approve or reject with reasons, confirm physical handoff with one click, identify overdue loans on a dashboard, and flag damaged equipment.

---

## 7. User Needs

### 7.1 Student User Needs
| ID | Need Category | Description | Business Value / Impact |
| :--- | :--- | :--- | :--- |
| **UN-STU-01** | Catalog Visibility | View real-time availability and stock counts of university equipment before coming to campus. | Eliminates wasted in-person visits to empty labs. |
| **UN-STU-02** | Simple Reservations | Submit equipment borrowing requests with flexible dates ($\le 10$ days) and academic justification. | Ensures fair, documented allocation of limited hardware. |
| **UN-STU-03** | Status Tracking | Transparently track request lifecycle stages (`PENDING_REVIEW`, `APPROVED`, `CHECKED_OUT`, `RETURNED`). | Keeps students informed on approval status and pickup readiness. |
| **UN-STU-04** | Deadline Awareness | Clear visibility on upcoming return due dates to prevent overdue occurrences. | Promotes accountability and timely returns. |

### 7.2 Administrator / Staff (Warehouse & Lab) User Needs
| ID | Need Category | Description | Business Value / Impact |
| :--- | :--- | :--- | :--- |
| **UN-ADM-01** | Student Verification | Manually verify and approve student accounts against university rosters before granting booking access. | Protects university assets from unauthorized borrowing. |
| **UN-ADM-02** | Inventory Control | Easily maintain equipment catalog, adjust aggregate quantities, and monitor counts across categories. | Prevents phantom stock and keeps inventory audits accurate. |
| **UN-ADM-03** | Request Governance | Review, approve, or reject loan requests with custom feedback/reasons based on academic priority. | Balances equipment distribution among students. |
| **UN-ADM-04** | Quick Physical Handoff | Confirm physical item checkout and check-in with a single click at the service counter. | Reduces counter bottleneck and paper sign-out bureaucracy. |
| **UN-ADM-05** | Overdue Tracking | Dedicated alert dashboard identifying loans past their 10-day deadline with student contact information. | Enables rapid, targeted manual follow-up without manual paper audits. |
| **UN-ADM-06** | Damage & Loss Handling | Flag returned equipment as damaged, log issue notes, and automatically deduct them from available stock. | Keeps physical stock aligned with digital availability and triggers maintenance. |

---

## 8. User Stories
- **US-01:** As a student, I want to register an account using my university email so that an administrator can verify and activate my access.
- **US-02:** As an administrator, I want to view a list of pending user registrations and approve or reject them so only eligible students can request items.
- **US-03:** As a student, I want to view available items and quantities so that I know what equipment can be borrowed.
- **US-04:** As a student, I want to submit a loan request specifying duration (up to 10 days) and purpose so that my request can be evaluated by staff.
- **US-05:** As an administrator, I want to view pending loan requests and approve or reject them with feedback.
- **US-06:** As an administrator, I want to record the physical handover of approved equipment to change its state to "Checked Out".
- **US-07:** As an administrator, I want to record the return of checked-out equipment with a single click so that available stock increases automatically.
- **US-08:** As an administrator, I want to flag a returned item as "Damaged" so that it is not returned to available stock and total inventory is deducted.
- **US-09:** As an administrator, I want to see an overdue list highlighting loans past their 10-day return window so that I can contact students directly.

---

## 9. MVP Scope

| Feature Area | In MVP Scope | Deferred to Post-MVP |
| :--- | :--- | :--- |
| **Authentication** | Email + Password, Admin manual approval of registrations | SSO (SAML/OAuth/LDAP), SMS OTP |
| **Inventory Tracking** | Quantity-based aggregate tracking (Total & Available counts) | Serial Number / Barcode / RFID tracking |
| **Borrowing Model** | Request $\rightarrow$ Admin Approval $\rightarrow$ Physical Handover $\rightarrow$ Return | Instant booking without review |
| **Borrow Duration** | Fixed maximum limit of up to 10 days | Dynamic custom time slots, recurring bookings |
| **Overdue Handling** | Dashboard alerts for Admin; manual follow-up; no auto-block | Automated overdue fines, automated account suspension |
| **Return & Damage** | 1-click Admin return; mark as Damaged (deducts stock) | Multi-step condition checklists, student pre-return checkin |
| **Notifications** | In-app dashboard status updates | Automated Email/SMS/WhatsApp notifications |

---

## 10. Core Features

### Feature F-01: User Management & Manual Verification
- **Purpose:** Secure access control for students and departmental administrators.
- **Description:** Traditional email/password registration with an account state of `PENDING_APPROVAL`. Admins review student credentials before granting access to submit requests.

### Feature F-02: Aggregate Inventory Catalog
- **Purpose:** Real-time visibility into available university gear.
- **Description:** Equipment is grouped by model/item with numerical counts (`total_quantity`, `available_quantity`, `borrowed_quantity`, `damaged_quantity`).

### Feature F-03: Loan Request & Approval Workflow
- **Purpose:** Regulate equipment distribution based on academic priority and availability.
- **Description:** Students select an item, pick dates ($\le$ 10 days), and enter justification. Admin reviews and marks `APPROVED` or `REJECTED`.

### Feature F-04: Checkout & Return Execution (Admin Counter)
- **Purpose:** Bridge digital records with physical handoffs.
- **Description:** When the student arrives at the lab, the admin confirms handover (`CHECKED_OUT`). Upon return, admin clicks return (`RETURNED`). If damaged, admin marks `DAMAGED`.

### Feature F-05: Overdue Tracking & Alert Dashboard
- **Purpose:** Identify items not returned within the approved 10-day duration.
- **Description:** Admin dashboard displays a dedicated "Overdue Loans" tab showing student contact details, item name, and overdue days.

---

## 11. Functional Requirements

### 11.1 Authentication & User Management
- **FR-001:** The system shall allow students to register with Full Name, University Email, Student ID number, Department, Active Mobile Phone Number, and Password.
- **FR-002:** The system shall assign newly registered student accounts a status of `PENDING_APPROVAL`.
- **FR-003:** The system shall restrict unapproved students from creating borrowing requests.
- **FR-004:** The system shall allow administrators to view, approve, or reject student registration requests.
- **FR-005:** The system shall allow active users to log in securely using email and password.

### 11.2 Inventory Management
- **FR-006:** The system shall allow administrators to add, edit, and archive equipment catalog entries.
- **FR-007:** Each equipment entry shall maintain: Title, Category, Description, Total Quantity, Available Quantity, Borrowed Quantity, and Damaged Quantity.
- **FR-008:** The system shall atomically decrement `available_quantity` and increment `reserved_quantity` immediately upon administrator approval (`APPROVED`). If an approved loan is cancelled or expired, reserved stock returns to `available_quantity`. Upon handover (`CHECKED_OUT`), reserved transitions to `borrowed_quantity`.
- **FR-009:** The system shall increase `available_quantity` and decrease `borrowed_quantity` when an item is returned in good condition.
- **FR-010:** The system shall move count to `damaged_quantity` and decrease `borrowed_quantity` (without restoring `available_quantity`) if marked `DAMAGED` upon return.

### 11.3 Request & Borrowing Workflow
- **FR-011:** The system shall allow approved students to browse equipment with `available_quantity > 0`.
- **FR-012:** The system shall enforce a maximum borrowing duration of 10 calendar days from the requested start date.
- **FR-013:** The system shall mandate a non-empty text field for "Purpose of Borrowing" on every request.
- **FR-014:** The system shall limit each student to borrowing a quantity of 1 unit per request, and a maximum of 2 concurrent active loans (status `PENDING_REVIEW`, `APPROVED`, or `CHECKED_OUT`).
- **FR-015:** The system shall set initial request status to `PENDING_REVIEW`.
- **FR-016:** The system shall allow students to self-cancel any loan request while it is still in `PENDING_REVIEW` status.
- **FR-017:** The system shall allow administrators to approve or reject requests with a mandatory reason upon rejection.
- **FR-018:** The system shall automatically cancel an `APPROVED` reservation and restore inventory if the student fails to pick up the equipment within 48 hours of the requested start date (No-Show Expiry).
- **FR-019:** The system shall allow administrators to transition an `APPROVED` request to `CHECKED_OUT` upon physical handover.
- **FR-020:** The system shall record timestamps for `requested_at`, `approved_at`, `checked_out_at`, `expected_return_at`, and `returned_at`.

### 11.4 Return & Damage Handling
- **FR-021:** The system shall allow administrators to mark a `CHECKED_OUT` loan as `RETURNED` via a single action.
- **FR-022:** The system shall allow administrators to flag an item as `DAMAGED` during the return action, entering optional damage notes.

### 11.5 Overdue Monitoring
- **FR-023:** The system shall flag any loan as `OVERDUE` when current time exceeds `expected_return_at` and status is still `CHECKED_OUT`.
- **FR-024:** The system shall display all overdue records on a dedicated Admin Alert Widget/Page with student name, university email, and mobile phone number for direct manual contact.
- **FR-025:** The system shall allow students to submit subsequent requests even if they hold an overdue item (admin handles approval discretion manually).

---

## 12. Non-Functional Requirements

### 12.1 Performance & Scalability (NFR-P)
- **NFR-001:** Page load times for catalog and dashboards shall not exceed 2.0 seconds under standard campus network speeds.
- **NFR-002:** Inventory stock decrement and increment operations shall be executed in atomic database transactions to prevent race conditions.

### 12.2 Usability & Localization (NFR-U)
- **NFR-003:** The user interface shall support Arabic (RTL) as the primary language, with clear technical terminology.
- **NFR-004:** Responsive design functional on standard mobile browsers (for students checking status) and desktop browsers (for administrators).

### 12.3 Security (NFR-S)
- **NFR-005:** All passwords shall be hashed using modern algorithms (bcrypt / Argon2).
- **NFR-006:** Role-Based Access Control (RBAC) enforced on both client routing and server API endpoints.
- **NFR-007:** Input sanitization to prevent XSS and SQL injection.

### 12.4 Reliability & Data Integrity (NFR-R)
- **NFR-008:** Audit log entries shall record who approved, checked out, and marked items returned or damaged.

---

## 13. User Flows

### 13.1 Student User Flow (End-to-End Lifecycle)
1. **Onboarding & Authentication:**
   - Student submits registration form with name, university email, student ID, mobile number, and password.
   - Initial status set to `PENDING_APPROVAL`. Access to request equipment is restricted (`ERR-AUTH-01`) until administrator verifies credentials.
   - Once activated (`ACTIVE`), student logs in using email and password.
2. **Catalog Discovery & Availability Check:**
   - Student views real-time catalog; items display real-time availability badges (`available_quantity > 0`).
   - If stock is 0, request action is disabled (`ERR-INV-01`).
3. **Request Creation & Limit Validation:**
   - Student selects item; system validates student has $< 2$ active concurrent loans (`ERR-LMT-01`).
   - Student enters start date, duration ($\le 10$ calendar days), and mandatory academic purpose text.
   - Upon submission, loan request is recorded as `PENDING_REVIEW`.
4. **Self-Service Tracking & Cancellation:**
   - Request displays under "My Borrowings" dashboard.
   - While in `PENDING_REVIEW`, student has the option to self-cancel at any time (transitions to `CANCELLED` with zero inventory side-effect).
   - If rejected by admin, status updates to `REJECTED` displaying mandatory rejection reason.
5. **Approval & Reservation Window:**
   - Once admin approves, request state transitions to `APPROVED` and unit is reserved.
   - 48-hour pickup countdown starts from the scheduled reservation start date. If student fails to pick up, the system automatically transitions the request to `EXPIRED` and frees reserved stock.
6. **Physical Handover (Checkout):**
   - Student arrives at lab counter and presents student ID.
   - Admin verifies and triggers handover; status changes to `CHECKED_OUT` and loan countdown starts.
7. **Equipment Usage, Overdue Alert, & Return:**
   - Student utilizes gear; if current date passes `expected_return_date`, system tags status as `OVERDUE` and alerts the user and administrator.
   - Student returns physical unit to counter; admin conducts inspection. Once confirmed (`RETURNED`), student's active loan quota is freed.

### 13.2 Staff & Administrator Flow (Operations & Governance)
1. **User Account Verification:**
   - Admin views "Pending Approvals" roster in User Management.
   - Validates student ID and enrollment against campus directory; clicks "Approve" (status becomes `ACTIVE`) or "Reject".
2. **Catalog & Inventory Maintenance:**
   - Admin adds new equipment items, categorizes assets, and manages aggregate quantities (`total_quantity`).
   - Edits or archives items as laboratory assets rotate.
3. **Loan Request Review & Atomic Allocation:**
   - Admin reviews pending queue (`PENDING_REVIEW`) with applicant details and academic purpose.
   - **Rejection:** Admin enters mandatory reason and clicks "Reject" (status becomes `REJECTED`).
   - **Approval:** Admin clicks "Approve". System executes atomic check: decrements `available_quantity` by 1 and increments `reserved_quantity` by 1 (transitions to `APPROVED`). If stock depleted in interim, triggers `ERR-ACT-01`.
4. **Counter Checkout (Physical Handover):**
   - Student arrives at lab counter; admin searches approved loan record.
   - Admin verifies student identity and hands over item.
   - Admin clicks "Handover Equipment"; system atomically transitions `reserved_quantity` to `borrowed_quantity` and sets status to `CHECKED_OUT`.
5. **Physical Return & Damage Inspection:**
   - Student presents returned hardware. Admin inspects condition and completeness:
     - **Intact / Good Condition:** Admin clicks "Confirm Return" $\rightarrow$ status updates to `RETURNED`, `borrowed_quantity` decrements by 1, `available_quantity` increments by 1.
     - **Damaged Condition:** Admin toggles "Flag as Damaged", writes damage notes $\rightarrow$ status updates to `RETURNED`, `borrowed_quantity` decrements by 1, `damaged_quantity` increments by 1 (`available_quantity` remains untouched).
6. **Overdue Monitoring & Delinquency Follow-Up:**
   - Admin navigates to "Overdue Alerts" view.
   - Filters loans past their 10-day deadline; accesses student's verified phone number and university email for direct manual recovery communication.

---

## 14. Pages / Screens

### Student Portal
1. **Login & Registration Page:** Sign up with student details; sign in; password reset.
2. **Equipment Catalog Page:** Grid/list of equipment with search, categories, and real-time available badges.
3. **Request Modal / Page:** Quantity selector, date picker ($\le 10$ days limit), purpose text area.
4. **My Borrowings Page:** Tabs for Active, Pending, Past, and Overdue loans with status badges and expected return dates.

### Admin Portal
5. **Admin Dashboard:** High-level metrics: Total Items, Active Loans, Pending Requests, Overdue Loans Count.
6. **User Management Page:** Table of registered students with Approve / Reject / Suspend actions.
7. **Inventory Management Page:** CRUD for equipment categories and items with direct quantity adjustments.
8. **Requests & Loans Management Page:** Filterable table by status (`PENDING`, `APPROVED`, `CHECKED_OUT`, `RETURNED`, `OVERDUE`).
9. **Loan Detail & Action Modal:** Action buttons for "Approve", "Reject", "Confirm Handover", "Confirm Return", "Mark Damaged".
10. **Overdue Alerts Page:** Filtered view of delinquent loans with student phone/email and days elapsed.

---

## 15. Roles & Permissions

| Permission | Student (Pending) | Student (Approved) | Admin / Staff |
| :--- | :---: | :---: | :---: |
| View Equipment Catalog | Yes | Yes | Yes |
| Submit Loan Request | No | Yes | No (Admin manages/hands over) |
| Cancel Own Pending Request | No | Yes | No |
| View Own Loans | Yes | Yes | No (Views all departmental loans) |
| Approve/Reject Student Accounts | No | No | Yes |
| Create/Edit Inventory | No | No | Yes |
| Approve/Reject Loan Requests | No | No | Yes |
| Confirm Handover (Check Out) | No | No | Yes |
| Confirm Return / Mark Damaged | No | No | Yes |
| View Overdue Dashboard (All Users) | No | No | Yes |

---

## 16. Data Requirements

### Key Entities & Attributes

#### User Entity
- `id`: UUID (Primary Key)
- `full_name`: String
- `email`: String (Unique)
- `student_id`: String (Unique for students)
- `phone_number`: String (Mandatory for student contact)
- `role`: Enum (`STUDENT`, `ADMIN`)
- `status`: Enum (`PENDING_APPROVAL`, `ACTIVE`, `REJECTED`)
- `created_at`: Timestamp

#### Equipment Entity
- `id`: UUID (Primary Key)
- `name`: String
- `category`: String
- `description`: Text
- `total_quantity`: Integer ($\ge 0$)
- `available_quantity`: Integer ($\ge 0$)
- `reserved_quantity`: Integer ($\ge 0$)
- `borrowed_quantity`: Integer ($\ge 0$)
- `damaged_quantity`: Integer ($\ge 0$)
- `created_at`: Timestamp

#### LoanRequest Entity
- `id`: UUID (Primary Key)
- `student_id`: Foreign Key (`User.id`)
- `equipment_id`: Foreign Key (`Equipment.id`)
- `quantity`: Integer (default 1 for MVP)
- `purpose`: Text
- `start_date`: Date
- `expected_return_date`: Date (Max `start_date` + 10 days)
- `actual_return_date`: Timestamp (Nullable)
- `status`: Enum (`PENDING_REVIEW`, `APPROVED`, `REJECTED`, `CHECKED_OUT`, `RETURNED`, `OVERDUE`)
- `damage_notes`: Text (Nullable)
- `approved_by`: Foreign Key (`User.id`, Nullable)
- `created_at`: Timestamp

---

## 17. Integrations
- **MVP Integrations:** None (Self-contained web app to ensure lightweight deployment and zero external vendor dependencies).
- **Post-MVP Integrations:** University LDAP/Active Directory SSO, Campus Email SMTP Gateway, SMS gateway for WhatsApp/SMS notifications.

---

## 18. Edge Cases
- **EC-01 (Simultaneous Requests for Last Item):** Two students submit requests for the last available laptop simultaneously.  
  *Behavior:* Both requests enter `PENDING_REVIEW`. The administrator chooses which to approve; the moment one is approved/checked out, the other cannot be approved due to insufficient stock (`available_quantity == 0`).
- **EC-02 (Equipment Damaged Beyond Repair):** Administrator marks returned item as `DAMAGED`.  
  *Behavior:* System increments `damaged_quantity` and decrements `total_quantity` / keeps `available_quantity` untouched. Item is not returned to available circulation.
- **EC-03 (Student Registers Twice with Same Student ID):**  
  *Behavior:* Unique constraint triggers friendly validation error: "Student ID already registered".
- **EC-04 (Admin Attempts Return Before Handover):**  
  *Behavior:* "Return" action is disabled until the loan status is strictly `CHECKED_OUT`.
- **EC-05 (Requested Duration Exceeds 10 Days):**  
  *Behavior:* Date picker client-side and server-side validation rejects date ranges $> 10$ days.
- **EC-06 (No-Show for Approved Reservation):**  
  *Behavior:* If student fails to pick up item within 48 hours of reservation start date, loan status automatically transitions to `EXPIRED` and `reserved_quantity` is returned to `available_quantity`.
- **EC-07 (Student Exceeds Concurrent Limit):**  
  *Behavior:* If student already has 2 active loans (`PENDING_REVIEW`, `APPROVED`, or `CHECKED_OUT`), request submission is disabled with notice: "Maximum limit of 2 concurrent loans reached".

---

## 19. Error States

| Error Code | Trigger Condition | System Response / User Message |
| :--- | :--- | :--- |
| **ERR-AUTH-01** | Unapproved student attempts to borrow | "Your account is pending administrator approval. Please contact the lab supervisor." |
| **ERR-INV-01** | Student attempts to request item with 0 available | "Item is currently out of stock. Please check back later." |
| **ERR-DUR-01** | Borrowing duration exceeds 10 days | "The maximum allowed borrowing duration is 10 days." |
| **ERR-LMT-01** | Student exceeds 2 active loans limit | "You have reached the maximum allowance of 2 concurrent loans." |
| **ERR-ACT-01** | Admin tries to approve request when stock reached 0 | "Cannot approve request: Insufficient available inventory." |
| **ERR-NET-01** | Disconnection or server failure | "Unable to process request. Please check your connection and try again." |

---

## 20. Security & Privacy Requirements
- **SEC-01:** Passwords stored using salted hashing (bcrypt cost factor 12).
- **SEC-02:** Strict session expiration after inactivity.
- **SEC-03:** Student personal information (phone numbers, IDs) accessible only to authorized administrators.
- **SEC-04:** Rate limiting on login and registration endpoints to prevent brute-force attacks.

---

## 21. Analytics & Tracking
- **AN-01:** Total count of active, completed, and overdue borrowings per semester.
- **AN-02:** Most requested equipment categories to assist department budget allocation.
- **AN-03:** Average turnaround time for admin approval.
- **AN-04:** Damaged item percentage by equipment category.

---

## 22. Success Metrics / KPIs
- **KPI-01:** **100% Digital Adoption** — Zero physical paper sign-out sheets after 30 days of launch.
- **KPI-02:** **Overdue Resolution** — 80% reduction in unreturned equipment by end-of-semester.
- **KPI-03:** **Approval Turnaround** — Average loan request approval within under 4 business hours.
- **KPI-04:** **Inventory Discrepancy** — Less than 2% discrepancy between recorded digital stock and physical shelf inventory.

---

## 23. Acceptance Criteria (Given / When / Then)

### AC-01: Student Submits Loan Request
- **Given** an approved student is logged into BorrowHub with fewer than 2 active loans and views an item with available stock $> 0$,
- **When** the student selects a duration $\le 10$ days, fills in the borrowing purpose, and clicks "Submit Request",
- **Then** the request is saved with status `PENDING_REVIEW`, and the student sees a success confirmation on their dashboard.

### AC-02: Admin Approves Loan Request (Deterministic Reservation)
- **Given** an administrator is reviewing a request with status `PENDING_REVIEW` and the item has available stock,
- **When** the admin clicks "Approve",
- **Then** the request status changes to `APPROVED`, the item's `available_quantity` decreases by 1, and `reserved_quantity` increases by 1 atomically.

### AC-03: Physical Handover (Check Out)
- **Given** a request with status `APPROVED`,
- **When** the admin clicks "Handover Equipment",
- **Then** the request status updates to `CHECKED_OUT`, `reserved_quantity` transfers to `borrowed_quantity`, and the official 10-day return countdown begins.

### AC-04: Equipment Return (Healthy Condition)
- **Given** a loan with status `CHECKED_OUT`,
- **When** the admin clicks "Confirm Return" without flagging damage,
- **Then** the loan status changes to `RETURNED`, `actual_return_date` is stamped, `borrowed_quantity` decreases by 1, and `available_quantity` increases by 1.

### AC-05: Equipment Return (Damaged Condition)
- **Given** a loan with status `CHECKED_OUT`,
- **When** the admin checks "Flag as Damaged", enters damage details, and confirms return,
- **Then** the loan status changes to `RETURNED`, `borrowed_quantity` decreases by 1, `damaged_quantity` increases by 1, and `available_quantity` remains unchanged.

### AC-06: Overdue Detection
- **Given** a loan in `CHECKED_OUT` status whose `expected_return_date` is earlier than the current date,
- **When** the system evaluates loan statuses,
- **Then** the loan is labeled as `OVERDUE` and highlighted in the administrator's Overdue Alerts dashboard with student phone number and email.

### AC-07: Student Self-Cancellation
- **Given** a student has a request in `PENDING_REVIEW` status,
- **When** the student clicks "Cancel Request",
- **Then** the request status changes to `CANCELLED` without affecting equipment inventory counts.

### AC-08: Reservation No-Show Expiry
- **Given** an approved request in `APPROVED` status that has not been picked up after 48 hours of the requested start date,
- **When** the system runs the reservation expiration check,
- **Then** the status changes to `EXPIRED`, `reserved_quantity` decreases by 1, and `available_quantity` increases by 1.

---

## 24. Future Features (Post-MVP Roadmap)
- **Phase 2:** Barcode / QR Code generation and camera scanner integration for ultra-fast checkouts.
- **Phase 3:** Automated email and push notifications for status updates and 24-hour return reminders.
- **Phase 4:** Serial Number tracking for high-value equipment (individual asset history & maintenance logs).
- **Phase 5:** University SSO integration (Google Workspace / Microsoft 365 / LDAP).
- **Phase 6:** Automated student suspension rules and policy violation point system.

---

## 25. Risks & Dependencies
- **Risk R-01:** Students may supply fake contact info during manual registration.  
  *Mitigation:* Admin manually verifies university ID / student records before account approval.
- **Risk R-02:** Overdue students might ignore manual follow-ups without automated system penalties.  
  *Mitigation:* Admin retains discretion to reject any future requests submitted by delinquent students.
- **Dependency D-01:** Timely physical check-in by lab staff to ensure digital stock matches physical shelves.

---

## 26. Resolved Decisions & Standards
- **DEC-01 (Concurrent Loan Limit):** Maximum 2 concurrent active loans permitted per student (`PENDING_REVIEW`, `APPROVED`, or `CHECKED_OUT`).
- **DEC-02 (Duration Counting):** The 10-day maximum borrowing duration counts consecutive calendar days.
- **DEC-03 (Student Self-Cancellation):** Permitted while status is strictly `PENDING_REVIEW`.
- **DEC-04 (No-Show Expiry):** Approved items not picked up within 48 hours expire and release reserved stock.
- **DEC-05 (Admin Role Boundaries):** Admins manage, approve, and execute transactions; they do not borrow gear for personal use in MVP.

---

## 27. Recommended Development Phases

```
┌─────────────────────────────────────────────────────────────┐
│ Phase 1: Foundation (Sprint 1)                              │
│ • Database Schema & Migrations                              │
│ • Authentication & Admin User Approval Flow                 │
│ • Equipment Inventory CRUD (Aggregate Quantities)           │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ Phase 2: Core Borrowing Workflow (Sprint 2)                 │
│ • Student Catalog & Loan Request Creation (<= 10 days)      │
│ • Admin Request Review (Approve / Reject)                   │
│ • Physical Handover (Check Out) & Return Action             │
│ • Damaged Equipment Flagging Flow                           │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ Phase 3: Monitoring & Polish (Sprint 3)                     │
│ • Overdue Detection & Admin Alert Dashboard                 │
│ • Student "My Borrowings" View                              │
│ • Arabic RTL Localization & Responsive UI                   │
│ • Acceptance Testing & MVP Deployment                       │
└─────────────────────────────────────────────────────────────┘
```
