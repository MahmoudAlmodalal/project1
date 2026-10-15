import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { AccountService } from "@/services/account.service";
import { Role } from "@prisma/client";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== Role.ADMIN) {
      return NextResponse.json(
        { error: "FORBIDDEN", message: "Administrator access required" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { reason } = body;

    const user = await AccountService.rejectStudent(id, reason);

    return NextResponse.json({
      success: true,
      message: "تم رفض تسجيل حساب الطالب وإرسال سبب الرفض",
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        status: user.status,
        rejectionReason: user.rejectionReason,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "REJECT_FAILED", message: error.message },
      { status: 400 }
    );
  }
}
