# مسار الإرجاع، الفحص، وتسجيل التلفيات (Return & Inspection Flow)

## 1. الهدف من المهمة (Task Objective)
معاينة واستلام الأجهزة المرجعة وفحص حالتها الفنية وتحديد مسار الإرجاع (سليم مع زيادة المتاح، أو متضرر مع توجيهه لحالة التلف/الصيانة).

---

## 2. مخطط سير المهمة (Flowchart)

```mermaid
flowchart TD
    Start(["بدء: حضور الطالب لمكتب المعمل لإعادة العتاد"]) --> OpenLoan["فتح ملف الإعارة النشطة برقم الطلب أو الطالب"]
    OpenLoan --> PhysicalInspection["الفحص الفعلي للعتاد وملحقاته من قبل المشرف"]
    PhysicalInspection --> DamageCheck{"هل توجد تلفيات أو كسر أو نواقص؟"}

    %% Clean Return
    DamageCheck -- "سليم وخالٍ من الأضرار" --> ConfirmClean["الضغط على تأكيد الإرجاع السليم (Confirm Clean Return)"]
    ConfirmClean --> UpdateCleanStock["تحديث المخزون:\nborrowed = borrowed - 1\navailable = available + 1"]
    UpdateCleanStock --> SetCleanReturned["تحديث الحالة إلى RETURNED\nتسجيل تاريخ الإرجاع returned_at\nاستعادة الطالب كامل أهليته للاستعارة"]
    SetCleanReturned --> EndClean(["نهاية: إغلاق الإعارة بنجاح"])

    %% Damaged Return
    DamageCheck -- "يوجد تلف / كسر" --> FlagDamaged["تفعيل خيار 'تسجيل كمتضرر' (Flag Damaged)"]
    FlagDamaged --> InputDamageReport["كتابة تقرير وملاحظات الضرر وتكلفة التلف الإلزامية"]
    InputDamageReport --> UpdateDamageStock["تحديث المخزون:\nborrowed = borrowed - 1\ndamaged = damaged + 1\n(يبقى available دون زيادة)"]
    UpdateDamageStock --> SetDamagedReturned["تحديث الحالة إلى RETURNED مع وسم 'damaged'\nتسجيل returned_at وتدوين تقرير التلف"]
    SetDamagedReturned --> EndDamaged(["نهاية: إرجاع مع إحالة للصيانة"])

    classDef startEnd fill:#2563eb,stroke:#1d4ed8,stroke-width:2px,color:#fff;
    classDef action fill:#f8fafc,stroke:#334155,stroke-width:1.5px,color:#0f172a;
    classDef decision fill:#fef3c7,stroke:#d97706,stroke-width:2px,color:#78350f;
    classDef alert fill:#fee2e2,stroke:#dc2626,stroke-width:2px,color:#7f1d1d;
    classDef success fill:#dcfce7,stroke:#16a34a,stroke-width:2px,color:#14532d;

    class Start,EndClean,EndDamaged startEnd;
    class OpenLoan,PhysicalInspection,InputDamageReport action;
    class DamageCheck decision;
    class FlagDamaged alert;
    class ConfirmClean,UpdateCleanStock,SetCleanReturned,UpdateDamageStock,SetDamagedReturned success;
```

---

## 3. حالات الخطأ والقيود (Business Rules & Errors)
- تقرير التلف: إلزامي عند الإرجاع المتضرر.
- المخزون: في الإرجاع السليم يعود الرصيد إلى `available`. في المتضرر ينتقل إلى `damaged` ولا يتاح للطلاب حتى الإصلاح.
