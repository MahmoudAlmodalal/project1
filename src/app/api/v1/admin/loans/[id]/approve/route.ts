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
        { error: "FORBIDDEN", message: "يجب تسجيل الدخول كمسؤول لاعتماد طلبات الاستعارة." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const loan = await LoanService.approveLoanRequest(id, session.id);

    return NextResponse.json({
      success: true,
      loan_id: loan.id,
      status: loan.status,
      approved_at: loan.approvedAt,
      pickup_deadline: loan.pickupDeadline,
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
        { error: "INVALID_STATUS", message: "يمكن فقط اعتماد الطلبات التي في حالة قيد المراجعة." },
        { status: 400 }
      );
    }
    if (message.includes("OUT_OF_STOCK")) {
      return NextResponse.json(
        { error: "OUT_OF_STOCK", message: "الكمية المتاحة من هذه المعدة نفدت ولا يمكن اعتماد الطلب." },
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
      { error: "APPROVAL_FAILED", message: message || "فشل اعتماد الطلب." },
      { status: 500 }
    );
  }
}
