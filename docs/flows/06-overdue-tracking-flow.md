# مسار رصد التأخير والمتابعة (Overdue Tracking Flow)

## 1. الهدف من المهمة (Task Objective)
مراقبة تواريخ الإرجاع المتوقعة، وسم الإعارات المتجاوزة لمهلة الـ 10 أيام كـ `OVERDUE`، وإجراء المتابعة الإدارية والتواصل لاسترداد المعدات.

---

## 2. مخطط سير المهمة (Flowchart)

```mermaid
flowchart TD
    Start(["بدء: عملية الإعارة نشطة (CHECKED_OUT)"]) --> DailyCron["مهمة النظام اليومية (Midnight Cron Job)"]
    DailyCron --> CheckDueDate{"مقارنة الوقت الحالي بتاريخ الإرجاع المتوقع:\ncurrent_date > expected_return_date؟"}

    %% Not Overdue
    CheckDueDate -- "لا (ضمن المدة)" --> KeepActive["إبقاء الحالة CHECKED_OUT ومتابعة العداد"]
    KeepActive --> EndNormal(["نهاية: إعارة نظامية"])

    %% Overdue Detected
    CheckDueDate -- "نعم (متأخر)" --> MarkOverdue["تحديث حالة السجل إلى OVERDUE"]
    MarkOverdue --> NotifyStudent["إرسال تنبيه عاجل للطالب عبر البريد وظهور شارة التأخير في لوحته"]
    NotifyStudent --> FlagAdminBoard["إدراج السجل في لوحة متابعة المتأخرين لدى المشرف"]

    %% Admin Outreach
    FlagAdminBoard --> AdminInspectDelinquent["استعراض بيانات الطالب ورقم هاتفه الجامعي"]
    AdminInspectDelinquent --> ManualCall["إجراء اتصال هاتفي ومتابعة يدوية مباشرة لاسترجاع العتاد"]
    ManualCall --> ReturnDesk["حضور الطالب لمكتب المعمل وتسليم العتاد"]
    ReturnDesk --> ToReturnFlow(["الانتقال لمسار الفحص والاستلام (Return Flow)"])

    classDef startEnd fill:#2563eb,stroke:#1d4ed8,stroke-width:2px,color:#fff;
    classDef action fill:#f8fafc,stroke:#334155,stroke-width:1.5px,color:#0f172a;
    classDef decision fill:#fef3c7,stroke:#d97706,stroke-width:2px,color:#78350f;
    classDef alert fill:#fee2e2,stroke:#dc2626,stroke-width:2px,color:#7f1d1d;
    classDef success fill:#dcfce7,stroke:#16a34a,stroke-width:2px,color:#14532d;

    class Start,EndNormal,ToReturnFlow startEnd;
    class DailyCron,KeepActive,AdminInspectDelinquent,ManualCall,ReturnDesk action;
    class CheckDueDate decision;
    class MarkOverdue,NotifyStudent,FlagAdminBoard alert;
```

---

## 3. حالات الخطأ والقيود (Business Rules & Errors)
- حد الإعارة: الحد الأقصى للإعارة 10 أيام ميلادية.
- المتابعة: التواصل المباشر هاتفياً عند التأخر لحماية الأصول الأكاديمية وضمان تدويرها.
