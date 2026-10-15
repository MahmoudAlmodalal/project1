import { NextRequest, NextResponse } from "next/server";
import { LoanService } from "@/services/loan.service";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const item = await LoanService.getEquipmentById(id);

    if (!item) {
      return NextResponse.json(
        { error: "NOT_FOUND", message: "المعدة غير موجودة أو تم أرشفتها" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: item });
  } catch (error: any) {
    console.error("Error fetching equipment item:", error);
    return NextResponse.json(
      { error: "EQUIPMENT_FETCH_FAILED", message: "حدث خطأ أثناء جلب تفاصيل المعدة" },
      { status: 500 }
    );
  }
}
