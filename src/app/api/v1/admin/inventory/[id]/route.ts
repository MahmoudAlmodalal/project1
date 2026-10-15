import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { InventoryService } from "@/services/inventory.service";
import { Role } from "@prisma/client";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/v1/admin/inventory/[id]
 * Update equipment details and stock levels
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
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

    const { id } = await params;
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

    const updated = await InventoryService.updateEquipment(id, {
      categoryId,
      nameAr,
      nameEn,
      descriptionAr,
      descriptionEn,
      imageUrl,
      totalQuantity: totalQuantity !== undefined ? (typeof totalQuantity === "string" ? parseInt(totalQuantity, 10) : totalQuantity) : undefined,
    });

    return NextResponse.json({
      success: true,
      equipment: updated,
    });
  } catch (error: any) {
    console.error("Error updating equipment:", error);
    const isClientError =
      error.message?.includes("INVALID_") ||
      error.message?.includes("CANNOT_REDUCE") ||
      error.message?.includes("CATEGORY_NOT_FOUND");
    const isNotFound = error.message?.includes("EQUIPMENT_NOT_FOUND");

    const status = isNotFound ? 404 : isClientError ? 400 : 500;
    return NextResponse.json(
      { error: "EQUIPMENT_UPDATE_FAILED", message: error.message || "تعذر تعديل بيانات المعدة" },
      { status }
    );
  }
}

/**
 * DELETE /api/v1/admin/inventory/[id]
 * Archive an equipment item
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    const { id } = await params;
    const archived = await InventoryService.archiveEquipment(id);

    return NextResponse.json({
      success: true,
      equipment: archived,
    });
  } catch (error: any) {
    console.error("Error archiving equipment:", error);
    const isConflict = error.message?.includes("ACTIVE_LOANS_EXIST");
    const isNotFound = error.message?.includes("EQUIPMENT_NOT_FOUND");

    const status = isNotFound ? 404 : isConflict ? 409 : 500;
    return NextResponse.json(
      { error: "EQUIPMENT_ARCHIVE_FAILED", message: error.message || "تعذر أرشفة المعدة" },
      { status }
    );
  }
}
