# مسار مراجعة واعتماد الطلبات وإلغائها (Approval & Cancellation Flow)

## 1. الهدف من المهمة (Task Objective)
معالجة الطلب المعلق (`PENDING_REVIEW`) سواء بالإلغاء الذاتي من قبل الطالب، أو بالمراجعة والاعتماد/الرفض من قبل مسؤول المعمل مع التعامل مع حجز المخزون الذري.

---

## 2. مخطط سير المهمة (Flowchart)

```mermaid
flowchart TD
    Start(["بدء: الطلب في حالة انتظار المراجعة (PENDING_REVIEW)"]) --> TriggerAction{"الجهة المتفاعلة"}

    %% Student Self-Cancel
    TriggerAction -- "الطالب" --> StudentAction{"إجراء الطالب"}
    StudentAction -- "إلغاء ذاتي (Self-Cancel)" --> ConfirmCancel["تأكيد إلغاء الطلب"]
    ConfirmCancel --> SetCancelled["تحديث الحالة إلى CANCELLED دون تغيير في المخزون"]
    SetCancelled --> EndStudentCancel(["نهاية: تم الإلغاء بنجاح"])

    %% Admin Review
    TriggerAction -- "مسؤول المعمل" --> OpenQueue["فتح طابور المراجعة وفحص تفاصيل الطلب والغرض"]
    OpenQueue --> AdminDecision{"قرار المسؤول"}

    %% Admin Reject
    AdminDecision -- "رفض الطلب" --> InputReason["إدخال سبب الرفض الإلزامي (Mandatory Reason)"]
    InputReason --> SetRejected["تحديث الحالة إلى REJECTED وإشعار الطالب"]
    SetRejected --> EndRejected(["نهاية: تم رفض الطلب"])

    %% Admin Approve
    AdminDecision -- "اعتماد الطلب" --> CheckLiveStock{"فحص توفر الرصيد الحي لحظة الاعتماد؟"}
    CheckLiveStock -- "نفد المخزون (Race Condition)" --> ErrStockConflict["عرض خطأ: ERR-ACT-01 (المخزون لم يعد كافياً)"]
    ErrStockConflict --> InputReason

    CheckLiveStock -- "متوفر (available > 0)" --> AtomicLock["حجز ذري للمخزون (Atomic Reservation):\navailable = available - 1\nreserved = reserved + 1"]
    AtomicLock --> SetApproved["تحديث الحالة إلى APPROVED\nبدء نافذة استلام 48 ساعة من تاريخ البدء"]
    SetApproved --> EndApproved(["نهاية: تم الاعتماد وحجز العتاد"])

    classDef startEnd fill:#2563eb,stroke:#1d4ed8,stroke-width:2px,color:#fff;
    classDef action fill:#f8fafc,stroke:#334155,stroke-width:1.5px,color:#0f172a;
    classDef decision fill:#fef3c7,stroke:#d97706,stroke-width:2px,color:#78350f;
    classDef alert fill:#fee2e2,stroke:#dc2626,stroke-width:2px,color:#7f1d1d;
    classDef success fill:#dcfce7,stroke:#16a34a,stroke-width:2px,color:#14532d;

    class Start,EndStudentCancel,EndRejected,EndApproved startEnd;
    class OpenQueue,InputReason,ConfirmCancel,SetCancelled,SetRejected action;
    class TriggerAction,StudentAction,AdminDecision,CheckLiveStock decision;
    class ErrStockConflict alert;
    class AtomicLock,SetApproved success;
```

---

## 3. حالات الخطأ والقيود (Business Rules & Errors)
- `ERR-ACT-01`: حماية ضد السباق المتزامن (Race Conditions) أثناء الاعتماد عند نفاد الرصيد المتاح.
- إلغاء الطالب: متاح فقط والطلب بحالة `PENDING_REVIEW` ولا يتطلب أي تعديل على المخزون (لأنه لم يُحجز بعد).
- سبب الرفض: إلزامي عند اتخاذ قرار الرفض ليظهر في سجل الطالب.
