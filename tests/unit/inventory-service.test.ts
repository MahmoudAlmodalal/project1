import { describe, it, expect, vi, beforeEach } from "vitest";
import { InventoryService } from "@/services/inventory.service";
import prisma from "@/lib/db/prisma";

vi.mock("@/lib/db/prisma", () => ({
  default: {
    category: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    equipment: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn(),
    },
  },
}));

describe("Phase 8: InventoryService Unit Tests (US6)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createEquipment", () => {
    it("should successfully create equipment when data and non-negative quantity are valid", async () => {
      vi.mocked(prisma.category.findUnique).mockResolvedValueOnce({
        id: "cat-1",
        nameAr: "كاميرات",
        nameEn: "Cameras",
        slug: "cameras",
        createdAt: new Date(),
      });

      vi.mocked(prisma.equipment.create).mockResolvedValueOnce({
        id: "eq-new-1",
        categoryId: "cat-1",
        nameAr: "كاميرا نيكون Z6",
        nameEn: "Nikon Z6 Camera",
        descriptionAr: "كاميرا احترافية للتصوير السنوي",
        descriptionEn: "Professional camera for annual projects",
        imageUrl: "https://images.unsplash.com/photo-1",
        totalQuantity: 5,
        availableQuantity: 5,
        reservedQuantity: 0,
        borrowedQuantity: 0,
        damagedQuantity: 0,
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await InventoryService.createEquipment({
        categoryId: "cat-1",
        nameAr: "كاميرا نيكون Z6",
        nameEn: "Nikon Z6 Camera",
        descriptionAr: "كاميرا احترافية للتصوير السنوي",
        descriptionEn: "Professional camera for annual projects",
        imageUrl: "https://images.unsplash.com/photo-1",
        totalQuantity: 5,
      });

      expect(result.id).toBe("eq-new-1");
      expect(result.availableQuantity).toBe(5);
      expect(prisma.equipment.create).toHaveBeenCalledWith({
        data: {
          categoryId: "cat-1",
          nameAr: "كاميرا نيكون Z6",
          nameEn: "Nikon Z6 Camera",
          descriptionAr: "كاميرا احترافية للتصوير السنوي",
          descriptionEn: "Professional camera for annual projects",
          imageUrl: "https://images.unsplash.com/photo-1",
          totalQuantity: 5,
          availableQuantity: 5,
          reservedQuantity: 0,
          borrowedQuantity: 0,
          damagedQuantity: 0,
          isArchived: false,
        },
        include: {
          category: true,
        },
      });
    });

    it("should reject creation if categoryId is invalid or not found", async () => {
      vi.mocked(prisma.category.findUnique).mockResolvedValueOnce(null);

      await expect(
        InventoryService.createEquipment({
          categoryId: "non-existent-cat",
          nameAr: "كاميرا",
          nameEn: "Camera",
          descriptionAr: "وصف",
          descriptionEn: "Description",
          imageUrl: "https://example.com/img.jpg",
          totalQuantity: 3,
        })
      ).rejects.toThrow("CATEGORY_NOT_FOUND");
    });

    it("should reject creation if totalQuantity is negative", async () => {
      vi.mocked(prisma.category.findUnique).mockResolvedValueOnce({
        id: "cat-1",
        nameAr: "كاميرات",
        nameEn: "Cameras",
        slug: "cameras",
        createdAt: new Date(),
      });

      await expect(
        InventoryService.createEquipment({
          categoryId: "cat-1",
          nameAr: "كاميرا",
          nameEn: "Camera",
          descriptionAr: "وصف",
          descriptionEn: "Description",
          imageUrl: "https://example.com/img.jpg",
          totalQuantity: -1,
        })
      ).rejects.toThrow("INVALID_QUANTITY");
    });

    it("should reject creation if names or descriptions are empty", async () => {
      await expect(
        InventoryService.createEquipment({
          categoryId: "cat-1",
          nameAr: "   ",
          nameEn: "Camera",
          descriptionAr: "وصف",
          descriptionEn: "Description",
          imageUrl: "https://example.com/img.jpg",
          totalQuantity: 2,
        })
      ).rejects.toThrow("INVALID_NAME");

      await expect(
        InventoryService.createEquipment({
          categoryId: "cat-1",
          nameAr: "كاميرا",
          nameEn: "   ",
          descriptionAr: "وصف",
          descriptionEn: "Description",
          imageUrl: "https://example.com/img.jpg",
          totalQuantity: 2,
        })
      ).rejects.toThrow("INVALID_NAME");
    });
  });

  describe("updateEquipment", () => {
    const existingEquip = {
      id: "eq-1",
      categoryId: "cat-1",
      nameAr: "كاميرا سوني",
      nameEn: "Sony Camera",
      descriptionAr: "وصف قديم",
      descriptionEn: "Old description",
      imageUrl: "https://example.com/old.jpg",
      totalQuantity: 10,
      availableQuantity: 5,
      reservedQuantity: 2,
      borrowedQuantity: 2,
      damagedQuantity: 1,
      isArchived: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it("should reject update if equipment does not exist", async () => {
      vi.mocked(prisma.equipment.findUnique).mockResolvedValueOnce(null);

      await expect(
        InventoryService.updateEquipment("eq-unknown", {
          nameAr: "اسم جديد",
        })
      ).rejects.toThrow("EQUIPMENT_NOT_FOUND");
    });

    it("should update metadata fields without altering stock counts if totalQuantity not provided", async () => {
      vi.mocked(prisma.equipment.findUnique).mockResolvedValueOnce(existingEquip);
      vi.mocked(prisma.equipment.update).mockResolvedValueOnce({
        ...existingEquip,
        nameAr: "كاميرا سوني الفا المحدثة",
      });

      const result = await InventoryService.updateEquipment("eq-1", {
        nameAr: "كاميرا سوني الفا المحدثة",
      });

      expect(prisma.equipment.update).toHaveBeenCalledWith({
        where: { id: "eq-1" },
        data: {
          nameAr: "كاميرا سوني الفا المحدثة",
        },
        include: {
          category: true,
        },
      });
      expect(result.nameAr).toBe("كاميرا سوني الفا المحدثة");
    });

    it("should adjust availableQuantity proportionally when totalQuantity increases", async () => {
      // Current: total=10, avail=5, res=2, bor=2, dam=1 (5+2+2+1 = 10)
      // New total: 14 -> delta = +4 -> new avail = 5 + 4 = 9 (9+2+2+1 = 14)
      vi.mocked(prisma.equipment.findUnique).mockResolvedValueOnce(existingEquip);
      vi.mocked(prisma.equipment.update).mockResolvedValueOnce({
        ...existingEquip,
        totalQuantity: 14,
        availableQuantity: 9,
      });

      const result = await InventoryService.updateEquipment("eq-1", {
        totalQuantity: 14,
      });

      expect(prisma.equipment.update).toHaveBeenCalledWith({
        where: { id: "eq-1" },
        data: {
          totalQuantity: 14,
          availableQuantity: 9,
        },
        include: {
          category: true,
        },
      });
      expect(result.availableQuantity).toBe(9);
    });

    it("should adjust availableQuantity when totalQuantity decreases within available stock bounds", async () => {
      // Current: total=10, avail=5, res=2, bor=2, dam=1
      // New total: 8 -> delta = -2 -> new avail = 5 - 2 = 3 >= 0
      vi.mocked(prisma.equipment.findUnique).mockResolvedValueOnce(existingEquip);
      vi.mocked(prisma.equipment.update).mockResolvedValueOnce({
        ...existingEquip,
        totalQuantity: 8,
        availableQuantity: 3,
      });

      await InventoryService.updateEquipment("eq-1", {
        totalQuantity: 8,
      });

      expect(prisma.equipment.update).toHaveBeenCalledWith({
        where: { id: "eq-1" },
        data: {
          totalQuantity: 8,
          availableQuantity: 3,
        },
        include: {
          category: true,
        },
      });
    });

    it("should reject totalQuantity reduction that drops below non-available active commitments (reserved + borrowed + damaged)", async () => {
      // Current: res=2, bor=2, dam=1 -> committed = 5
      // Attempting totalQuantity = 4 (less than 5) must be rejected
      vi.mocked(prisma.equipment.findUnique).mockResolvedValueOnce(existingEquip);

      await expect(
        InventoryService.updateEquipment("eq-1", {
          totalQuantity: 4,
        })
      ).rejects.toThrow("CANNOT_REDUCE_BELOW_COMMITTED_STOCK");
    });
  });

  describe("archiveEquipment", () => {
    it("should archive equipment if there are no active loans in reserved or borrowed states", async () => {
      vi.mocked(prisma.equipment.findUnique).mockResolvedValueOnce({
        id: "eq-1",
        categoryId: "cat-1",
        nameAr: "كاميرا",
        nameEn: "Camera",
        descriptionAr: "وصف",
        descriptionEn: "Desc",
        imageUrl: "http://example.com/img.jpg",
        totalQuantity: 5,
        availableQuantity: 5,
        reservedQuantity: 0,
        borrowedQuantity: 0,
        damagedQuantity: 0,
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(prisma.equipment.update).mockResolvedValueOnce({
        id: "eq-1",
        categoryId: "cat-1",
        nameAr: "كاميرا",
        nameEn: "Camera",
        descriptionAr: "وصف",
        descriptionEn: "Desc",
        imageUrl: "http://example.com/img.jpg",
        totalQuantity: 5,
        availableQuantity: 0,
        reservedQuantity: 0,
        borrowedQuantity: 0,
        damagedQuantity: 0,
        isArchived: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await InventoryService.archiveEquipment("eq-1");
      expect(result.isArchived).toBe(true);
      expect(prisma.equipment.update).toHaveBeenCalledWith({
        where: { id: "eq-1" },
        data: {
          isArchived: true,
          availableQuantity: 0,
        },
      });
    });

    it("should reject archiving if equipment has active reserved or borrowed units", async () => {
      vi.mocked(prisma.equipment.findUnique).mockResolvedValueOnce({
        id: "eq-1",
        categoryId: "cat-1",
        nameAr: "كاميرا",
        nameEn: "Camera",
        descriptionAr: "وصف",
        descriptionEn: "Desc",
        imageUrl: "http://example.com/img.jpg",
        totalQuantity: 5,
        availableQuantity: 3,
        reservedQuantity: 1,
        borrowedQuantity: 1,
        damagedQuantity: 0,
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(InventoryService.archiveEquipment("eq-1")).rejects.toThrow(
        "ACTIVE_LOANS_EXIST"
      );
    });
  });

  describe("getInventoryStats & listEquipment", () => {
    it("should compute aggregate metrics correctly across items", async () => {
      vi.mocked(prisma.equipment.aggregate).mockResolvedValueOnce({
        _sum: {
          totalQuantity: 50,
          availableQuantity: 30,
          reservedQuantity: 5,
          borrowedQuantity: 12,
          damagedQuantity: 3,
        },
        _count: {
          id: 15,
        },
      } as any);

      const stats = await InventoryService.getInventoryStats();
      expect(stats.totalItems).toBe(15);
      expect(stats.totalQuantity).toBe(50);
      expect(stats.availableQuantity).toBe(30);
      expect(stats.reservedQuantity).toBe(5);
      expect(stats.borrowedQuantity).toBe(12);
      expect(stats.damagedQuantity).toBe(3);
    });
  });
});
