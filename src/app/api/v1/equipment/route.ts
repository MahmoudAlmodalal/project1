import { NextRequest, NextResponse } from "next/server";
import { LoanService } from "@/services/loan.service";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || undefined;
    const search = searchParams.get("search") || undefined;
    const availableOnly = searchParams.get("available_only") === "true";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "12", 10);

    const result = await LoanService.getCatalog({
      category,
      search,
      availableOnly,
      page: isNaN(page) ? 1 : page,
      limit: isNaN(limit) ? 12 : limit,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error fetching equipment catalog:", error);
    return NextResponse.json(
      { error: "CATALOG_FETCH_FAILED", message: "تعذر جلب كتالوج المعدات" },
      { status: 500 }
    );
  }
}
