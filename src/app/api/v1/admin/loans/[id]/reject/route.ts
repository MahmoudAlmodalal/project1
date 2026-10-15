import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { LoanService } from "@/services/loan.service";
import { Role } from "@prisma/client";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== Role.ADMIN) {
      return NextResponse.json(
        { error: "FORBIDDEN", message: "يجب تسجيل الدخول كمسؤول لرفض طلبات الاستعارة." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const reason = body.reason || body.rejection_reason || body.rejectionReason;

    if (!reason || String(reason).trim().length === 0) {
      return NextResponse.json(
        { error: "REJECTION_REASON_REQUIRED", message: "سبب الرفض إلزامي." },
        { status: 400 }
      );
    }

    const loan = await LoanService.rejectLoanRequest(id, String(reason));

    return NextResponse.json({
      success: true,
      status: loan.status,
      rejection_reason: loan.rejectionReason,
    });
  } catch (error: any) {
    const message = error.message || "";
    if (message.includes("LOAN_NOT_FOUND")) {
      return NextResponse.json(
        { error: "LOAN_NOT_FOUND", message: "طلب الاستعارة غير موجود." },
        { status: 404 }
      );
    }
    if (message.includes("INVALID_STATUS")) {
      return NextResponse.json(
        { error: "INVALID_STATUS", message: "يمكن فقط رفض الطلبات التي في حالة قيد المراجعة." },
        { status: 400 }
      );
    }
    if (message.includes("REJECTION_REASON_REQUIRED")) {
      return NextResponse.json(
        { error: "REJECTION_REASON_REQUIRED", message: "سبب الرفض إلزامي." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "REJECTION_FAILED", message: message || "فشل رفض الطلب." },
      { status: 500 }
    );
  }
}
