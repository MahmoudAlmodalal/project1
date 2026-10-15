import { describe, it, expect, vi, beforeEach } from "vitest";
import { LoanService } from "@/services/loan.service";
import { sweepExpiredReservations } from "@/lib/utils/expiration";
import prisma from "@/lib/db/prisma";
import { LoanStatus } from "@prisma/client";

vi.mock("@/lib/db/prisma", () => ({
  default: {
    $transaction: vi.fn(),
    loan: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    equipment: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe("Phase 4: User Story 2 Unit Tests - Review Queue & Stock Reservation (T023)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("approveLoanRequest", () => {
    it("should throw error if loan does not exist", async () => {
      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        const txMock = {
          loan: { findUnique: vi.fn().mockResolvedValue(null) },
          $queryRaw: vi.fn(),
          equipment: { findUnique: vi.fn(), update: vi.fn() },
        };
        return await callback(txMock);
      });

      await expect(
        LoanService.approveLoanRequest("loan-not-found", "admin-1")
      ).rejects.toThrow("LOAN_NOT_FOUND");
    });

    it("should reject approval if loan is not in PENDING_REVIEW status", async () => {
      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        const txMock = {
          loan: {
            findUnique: vi.fn().mockResolvedValue({
              id: "loan-1",
              status: LoanStatus.APPROVED,
              equipmentId: "equip-1",
            }),
          },
          $queryRaw: vi.fn(),
          equipment: { findUnique: vi.fn(), update: vi.fn() },
        };
        return await callback(txMock);
      });

      await expect(
        LoanService.approveLoanRequest("loan-1", "admin-1")
      ).rejects.toThrow("INVALID_STATUS");
    });

    it("should throw error if equipment is out of stock (availableQuantity < 1)", async () => {
      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        const txMock = {
          loan: {
            findUnique: vi.fn().mockResolvedValue({
              id: "loan-1",
              status: LoanStatus.PENDING_REVIEW,
              equipmentId: "equip-1",
            }),
          },
          $queryRaw: vi.fn().mockResolvedValue([]),
          equipment: {
            findUnique: vi.fn().mockResolvedValue({
              id: "equip-1",
              availableQuantity: 0,
              reservedQuantity: 2,
              isArchived: false,
            }),
            update: vi.fn(),
          },
        };
        return await callback(txMock);
      });

      await expect(
        LoanService.approveLoanRequest("loan-1", "admin-1")
      ).rejects.toThrow("OUT_OF_STOCK");
    });

    it("should atomically shift stock from available to reserved and set 48h deadline", async () => {
      const mockEquipmentUpdate = vi.fn().mockResolvedValue({
        id: "equip-1",
        availableQuantity: 2,
        reservedQuantity: 1,
      });

      const mockLoanUpdate = vi.fn().mockImplementation(({ data }: any) => ({
        id: "loan-1",
        status: data.status,
        approvedAt: data.approvedAt,
        approvedById: data.approvedById,
        pickupDeadline: data.pickupDeadline,
      }));

      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        const txMock = {
          loan: {
            findUnique: vi.fn().mockResolvedValue({
              id: "loan-1",
              status: LoanStatus.PENDING_REVIEW,
              equipmentId: "equip-1",
            }),
            update: mockLoanUpdate,
          },
          $queryRaw: vi.fn().mockResolvedValue([]),
          equipment: {
            findUnique: vi.fn().mockResolvedValue({
              id: "equip-1",
              availableQuantity: 3,
              reservedQuantity: 0,
              isArchived: false,
            }),
            update: mockEquipmentUpdate,
          },
        };
        return await callback(txMock);
      });

      const beforeApproval = Date.now();
      const approvedLoan = await LoanService.approveLoanRequest("loan-1", "admin-1");
      const afterApproval = Date.now();

      // Verify stock decrement/increment
      expect(mockEquipmentUpdate).toHaveBeenCalledWith({
        where: { id: "equip-1" },
        data: {
          availableQuantity: { decrement: 1 },
          reservedQuantity: { increment: 1 },
        },
      });

      // Verify status and deadline
      expect(approvedLoan.status).toBe(LoanStatus.APPROVED);
      expect(approvedLoan.approvedById).toBe("admin-1");

      expect(approvedLoan.pickupDeadline).not.toBeNull();
      const deadline = new Date(approvedLoan.pickupDeadline!).getTime();
      const expectedMin = beforeApproval + 48 * 60 * 60 * 1000;
      const expectedMax = afterApproval + 48 * 60 * 60 * 1000;
      expect(deadline).toBeGreaterThanOrEqual(expectedMin);
      expect(deadline).toBeLessThanOrEqual(expectedMax);
    });
  });

  describe("rejectLoanRequest", () => {
    it("should require non-empty rejection reason", async () => {
      await expect(
        LoanService.rejectLoanRequest("loan-1", "")
      ).rejects.toThrow("REJECTION_REASON_REQUIRED");

      await expect(
        LoanService.rejectLoanRequest("loan-1", "   ")
      ).rejects.toThrow("REJECTION_REASON_REQUIRED");
    });

    it("should throw error if loan is not found", async () => {
      vi.mocked(prisma.loan.findUnique).mockResolvedValue(null);

      await expect(
        LoanService.rejectLoanRequest("loan-1", "Valid reason")
      ).rejects.toThrow("LOAN_NOT_FOUND");
    });

    it("should throw error if loan is not in PENDING_REVIEW", async () => {
      vi.mocked(prisma.loan.findUnique).mockResolvedValue({
        id: "loan-1",
        status: LoanStatus.APPROVED,
      } as any);

      await expect(
        LoanService.rejectLoanRequest("loan-1", "Valid reason")
      ).rejects.toThrow("INVALID_STATUS");
    });

    it("should update status to REJECTED with rejection reason without altering stock", async () => {
      vi.mocked(prisma.loan.findUnique).mockResolvedValue({
        id: "loan-1",
        status: LoanStatus.PENDING_REVIEW,
      } as any);

      vi.mocked(prisma.loan.update).mockResolvedValue({
        id: "loan-1",
        status: LoanStatus.REJECTED,
        rejectionReason: "الجهاز مخصص لدورة تدريبية",
      } as any);

      const result = await LoanService.rejectLoanRequest(
        "loan-1",
        "  الجهاز مخصص لدورة تدريبية  "
      );

      expect(prisma.loan.update).toHaveBeenCalledWith({
        where: { id: "loan-1" },
        data: {
          status: LoanStatus.REJECTED,
          rejectionReason: "الجهاز مخصص لدورة تدريبية",
        },
        include: {
          user: true,
          equipment: {
            include: { category: true },
          },
        },
      });
      expect(result.status).toBe(LoanStatus.REJECTED);
      expect(result.rejectionReason).toBe("الجهاز مخصص لدورة تدريبية");
    });
  });

  describe("sweepExpiredReservations", () => {
    it("should return 0 when no expired reservations exist", async () => {
      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        const txMock = {
          loan: {
            findMany: vi.fn().mockResolvedValue([]),
          },
        };
        return await callback(txMock);
      });

      const res = await sweepExpiredReservations();
      expect(res.expiredCount).toBe(0);
      expect(res.expiredLoanIds).toEqual([]);
    });

    it("should atomically expire loans past pickup deadline and return stock to available", async () => {
      const mockUpdateMany = vi.fn().mockResolvedValue({ count: 2 });
      const mockEquipmentUpdate = vi.fn().mockResolvedValue({});

      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        const txMock = {
          loan: {
            findMany: vi.fn().mockResolvedValue([
              { id: "loan-1", equipmentId: "equip-1" },
              { id: "loan-2", equipmentId: "equip-1" },
            ]),
            updateMany: mockUpdateMany,
          },
          equipment: {
            update: mockEquipmentUpdate,
          },
        };
        return await callback(txMock);
      });

      const res = await sweepExpiredReservations(new Date());

      expect(res.expiredCount).toBe(2);
      expect(res.expiredLoanIds).toEqual(["loan-1", "loan-2"]);
      expect(mockUpdateMany).toHaveBeenCalledWith({
        where: { id: { in: ["loan-1", "loan-2"] } },
        data: { status: LoanStatus.EXPIRED },
      });
      expect(mockEquipmentUpdate).toHaveBeenCalledWith({
        where: { id: "equip-1" },
        data: {
          reservedQuantity: { decrement: 2 },
          availableQuantity: { increment: 2 },
        },
      });
    });
  });
});
