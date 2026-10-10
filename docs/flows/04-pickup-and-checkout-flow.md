# مسار الاستلام والتسليم المكتبي (Pickup & Checkout Flow)

## 1. الهدف من المهمة (Task Objective)
معالجة نافذة استلام العتاد (48 ساعة)، تسليم المعدة في مكتب المعمل وتحويل حالتها إلى `CHECKED_OUT`، أو معالجة انتهاء المهلة (`EXPIRED`) واستعادة المخزون.

---

## 2. مخطط سير المهمة (Flowchart)

```mermaid
flowchart TD
    Start(["بدء: الطلب في حالة APPROVED"]) --> PickupWindow["نافذة الاستلام: 48 ساعة من تاريخ البدء المحدد"]
    PickupWindow --> StudentArrival{"حضور الطالب لمقر المستودع خلال 48 ساعة؟"}

    %% Expired Branch
    StudentArrival -- "لا (تخلف عن الحضور)" --> SystemExpiry["مهمة النظام المجدولة (Background Cron)"]
    SystemExpiry --> ReleaseStock["تحرير الرصيد المحجوز:\nreserved = reserved - 1\navailable = available + 1"]
    ReleaseStock --> SetExpired["تحديث الحالة إلى EXPIRED وتدوين السبب"]
    SetExpired --> EndExpired(["نهاية: إلغاء الحجز لانتهاء المهلة"])

    %% Pickup Branch
    StudentArrival -- "نعم (حضور الطالب)" --> VerifyIdentity["تحقق أمين المعمل من الهوية الجامعية ورقم الطلب"]
    VerifyIdentity --> ConfirmCheckout["الضغط على تأكيد التسليم (Confirm Handover)"]
    ConfirmCheckout --> UpdateCheckoutStock["تحديث المخزون ذرياً:\nreserved = reserved - 1\nborrowed = borrowed + 1"]
    UpdateCheckoutStock --> SetCheckedOut["تحديث الحالة إلى CHECKED_OUT\nتسجيل وقت التسليم checked_out_at\nبدء سريان فترة الإعارة الفعلية"]
    SetCheckedOut --> EndHandover(["نهاية: تم تسليم المعدة بنجاح"])

    classDef startEnd fill:#2563eb,stroke:#1d4ed8,stroke-width:2px,color:#fff;
    classDef action fill:#f8fafc,stroke:#334155,stroke-width:1.5px,color:#0f172a;
    classDef decision fill:#fef3c7,stroke:#d97706,stroke-width:2px,color:#78350f;
    classDef alert fill:#fee2e2,stroke:#dc2626,stroke-width:2px,color:#7f1d1d;
    classDef success fill:#dcfce7,stroke:#16a34a,stroke-width:2px,color:#14532d;

    class Start,EndExpired,EndHandover startEnd;
    class PickupWindow,SystemExpiry,ReleaseStock,VerifyIdentity action;
    class StudentArrival decision;
    class SetExpired alert;
    class ConfirmCheckout,UpdateCheckoutStock,SetCheckedOut success;
```

---

## 3. حالات الخطأ والقيود (Business Rules & Errors)
- نافذة الـ 48 ساعة: إذا لم يحضر الطالب يتم وسم الطلب بـ `EXPIRED` وإرجاع القطعة من `reserved` إلى `available`.
- التسليم اليدوي: يتم حصرياً بواسطة مسؤول المعمل بعد مطابقة بطاقة الهوية الجامعية.
