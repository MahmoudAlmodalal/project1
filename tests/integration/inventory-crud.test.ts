import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET as getInventory, POST as postEquipment } from "@/app/api/v1/admin/inventory/route";
import { PATCH as patchEquipment, DELETE as deleteEquipment } from "@/app/api/v1/admin/inventory/[id]/route";
import * as authSession from "@/lib/auth/session";
import { InventoryService } from "@/services/inventory.service";
import { Role, UserStatus } from "@prisma/client";

vi.mock("@/services/inventory.service", () => ({
  InventoryService: {
    listInventory: vi.fn(),
    getInventoryStats: vi.fn(),
    createEquipment: vi.fn(),
    updateEquipment: vi.fn(),
    archiveEquipment: vi.fn(),
  },
}));

vi.mock("@/lib/auth/session", () => ({
  getSession: vi.fn(),
}));

describe("Phase 8: Integration Tests for Admin Inventory CRUD Endpoints", () => {
  const adminUser = {
    id: "admin-1",
    email: "admin@university.edu.sa",
    fullName: "مدير المعمل",
    role: Role.ADMIN,
    status: UserStatus.ACTIVE,
    department: "IT",
  };

  const studentUser = {
    id: "student-1",
    email: "student@university.edu.sa",
    fullName: "طالب معمل",
    role: Role.STUDENT,
    status: UserStatus.ACTIVE,
    department: "CS",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Authentication and Role Guards", () => {
    it("should reject non-admin users with 403 Forbidden", async () => {
      vi.mocked(authSession.getSession).mockResolvedValueOnce(studentUser);

      const req = new NextRequest("http://localhost:3000/api/v1/admin/inventory");
      const res = await getInventory(req);
      expect(res.status).toBe(403);
    });

    it("should reject unauthenticated requests with 401 Unauthorized", async () => {
      vi.mocked(authSession.getSession).mockResolvedValueOnce(null);

      const req = new NextRequest("http://localhost:3000/api/v1/admin/inventory");
      const res = await getInventory(req);
      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/v1/admin/inventory", () => {
    it("should return inventory items, categories, and aggregate stats for admin", async () => {
      vi.mocked(authSession.getSession).mockResolvedValueOnce(adminUser);

      vi.mocked(InventoryService.listInventory).mockResolvedValueOnce({
        data: [
          {
            id: "eq-1",
            nameAr: "كاميرا سوني",
            nameEn: "Sony Camera",
            totalQuantity: 5,
            availableQuantity: 5,
            reservedQuantity: 0,
            borrowedQuantity: 0,
            damagedQuantity: 0,
            isArchived: false,
          } as any,
        ],
        categories: [{ id: "cat-1", slug: "cameras", nameAr: "كاميرات", nameEn: "Cameras", createdAt: new Date() }],
        meta: { total: 1, page: 1, limit: 15, totalPages: 1 },
      });

      vi.mocked(InventoryService.getInventoryStats).mockResolvedValueOnce({
        totalItems: 1,
        totalQuantity: 5,
        availableQuantity: 5,
        reservedQuantity: 0,
        borrowedQuantity: 0,
        damagedQuantity: 0,
      });

      const req = new NextRequest("http://localhost:3000/api/v1/admin/inventory?search=sony");
      const res = await getInventory(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.length).toBe(1);
      expect(json.stats.totalItems).toBe(1);
      expect(InventoryService.listInventory).toHaveBeenCalledWith({
        categoryId: undefined,
        search: "sony",
        isArchived: undefined,
        page: 1,
        limit: 15,
      });
    });
  });

  describe("POST /api/v1/admin/inventory", () => {
    it("should create new equipment item for admin", async () => {
      vi.mocked(authSession.getSession).mockResolvedValueOnce(adminUser);

      const payload = {
        categoryId: "cat-1",
        nameAr: "كاميرا كانون R5",
        nameEn: "Canon R5 Camera",
        descriptionAr: "كاميرا سينمائية",
        descriptionEn: "Cinema camera",
        imageUrl: "https://example.com/canon.jpg",
        totalQuantity: 4,
      };

      vi.mocked(InventoryService.createEquipment).mockResolvedValueOnce({
        id: "eq-new-1",
        ...payload,
        availableQuantity: 4,
        reservedQuantity: 0,
        borrowedQuantity: 0,
        damagedQuantity: 0,
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const req = new NextRequest("http://localhost:3000/api/v1/admin/inventory", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const res = await postEquipment(req);
      const json = await res.json();

      expect(res.status).toBe(201);
      expect(json.success).toBe(true);
      expect(json.equipment.id).toBe("eq-new-1");
      expect(InventoryService.createEquipment).toHaveBeenCalledWith(payload);
    });
  });

  describe("PATCH /api/v1/admin/inventory/[id]", () => {
    it("should update existing equipment metadata and stock", async () => {
      vi.mocked(authSession.getSession).mockResolvedValueOnce(adminUser);

      const updatePayload = {
        nameAr: "كاميرا كانون المحدثة",
        totalQuantity: 6,
      };

      vi.mocked(InventoryService.updateEquipment).mockResolvedValueOnce({
        id: "eq-1",
        categoryId: "cat-1",
        nameAr: "كاميرا كانون المحدثة",
        nameEn: "Canon R5",
        descriptionAr: "وصف",
        descriptionEn: "Desc",
        imageUrl: "https://example.com/img.jpg",
        totalQuantity: 6,
        availableQuantity: 6,
        reservedQuantity: 0,
        borrowedQuantity: 0,
        damagedQuantity: 0,
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const req = new NextRequest("http://localhost:3000/api/v1/admin/inventory/eq-1", {
        method: "PATCH",
        body: JSON.stringify(updatePayload),
      });

      const res = await patchEquipment(req, { params: Promise.resolve({ id: "eq-1" }) });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.equipment.nameAr).toBe("كاميرا كانون المحدثة");
      expect(InventoryService.updateEquipment).toHaveBeenCalledWith("eq-1", updatePayload);
    });
  });

  describe("DELETE /api/v1/admin/inventory/[id]", () => {
    it("should archive equipment item", async () => {
      vi.mocked(authSession.getSession).mockResolvedValueOnce(adminUser);

      vi.mocked(InventoryService.archiveEquipment).mockResolvedValueOnce({
        id: "eq-1",
        categoryId: "cat-1",
        nameAr: "كاميرا قديمة",
        nameEn: "Old Camera",
        descriptionAr: "وصف",
        descriptionEn: "Desc",
        imageUrl: "https://example.com/img.jpg",
        totalQuantity: 2,
        availableQuantity: 0,
        reservedQuantity: 0,
        borrowedQuantity: 0,
        damagedQuantity: 0,
        isArchived: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const req = new NextRequest("http://localhost:3000/api/v1/admin/inventory/eq-1", {
        method: "DELETE",
      });

      const res = await deleteEquipment(req, { params: Promise.resolve({ id: "eq-1" }) });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.equipment.isArchived).toBe(true);
      expect(InventoryService.archiveEquipment).toHaveBeenCalledWith("eq-1");
    });
  });
});
