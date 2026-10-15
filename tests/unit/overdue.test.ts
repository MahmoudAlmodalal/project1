import { describe, it, expect, vi, beforeEach } from "vitest";
import { LoanService } from "@/services/loan.service";
import prisma from "@/lib/db/prisma";
import { LoanStatus, UserStatus } from "@prisma/client";

vi.mock("@/lib/db/prisma", () => ({
  default: {
    user: {
      findUnique: vi.fn(),
    },
    equipment: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
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
      updateMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

describe("Phase 6: User Story 4 Unit Tests - Overdue Loans & Delinquency Tracking (T038)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("student borrowing block and auto-reinstatement rules", () => {
    it("should block loan creation when student has OVERDUE loans", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: "student-1",
        status: UserStatus.ACTIVE,
      } as any);

      // Student has 1 overdue loan
      vi.mocked(prisma.loan.count).mockResolvedValueOnce(1);

      await expect(
        LoanService.createBookingRequest({
          userId: "student-1",
          equipmentId: "equip-1",
          durationDays: 3,
          academicJustification: "Course project",
        })
      ).rejects.toThrow("STUDENT_OVERDUE_BLOCKED");
    });

    it("should allow loan creation once student has 0 OVERDUE loans", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: "student-1",
        status: UserStatus.ACTIVE,
      } as any);

      // Student has 0 overdue loans and 0 active loans
      vi.mocked(prisma.loan.count)
        .mockResolvedValueOnce(0) // overdue count
        .mockResolvedValueOnce(0); // active loan count

      vi.mocked(prisma.equipment.findUnique).mockResolvedValueOnce({
        id: "equip-1",
        isArchived: false,
        availableQuantity: 5,
      } as any);

      vi.mocked(prisma.loan.create).mockResolvedValueOnce({
        id: "loan-new",
        userId: "student-1",
        equipmentId: "equip-1",
        durationDays: 3,
        status: LoanStatus.PENDING_REVIEW,
      } as any);

      const result = await LoanService.createBookingRequest({
        userId: "student-1",
        equipmentId: "equip-1",
        durationDays: 3,
        academicJustification: "Course project",
      });

      expect(result.id).toBe("loan-new");
      expect(result.status).toBe(LoanStatus.PENDING_REVIEW);
    });

    it("should return student borrowing eligibility status", async () => {
      // Test checkStudentBorrowingEligibility helper
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: "student-1",
        status: UserStatus.ACTIVE,
      } as any);
      vi.mocked(prisma.loan.count)
        .mockResolvedValueOnce(1) // overdue
        .mockResolvedValueOnce(1); // active

      const eligibility = await LoanService.checkStudentEligibility("student-1");
      expect(eligibility.isEligible).toBe(false);
      expect(eligibility.hasOverdue).toBe(true);
      expect(eligibility.activeLoansCount).toBe(1);
      expect(eligibility.reason).toBe("STUDENT_OVERDUE_BLOCKED");
    });
  });

  describe("getOverdueLoans", () => {
    it("should query loans that are OVERDUE or CHECKED_OUT past expectedReturnDate", async () => {
      const mockOverdueLoans = [
        {
          id: "loan-overdue-1",
          status: LoanStatus.OVERDUE,
          durationDays: 5,
          checkedOutAt: new Date("2026-10-01T10:00:00Z"),
          expectedReturnDate: new Date("2026-10-06T10:00:00Z"),
          user: {
            id: "user-1",
            fullName: "سعد القحطاني",
            studentId: "STD-2023-4412",
            department: "Computer Science",
            phone: "+966551122334",
            email: "saad@univ.edu",
          },
          equipment: {
            id: "eq-1",
            nameAr: "كاميرا سوني الفا",
            nameEn: "Sony Alpha Camera",
            imageUrl: "/camera.jpg",
          },
        },
      ];

      vi.mocked(prisma.loan.findMany).mockResolvedValueOnce(mockOverdueLoans as any);
      vi.mocked(prisma.loan.count).mockResolvedValueOnce(1);

      const now = new Date("2026-10-10T10:00:00Z");
      const result = await LoanService.getOverdueLoans({ now });

      expect(result.loans).toBeDefined();
      expect(result.loans.length).toBe(1);
      expect(result.loans[0].daysOverdue).toBe(4);
      expect(result.meta.total).toBe(1);
    });

    it("should support search filtering by student name, phone, or equipment", async () => {
      vi.mocked(prisma.loan.findMany).mockResolvedValueOnce([]);
      vi.mocked(prisma.loan.count).mockResolvedValueOnce(0);

      const result = await LoanService.getOverdueLoans({ search: "القحطاني" });
      expect(result.loans).toEqual([]);
      expect(prisma.loan.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.any(Array),
          }),
        })
      );
    });
  });

  describe("syncOverdueLoans", () => {
    it("should mark CHECKED_OUT loans past expectedReturnDate as OVERDUE", async () => {
      const pastLoans = [
        { id: "loan-1", status: LoanStatus.CHECKED_OUT, expectedReturnDate: new Date("2026-10-01") },
        { id: "loan-2", status: LoanStatus.CHECKED_OUT, expectedReturnDate: new Date("2026-10-02") },
      ];

      vi.mocked(prisma.loan.findMany).mockResolvedValueOnce(pastLoans as any);
      vi.mocked(prisma.loan.updateMany).mockResolvedValueOnce({ count: 2 } as any);

      const res = await LoanService.syncOverdueLoans(new Date("2026-10-15"));
      expect(res.syncedCount).toBe(2);
      expect(prisma.loan.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ["loan-1", "loan-2"] } },
        data: { status: LoanStatus.OVERDUE },
      });
    });
  });
});
