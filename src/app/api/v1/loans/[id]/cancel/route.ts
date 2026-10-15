import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { LoanService } from "@/services/loan.service";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "UNAUTHORIZED", message: "يجب تسجيل الدخول لإلغاء الطلب" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const updatedLoan = await LoanService.selfCancelRequest(id, session.id);

    return NextResponse.json({
      success: true,
      message: "تم إلغاء طلب الاستعارة بنجاح",
      status: updatedLoan.status,
    });
  } catch (error: any) {
    console.error("Error cancelling loan:", error);
    const message = error.message || "";

    if (message.includes("LOAN_NOT_FOUND")) {
      return NextResponse.json(
        { error: "LOAN_NOT_FOUND", message: "طلب الاستعارة غير موجود أو غير مصرح به." },
        { status: 404 }
      );
    }

    if (message.includes("CANNOT_CANCEL_NON_PENDING")) {
      return NextResponse.json(
        { error: "CANNOT_CANCEL_NON_PENDING", message: "يمكن فقط إلغاء الطلبات التي لا تزال قيد المراجعة." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "CANCEL_FAILED", message: "تعذر إلغاء الطلب في الوقت الحالي." },
      { status: 500 }
    );
  }
}
