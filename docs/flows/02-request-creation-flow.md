# مسار تصفح وإنشاء طلب استعارة (Borrow Request Creation Flow)

## 1. الهدف من المهمة (Task Objective)
تمكين الطالب المفعل من استعراض الكتالوج، فحص التوفر، والتحقق من قيود الحد الأقصى والمدة وتقديم طلب الاستعارة.

---

## 2. مخطط سير المهمة (Flowchart)

```mermaid
flowchart TD
    Start(["بدء: تصفح كتالوج المعدات"]) --> FilterSearch["البحث / تصفية حسب الفئة وملاحظة شارة الرصيد المتاح"]
    FilterSearch --> PickItem["تحديد المعدة والضغط على 'طلب استعارة'"]

    PickItem --> CheckStock{"هل الكمية المتاحة متوفرة؟\navailable_quantity > 0"}
    CheckStock -- "لا" --> ErrStock["عرض خطأ: ERR-INV-01 (المعدة غير متوفرة حالياً)"]
    ErrStock --> FilterSearch

    CheckStock -- "نعم" --> CheckActiveLimit{"هل لدى الطالب أقل من 2 إعارات نشطة؟"}
    CheckActiveLimit -- "لا" --> ErrLimit["عرض خطأ: ERR-LMT-01 (الحد الأقصى إعارتان نشطتان)"]
    ErrLimit --> EndBlocked(["نهاية: تعذر الطلب"])

    CheckActiveLimit -- "نعم" --> OpenModal["فتح نموذج الاستعارة:\n- تاريخ البدء\n- المدة (<= 10 أيام)\n- الغرض الأكاديمي"]
    OpenModal --> ValidateForm{"التحقق من المدخلات:\nالمدة <= 10 أيام والغرض غير فارغ؟"}
    
    ValidateForm -- "لا" --> ErrDuration["عرض خطأ: ERR-DUR-01 أو تنبيه بالحقول الإلزامية"]
    ErrDuration --> OpenModal

    ValidateForm -- "نعم" --> Submit["إرسال الطلب وحفظه بحالة PENDING_REVIEW"]
    Submit --> SuccessNotice["عرض إشعار بنجاح التقديم والتوجيه لصفحة طلباتي"]
    SuccessNotice --> EndDone(["نهاية: تم رفع الطلب للمراجعة"])

    classDef startEnd fill:#2563eb,stroke:#1d4ed8,stroke-width:2px,color:#fff;
    classDef action fill:#f8fafc,stroke:#334155,stroke-width:1.5px,color:#0f172a;
    classDef decision fill:#fef3c7,stroke:#d97706,stroke-width:2px,color:#78350f;
    classDef alert fill:#fee2e2,stroke:#dc2626,stroke-width:2px,color:#7f1d1d;
    classDef success fill:#dcfce7,stroke:#16a34a,stroke-width:2px,color:#14532d;

    class Start,EndBlocked,EndDone startEnd;
    class FilterSearch,PickItem,OpenModal,Submit action;
    class CheckStock,CheckActiveLimit,ValidateForm decision;
    class ErrStock,ErrLimit,ErrDuration alert;
    class SuccessNotice success;
```

---

## 3. حالات الخطأ والقيود (Business Rules & Errors)
- `ERR-INV-01`: حظر الطلب إذا كان `available_quantity <= 0`.
- `ERR-LMT-01`: الحد الأقصى لكل طالب هو إعارتان نشطتان (`PENDING_REVIEW` أو `APPROVED` أو `CHECKED_OUT`).
- `ERR-DUR-01`: أقصى مدة للاستعارة 10 أيام ميلادية مع كتابة غرض أكاديمي إلزامي.
