# مخططات التتابع — BorrowHub MVP

## الغرض والمصادر

يوثق هذا الملف تحليل المتطلبات ثم **15 مخطط تتابع مستقل** لحالات الاستخدام الرئيسية. الشرح بالعربية، وأسماء المشاركين والرسائل بالإنجليزية لسهولة مراجعة Mermaid. المخططات نماذج منطقية وليست وصفاً لكود أو واجهات API منفذة.

المصدر الوحيد لقواعد المنتج هو [PRD v1.0.0](../PRD.md)، و[تدفق المستخدم](../user-flow.md)، و[تحليل حالات الاستخدام](use-case.md). روجعت أيضاً [مسارات المهام](../flows/README.md) للتحقق من الاتساق. **لم يُعثر على `docs/ERD.md` أو `docs/database.dbml`**؛ أسماء User وEquipment وLoanRequest تشير إلى كيانات PRD §16، ولا تفترض أسماء جداول أو محرك قاعدة بيانات. تخزين الجلسات وسجل التدقيق والفئات غير محدد في مخطط بيانات فعلي.

عند اختلاف المصادر، يعرض الرسم الجزء المتفق عليه ويسمي نقطة الخلاف. لا تُحوّل هذه الوثيقة الأسئلة المفتوحة إلى قرارات أعمال. تُستخدم [وثائق Mermaid الرسمية](https://mermaid.js.org/syntax/sequenceDiagram.html) للصياغة فقط.

## تحليل المتطلبات وتغطيتها

| المخطط / حالة الاستخدام | الممثل | الطلب والاستجابة الناجحة | التحقق وقواعد الأعمال | القراءة والكتابة / البدائل والفشل | المصدر |
| --- | --- | --- | --- | --- | --- |
| [SD01 — التسجيل](#sd01) / UC01 | الطالب | إرسال البيانات؛ حساب PENDING_APPROVAL | الحقول الستة، بريد جامعي، تفرد البريد والرقم الجامعي، حماية التسجيل وكلمة المرور | قراءة التفرد؛ حفظ User مع hash؛ مدخلات ناقصة أو تكرار أو فشل حفظ | FR-001–002، EC-03، SEC-01، SEC-04 |
| [SD02 — الدخول](#sd02) / UC02 | الطالب أو المسؤول | إرسال البريد وكلمة المرور؛ جلسة وبوابة الدور | تحديد المعدل، فحص hash، الحالة ACTIVE، انتهاء الجلسة | قراءة User؛ بيانات خاطئة أو حساب غير نشط؛ وصول المعلق Q01 | FR-005، NFR-005–006، SEC-01–04 |
| [SD03 — مراجعة الحساب](#sd03) / UC04 | المسؤول | عرض المعلقين ثم تفعيل أو رفض | ADMIN؛ مطابقة يدوية؛ إعادة فحص PENDING_APPROVAL | قراءة User؛ تحديث ACTIVE أو REJECTED؛ تعارض مراجعة أو فشل حفظ | FR-004، US-02، PRD §13.2 |
| [SD04 — الكتالوج والبحث](#sd04) / UC06–07، UC23 | الطالب أو المسؤول | عرض المعدات والتوفر؛ بحث اختياري | صلاحيات العرض؛ لا حجز؛ الطلب يتطلب ACTIVE | قراءة Equipment؛ نتائج فارغة أو فشل قراءة؛ المعلق/رصيد صفر Q01 | FR-011، PRD §14–15 |
| [SD05 — إدارة المعدات](#sd05) / UC08 | المسؤول | إضافة أو تعديل أو أرشفة | ADMIN؛ الكميات أعداد صحيحة غير سالبة؛ قيود تعديل الأرصدة Q08 | قراءة Equipment وأرصدة مرتبطة؛ حفظ التغيير؛ خطأ إدخال أو تعارض أو فشل | FR-006–007، PRD §14، NFR-002 |
| [SD06 — إدارة الفئات](#sd06) / UC09 | المسؤول | عرض وإضافة وتعديل وحذف فئة | ADMIN؛ بيانات الفئة؛ شروط حذف المرتبط Q08 | قراءة/كتابة بيانات الفئات؛ سياسة الحذف غير محسومة | PRD §14، Admin Portal 7 |
| [SD07 — تقديم طلب](#sd07) / UC10، UC23 | الطالب | تقديم طلب؛ PENDING_REVIEW | ACTIVE، كمية 1، أقل من 2 نشطين، مدة ≤10 أيام تقويمية، غرض غير فارغ، توفر | قراءة User وEquipment وLoanRequest؛ حفظ الطلب بلا حجز؛ ERR-AUTH/INV/DUR/LMT | FR-003، FR-011–015، AC-01، DEC-01–02 |
| [SD08 — متابعة الطلبات](#sd08) / UC11 | الطالب | عرض طلباته وحالاتها ومواعيدها | ملكية البيانات؛ لا بيانات طلاب آخرين | قراءة LoanRequest وEquipment؛ قائمة فارغة؛ سبب الرفض ومهلة الاستلام والتأخير | PRD §13.1، §14–15، SEC-03 |
| [SD09 — الإلغاء الذاتي](#sd09) / UC12 | الطالب | إلغاء طلبه؛ CANCELLED | ACTIVE؛ ملكية الطلب؛ PENDING_REVIEW فقط | تحديث شرطي؛ لا تغيير مخزون؛ تعارض مع الموافقة أو ملكية خاطئة | FR-016، AC-07، DEC-03 |
| [SD10 — مراجعة الطلب واتخاذ القرار](#sd10) / UC13–15، UC23–24 | المسؤول | اعتماد وحجز أو رفض مع سبب | ADMIN؛ PENDING_REVIEW؛ سبب إلزامي للرفض؛ توفر لحظة الاعتماد | قراءة الطلب والطالب والمعدة؛ كتابة القرار؛ حجز ذري؛ ERR-ACT-01 أو تعارض أو rollback | FR-008، FR-017، AC-02، EC-01، NFR-008 |
| [SD11 — التسليم](#sd11) / UC16، UC24 | المسؤول؛ الطالب فعلياً | تأكيد التسليم؛ CHECKED_OUT | تحقق هوية يدوي؛ APPROVED؛ صلاحية مهلة الاستلام | reserved −1، borrowed +1؛ حفظ الوقت والمدقق؛ تعارض مع الانتهاء؛ موعد الإرجاع Q02 | FR-008، FR-019–020، AC-03، NFR-008 |
| [SD12 — الإرجاع والفحص والتلف](#sd12) / UC17–18، UC24 | المسؤول؛ الطالب فعلياً | إغلاق الإعارة وتسجيل الحالة | فحص فعلي؛ إعارة مسلمة وغير مغلقة؛ قواعد المتأخر والتلف Q03–05 | borrowed −1؛ available +1 أو damaged +1؛ وقت الإرجاع والتدقيق؛ تكرار أو فشل ذري | FR-009–010، FR-020–022، AC-04–05 |
| [SD13 — انتهاء الحجز](#sd13) / UC21، UC24 | لا ممثل بشري بادئ | تقييم داخلي؛ EXPIRED وتحرير الوحدة | APPROVED وعدم الاستلام بعد مهلة 48 ساعة من start_date | قراءة مرشحين؛ تحديث شرطي ذري؛ تجاهل سجل تغير بالتزامن؛ rollback | FR-018، AC-08، EC-06، DEC-04 |
| [SD14 — كشف التأخير والمتابعة](#sd14) / UC20، UC22 | تقييم داخلي ثم المسؤول | كشف التأخير؛ عرض بيانات التواصل للمتابعة اليدوية | الوقت تجاوز موعد الاستحقاق ولم تُعد المعدة؛ ADMIN لبيانات التواصل | قراءة الإعارات والطالب والمعدات؛ وسم/حالة Q03؛ لا تعديل مخزون؛ قائمة فارغة أو فشل قراءة | FR-023–025، AC-06، SEC-03 |
| [SD15 — لوحة الإدارة](#sd15) / UC19 | المسؤول | عرض مؤشرات المخزون والطلبات والإعارات والتأخير | ADMIN؛ تعريف النشط والمتأخر Q03 | قراءات تجميعية؛ صفر سجلات أو فشل قراءة؛ لا كتابة | PRD §14، Admin Portal 5 |

## المشاركون ومسؤولياتهم

| المشارك | المسؤولية وحدود النموذج |
| --- | --- |
| Student / Admin / User (`actor`) | البشر الذين يبدأون إجراءات الواجهة. User في SD02 وSD04 يعني الطالب أو المسؤول، وليس دوراً جديداً. |
| Web UI (`participant`) | إدخال البيانات، تحقق أولي، إرسال الطلب وعرض النتيجة. صلاحيات الواجهة لا تغني عن تحقق الخادم. |
| BorrowHub Application (`participant`) | الجلسة، RBAC، التحقق من المدخلات والملكية والحالة، تطبيق القواعد، حساب البيانات المعروضة وتنسيق المعاملات. تقسيم منطقي واحد؛ لا افتراض لخدمات مصغرة. |
| Database (`participant`) | حفظ وقراءة الكيانات، التفرد والتحديثات المشروطة والمعاملات الذرية وسجل التدقيق المطلوب. لا افتراض لـSQL أو ORM بعينه. |
| BorrowHub Internal Evaluation (`participant`) | بدء تقييم الانتهاء/التأخير داخل التطبيق. آلية التشغيل وتواتره غير محسومين في المصادر الأساسية؛ ليس ممثلاً خارجياً أو منتج جدولة مؤكداً. |

## قواعد القراءة والتحقق المشتركة

- `->>` طلب، و`-->>` استجابة، والأسهم الذاتية تحقق/معالجة داخلية. الرسائل البشرية بين الطالب والمسؤول في SD11–12 تمثل الحضور الفعلي خارج الويب.
- كل عملية محمية تبدأ بفحص الجلسة والدور على الخادم؛ عمليات الطالب تقيد القراءة/الكتابة بمالك الطلب. لا تُرسل بيانات تواصل الطلاب إلى واجهات الطلاب الآخرين.
- جميع المدخلات تتحقق على الخادم وتُعالج بأمان وفق NFR-007؛ تحقق الواجهة لتحسين تجربة الاستخدام. فحص المعدلات مطلوب للدخول والتسجيل وفق SEC-04.
- `BEGIN / COMMIT / ROLLBACK` حدود منطقية للمعاملة. فحص الحالة والمخزون والتعديل وسجل تدقيق الاعتماد/التسليم/الإرجاع عملية واحدة: لا نجاح قبل COMMIT، ولا تحديث جزئي عند الفشل.
- إعادة فحص الحالة داخل المعاملة/التحديث الشرطي تمنع الإلغاء والموافقة المتزامنين، أو التسليم والانتهاء المتزامنين، أو مضاعفة أثر النقر المكرر. هذه معالجة لسلامة العمليات وليست قاعدة أعمال جديدة.
- في SD07 يجب حماية عدّ الطلبات النشطة وحفظ الطلب من التقديم المتزامن للطالب نفسه؛ لا تكفي قراءة العدد ثم كتابة مستقلة. هذه مسؤولية منطقية، دون فرض وسيلة قفل محددة.
- أخطاء الجلسة والصلاحيات والتعارض والمدخلات تستخدم رسائل وصفية؛ لا تُخترع لها رموز ERR. الرموز الموجودة مأخوذة من PRD §19.
- `ERR-NET-01` يغطي انقطاع الشبكة/فشل الخادم. إذا ضاعت الاستجابة بعد COMMIT فقد تكون العملية نجحت؛ تُحدَّث حالة السجل قبل إعادة المحاولة، ولا يُفترض أن انقطاع الاتصال يعني rollback.
- الحالة والمخزون والتفرد تُفحص في قاعدة البيانات عند الكتابة، حتى لو عرضت الواجهة بيانات قديمة. قوائم العرض لا تحجز معدات.
- لا `par` لأن التوازي غير مطلوب في المسارات المؤكدة. `loop` مخصص فقط لمعالجة مجموعة مرشحين. إشعارات الـMVP هي بيانات وحالات داخل لوحات المنصة، وليست رسائل بريد/SMS أو push.

## التعارضات وحدود التفصيل

تطابق المعرفات Q01–Q14 [سجل الأسئلة الموجود](use-case.md#المتطلبات-الناقصة-والأسئلة-المفتوحة). النقاط المؤثرة مباشرة:

| النقطة | أثرها على نمذجة التتابع |
| --- | --- |
| Q01 — دخول الحساب المعلق وظهور المخزون الصفري | SD02 يوضح دخول ACTIVE المؤكد؛ لا يخترع جلسة للمعلق. SD04 وSD08 يتركان وصول المعلق مفتوحاً وفق §15. عرض المعدات ذات الرصيد صفر أيضاً غير محسوم. |
| Q02 / Q10 — المواعيد | SD07 يطبق سقف 10 أيام من start_date. SD11 يوضح وجوب وجود موعد إرجاع، دون اختيار إعادة حسابه من التسليم. منطقة الوقت وحدود اليوم والاستلام المبكر والاعتماد المتأخر غير محددة؛ لا يُفترض أن كل إعارة مدتها 10 أيام. |
| Q03 — OVERDUE | SD12 وSD14–15 يعرضان التأخير كسلوك مؤكد، ويضعان الحالة الدائمة/الوسم وحصة الطلبين وقبول إرجاع الحالة OVERDUE كقرارات مفتوحة. لا يُحسم هذا الخيار بتغيير enum ضمن هذه المهمة. |
| Q04–05 — التلف | الحسابات المتفق عليها هي borrowed −1 وdamaged +1 دون استعادة available. أثر total_quantity مختلف بين EC-02 وAC-05؛ لا تُفرض معادلة إجمالي. SD12 يعرض RETURNED وفق AC-05 مع ملاحظة اختلاف DAMAGED. ملاحظات التلف اختيارية في FR-022 وإلزامية في التدفق؛ تُترك الإلزامية مفتوحة. |
| Q08 — المخزون والفئات | SD05–06 نماذج جزئية للعمليات المؤكدة. قيود الأرشفة وخفض الأرصدة وحذف فئة مرتبطة غير معروفة؛ لا يقرر الرسم حذفاً متسلسلاً أو تحرير حجوزات. يلزم حسمها قبل تنفيذ هذه الفروع. |
| Q11 — نفاد المخزون عند الاعتماد | SD10 يفشل محاولة الاعتماد بلا تغيير حالة أو مخزون. الانتقال إلى REJECTED يتطلب قرار رفض مستقل وسبباً؛ سياسة فرض الرفض أو الانتظار غير محسومة. |
| تعارضات مسارات المهام التفصيلية | مسار التأخير يذكر بريداً آلياً وcron منتصف الليل، ومسار التلف يذكر تكلفة تلف إلزامية وإحالة صيانة. PRD §9 و§17 يستبعد الرسائل الآلية، ولا يؤكد تكلفة أو سير صيانة؛ لا تُضاف هذه التفاعلات. |

**حالات معروفة لا تتوافر لها خطوات كافية:** UC03 استعادة كلمة المرور وUC05 التعليق اليدوي مذكورتان، لكن وسيلة التحقق، انتقالات الحالة وآثارها غير معرفة (Q06–07). لا يمكن تقديم تتابع تنفيذي لهما دون اختراع قواعد. كذلك لا نمذجة لإنشاء ADMIN أو إلغاء APPROVED يدوياً أو التمديد أو الفقد أو تقارير/تصدير جديد (Q09، Q12–14). UC23–24 سلوكان مشتركان مدمجان في المخططات الأصلية وليسا أهدافاً مستقلة للمستخدم.

<a id="sd01"></a>
## SD01 — إنشاء حساب الطالب

**قبل التنفيذ:** الطالب يقدم نموذج التسجيل. **بعد النجاح:** User بحالة PENDING_APPROVAL؛ لا حق لتقديم إعارة حتى التفعيل. **المراجع:** FR-001–002، EC-03، SEC-01، SEC-04.

```mermaid
sequenceDiagram
    autonumber
    actor Student
    participant UI as Registration UI
    participant App as BorrowHub Application
    participant DB as Database
    Student->>UI: Submit name, university email, student ID, department, phone, password
    UI->>UI: Check required fields and formats
    alt Invalid form
        UI-->>Student: Show field validation errors
    else Form passes client validation
        UI->>App: Register student with supplied fields
        App->>App: Enforce rate limit and validate inputs safely
        alt Rate limited or invalid inputs
            App-->>UI: Registration validation or rate limit error
            UI-->>Student: Show error
        else Valid inputs
            App->>DB: Check unique email and student ID
            DB-->>App: Existing matches or none
            alt Duplicate email or student ID
                App-->>UI: Already registered validation error
                UI-->>Student: Show duplicate field error
            else No existing account
                App->>App: Salt and hash password using bcrypt cost 12
                App->>DB: Insert STUDENT User with hash and PENDING_APPROVAL, enforce uniqueness
                alt Insert succeeds
                    DB-->>App: Saved account ID and status
                    App-->>UI: Registration successful, awaiting approval
                    UI-->>Student: Show pending approval and borrowing restriction
                else Concurrent duplicate insert
                    DB-->>App: Unique constraint conflict, no account inserted
                    App-->>UI: Already registered validation error
                    UI-->>Student: Show duplicate field error
                else Database or server failure
                    DB-->>App: Save failed
                    App-->>UI: ERR-NET-01
                    UI-->>Student: Show failure and retry guidance
                end
            end
        end
    end
```

صيغة البريد الجامعي وسياسة كلمة المرور وأرقام الهاتف غير محددة تفصيلياً؛ لا يفترض الرسم نطاق جامعة أو تعبير تحقق معيناً. كلمة المرور ليست نصاً محفوظاً، رغم عدم إدراج حقل hash في ملخص User في PRD §16.

<a id="sd02"></a>
## SD02 — تسجيل الدخول

**بعد النجاح:** جلسة لحساب ACTIVE وتوجيه حسب الدور. **المراجع:** FR-005، SEC-01–04، NFR-006. الحساب المعلق/المرفوض لا يحصل هنا على جلسة دخول كاملة؛ وصول الصفحات المسموح بها للمعلق يبقى Q01.

```mermaid
sequenceDiagram
    autonumber
    actor User as Student or Admin
    participant UI as Login UI
    participant App as BorrowHub Application
    participant DB as Database
    User->>UI: Enter email and password
    UI->>App: Request login
    App->>App: Validate inputs and enforce login rate limit
    alt Invalid input or rate limited
        App-->>UI: Validation or rate limit error
        UI-->>User: Show error
    else Login attempt permitted
        App->>DB: Read User and password hash by email
        alt Database failure
            DB-->>App: Read failed
            App-->>UI: ERR-NET-01
            UI-->>User: Show failure
        else Lookup completes
            DB-->>App: User record or no match
            App->>App: Verify password against stored hash
            alt No user or invalid password
                App-->>UI: Invalid credentials
                UI-->>User: Show login error
            else Account is not ACTIVE
                App-->>UI: Account pending or rejected, see Q01
                UI-->>User: Show account access restriction
            else ACTIVE account
                App->>App: Establish session with inactivity expiration
                Note over App,DB: Session storage mechanism is unspecified
                App-->>UI: Authenticated session and authorized role
                alt STUDENT role
                    UI-->>User: Open student portal
                else ADMIN role
                    UI-->>User: Open admin dashboard
                end
            end
        end
    end
```

<a id="sd03"></a>
## SD03 — مراجعة حساب الطالب واعتماده أو رفضه

**قبل التنفيذ:** مسؤول مصادق عليه. **بعد النجاح:** ACTIVE أو REJECTED بقرار يدوي. لا يُفرض سبب رفض التسجيل؛ السبب الإلزامي موثق لرفض الإعارة فقط.

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Admin / Staff
    participant UI as User Management UI
    participant App as BorrowHub Application
    participant DB as Database
    Admin->>UI: Open pending registrations
    UI->>App: Request pending User list
    App->>App: Validate session and ADMIN role
    alt Unauthorized
        App-->>UI: Access denied
        UI-->>Admin: Show access error
    else Authorized
        App->>DB: Read Users with PENDING_APPROVAL and verification details
        DB-->>App: Pending registrations
        App-->>UI: Pending registrations
        UI-->>Admin: Display student details or empty list
        opt Admin selects a registration
            Note over Admin: Manually compare identity and university records outside the app
            Admin->>UI: Choose approve or reject
            UI->>App: Submit account decision and User ID
            App->>App: Revalidate ADMIN session and decision
            App->>DB: Update User only if still PENDING_APPROVAL to ACTIVE or REJECTED
            alt Conditional update succeeds
                DB-->>App: Saved account status
                App-->>UI: Decision confirmed
                UI-->>Admin: Refresh registration list
            else Record missing or already reviewed
                DB-->>App: No matching pending record
                App-->>UI: State conflict, refresh record
                UI-->>Admin: Show conflict
            else Save fails
                DB-->>App: No decision saved
                App-->>UI: ERR-NET-01
                UI-->>Admin: Show failure
            end
        end
    end
```

فشل قراءة القائمة يعرض ERR-NET-01 بدلاً من قائمة فارغة. إعادة التحقق عند إرسال القرار شرط لبدء الكتابة؛ عند فشل الصلاحية لا تُنفذ رسالة التحديث.

<a id="sd04"></a>
## SD04 — تصفح الكتالوج والبحث والتصفية

**المراجع:** UC06–07، FR-011، PRD §14–15. يعرض الرسم صلاحية العرض بعد تحققها؛ طريقة وصول الحساب المعلق وعرض عناصر الرصيد صفر تحتاجان Q01. الاستعراض لا يخصص مخزوناً.

```mermaid
sequenceDiagram
    autonumber
    actor User as Student or Admin
    participant UI as Equipment Catalog UI
    participant App as BorrowHub Application
    participant DB as Database
    User->>UI: Open equipment catalog
    opt User searches or filters by category
        User->>UI: Enter search text or select category
    end
    UI->>App: Request catalog with optional search and category
    App->>App: Validate catalog access and query inputs, see Q01
    alt Access denied or invalid filter
        App-->>UI: Access or validation error
        UI-->>User: Show error
    else Catalog access permitted
        App->>DB: Read matching Equipment and available quantities
        alt Read fails
            DB-->>App: Query failure
            App-->>UI: ERR-NET-01
            UI-->>User: Show failure
        else Read succeeds
            DB-->>App: Matching equipment or empty list
            App-->>UI: Catalog and current availability
            alt No matching equipment
                UI-->>User: Show empty search result
            else Matching equipment
                UI-->>User: Show equipment and availability badges
                Note over UI,App: Only ACTIVE students may request, ADMIN cannot borrow
                Note over UI,DB: If zero-stock items are shown, disable request action
            end
        end
    end
```

<a id="sd05"></a>
## SD05 — إضافة المعدات وتعديلها وأرشفتها

**المراجع:** FR-006–007، PRD §14، Q08. المخطط يوضح التفاعل المؤكد؛ قواعد تعديل الكميات والأرشفة مع حجوزات/إعارات قائمة غير مكتملة، ولا يسمح النموذج بتجاوزها بافتراض جديد.

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Admin / Staff
    participant UI as Inventory Management UI
    participant App as BorrowHub Application
    participant DB as Database
    Admin->>UI: Open equipment management
    UI->>App: Request equipment and inventory balances
    App->>App: Validate ADMIN session
    alt Unauthorized
        App-->>UI: Access denied
        UI-->>Admin: Show error
    else Authorized
        App->>DB: Read Equipment and aggregate balances
        DB-->>App: Equipment records
        App-->>UI: Inventory list
        UI-->>Admin: Display equipment
        Admin->>UI: Submit add, edit, quantity adjustment, or archive
        UI->>App: Submit equipment operation and fields
        App->>App: Revalidate ADMIN access and sanitize fields
        App->>App: Check title, category, description and nonnegative integer counts
        alt Invalid fields or access
            App-->>UI: Validation or access error
            UI-->>Admin: Show error
        else Valid operation
            App->>DB: BEGIN and read current balances and linked loans if applicable
            DB-->>App: Current record and dependencies
            Note over App,DB: Q08 must define quantity and archive constraints before implementation
            alt Operation conflicts with defined inventory constraints
                App->>DB: ROLLBACK
                DB-->>App: No changes saved
                App-->>UI: Inventory conflict
                UI-->>Admin: Refresh and review affected records
            else Operation satisfies resolved constraints
                alt Add equipment
                    App->>DB: Insert Equipment with validated initial balances
                else Edit details or adjust quantities
                    App->>DB: Update Equipment using current validated balances
                else Archive equipment
                    App->>DB: Record archive operation, preserve loan references
                end
                alt All writes succeed
                    DB-->>App: Changes ready
                    App->>DB: COMMIT
                    DB-->>App: Committed
                    App-->>UI: Equipment saved or archived
                    UI-->>Admin: Refresh inventory
                else Database failure
                    DB-->>App: Write failed
                    App->>DB: ROLLBACK
                    DB-->>App: No partial change
                    App-->>UI: ERR-NET-01
                    UI-->>Admin: Show failure
                end
            end
        end
    end
```

أسماء حقول الأرشفة، تهيئة الأرصدة ومعادلة total_quantity غير محددة. لا يحوّل الرسم الأرشفة إلى حذف المعدات ولا يحرر الحجز تلقائياً بسبب تعديل الكتالوج. فشل القراءة الأولى يظهر ERR-NET-01.

<a id="sd06"></a>
## SD06 — إدارة فئات المعدات

**المراجع:** PRD §14، UC09، Q08. CRUD للفئات مؤكد؛ الحقول والتفرد وشروط حذف المرتبط غير محددة. فرع الحذف مشروط بحسم السياسة، ولا يعني أن الحذف مسموح لكل فئة.

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Admin / Staff
    participant UI as Category Management UI
    participant App as BorrowHub Application
    participant DB as Database
    Admin->>UI: Open category management
    UI->>App: Request equipment categories
    App->>App: Validate ADMIN session
    alt Unauthorized
        App-->>UI: Access denied
        UI-->>Admin: Show error
    else Authorized
        App->>DB: Read category data
        DB-->>App: Categories or empty list
        App-->>UI: Category list
        UI-->>Admin: Display categories
        Admin->>UI: Submit create, edit, or delete category
        UI->>App: Submit category operation
        App->>App: Revalidate access and validate category inputs
        alt Invalid access or inputs
            App-->>UI: Access or validation error
            UI-->>Admin: Show error
        else Valid operation
            App->>DB: BEGIN and read current category dependencies
            DB-->>App: Current category and linked equipment
            Note over App,DB: Q08 must resolve linked-category deletion policy
            alt Operation is disallowed by resolved category policy
                App->>DB: ROLLBACK
                DB-->>App: No changes
                App-->>UI: Category dependency conflict
                UI-->>Admin: Show conflict
            else Operation is permitted by resolved category policy
                App->>DB: Apply selected category create, edit, or delete
                alt Write succeeds
                    DB-->>App: Change ready
                    App->>DB: COMMIT
                    DB-->>App: Committed
                    App-->>UI: Category operation confirmed
                    UI-->>Admin: Refresh categories
                else Write fails
                    DB-->>App: Failure
                    App->>DB: ROLLBACK
                    DB-->>App: No partial change
                    App-->>UI: ERR-NET-01
                    UI-->>Admin: Show failure
                end
            end
        end
    end
```

فشل قراءة الفئات يعرض ERR-NET-01. لا يُفترض حذف المعدات التابعة أو نقلها تلقائياً إلى فئة أخرى.

<a id="sd07"></a>
## SD07 — تقديم طلب استعارة

**قبل التنفيذ:** طالب مصادق عليه اختار معدة. **بعد النجاح:** PENDING_REVIEW وrequested_at؛ لا تعديل مخزون. **المراجع:** FR-003، FR-011–015، FR-020، AC-01، EC-01 وEC-05 وEC-07.

```mermaid
sequenceDiagram
    autonumber
    actor Student
    participant UI as Loan Request UI
    participant App as BorrowHub Application
    participant DB as Database
    Student->>UI: Enter start date, duration and borrowing purpose
    UI->>UI: Check quantity 1, date range at most 10 calendar days and nonempty purpose
    alt Invalid form
        UI-->>Student: ERR-DUR-01 or field validation error
    else Valid client form
        UI->>App: Submit loan request for selected equipment
        App->>App: Validate session, STUDENT role and all request inputs
        alt Invalid session, role, duration, quantity or purpose
            App-->>UI: Access error, ERR-DUR-01 or field error
            UI-->>Student: Show error
        else Valid request inputs
            App->>DB: BEGIN and serialize active-loan count and insert for this student
            App->>DB: Read User status, active LoanRequest count and Equipment availability
            DB-->>App: Account status, count and current stock
            Note over App,DB: Active set is PENDING_REVIEW, APPROVED, CHECKED_OUT per DEC-01. OVERDUE needs Q03
            alt Student account is not ACTIVE
                App->>DB: ROLLBACK
                DB-->>App: No request saved
                App-->>UI: ERR-AUTH-01
                UI-->>Student: Show account restriction
            else Equipment missing or no available stock
                App->>DB: ROLLBACK
                DB-->>App: No request saved
                App-->>UI: Not found or ERR-INV-01
                UI-->>Student: Show unavailable equipment
            else Active request count is at least 2
                App->>DB: ROLLBACK
                DB-->>App: No request saved
                App-->>UI: ERR-LMT-01
                UI-->>Student: Show concurrent loan limit
            else Eligible request
                App->>DB: Insert LoanRequest with quantity 1, PENDING_REVIEW, dates, purpose and requested_at
                alt Save succeeds
                    DB-->>App: New request ready
                    App->>DB: COMMIT
                    DB-->>App: Committed request ID
                    App-->>UI: Request submitted as PENDING_REVIEW
                    UI-->>Student: Show confirmation and My Borrowings
                else Read or save transaction fails
                    DB-->>App: Transaction failure
                    App->>DB: ROLLBACK
                    DB-->>App: No request committed
                    App-->>UI: ERR-NET-01
                    UI-->>Student: Show failure
                end
            end
        end
    end
```

وجود رصيد عند تقديم الطلب لا يضمن الموافقة لاحقاً. طلبان لآخر وحدة قد يبقيان PENDING_REVIEW وفق EC-01؛ الحجز يحدث فقط في SD10. فشل القراءة داخل المعاملة يوقفها وينفذ rollback؛ لا يصل التنفيذ إلى فروع الأهلية ببيانات مفقودة. الحد الأدنى للمدة والتاريخ الماضي غير محددين (Q10).

<a id="sd08"></a>
## SD08 — متابعة الطلبات والإعارات الشخصية

**المراجع:** UC11، PRD §13.1 و§14–15. النتيجة مقتصرة على بيانات الطالب نفسه، دون إشعارات خارجية أو polling مفترض.

```mermaid
sequenceDiagram
    autonumber
    actor Student
    participant UI as My Borrowings UI
    participant App as BorrowHub Application
    participant DB as Database
    Student->>UI: Open My Borrowings and select a tab
    UI->>App: Request own loans filtered by tab
    App->>App: Validate student access and derive owner from session
    Note over UI,App: Pending-account access remains Q01
    alt Invalid session or access
        App-->>UI: Access denied
        UI-->>Student: Show error
    else Access permitted
        App->>DB: Read own LoanRequest records and equipment names
        alt Read fails
            DB-->>App: Query failure
            App-->>UI: ERR-NET-01
            UI-->>Student: Show failure
        else Read succeeds
            DB-->>App: Own records, statuses, dates and rejection reasons
            App->>App: Prepare pickup deadline and overdue presentation, see Q02 and Q03
            App-->>UI: Own loan summaries or empty list
            alt No matching loans
                UI-->>Student: Show empty tab
            else Matching loans
                UI-->>Student: Show status, due date and history
                opt Loan is REJECTED
                    UI-->>Student: Display rejection reason
                end
                opt Loan is APPROVED
                    UI-->>Student: Display 48-hour pickup deadline from start_date
                end
                opt Loan is overdue and unreturned
                    UI-->>Student: Highlight overdue loan and due date
                end
                opt ACTIVE student owns a PENDING_REVIEW request
                    UI-->>Student: Offer cancellation via SD09
                end
            end
        end
    end
```

<a id="sd09"></a>
## SD09 — إلغاء الطالب لطلبه المعلق

**المراجع:** FR-016، AC-07، DEC-03. لا إلغاء ذاتي لـAPPROVED، ولا تغيير للمخزون.

```mermaid
sequenceDiagram
    autonumber
    actor Student
    participant UI as My Borrowings UI
    participant App as BorrowHub Application
    participant DB as Database
    Student->>UI: Cancel own pending request
    UI->>App: Cancel LoanRequest by ID
    App->>App: Validate ACTIVE STUDENT session
    alt Invalid access
        App-->>UI: Access denied
        UI-->>Student: Show error
    else Authorized student
        App->>DB: Set CANCELLED only where ID, session owner and PENDING_REVIEW match
        alt Conditional update succeeds
            DB-->>App: Saved CANCELLED
            App-->>UI: Cancellation confirmed
            UI-->>Student: Refresh request status
        else Missing request, wrong owner or state changed
            DB-->>App: No eligible row changed
            App-->>UI: Request cannot be cancelled
            UI-->>Student: Show conflict and refresh own list
        else Database failure
            DB-->>App: Update failed
            App-->>UI: ERR-NET-01
            UI-->>Student: Show failure
        end
    end
    Note over App,DB: Inventory unchanged in every cancellation branch
```

<a id="sd10"></a>
## SD10 — مراجعة طلبات القسم واعتماد الطلب أو رفضه

**قبل التنفيذ:** ADMIN؛ الطلب المتوقع PENDING_REVIEW. **بعد النجاح:** APPROVED مع حجز وحدة أو REJECTED مع سبب. **المراجع:** FR-008، FR-017، AC-02، EC-01، NFR-002 وNFR-008، Q11.

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Admin / Staff
    participant UI as Requests and Loans UI
    participant App as BorrowHub Application
    participant DB as Database
    Admin->>UI: Open departmental loans filtered by status
    UI->>App: Request departmental queue and details
    App->>App: Validate ADMIN session and authorized scope
    alt Unauthorized
        App-->>UI: Access denied
        UI-->>Admin: Show error
    else Authorized
        App->>DB: Read scoped LoanRequests, applicant details and equipment
        DB-->>App: Queue and loan details
        App-->>UI: Queue with purpose and requested dates
        UI-->>Admin: Display records or empty queue
        opt Admin selects a pending request
            Admin->>UI: Choose approve or reject with reason
            UI->>App: Submit decision, request ID and optional reason
            App->>App: Revalidate ADMIN session, scope and decision
            alt Invalid access or rejection reason is empty
                App-->>UI: Access or mandatory reason error
                UI-->>Admin: Show error
            else Valid decision input
                App->>DB: BEGIN and read current request with concurrency protection
                DB-->>App: Current state and equipment reference
                alt Request missing, out of scope or no longer PENDING_REVIEW
                    App->>DB: ROLLBACK
                    DB-->>App: No changes
                    App-->>UI: Request state conflict
                    UI-->>Admin: Refresh queue
                else Current pending request
                    alt Admin chooses reject
                        App->>DB: Set REJECTED and persist mandatory rejection reason
                        Note over App,DB: No inventory allocation on rejection
                    else Admin chooses approve
                        App->>DB: Check and reserve one unit only if available_quantity is positive
                        alt Unit reserved successfully
                            DB-->>App: available minus 1, reserved plus 1
                            App->>DB: Set APPROVED, approved_at and approved_by
                            App->>DB: Record approval audit with actor and request
                        else Stock exhausted by another approval
                            DB-->>App: No unit reserved
                            App->>DB: ROLLBACK
                            DB-->>App: Request and stock unchanged
                            App-->>UI: ERR-ACT-01
                            UI-->>Admin: Show insufficient stock
                            Note over Admin,App: Any later rejection is a separate decision with a reason, see Q11
                        end
                    end
                    opt Decision writes are ready and transaction is still open
                        alt All decision and required audit writes succeed
                            DB-->>App: Changes ready
                            App->>DB: COMMIT
                            DB-->>App: Committed status and balances
                            App-->>UI: Decision confirmed
                            UI-->>Admin: Refresh queue and stock
                        else Database or audit write fails
                            DB-->>App: Transaction failure
                            App->>DB: ROLLBACK
                            DB-->>App: No partial decision or stock change
                            App-->>UI: ERR-NET-01
                            UI-->>Admin: Show failure
                        end
                    end
                end
            end
        end
    end
```

يتم الحجز فور الموافقة حتى لو كان start_date مستقبلياً؛ مهلة الاستلام تحسب من start_date لا approved_at. تُعرض النتيجة للطالب عند قراءة SD08، دون إرسال آلي. فشل قراءة القائمة أو الطلب يوقف العملية ويعرض ERR-NET-01؛ فشل أي قراءة داخل معاملة مفتوحة يستلزم rollback.

<a id="sd11"></a>
## SD11 — تأكيد التسليم الفعلي

**المراجع:** FR-008، FR-019–020، AC-03، NFR-008. التسليم والانتهاء يتنافسان على الطلب نفسه، لذلك تُعاد قراءة حالته داخل المعاملة.

```mermaid
sequenceDiagram
    autonumber
    actor Student
    actor Admin as Admin / Staff
    participant UI as Counter Checkout UI
    participant App as BorrowHub Application
    participant DB as Database
    Student->>Admin: Present university ID and reservation at lab counter
    Admin->>UI: Open approved reservation
    UI->>App: Request reservation details
    App->>App: Validate ADMIN session and authorized scope
    alt Initial access denied
        App-->>UI: Access denied
        UI-->>Admin: Show error without reservation details
    else Initial access permitted
    App->>DB: Read LoanRequest and student identity details
    alt Reservation read fails or record is missing
        DB-->>App: Query failure or no record
        App-->>UI: ERR-NET-01 or reservation not found
        UI-->>Admin: Show error
    else Reservation read succeeds
    DB-->>App: Reservation details
    App-->>UI: Current reservation and pickup deadline
    UI-->>Admin: Display reservation
    Note over Admin: Verify physical identity against reservation outside the app
    alt Identity cannot be verified
        Admin-->>Student: Handover not confirmed
        Note over App,DB: No digital checkout and no stock change
    else Identity verified
        Admin->>UI: Confirm handover
        UI->>App: Confirm checkout for request ID
        App->>App: Revalidate ADMIN access
        alt Unauthorized
            App-->>UI: Access denied
            UI-->>Admin: Show error
        else Authorized
            App->>DB: BEGIN and read current request and reservation balance
            DB-->>App: Current state, start_date and reserved_quantity
            alt Not APPROVED, pickup window elapsed or reservation unavailable
                App->>DB: ROLLBACK
                DB-->>App: No checkout changes
                App-->>UI: State or pickup-window conflict
                UI-->>Admin: Show conflict and refresh
            else Eligible approved reservation
                App->>DB: Move one unit from reserved to borrowed
                App->>DB: Set CHECKED_OUT and checked_out_at, retain or calculate due deadline per Q02
                App->>DB: Record checkout audit with Admin and request
                alt All writes succeed
                    DB-->>App: Checkout changes ready
                    App->>DB: COMMIT
                    DB-->>App: Committed checkout
                    App-->>UI: CHECKED_OUT and recorded due deadline
                    UI-->>Admin: Show checkout confirmation
                    Admin-->>Student: Complete physical handover and communicate due date
                else Database or audit failure
                    DB-->>App: Transaction failure
                    App->>DB: ROLLBACK
                    DB-->>App: No partial checkout or inventory movement
                    App-->>UI: ERR-NET-01
                    UI-->>Admin: Show failure
                end
            end
        end
    end
    end
    end
```

فشل صلاحية أو قراءة تفاصيل الحجز يمنع عرضها ويوقف المسار؛ لا تتم كتابة على أساس بيانات غير مقروءة. الموعد يبدأ من start_date في FR-012، بينما AC-03 يبدأ العداد عند التسليم؛ **Q02 يحتاج حسم قبل التنفيذ**. لا يفترض الرسم التسليم المبكر أو اختيار مدة 10 أيام لكل طلب (Q10).

<a id="sd12"></a>
## SD12 — تأكيد الإرجاع السليم أو المتضرر

**المراجع:** FR-009–010، FR-020–022، AC-04–05، NFR-008؛ الأسئلة Q03–05. يُظهر المخطط RETURNED للإغلاق وفق معايير القبول، مع بيان خلاف DAMAGED في النص، ولا يغير enum فعلياً.

```mermaid
sequenceDiagram
    autonumber
    actor Student
    actor Admin as Admin / Staff
    participant UI as Return and Inspection UI
    participant App as BorrowHub Application
    participant DB as Database
    Student->>Admin: Present borrowed equipment for return
    Admin->>UI: Open loan for inspection
    UI->>App: Request current loan details
    App->>App: Validate ADMIN session and scope
    alt Initial access denied
        App-->>UI: Access denied
        UI-->>Admin: Show error without loan details
    else Initial access permitted
    App->>DB: Read LoanRequest and Equipment
    alt Loan read fails or record is missing
        DB-->>App: Query failure or no record
        App-->>UI: ERR-NET-01 or loan not found
        UI-->>Admin: Show error
    else Loan read succeeds
    DB-->>App: Loan and balances
    App-->>UI: Loan details and return eligibility
    UI-->>Admin: Display record
    Note over Admin: Physically inspect equipment and accessories outside the app
    alt Equipment is damaged
        Admin->>UI: Flag damage
        opt Damage notes provided
            Admin->>UI: Enter damage notes, requiredness remains Q05
        end
    else Equipment is healthy
        Admin->>UI: Select healthy return
    end
    Admin->>UI: Confirm return in a single action
    UI->>App: Submit return condition and notes for loan ID
    App->>App: Revalidate ADMIN scope and return inputs
    alt Invalid access or condition inputs
        App-->>UI: Access or validation error
        UI-->>Admin: Show error
    else Valid return input
        App->>DB: BEGIN and read current loan and borrowed balance with concurrency protection
        DB-->>App: Current loan state and inventory
        Note over App,DB: CHECKED_OUT is confirmed eligible. Persisted OVERDUE eligibility requires Q03
        alt Not handed over, already closed, ineligible state or missing borrowed unit
            App->>DB: ROLLBACK
            DB-->>App: No return changes
            App-->>UI: Return state or inventory conflict
            UI-->>Admin: Show conflict and refresh
        else Eligible unreturned loan
            alt Healthy condition
                App->>DB: borrowed minus 1, available plus 1
            else Damaged condition
                App->>DB: borrowed minus 1, damaged plus 1, available unchanged
                App->>DB: Persist damage indication and provided notes
                Note over App,DB: Effect on total_quantity remains Q04, do not assume an inventory equation
            end
            App->>DB: Close loan as RETURNED per AC-04 and AC-05, record return timestamp
            App->>DB: Record return or damage audit with Admin and request
            alt All writes succeed
                DB-->>App: Return changes ready
                App->>DB: COMMIT
                DB-->>App: Committed closure and balances
                App-->>UI: Return confirmed with recorded condition
                UI-->>Admin: Show closure and updated stock
                Admin-->>Student: Confirm receipt of equipment
            else Database or audit failure
                DB-->>App: Transaction failure
                App->>DB: ROLLBACK
                DB-->>App: No partial return or inventory movement
                App-->>UI: ERR-NET-01
                UI-->>Admin: Show failure
            end
        end
    end
    end
    end
```

فشل الصلاحية أو القراءة الأولى يوقف المسار. ختم returned_at في FR-020 يقابله actual_return_date في ملخص البيانات؛ هذه تسمية مفهومية واحدة هنا، ولا تُفترض أعمدة إضافية. لا تُحصّل تكلفة تلف، ولا يبدأ سير صيانة آلي. إغلاق الإعارة يخرجها من الحصة النشطة دون عداد حصة مخزن إضافي.

<a id="sd13"></a>
## SD13 — انتهاء الحجز غير المستلم وتحرير المخزون

**المراجع:** FR-018، AC-08، DEC-04. لا ممثل بشري يبدأ هذا السلوك الداخلي؛ الطالب يرى نتيجته لاحقاً في SD08. الحد الدقيق والمنطقة الزمنية لمهلة 48 ساعة يحتاجان حسم Q02/Q10.

```mermaid
sequenceDiagram
    autonumber
    participant Eval as BorrowHub Internal Evaluation
    participant App as BorrowHub Application
    participant DB as Database
    Note over Eval,App: Internal trigger mechanism and schedule are unspecified
    Eval->>App: Evaluate uncollected reservation expiry
    App->>DB: Read APPROVED candidates past the 48-hour pickup deadline from start_date
    alt Candidate query fails
        DB-->>App: Query failure
        App-->>Eval: Evaluation failed, no expiry changes
    else Query succeeds
        DB-->>App: Candidate reservations or empty list
        loop Each candidate reservation
            App->>DB: BEGIN and reread reservation and balance with concurrency protection
            DB-->>App: Current status, deadline and reserved balance
            alt State changed, not yet expired or already processed
                App->>DB: ROLLBACK
                DB-->>App: No changes
                Note over App,DB: Skip candidate, do not release stock twice
            else Eligible APPROVED no-show
                App->>DB: Set EXPIRED and move one unit from reserved to available atomically
                alt All writes succeed and reserved balance is sufficient
                    DB-->>App: Expiry changes ready
                    App->>DB: COMMIT
                    DB-->>App: Committed EXPIRED and released unit
                else Database failure or balance conflict
                    DB-->>App: Transaction failure
                    App->>DB: ROLLBACK
                    DB-->>App: No partial expiry or release
                    Note over App: Candidate expiry failed, no success claimed
                end
            end
        end
        App-->>Eval: Evaluation completed with committed and failed outcomes
    end
```

إعادة قراءة فاشلة تعامل كفشل المعاملة مع rollback، لا كسجل مستوفٍ للانتهاء. التسليم الذي يسبق هذا التحديث يجعل الطلب غير APPROVED؛ الانتهاء الذي يسبق التسليم يجعل SD11 يرفضه. لا تُحدد هذه الوثيقة سياسة إعادة محاولة أو منصة cron.

<a id="sd14"></a>
## SD14 — كشف التأخير واستعراض المتأخرين وبيانات التواصل

**المراجع:** FR-023–025، AC-06، SEC-03، Q02–03. التقييم والمطالعة حدثان مستقلان في المخطط؛ ليس هناك push تلقائي إلى واجهة المسؤول.

```mermaid
sequenceDiagram
    autonumber
    participant Eval as BorrowHub Internal Evaluation
    actor Admin as Admin / Staff
    actor Student
    participant UI as Overdue Alerts UI
    participant App as BorrowHub Application
    participant DB as Database
    Eval->>App: Evaluate overdue loans
    App->>DB: Read unreturned checked-out loans and recorded due deadlines
    alt Read fails
        DB-->>App: Query failure
        App-->>Eval: Evaluation failed
    else Read succeeds
        DB-->>App: Candidate loans
        loop Each candidate loan
            App->>App: Compare current time with recorded due deadline
            alt Due deadline exceeded and equipment not returned
                Note over App,DB: Q03 must choose derived label or persisted OVERDUE state
                opt Resolved representation requires persistence
                    App->>DB: Conditionally record overdue marker only if still checked out and due
                    alt Write succeeds
                        DB-->>App: Marker recorded or record already changed
                    else Write fails
                        DB-->>App: Marker not recorded
                        Note over App: Record evaluation failure, do not claim saved status
                    end
                end
                Note over App,DB: Derived representation evaluates the due predicate without writing
            else Deadline not exceeded or loan closed
                Note over App: Do not label this loan overdue
            end
        end
        App-->>Eval: Evaluation outcomes, no inventory changes
    end
    Note over Admin,UI: Administrator opens the dashboard independently
    Admin->>UI: Open overdue alerts
    UI->>App: Request overdue loans and student contact details
    App->>App: Validate ADMIN session and authorized scope
    alt Unauthorized
        App-->>UI: Access denied, no contact data returned
        UI-->>Admin: Show error
    else Authorized
        App->>DB: Read current overdue unreturned loans with User and Equipment details
        alt Read fails
            DB-->>App: Query failure
            App-->>UI: ERR-NET-01
            UI-->>Admin: Show failure
        else Read succeeds
            DB-->>App: Loan, equipment, student name, university email and phone
            App->>App: Calculate overdue days using resolved deadline convention, see Q02
            App-->>UI: Overdue list and contact details
            alt No overdue loans
                UI-->>Admin: Show empty overdue list
            else Overdue loans exist
                UI-->>Admin: Show overdue days and student contact details
                opt Admin follows up manually outside BorrowHub
                    Admin->>Student: Contact student manually about overdue equipment
                    Student-->>Admin: Arrange physical return
                    Note over Admin,Student: Return recording continues in SD12
                end
            end
        end
    end
```

FR-025 يمنع الحظر الآلي بسبب التأخير وحده، ولا يلغي حد الطلبين وبقية التحققات في SD07. لا بريد آلي أو غرامة أو تعليق آلي. تمثيل OVERDUE لا يغيّر borrowed_quantity؛ المعدات ما زالت لدى الطالب.

<a id="sd15"></a>
## SD15 — استعراض لوحة الإدارة

**المراجع:** PRD §14، Admin Portal 5، UC19. قراءة مؤشرات مؤكدة فقط؛ لا شاشة تحليلات موسعة أو تصدير أو عرض سجل التدقيق.

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Admin / Staff
    participant UI as Admin Dashboard UI
    participant App as BorrowHub Application
    participant DB as Database
    Admin->>UI: Open admin dashboard
    UI->>App: Request dashboard summary
    App->>App: Validate ADMIN session and authorized scope
    alt Unauthorized
        App-->>UI: Access denied
        UI-->>Admin: Show error
    else Authorized
        App->>DB: Read scoped equipment totals, active loans, pending requests and overdue count
        alt Aggregation fails
            DB-->>App: Query failure
            App-->>UI: ERR-NET-01
            UI-->>Admin: Show dashboard failure
        else Aggregation succeeds
            DB-->>App: Dashboard counts
            Note over App,DB: Active and overdue definitions depend on Q03, total semantics on Q04
            App-->>UI: Total items, active loans, pending requests and overdue count
            UI-->>Admin: Display dashboard including zero counts
            opt Admin opens operational details
                Admin->>UI: Select requests or overdue alerts
                UI-->>Admin: Open SD10 or SD14 view
            end
        end
    end
```

## مراجعة الاتساق والتحقق

- تغطية FR-001–025 تظهر في جدول التحليل، إما كسلوك أو شرط. UC23 وUC24 داخل العمليات التي تحتاجهما. كل رسم مستقل يبدأ بـ`sequenceDiagram` ويمكن نسخه إلى Mermaid.
- لا حجز عند تقديم الطلب أو إلغائه قبل المراجعة؛ الاعتماد يحجز، والتسليم ينقل المحجوز للمستعار، والإرجاع يوجه للمناسب، والانتهاء يعيد المحجوز للمتاح.
- لا استجابة نجاح لعمليات المخزون قبل COMMIT؛ فشل المعاملة لا يترك تحديثاً جزئياً. فشل الاستجابة بعد COMMIT يعالج بقراءة الحالة الحالية قبل إعادة المحاولة.
- سجل التدقيق المطلوب للاعتماد والتسليم والإرجاع/التلف يظهر في المعاملة نفسها. لا يفترض الرسم واجهة إدارة سجل أو مزود تدقيق منفصلاً.
- اجتازت المخططات الخمسة عشر محلل Mermaid **11.17.2**، مع فحص أن جميع مرسلي الرسائل ومستقبليها مشاركون معلنون. أدوات التحقق مؤقتة خارج المشروع؛ لم تُضف تبعيات أو كود تطبيق. لم يُختبر العرض البصري في متصفح أو إضافة IDE.
- قيود الأعمال المفتوحة أعلاه تحتاج قرارات قبل التنفيذ. صحة صياغة Mermaid لا تحسمها، وغياب ERD/DBML يمنع تأكيد أسماء الأعمدة والعلاقات الفيزيائية.
