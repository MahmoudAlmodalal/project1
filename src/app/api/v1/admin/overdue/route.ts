import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { LoanService } from "@/services/loan.service";
import { Role } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "UNAUTHORIZED", message: "يجب تسجيل الدخول للوصول إلى لوحة المتأخرات" },
        { status: 401 }
      );
    }

    if (session.role !== Role.ADMIN) {
      return NextResponse.json(
        { error: "FORBIDDEN", message: "هذه الشاشة مخصصة لمسؤولي المعمل فقط" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    // Sync overdue loans first to ensure up-to-date statuses
    await LoanService.syncOverdueLoans();

    // Query overdue loans
    const result = await LoanService.getOverdueLoans({
      search,
      page,
      limit,
    });

    const loanList = result.loans || (result as any).data || [];

    const formattedData = loanList.map((loan: any) => ({
      loan_id: loan.id || loan.loan_id,
      duration_days: loan.durationDays || loan.duration_days,
      student: {
        id: loan.user?.id || loan.student?.id,
        full_name: loan.user?.fullName || loan.student?.full_name,
        student_id: loan.user?.studentId || loan.student?.student_id,
        department: loan.user?.department || loan.student?.department,
        phone: loan.user?.phone || loan.student?.phone,
        email: loan.user?.email || loan.student?.email,
      },
      equipment: {
        id: loan.equipment?.id,
        name_ar: loan.equipment?.nameAr || loan.equipment?.name_ar,
        name_en: loan.equipment?.nameEn || loan.equipment?.name_en,
        image_url: loan.equipment?.imageUrl || loan.equipment?.image_url,
        category: loan.equipment?.category
          ? {
              name_ar: loan.equipment.category.nameAr || loan.equipment.category.name_ar,
              name_en: loan.equipment.category.nameEn || loan.equipment.category.name_en,
            }
          : undefined,
      },
      checked_out_at: loan.checkedOutAt instanceof Date
        ? loan.checkedOutAt.toISOString()
        : loan.checkedOutAt || loan.checked_out_at || null,
      expected_return_date: loan.expectedReturnDate instanceof Date
        ? loan.expectedReturnDate.toISOString()
        : loan.expectedReturnDate || loan.expected_return_date || null,
      days_overdue: loan.daysOverdue ?? loan.days_overdue ?? 0,
    }));

    return NextResponse.json({
      count: formattedData.length,
      data: formattedData,
      meta: result.meta,
    });
  } catch (error: any) {
    console.error("Error fetching overdue loans:", error);
    return NextResponse.json(
      { error: "OVERDUE_FETCH_FAILED", message: "حدث خطأ أثناء جلب قائمة الأجهزة المتأخرة" },
      { status: 500 }
    );
  }
}
