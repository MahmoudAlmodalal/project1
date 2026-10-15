import { describe, it, expect, vi, beforeEach } from "vitest";
import { LoanService } from "@/services/loan.service";
import prisma from "@/lib/db/prisma";

vi.mock("@/lib/db/prisma", () => ({
  default: {
    user: {
      findUnique: vi.fn(),
    },
    equipment: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    category: {
      findMany: vi.fn(),
    },
    loan: {
      count: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe("Phase 3: LoanService Unit Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createBookingRequest", () => {
    it("should reject duration less than 1 or greater than 10 days", async () => {
      await expect(
        LoanService.createBookingRequest({
          userId: "user-1",
          equipmentId: "equip-1",
          durationDays: 0,
          academicJustification: "Valid reason for class",
        })
      ).rejects.toThrow("DURATION_INVALID");

      await expect(
        LoanService.createBookingRequest({
          userId: "user-1",
          equipmentId: "equip-1",
          durationDays: 11,
          academicJustification: "Valid reason for class",
        })
      ).rejects.toThrow("DURATION_INVALID");
    });

    it("should reject empty or whitespace academic justification", async () => {
      await expect(
        LoanService.createBookingRequest({
          userId: "user-1",
          equipmentId: "equip-1",
          durationDays: 3,
          academicJustification: "   ",
        })
      ).rejects.toThrow("JUSTIFICATION_REQUIRED");
    });

    it("should reject if student account is not ACTIVE", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: "user-1",
        status: "PENDING_APPROVAL",
      } as any);

      await expect(
        LoanService.createBookingRequest({
          userId: "user-1",
          equipmentId: "equip-1",
          durationDays: 3,
          academicJustification: "Robotics lab experiment",
        })
      ).rejects.toThrow("STUDENT_NOT_ACTIVE");
    });

    it("should reject if student has any OVERDUE loans", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: "user-1",
        status: "ACTIVE",
      } as any);

      vi.mocked(prisma.loan.count).mockResolvedValueOnce(1); // 1 overdue

      await expect(
        LoanService.createBookingRequest({
          userId: "user-1",
          equipmentId: "equip-1",
          durationDays: 3,
          academicJustification: "Robotics lab experiment",
        })
      ).rejects.toThrow("STUDENT_OVERDUE_BLOCKED");
    });

    it("should reject if student already has 2 or more active loans", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: "user-1",
        status: "ACTIVE",
      } as any);

      vi.mocked(prisma.loan.count)
        .mockResolvedValueOnce(0) // 0 overdue
        .mockResolvedValueOnce(2); // 2 active

      await expect(
        LoanService.createBookingRequest({
          userId: "user-1",
          equipmentId: "equip-1",
          durationDays: 3,
          academicJustification: "Robotics lab experiment",
        })
      ).rejects.toThrow("QUOTA_EXCEEDED");
    });

    it("should reject if equipment does not exist or is archived", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: "user-1",
        status: "ACTIVE",
      } as any);

      vi.mocked(prisma.loan.count)
        .mockResolvedValueOnce(0) // 0 overdue
        .mockResolvedValueOnce(1); // 1 active

      vi.mocked(prisma.equipment.findUnique).mockResolvedValueOnce(null);

      await expect(
        LoanService.createBookingRequest({
          userId: "user-1",
          equipmentId: "equip-1",
          durationDays: 3,
          academicJustification: "Robotics lab experiment",
        })
      ).rejects.toThrow("EQUIPMENT_NOT_FOUND");
    });

    it("should reject if equipment has 0 available quantity", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: "user-1",
        status: "ACTIVE",
      } as any);

      vi.mocked(prisma.loan.count)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      vi.mocked(prisma.equipment.findUnique).mockResolvedValueOnce({
        id: "equip-1",
        isArchived: false,
        availableQuantity: 0,
      } as any);

      await expect(
        LoanService.createBookingRequest({
          userId: "user-1",
          equipmentId: "equip-1",
          durationDays: 3,
          academicJustification: "Robotics lab experiment",
        })
      ).rejects.toThrow("OUT_OF_STOCK");
    });

    it("should create booking request successfully when valid", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: "user-1",
        status: "ACTIVE",
      } as any);

      vi.mocked(prisma.loan.count)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(1);

      vi.mocked(prisma.equipment.findUnique).mockResolvedValueOnce({
        id: "equip-1",
        isArchived: false,
        availableQuantity: 3,
      } as any);

      const mockCreatedLoan = {
        id: "loan-new-123",
        userId: "user-1",
        equipmentId: "equip-1",
        durationDays: 4,
        academicJustification: "Final Graduation Project",
        status: "PENDING_REVIEW",
        requestedAt: new Date(),
      };

      vi.mocked(prisma.loan.create).mockResolvedValueOnce(mockCreatedLoan as any);

      const result = await LoanService.createBookingRequest({
        userId: "user-1",
        equipmentId: "equip-1",
        durationDays: 4,
        academicJustification: "Final Graduation Project",
      });

      expect(result).toEqual(mockCreatedLoan);
      expect(prisma.loan.create).toHaveBeenCalledWith({
        data: {
          userId: "user-1",
          equipmentId: "equip-1",
          durationDays: 4,
          academicJustification: "Final Graduation Project",
          status: "PENDING_REVIEW",
        },
      });
    });
  });

  describe("selfCancelRequest", () => {
    it("should reject if loan is not found or not owned by user", async () => {
      vi.mocked(prisma.loan.findUnique).mockResolvedValueOnce(null);

      await expect(
        LoanService.selfCancelRequest("loan-1", "user-1")
      ).rejects.toThrow("LOAN_NOT_FOUND");
    });

    it("should reject if loan is not in PENDING_REVIEW state", async () => {
      vi.mocked(prisma.loan.findUnique).mockResolvedValueOnce({
        id: "loan-1",
        userId: "user-1",
        status: "APPROVED",
      } as any);

      await expect(
        LoanService.selfCancelRequest("loan-1", "user-1")
      ).rejects.toThrow("CANNOT_CANCEL_NON_PENDING");
    });

    it("should cancel loan when in PENDING_REVIEW and owned by user", async () => {
      vi.mocked(prisma.loan.findUnique).mockResolvedValueOnce({
        id: "loan-1",
        userId: "user-1",
        status: "PENDING_REVIEW",
      } as any);

      vi.mocked(prisma.loan.update).mockResolvedValueOnce({
        id: "loan-1",
        status: "CANCELLED",
      } as any);

      const result = await LoanService.selfCancelRequest("loan-1", "user-1");
      expect(result.status).toBe("CANCELLED");
      expect(prisma.loan.update).toHaveBeenCalledWith({
        where: { id: "loan-1" },
        data: { status: "CANCELLED" },
      });
    });
  });

  describe("getStudentLoans", () => {
    it("should return student loans sorted by requestedAt desc", async () => {
      const mockLoans = [
        {
          id: "loan-1",
          userId: "user-1",
          status: "PENDING_REVIEW",
          equipment: { id: "eq-1", nameAr: "كاميرا", nameEn: "Camera" },
        },
      ];
      vi.mocked(prisma.loan.findMany).mockResolvedValueOnce(mockLoans as any);

      const result = await LoanService.getStudentLoans("user-1");
      expect(result).toEqual(mockLoans);
      expect(prisma.loan.findMany).toHaveBeenCalledWith({
        where: { userId: "user-1" },
        include: {
          equipment: {
            include: { category: true },
          },
        },
        orderBy: { requestedAt: "desc" },
      });
    });
  });
});
