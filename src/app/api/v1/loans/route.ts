import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { LoanService } from "@/services/loan.service";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "UNAUTHORIZED", message: "يجب تسجيل الدخول لعرض الطلبات" },
        { status: 401 }
      );
    }

    const loans = await LoanService.getStudentLoans(session.id);
    return NextResponse.json({ data: loans });
  } catch (error: any) {
    console.error("Error fetching user loans:", error);
    return NextResponse.json(
      { error: "LOANS_FETCH_FAILED", message: "حدث خطأ أثناء جلب قائمة الطلبات" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "UNAUTHORIZED", message: "يجب تسجيل الدخول لتقديم طلب استعارة" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { equipment_id, equipmentId, duration_days, durationDays, academic_justification, academicJustification } = body;

    const targetEquipmentId = equipment_id || equipmentId;
    const targetDuration = Number(duration_days ?? durationDays);
    const targetJustification = academic_justification || academicJustification;

    if (!targetEquipmentId) {
      return NextResponse.json(
        { error: "EQUIPMENT_REQUIRED", message: "معرّف المعدة مطلوب" },
        { status: 400 }
      );
    }

    const loan = await LoanService.createBookingRequest({
      userId: session.id,
      equipmentId: targetEquipmentId,
      durationDays: targetDuration,
      academicJustification: targetJustification,
    });

    return NextResponse.json(
      {
        success: true,
        message: "تم تقديم طلب الاستعارة بنجاح",
        loan: {
          id: loan.id,
          equipment_id: loan.equipmentId,
          duration_days: loan.durationDays,
          academic_justification: loan.academicJustification,
          status: loan.status,
          requested_at: loan.requestedAt,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating loan booking:", error);
    const message = error.message || "";

    if (message.includes("DURATION_INVALID")) {
      return NextResponse.json(
        { error: "DURATION_INVALID", message: "مدة الاستعارة يجب أن تكون بين يوم واحد و 10 أيام." },
        { status: 400 }
      );
    }
    if (message.includes("JUSTIFICATION_REQUIRED")) {
      return NextResponse.json(
        { error: "JUSTIFICATION_REQUIRED", message: "يرجى كتابة المبرر الأكاديمي للاستعارة." },
        { status: 400 }
      );
    }
    if (message.includes("STUDENT_NOT_ACTIVE")) {
      return NextResponse.json(
        { error: "STUDENT_NOT_ACTIVE", message: "حسابك غير مفعل بعد أو بانتظار اعتماد الإدارة." },
        { status: 403 }
      );
    }
    if (message.includes("STUDENT_OVERDUE_BLOCKED")) {
      return NextResponse.json(
        { error: "STUDENT_OVERDUE_BLOCKED", message: "حسابك مقيد مؤقتاً بسبب وجود أجهزة متأخرة لم يتم إرجاعها." },
        { status: 403 }
      );
    }
    if (message.includes("QUOTA_EXCEEDED")) {
      return NextResponse.json(
        { error: "QUOTA_EXCEEDED", message: "لا يمكنك حجز أكثر من جهازين في نفس الوقت." },
        { status: 403 }
      );
    }
    if (message.includes("OUT_OF_STOCK")) {
      return NextResponse.json(
        { error: "OUT_OF_STOCK", message: "عذراً، هذا الجهاز غير متاح حالياً للحجز." },
        { status: 400 }
      );
    }
    if (message.includes("EQUIPMENT_NOT_FOUND")) {
      return NextResponse.json(
        { error: "EQUIPMENT_NOT_FOUND", message: "المعدة غير موجودة أو تم أرشفتها." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "LOAN_CREATION_FAILED", message: "تعذر إتمام طلب الاستعارة، يرجى المحاولة لاحقاً." },
      { status: 500 }
    );
  }
}
