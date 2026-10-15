import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { LoanService } from "@/services/loan.service";
import { Role } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== Role.ADMIN) {
      return NextResponse.json(
        { error: "FORBIDDEN", message: "يجب تسجيل الدخول كمسؤول لعرض طابور المراجعة." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const result = await LoanService.getPendingReviewQueue({
      search,
      page,
      limit,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: "QUEUE_FETCH_FAILED", message: error.message || "فشل جلب طابور المراجعة." },
      { status: 500 }
    );
  }
}
