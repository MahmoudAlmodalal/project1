import { describe, it, expect, vi, beforeEach } from "vitest";
import { CounterService } from "@/services/counter.service";
import prisma from "@/lib/db/prisma";
import { LoanStatus, DamageSeverity } from "@prisma/client";

vi.mock("@/lib/db/prisma", () => ({
  default: {
    $transaction: vi.fn(),
    loan: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
    },
    equipment: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    damageRecord: {
      create: vi.fn(),
    },
  },
}));

describe("Phase 5: User Story 3 Unit Tests - Counter Service Operations (T030)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("checkoutHandover", () => {
    it("should throw error if loan is not found", async () => {
      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        const txMock = {
          loan: { findUnique: vi.fn().mockResolvedValue(null) },
          equipment: { findUnique: vi.fn(), update: vi.fn() },
        };
        return await callback(txMock);
      });

      await expect(
        CounterService.checkoutHandover("invalid-loan", "admin-1")
      ).rejects.toThrow("LOAN_NOT_FOUND");
    });

    it("should throw error if loan status is not APPROVED", async () => {
      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        const txMock = {
          loan: {
            findUnique: vi.fn().mockResolvedValue({
              id: "loan-1",
              status: LoanStatus.PENDING_REVIEW,
              equipmentId: "equip-1",
            }),
          },
          equipment: { findUnique: vi.fn(), update: vi.fn() },
        };
        return await callback(txMock);
      });

      await expect(
        CounterService.checkoutHandover("loan-1", "admin-1")
      ).rejects.toThrow("INVALID_STATUS");
    });

    it("should throw error if equipment has reservedQuantity < 1", async () => {
      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        const txMock = {
          loan: {
            findUnique: vi.fn().mockResolvedValue({
              id: "loan-1",
              status: LoanStatus.APPROVED,
              equipmentId: "equip-1",
            }),
          },
          equipment: {
            findUnique: vi.fn().mockResolvedValue({
              id: "equip-1",
              reservedQuantity: 0,
            }),
            update: vi.fn(),
          },
        };
        return await callback(txMock);
      });

      await expect(
        CounterService.checkoutHandover("loan-1", "admin-1")
      ).rejects.toThrow("STOCK_INCONSISTENCY");
    });

    it("should atomically shift stock from reserved to borrowed and set CHECKED_OUT status", async () => {
      const mockEquipmentUpdate = vi.fn().mockResolvedValue({
        id: "equip-1",
        reservedQuantity: 0,
        borrowedQuantity: 1,
      });

      const mockLoanUpdate = vi.fn().mockImplementation(({ data }) => ({
        id: "loan-1",
        status: data.status,
        checkedOutAt: data.checkedOutAt,
        checkedOutById: data.checkedOutById,
        expectedReturnDate: data.expectedReturnDate,
      }));

      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        const txMock = {
          loan: {
            findUnique: vi.fn().mockResolvedValue({
              id: "loan-1",
              status: LoanStatus.APPROVED,
              equipmentId: "equip-1",
              durationDays: 5,
            }),
            update: mockLoanUpdate,
          },
          equipment: {
            findUnique: vi.fn().mockResolvedValue({
              id: "equip-1",
              reservedQuantity: 1,
              borrowedQuantity: 0,
            }),
            update: mockEquipmentUpdate,
          },
        };
        return await callback(txMock);
      });

      const result = await CounterService.checkoutHandover("loan-1", "admin-1");

      expect(result.status).toBe(LoanStatus.CHECKED_OUT);
      expect(result.checkedOutById).toBe("admin-1");
      expect(mockEquipmentUpdate).toHaveBeenCalledWith({
        where: { id: "equip-1" },
        data: {
          reservedQuantity: { decrement: 1 },
          borrowedQuantity: { increment: 1 },
        },
      });
      expect(mockLoanUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "loan-1" },
          data: expect.objectContaining({
            status: LoanStatus.CHECKED_OUT,
            checkedOutById: "admin-1",
          }),
        })
      );
    });
  });

  describe("returnHealthy", () => {
    it("should throw error if loan is not found or not in CHECKED_OUT or OVERDUE status", async () => {
      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        const txMock = {
          loan: {
            findUnique: vi.fn().mockResolvedValue({
              id: "loan-1",
              status: LoanStatus.APPROVED,
            }),
          },
          equipment: { findUnique: vi.fn(), update: vi.fn() },
        };
        return await callback(txMock);
      });

      await expect(
        CounterService.returnHealthy("loan-1", "admin-1")
      ).rejects.toThrow("INVALID_STATUS");
    });

    it("should throw error if equipment has borrowedQuantity < 1", async () => {
      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        const txMock = {
          loan: {
            findUnique: vi.fn().mockResolvedValue({
              id: "loan-1",
              status: LoanStatus.CHECKED_OUT,
              equipmentId: "equip-1",
            }),
          },
          equipment: {
            findUnique: vi.fn().mockResolvedValue({
              id: "equip-1",
              borrowedQuantity: 0,
            }),
            update: vi.fn(),
          },
        };
        return await callback(txMock);
      });

      await expect(
        CounterService.returnHealthy("loan-1", "admin-1")
      ).rejects.toThrow("STOCK_INCONSISTENCY");
    });

    it("should atomically return item to availableQuantity and set status to RETURNED", async () => {
      const mockEquipmentUpdate = vi.fn().mockResolvedValue({
        id: "equip-1",
        borrowedQuantity: 0,
        availableQuantity: 3,
      });

      const mockLoanUpdate = vi.fn().mockImplementation(({ data }) => ({
        id: "loan-1",
        status: data.status,
        returnedAt: data.returnedAt,
        returnedById: data.returnedById,
      }));

      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        const txMock = {
          loan: {
            findUnique: vi.fn().mockResolvedValue({
              id: "loan-1",
              status: LoanStatus.CHECKED_OUT,
              equipmentId: "equip-1",
            }),
            update: mockLoanUpdate,
          },
          equipment: {
            findUnique: vi.fn().mockResolvedValue({
              id: "equip-1",
              borrowedQuantity: 1,
              availableQuantity: 2,
            }),
            update: mockEquipmentUpdate,
          },
        };
        return await callback(txMock);
      });

      const result = await CounterService.returnHealthy("loan-1", "admin-1");

      expect(result.status).toBe(LoanStatus.RETURNED);
      expect(mockEquipmentUpdate).toHaveBeenCalledWith({
        where: { id: "equip-1" },
        data: {
          borrowedQuantity: { decrement: 1 },
          availableQuantity: { increment: 1 },
        },
      });
      expect(result.stockCredited).toBe("AVAILABLE");
    });

    it("should also allow healthy return for OVERDUE status loans", async () => {
      const mockEquipmentUpdate = vi.fn().mockResolvedValue({});
      const mockLoanUpdate = vi.fn().mockResolvedValue({
        id: "loan-1",
        status: LoanStatus.RETURNED,
      });

      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        const txMock = {
          loan: {
            findUnique: vi.fn().mockResolvedValue({
              id: "loan-1",
              status: LoanStatus.OVERDUE,
              equipmentId: "equip-1",
            }),
            update: mockLoanUpdate,
          },
          equipment: {
            findUnique: vi.fn().mockResolvedValue({
              id: "equip-1",
              borrowedQuantity: 1,
            }),
            update: mockEquipmentUpdate,
          },
        };
        return await callback(txMock);
      });

      const result = await CounterService.returnHealthy("loan-1", "admin-1");
      expect(result.status).toBe(LoanStatus.RETURNED);
    });
  });

  describe("returnDamaged", () => {
    it("should reject returnDamaged if notes or severity are missing", async () => {
      await expect(
        CounterService.returnDamaged({
          loanId: "loan-1",
          adminId: "admin-1",
          severity: "MODERATE" as DamageSeverity,
          notes: "",
        })
      ).rejects.toThrow("NOTES_REQUIRED");
    });

    it("should atomically shift stock from borrowed to damaged and create DamageRecord", async () => {
      const mockEquipmentUpdate = vi.fn().mockResolvedValue({
        id: "equip-1",
        borrowedQuantity: 0,
        damagedQuantity: 1,
      });

      const mockLoanUpdate = vi.fn().mockImplementation(({ data }) => ({
        id: "loan-1",
        status: data.status,
        returnedAt: data.returnedAt,
        returnedById: data.returnedById,
      }));

      const mockDamageRecordCreate = vi.fn().mockResolvedValue({
        id: "damage-1",
        loanId: "loan-1",
        equipmentId: "equip-1",
        reportedById: "admin-1",
        severity: DamageSeverity.MODERATE,
        notes: "Broken lens mount",
      });

      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        const txMock = {
          loan: {
            findUnique: vi.fn().mockResolvedValue({
              id: "loan-1",
              status: LoanStatus.CHECKED_OUT,
              equipmentId: "equip-1",
            }),
            update: mockLoanUpdate,
          },
          equipment: {
            findUnique: vi.fn().mockResolvedValue({
              id: "equip-1",
              borrowedQuantity: 1,
              damagedQuantity: 0,
            }),
            update: mockEquipmentUpdate,
          },
          damageRecord: {
            create: mockDamageRecordCreate,
          },
        };
        return await callback(txMock);
      });

      const result = await CounterService.returnDamaged({
        loanId: "loan-1",
        adminId: "admin-1",
        severity: DamageSeverity.MODERATE,
        notes: "Broken lens mount",
      });

      expect(result.status).toBe(LoanStatus.RETURNED);
      expect(result.stockCredited).toBe("DAMAGED");
      expect(mockEquipmentUpdate).toHaveBeenCalledWith({
        where: { id: "equip-1" },
        data: {
          borrowedQuantity: { decrement: 1 },
          damagedQuantity: { increment: 1 },
        },
      });
      expect(mockDamageRecordCreate).toHaveBeenCalledWith({
        data: {
          loanId: "loan-1",
          equipmentId: "equip-1",
          reportedById: "admin-1",
          severity: DamageSeverity.MODERATE,
          notes: "Broken lens mount",
        },
      });
    });
  });

  describe("extendLoanDuration", () => {
    it("should throw error if additional days is <= 0", async () => {
      await expect(
        CounterService.extendLoanDuration("loan-1", 0)
      ).rejects.toThrow("INVALID_ADDITIONAL_DAYS");
    });

    it("should throw error if cumulative duration exceeds 10 days", async () => {
      vi.mocked(prisma.loan.findUnique).mockResolvedValueOnce({
        id: "loan-1",
        durationDays: 8,
        status: LoanStatus.CHECKED_OUT,
        checkedOutAt: new Date("2026-10-10T10:00:00Z"),
      } as any);

      await expect(
        CounterService.extendLoanDuration("loan-1", 3)
      ).rejects.toThrow("DURATION_EXCEEDED");
    });

    it("should successfully extend duration if total <= 10 days", async () => {
      const checkedOutDate = new Date("2026-10-10T10:00:00Z");
      vi.mocked(prisma.loan.findUnique).mockResolvedValueOnce({
        id: "loan-1",
        durationDays: 5,
        status: LoanStatus.CHECKED_OUT,
        checkedOutAt: checkedOutDate,
      } as any);

      vi.mocked(prisma.loan.update).mockResolvedValueOnce({
        id: "loan-1",
        durationDays: 8,
        expectedReturnDate: new Date(checkedOutDate.getTime() + 8 * 24 * 60 * 60 * 1000),
      } as any);

      const result = await CounterService.extendLoanDuration("loan-1", 3);

      expect(result.durationDays).toBe(8);
      const expectedDate = new Date(checkedOutDate.getTime() + 8 * 24 * 60 * 60 * 1000);
      expect(result.expectedReturnDate?.toISOString()).toBe(expectedDate.toISOString());
    });
  });

  describe("getApprovedPickupsQueue", () => {
    it("should query loans with APPROVED status", async () => {
      vi.mocked(prisma.loan.findMany).mockResolvedValueOnce([
        { id: "loan-1", status: LoanStatus.APPROVED } as any,
      ]);
      vi.mocked(prisma.loan.count).mockResolvedValueOnce(1);

      const res = await CounterService.getApprovedPickupsQueue();
      expect(res.loans.length).toBe(1);
      expect(res.meta.total).toBe(1);
    });
  });

  describe("getCheckedOutReturnsQueue", () => {
    it("should query loans with CHECKED_OUT or OVERDUE status", async () => {
      vi.mocked(prisma.loan.findMany).mockResolvedValueOnce([
        { id: "loan-1", status: LoanStatus.CHECKED_OUT } as any,
        { id: "loan-2", status: LoanStatus.OVERDUE } as any,
      ]);
      vi.mocked(prisma.loan.count).mockResolvedValueOnce(2);

      const res = await CounterService.getCheckedOutReturnsQueue();
      expect(res.loans.length).toBe(2);
      expect(res.meta.total).toBe(2);
    });
  });
});
