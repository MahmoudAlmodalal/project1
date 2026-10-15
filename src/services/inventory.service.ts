import prisma from "@/lib/db/prisma";
import { Equipment, Category } from "@prisma/client";

export interface CreateEquipmentInput {
  categoryId: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  imageUrl: string;
  totalQuantity: number;
}

export interface UpdateEquipmentInput {
  categoryId?: string;
  nameAr?: string;
  nameEn?: string;
  descriptionAr?: string;
  descriptionEn?: string;
  imageUrl?: string;
  totalQuantity?: number;
}

export interface InventoryFilterParams {
  categoryId?: string;
  search?: string;
  isArchived?: boolean;
  page?: number;
  limit?: number;
}

export interface InventoryStats {
  totalItems: number;
  totalQuantity: number;
  availableQuantity: number;
  reservedQuantity: number;
  borrowedQuantity: number;
  damagedQuantity: number;
}

export class InventoryService {
  /**
   * Create new equipment item
   */
  static async createEquipment(input: CreateEquipmentInput): Promise<Equipment & { category?: Category }> {
    const { categoryId, nameAr, nameEn, descriptionAr, descriptionEn, imageUrl, totalQuantity } = input;

    if (!nameAr || nameAr.trim().length === 0 || !nameEn || nameEn.trim().length === 0) {
      throw new Error("INVALID_NAME: Both Arabic and English names are mandatory");
    }

    if (!descriptionAr || descriptionAr.trim().length === 0 || !descriptionEn || descriptionEn.trim().length === 0) {
      throw new Error("INVALID_DESCRIPTION: Both Arabic and English descriptions are mandatory");
    }

    if (totalQuantity === undefined || totalQuantity === null || totalQuantity < 0) {
      throw new Error("INVALID_QUANTITY: Total quantity must be a non-negative integer");
    }

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      throw new Error("CATEGORY_NOT_FOUND: Selected category does not exist");
    }

    return await prisma.equipment.create({
      data: {
        categoryId,
        nameAr: nameAr.trim(),
        nameEn: nameEn.trim(),
        descriptionAr: descriptionAr.trim(),
        descriptionEn: descriptionEn.trim(),
        imageUrl: imageUrl?.trim() || "/images/placeholder.jpg",
        totalQuantity,
        availableQuantity: totalQuantity,
        reservedQuantity: 0,
        borrowedQuantity: 0,
        damagedQuantity: 0,
        isArchived: false,
      },
      include: {
        category: true,
      },
    });
  }

  /**
   * Update equipment details and/or adjust stock quantities
   */
  static async updateEquipment(
    id: string,
    input: UpdateEquipmentInput
  ): Promise<Equipment & { category?: Category }> {
    const existing = await prisma.equipment.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error("EQUIPMENT_NOT_FOUND: Equipment item not found");
    }

    const updateData: any = {};

    if (input.nameAr !== undefined) {
      if (!input.nameAr.trim()) throw new Error("INVALID_NAME: Arabic name cannot be empty");
      updateData.nameAr = input.nameAr.trim();
    }

    if (input.nameEn !== undefined) {
      if (!input.nameEn.trim()) throw new Error("INVALID_NAME: English name cannot be empty");
      updateData.nameEn = input.nameEn.trim();
    }

    if (input.descriptionAr !== undefined) {
      if (!input.descriptionAr.trim()) throw new Error("INVALID_DESCRIPTION: Arabic description cannot be empty");
      updateData.descriptionAr = input.descriptionAr.trim();
    }

    if (input.descriptionEn !== undefined) {
      if (!input.descriptionEn.trim()) throw new Error("INVALID_DESCRIPTION: English description cannot be empty");
      updateData.descriptionEn = input.descriptionEn.trim();
    }

    if (input.imageUrl !== undefined) {
      updateData.imageUrl = input.imageUrl.trim() || "/images/placeholder.jpg";
    }

    if (input.categoryId !== undefined) {
      const cat = await prisma.category.findUnique({ where: { id: input.categoryId } });
      if (!cat) throw new Error("CATEGORY_NOT_FOUND: Selected category does not exist");
      updateData.categoryId = input.categoryId;
    }

    // Stock adjustments conservation logic
    if (input.totalQuantity !== undefined) {
      if (input.totalQuantity < 0) {
        throw new Error("INVALID_QUANTITY: Total quantity must be non-negative");
      }

      const committed = existing.reservedQuantity + existing.borrowedQuantity + existing.damagedQuantity;
      if (input.totalQuantity < committed) {
        throw new Error(
          `CANNOT_REDUCE_BELOW_COMMITTED_STOCK: Cannot reduce total quantity below currently committed stock (${committed})`
        );
      }

      const diff = input.totalQuantity - existing.totalQuantity;
      const newAvailable = existing.availableQuantity + diff;

      if (newAvailable < 0) {
        throw new Error("CANNOT_REDUCE_BELOW_COMMITTED_STOCK: Invariant failure, calculated available is negative");
      }

      updateData.totalQuantity = input.totalQuantity;
      updateData.availableQuantity = newAvailable;
    }

    return await prisma.equipment.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
      },
    });
  }

  /**
   * Archive equipment item if no active loans (reserved or borrowed) exist
   */
  static async archiveEquipment(id: string): Promise<Equipment> {
    const existing = await prisma.equipment.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error("EQUIPMENT_NOT_FOUND: Equipment item not found");
    }

    if (existing.reservedQuantity > 0 || existing.borrowedQuantity > 0) {
      throw new Error(
        `ACTIVE_LOANS_EXIST: Cannot archive equipment with active reservations (${existing.reservedQuantity}) or borrowed loans (${existing.borrowedQuantity})`
      );
    }

    return await prisma.equipment.update({
      where: { id },
      data: {
        isArchived: true,
        availableQuantity: 0,
      },
    });
  }

  /**
   * Get equipment inventory list with filters and pagination
   */
  static async listInventory(params: InventoryFilterParams = {}) {
    const { categoryId, search, isArchived, page = 1, limit = 15 } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (isArchived !== undefined) {
      where.isArchived = isArchived;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (search) {
      where.OR = [
        { nameAr: { contains: search, mode: "insensitive" } },
        { nameEn: { contains: search, mode: "insensitive" } },
        { descriptionAr: { contains: search, mode: "insensitive" } },
        { descriptionEn: { contains: search, mode: "insensitive" } },
      ];
    }

    const [total, items, categories] = await Promise.all([
      prisma.equipment.count({ where }),
      prisma.equipment.findMany({
        where,
        include: {
          category: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.category.findMany({
        orderBy: {
          nameAr: "asc",
        },
      }),
    ]);

    return {
      data: items,
      categories,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Get aggregate inventory statistics (KPI cards)
   */
  static async getInventoryStats(): Promise<InventoryStats> {
    const agg = await prisma.equipment.aggregate({
      where: {
        isArchived: false,
      },
      _sum: {
        totalQuantity: true,
        availableQuantity: true,
        reservedQuantity: true,
        borrowedQuantity: true,
        damagedQuantity: true,
      },
      _count: {
        id: true,
      },
    });

    return {
      totalItems: agg._count.id || 0,
      totalQuantity: agg._sum.totalQuantity || 0,
      availableQuantity: agg._sum.availableQuantity || 0,
      reservedQuantity: agg._sum.reservedQuantity || 0,
      borrowedQuantity: agg._sum.borrowedQuantity || 0,
      damagedQuantity: agg._sum.damagedQuantity || 0,
    };
  }
}
