import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET as getOverdueDashboard } from "@/app/api/v1/admin/overdue/route";
import { POST as returnLoan } from "@/app/api/v1/admin/loans/[id]/return/route";
import * as authSession from "@/lib/auth/session";
import { LoanService } from "@/services/loan.service";
import { CounterService } from "@/services/counter.service";
import { Role, LoanStatus } from "@prisma/client";

vi.mock("@/services/loan.service", () => ({
  LoanService: {
    getOverdueLoans: vi.fn(),
    syncOverdueLoans: vi.fn(),
    checkStudentEligibility: vi.fn(),
  },
}));

vi.mock("@/services/counter.service", () => ({
  CounterService: {
    returnHealthy: vi.fn(),
  },
}));

vi.mock("@/lib/auth/session", () => ({
  getSession: vi.fn(),
}));

describe("Phase 6: Integration Tests for Overdue Dashboard & Return Action (T039)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockAdminUser = {
    id: "admin-1",
    email: "admin@univ.edu",
    fullName: "Lab Supervisor",
    role: Role.ADMIN,
    status: "ACTIVE" as any,
    department: "Engineering",
  };

  const mockStudentUser = {
    id: "student-1",
    email: "student@univ.edu",
    fullName: "Student Member",
    role: Role.STUDENT,
    status: "ACTIVE" as any,
    department: "Engineering",
  };

  describe("GET /api/v1/admin/overdue", () => {
    it("should return 401 when unauthenticated", async () => {
      vi.mocked(authSession.getSession).mockResolvedValueOnce(null);

      const req = new NextRequest("http://localhost:3000/api/v1/admin/overdue");
      const res = await getOverdueDashboard(req);

      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toBe("UNAUTHORIZED");
    });

    it("should return 403 when user is not an administrator", async () => {
      vi.mocked(authSession.getSession).mockResolvedValueOnce(mockStudentUser);

      const req = new NextRequest("http://localhost:3000/api/v1/admin/overdue");
      const res = await getOverdueDashboard(req);

      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toBe("FORBIDDEN");
    });

    it("should return 200 with list of overdue loans, student contacts, and days overdue", async () => {
      vi.mocked(authSession.getSession).mockResolvedValueOnce(mockAdminUser);
      vi.mocked(LoanService.syncOverdueLoans).mockResolvedValueOnce({ syncedCount: 1 });
      vi.mocked(LoanService.getOverdueLoans).mockResolvedValueOnce({
        loans: [
          {
            id: "f5e92182-38d1-419b-b921-9988221100aa",
            durationDays: 10,
            academicJustification: "Class project",
            status: LoanStatus.OVERDUE,
            requestedAt: new Date(),
            approvedAt: new Date(),
            approvedById: "admin-1",
            pickupDeadline: new Date(),
            checkedOutAt: new Date("2026-10-01T10:00:00.000Z"),
            checkedOutById: "admin-1",
            expectedReturnDate: new Date("2026-10-11T10:00:00.000Z"),
            returnedAt: null,
            returnedById: null,
            rejectionReason: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            userId: "student-1",
            equipmentId: "equip-1",
            user: {
              id: "student-1",
              fullName: "سعد ناصر القحطاني",
              studentId: "STD-2023-4412",
              department: "Computer Science",
              phone: "+966551122334",
              email: "saad@university.edu.sa",
              status: "ACTIVE" as any,
              role: Role.STUDENT,
              passwordHash: "hash",
              rejectionReason: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            equipment: {
              id: "equip-1",
              nameAr: "كاميرا سوني الفا A7 III",
              nameEn: "Sony Alpha A7 III",
              imageUrl: "/sony.jpg",
              descriptionAr: "وصف",
              descriptionEn: "Description",
              totalQuantity: 5,
              availableQuantity: 2,
              reservedQuantity: 0,
              borrowedQuantity: 3,
              damagedQuantity: 0,
              isArchived: false,
              categoryId: "cat-1",
              createdAt: new Date(),
              updatedAt: new Date(),
              category: {
                id: "cat-1",
                nameAr: "كاميرات",
                nameEn: "Cameras",
                slug: "cameras",
                createdAt: new Date(),
              },
            },
            daysOverdue: 4,
          },
        ],
        meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
      });

      const req = new NextRequest("http://localhost:3000/api/v1/admin/overdue?search=سعد");
      const res = await getOverdueDashboard(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.count).toBe(1);
      expect(json.data.length).toBe(1);
      expect(json.data[0].days_overdue).toBe(4);
      expect(json.data[0].student.phone).toBe("+966551122334");
      expect(LoanService.getOverdueLoans).toHaveBeenCalledWith(
        expect.objectContaining({ search: "سعد" })
      );
    });
  });

  describe("Immediate Return from Overdue Dashboard", () => {
    it("should process immediate return and check-in on an overdue loan, returning 200", async () => {
      vi.mocked(authSession.getSession).mockResolvedValueOnce(mockAdminUser);
      vi.mocked(CounterService.returnHealthy).mockResolvedValueOnce({
        id: "overdue-loan-1",
        status: LoanStatus.RETURNED,
        returnedAt: new Date(),
        stockCredited: "AVAILABLE",
      } as any);

      const req = new NextRequest("http://localhost:3000/api/v1/admin/loans/overdue-loan-1/return", {
        method: "POST",
        body: JSON.stringify({ condition: "GOOD" }),
      });
      const res = await returnLoan(req, { params: Promise.resolve({ id: "overdue-loan-1" }) });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.status).toBe(LoanStatus.RETURNED);
      expect(json.stock_credited).toBe("AVAILABLE");
      expect(CounterService.returnHealthy).toHaveBeenCalledWith("overdue-loan-1", "admin-1");
    });
  });
});
