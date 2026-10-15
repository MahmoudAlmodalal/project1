# API & Interface Contracts: BorrowHub Platform

**Feature Branch**: `001-equipment-borrowing-ui`  
**Date**: 2026-10-15  
**Base Path**: `/api/v1`

---

## 1. Authentication Endpoints

### 1.1 POST `/api/v1/auth/register` (Student Registration)
- **Actor**: Anonymous Student (`SCR-02`)
- **Request Body**:
```json
{
  "full_name": "خالد بن عبد الله",
  "email": "khalid@university.edu.sa",
  "student_id": "STD-2024-9981",
  "department": "Engineering - Robotics Lab",
  "phone": "+966501234567",
  "password": "StrongPassword123!"
}
```
- **Validation**:
  - `email`: valid university email domain
  - `student_id`: required, unique
  - `phone`: non-empty, valid phone pattern
  - `password`: min 8 chars, 1 uppercase, 1 number
- **Response `201 Created`**:
```json
{
  "success": true,
  "message": "تم تسجيل حسابك بنجاح وهو بانتظار اعتماد مسؤول المعمل",
  "user": {
    "id": "c1f7b029-4d62-4f81-a67b-1a91cf769b7e",
    "full_name": "خالد بن عبد الله",
    "email": "khalid@university.edu.sa",
    "role": "STUDENT",
    "status": "PENDING_APPROVAL"
  }
}
```

---

### 1.2 POST `/api/v1/auth/login` (User Login)
- **Actor**: Any User (`SCR-01`)
- **Request Body**:
```json
{
  "email": "khalid@university.edu.sa",
  "password": "StrongPassword123!"
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "token": "eyJhbGciOi...",
  "user": {
    "id": "c1f7b029-4d62-4f81-a67b-1a91cf769b7e",
    "full_name": "خالد بن عبد الله",
    "role": "STUDENT",
    "status": "ACTIVE"
  }
}
```

---

## 2. Equipment Catalog Endpoints

### 2.1 GET `/api/v1/equipment` (Catalog Browsing)
- **Actor**: Public / Students / Admins (`SCR-04`)
- **Query Params**:
  - `category` (optional, UUID or slug)
  - `search` (optional, string)
  - `available_only` (optional, boolean)
  - `page` (optional, default 1)
  - `limit` (optional, default 12)
- **Response `200 OK`**:
```json
{
  "data": [
    {
      "id": "8c4187e1-fb32-4740-9112-9c169222de8b",
      "name_ar": "كاميرا سوني الفا A7 III الاحترافية",
      "name_en": "Sony Alpha A7 III Professional Mirrorless",
      "category": {
        "id": "a988b4d8-7b95-46f9-bbbf-6ff7c92a95df",
        "name_ar": "كاميرات ومعدات تصوير",
        "name_en": "Cameras & Video Gear"
      },
      "image_url": "/images/sony-a7iii.jpg",
      "total_quantity": 5,
      "available_quantity": 3,
      "reserved_quantity": 1,
      "borrowed_quantity": 1,
      "damaged_quantity": 0,
      "is_available": true
    }
  ],
  "meta": {
    "total": 48,
    "page": 1,
    "limit": 12,
    "total_pages": 4
  }
}
```

---

## 3. Loan Request & Portal Endpoints

### 3.1 POST `/api/v1/loans` (Submit Booking Request)
- **Actor**: Authenticated Active Student (`SCR-04-M`)
- **Request Body**:
```json
{
  "equipment_id": "8c4187e1-fb32-4740-9112-9c169222de8b",
  "duration_days": 5,
  "academic_justification": "تصوير تجربة التخرج لمشروع الروبوتات الطبية بالكلية"
}
```
- **Validation**:
  - `duration_days`: Integer between 1 and 10.
  - Student status MUST be `ACTIVE`.
  - Student active loan count (`PENDING_REVIEW` + `APPROVED` + `CHECKED_OUT`) MUST be < 2.
  - Student MUST NOT have any `OVERDUE` loans.
- **Response `201 Created`**:
```json
{
  "success": true,
  "loan": {
    "id": "e8e58129-84d2-43bb-85bb-f8db707ef840",
    "equipment_id": "8c4187e1-fb32-4740-9112-9c169222de8b",
    "duration_days": 5,
    "academic_justification": "تصوير تجربة التخرج لمشروع الروبوتات الطبية بالكلية",
    "status": "PENDING_REVIEW",
    "requested_at": "2026-10-15T14:00:00Z"
  }
}
```
- **Error `403 Forbidden` (Quota Exceeded)**:
```json
{
  "error": "QUOTA_EXCEEDED",
  "message": "لا يمكنك حجز أكثر من جهازين في نفس الوقت."
}
```
- **Error `403 Forbidden` (Delinquent/Overdue)**:
```json
{
  "error": "STUDENT_OVERDUE_BLOCKED",
  "message": "حسابك مقيد مؤقتاً بسبب وجود أجهزة متأخرة لم يتم إرجاعها."
}
```

---

### 3.2 POST `/api/v1/loans/:id/cancel` (Student Self-Cancellation)
- **Actor**: Student owner of the loan (`SCR-03`)
- **Rules**: Permitted ONLY when status is `PENDING_REVIEW`.
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "تم إلغاء طلب الاستعارة بنجاح",
  "status": "CANCELLED"
}
```

---

## 4. Administrative Counter Endpoints

### 4.1 POST `/api/v1/admin/loans/:id/approve` (Approve Request)
- **Actor**: Admin (`SCR-06`)
- **Behavior**: Executes atomic transaction: locks equipment row, checks `available_quantity > 0`, shifts 1 unit from `available_quantity` to `reserved_quantity`, sets `pickup_deadline` to 48 hours.
- **Response `200 OK`**:
```json
{
  "success": true,
  "loan_id": "e8e58129-84d2-43bb-85bb-f8db707ef840",
  "status": "APPROVED",
  "approved_at": "2026-10-15T14:10:00Z",
  "pickup_deadline": "2026-10-17T14:10:00Z"
}
```

---

### 4.2 POST `/api/v1/admin/loans/:id/reject` (Reject Request)
- **Actor**: Admin (`SCR-06`)
- **Request Body**:
```json
{
  "reason": "الجهاز محجوز لدورة تدريبية معتمدة مسبقاً للكلية"
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "status": "REJECTED",
  "rejection_reason": "الجهاز محجوز لدورة تدريبية معتمدة مسبقاً للكلية"
}
```

---

### 4.3 POST `/api/v1/admin/loans/:id/checkout` (Confirm Handover)
- **Actor**: Admin / Counter Staff (`SCR-07`)
- **Behavior**: Atomically shifts stock from `reserved_quantity` to `borrowed_quantity`, sets status to `CHECKED_OUT`, sets `expected_return_date = NOW() + duration_days`.
- **Response `200 OK`**:
```json
{
  "success": true,
  "status": "CHECKED_OUT",
  "checked_out_at": "2026-10-15T14:15:00Z",
  "expected_return_date": "2026-10-20T14:15:00Z"
}
```

---

### 4.4 POST `/api/v1/admin/loans/:id/return` (Confirm Return)
- **Actor**: Admin / Counter Staff (`SCR-08`)
- **Request Body**:
```json
{
  "condition": "GOOD" // or "DAMAGED"
}
```
- **If Condition is "DAMAGED"**:
```json
{
  "condition": "DAMAGED",
  "severity": "MODERATE",
  "notes": "كسر في حامل العدسة الجانبي نتيجة سقوط"
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "status": "RETURNED",
  "returned_at": "2026-10-19T10:00:00Z",
  "stock_credited": "AVAILABLE" // or "DAMAGED"
}
```

---

### 4.5 POST `/api/v1/admin/loans/:id/extend` (Admin Counter Extension)
- **Actor**: Admin / Counter Staff (`SCR-07`/`SCR-08`)
- **Request Body**:
```json
{
  "additional_days": 2
}
```
- **Validation**: Total cumulative duration (`duration_days + additional_days`) MUST NOT exceed 10 calendar days.
- **Response `200 OK`**:
```json
{
  "success": true,
  "new_duration_days": 7,
  "expected_return_date": "2026-10-22T14:15:00Z"
}
```

---

### 4.6 GET `/api/v1/admin/overdue` (Overdue Loans Dashboard)
- **Actor**: Admin (`SCR-09`)
- **Response `200 OK`**:
```json
{
  "count": 3,
  "data": [
    {
      "loan_id": "f5e92182-38d1-419b-b921-9988221100aa",
      "student": {
        "id": "b1a2c3-...",
        "full_name": "سعد ناصر القحطاني",
        "student_id": "STD-2023-4412",
        "department": "Computer Science",
        "phone": "+966551122334",
        "email": "saad@university.edu.sa"
      },
      "equipment": {
        "id": "8c4187e1-...",
        "name_ar": "كاميرا سوني الفا A7 III"
      },
      "checked_out_at": "2026-10-01T10:00:00Z",
      "expected_return_date": "2026-10-11T10:00:00Z",
      "days_overdue": 4
    }
  ]
}
```
