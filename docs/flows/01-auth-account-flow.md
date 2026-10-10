# مسار مصادقة وإدارة الحسابات (Auth & Account Management Flow)

## 1. الهدف من المهمة (Task Objective)
إدارة تسجيل حسابات الطلاب ومراجعة وتفعيل الحسابات من قبل المشرفين، والتحكم في صلاحيات الوصول للمنصة.

---

## 2. مخطط سير المهمة (Flowchart)

```mermaid
flowchart TD
    %% Student Account Lifecycle
    Start(["بدء: وصول المستخدم للمنصة"]) --> HasAccount{"هل يمتلك حساباً؟"}

    HasAccount -- "لا" --> Register["إنشاء حساب جديد\n(الاسم، البريد الجامعي، الرقم الجامعي، الهاتف، كلمة المرور)"]
    Register --> PendingStatus["حالة الحساب: قيد المراجعة (PENDING_APPROVAL)"]
    PendingStatus --> WaitAdminNotice["إشعار: منع تقديم طلبات الاستعارة حتى التفعيل (ERR-AUTH-01)"]

    HasAccount -- "نعم" --> Login["تسجيل الدخول (البريد + كلمة المرور)"]
    WaitAdminNotice -.-> Login

    Login --> CheckRole{"نوع الحساب"}

    %% Admin Branch
    CheckRole -- "Staff / Admin" --> AdminHome["لوحة الإدارة المركزية (Admin Dashboard)"]
    AdminHome --> ReviewUsers["مراجعة طلبات التسجيل المعلقة (Pending Approvals)"]
    ReviewUsers --> ValidateRecords{"مطابقة بيانات وسجلات الكلية؟"}
    ValidateRecords -- "غير مطابق / غير صالح" --> RejectUser["رفض الحساب (REJECTED) وإشعار الطالب"]
    ValidateRecords -- "بيانات سليمة" --> ApproveUser["اعتماد وتفعيل الحساب (ACTIVE)"]
    RejectUser --> AdminEnd(["نهاية إجراء الإدارة"])
    ApproveUser --> AdminEnd

    %% Student Branch
    CheckRole -- "Student" --> CheckStatus{"حالة حساب الطالب"}
    CheckStatus -- "REJECTED" --> AccRejected["رسالة: تم رفض تفعيل الحساب - مراجعة المشرف"]
    AccRejected --> EndTerminated(["نهاية: حساب مرفوض"])

    CheckStatus -- "PENDING_APPROVAL" --> WaitAdminNotice
    CheckStatus -- "ACTIVE" --> StudentHome["الدخول للوحة الطالب والتصفح (جاهز للاستعارة)"]
    StudentHome --> EndActive(["نهاية: تسجيل دخول ناجح"])

    classDef startEnd fill:#2563eb,stroke:#1d4ed8,stroke-width:2px,color:#fff;
    classDef action fill:#f8fafc,stroke:#334155,stroke-width:1.5px,color:#0f172a;
    classDef decision fill:#fef3c7,stroke:#d97706,stroke-width:2px,color:#78350f;
    classDef alert fill:#fee2e2,stroke:#dc2626,stroke-width:2px,color:#7f1d1d;
    classDef success fill:#dcfce7,stroke:#16a34a,stroke-width:2px,color:#14532d;

    class Start,AdminEnd,EndTerminated,EndActive startEnd;
    class Register,PendingStatus,Login,AdminHome,ReviewUsers,StudentHome action;
    class HasAccount,CheckRole,ValidateRecords,CheckStatus decision;
    class WaitAdminNotice,RejectUser,AccRejected alert;
    class ApproveUser success;
```

---

## 3. حالات الخطأ والقيود (Business Rules & Errors)
- `ERR-AUTH-01`: منع أي طالب من تقديم طلب استعارة ما لم تكن حالة الحساب `ACTIVE`.
- التدقيق الأكاديمي: يتطلب موافقة يدوية من موظف المعمل للتأكد من هوية الطالب.
