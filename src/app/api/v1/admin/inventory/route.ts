import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { InventoryService } from "@/services/inventory.service";
import { Role } from "@prisma/client";

/**
 * GET /api/v1/admin/inventory
 * Fetch equipment list and aggregate inventory statistics for administrators
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "UNAUTHORIZED", message: "يجب تسجيل الدخول كمسؤول للوصول إلى هذه البيانات" },
        { status: 401 }
      );
    }

    if (session.role !== Role.ADMIN) {
      return NextResponse.json(
        { error: "FORBIDDEN", message: "هذه الشاشة مخصصة لمشرفي المعمل فقط" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("category_id") || undefined;
    const search = searchParams.get("search") || undefined;
    const isArchivedParam = searchParams.get("is_archived");
    const isArchived = isArchivedParam !== null ? isArchivedParam === "true" : undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "15", 10);

    const [inventoryResult, stats] = await Promise.all([
      InventoryService.listInventory({
        categoryId,
        search,
        isArchived,
        page: isNaN(page) ? 1 : page,
        limit: isNaN(limit) ? 15 : limit,
      }),
      InventoryService.getInventoryStats(),
    ]);

    return NextResponse.json({
      success: true,
      data: inventoryResult.data,
      categories: inventoryResult.categories,
      meta: inventoryResult.meta,
      stats,
    });
  } catch (error: any) {
    console.error("Error fetching admin inventory:", error);
    return NextResponse.json(
      { error: "INVENTORY_FETCH_FAILED", message: error.message || "تعذر جلب بيانات المخزون" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/admin/inventory
 * Create a new equipment item
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "UNAUTHORIZED", message: "يجب تسجيل الدخول كمسؤول للوصول إلى هذه البيانات" },
        { status: 401 }
      );
    }

    if (session.role !== Role.ADMIN) {
      return NextResponse.json(
        { error: "FORBIDDEN", message: "هذه العملية مخصصة لمشرفي المعمل فقط" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      categoryId,
      nameAr,
      nameEn,
      descriptionAr,
      descriptionEn,
      imageUrl,
      totalQuantity,
    } = body;

    const newEquipment = await InventoryService.createEquipment({
      categoryId,
      nameAr,
      nameEn,
      descriptionAr,
      descriptionEn,
      imageUrl,
      totalQuantity: typeof totalQuantity === "string" ? parseInt(totalQuantity, 10) : totalQuantity,
    });

    return NextResponse.json(
      {
        success: true,
        equipment: newEquipment,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating equipment:", error);
    const status = error.message?.includes("INVALID_") || error.message?.includes("CATEGORY_NOT_FOUND") ? 400 : 500;
    return NextResponse.json(
      { error: "EQUIPMENT_CREATE_FAILED", message: error.message || "تعذر إنشاء المعدة" },
      { status }
    );
  }
}
