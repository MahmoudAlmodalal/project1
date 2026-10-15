import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST as approveLoan } from "@/app/api/v1/admin/loans/[id]/approve/route";
import { POST as rejectLoan } from "@/app/api/v1/admin/loans/[id]/reject/route";
import { GET as getQueue } from "@/app/api/v1/admin/loans/route";
import * as authSession from "@/lib/auth/session";
import { LoanService } from "@/services/loan.service";
import { Role, LoanStatus } from "@prisma/client";

vi.mock("@/services/loan.service", () => ({
  LoanService: {
    approveLoanRequest: vi.fn(),
    rejectLoanRequest: vi.fn(),
    getPendingReviewQueue: vi.fn(),
  },
}));

vi.mock("@/lib/auth/session", () => ({
  getSession: vi.fn(),
}));

describe("Phase 4: Integration Tests for Admin Review Queue Endpoints (T024)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/v1/admin/loans", () => {
    it("should return 403 when user is not an admin", async () => {
      vi.mocked(authSession.getSession).mockResolvedValueOnce({
        id: "student-1",
        email: "student@univ.edu",
        fullName: "Student User",
        role: Role.STUDENT,
        status: "ACTIVE" as any,
        department: "CS",
      });

      const req = new NextRequest("http://localhost:3000/api/v1/admin/loans");
      const res = await getQueue(req);

      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toBe("FORBIDDEN");
    });

    it("should return review queue items for authenticated admin", async () => {
      vi.mocked(authSession.getSession).mockResolvedValueOnce({
        id: "admin-1",
        email: "admin@univ.edu",
        fullName: "Admin User",
        role: Role.ADMIN,
        status: "ACTIVE" as any,
        department: "IT",
      });

      vi.mocked(LoanService.getPendingReviewQueue).mockResolvedValueOnce({
        loans: [
          {
            id: "loan-1",
            durationDays: 5,
            academicJustification: "Class project",
            status: LoanStatus.PENDING_REVIEW,
          } as any,
        ],
        meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
      });

      const req = new NextRequest("http://localhost:3000/api/v1/admin/loans?search=camera&page=1");
      const res = await getQueue(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.loans.length).toBe(1);
      expect(LoanService.getPendingReviewQueue).toHaveBeenCalledWith({
        search: "camera",
        page: 1,
        limit: 20,
      });
    });
  });

  describe("POST /api/v1/admin/loans/[id]/approve", () => {
    it("should return 403 when caller is not an admin", async () => {
      vi.mocked(authSession.getSession).mockResolvedValueOnce(null);

      const req = new NextRequest("http://localhost:3000/api/v1/admin/loans/loan-1/approve", {
        method: "POST",
      });
      const res = await approveLoan(req, { params: Promise.resolve({ id: "loan-1" }) });

      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toBe("FORBIDDEN");
    });

    it("should approve loan and return 200 with 48h deadline", async () => {
      vi.mocked(authSession.getSession).mockResolvedValueOnce({
        id: "admin-1",
        email: "admin@univ.edu",
        fullName: "Admin User",
        role: Role.ADMIN,
        status: "ACTIVE" as any,
        department: "IT",
      });

      const deadline = new Date(Date.now() + 48 * 60 * 60 * 1000);
      vi.mocked(LoanService.approveLoanRequest).mockResolvedValueOnce({
        id: "loan-1",
        status: LoanStatus.APPROVED,
        approvedAt: new Date(),
        pickupDeadline: deadline,
      } as any);

      const req = new NextRequest("http://localhost:3000/api/v1/admin/loans/loan-1/approve", {
        method: "POST",
      });
      const res = await approveLoan(req, { params: Promise.resolve({ id: "loan-1" }) });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.loan_id).toBe("loan-1");
      expect(json.status).toBe("APPROVED");
      expect(LoanService.approveLoanRequest).toHaveBeenCalledWith("loan-1", "admin-1");
    });

    it("should return 400 when loan is out of stock", async () => {
      vi.mocked(authSession.getSession).mockResolvedValueOnce({
        id: "admin-1",
        email: "admin@univ.edu",
        fullName: "Admin User",
        role: Role.ADMIN,
        status: "ACTIVE" as any,
        department: "IT",
      });

      vi.mocked(LoanService.approveLoanRequest).mockRejectedValueOnce(
        new Error("OUT_OF_STOCK: Insufficient available inventory to approve loan")
      );

      const req = new NextRequest("http://localhost:3000/api/v1/admin/loans/loan-1/approve", {
        method: "POST",
      });
      const res = await approveLoan(req, { params: Promise.resolve({ id: "loan-1" }) });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("OUT_OF_STOCK");
    });
  });

  describe("POST /api/v1/admin/loans/[id]/reject", () => {
    it("should return 400 when reason is missing", async () => {
      vi.mocked(authSession.getSession).mockResolvedValueOnce({
        id: "admin-1",
        email: "admin@univ.edu",
        fullName: "Admin User",
        role: Role.ADMIN,
        status: "ACTIVE" as any,
        department: "IT",
      });

      const req = new NextRequest("http://localhost:3000/api/v1/admin/loans/loan-1/reject", {
        method: "POST",
        body: JSON.stringify({ reason: "   " }),
      });
      const res = await rejectLoan(req, { params: Promise.resolve({ id: "loan-1" }) });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("REJECTION_REASON_REQUIRED");
    });

    it("should reject loan with reason and return 200", async () => {
      vi.mocked(authSession.getSession).mockResolvedValueOnce({
        id: "admin-1",
        email: "admin@univ.edu",
        fullName: "Admin User",
        role: Role.ADMIN,
        status: "ACTIVE" as any,
        department: "IT",
      });

      vi.mocked(LoanService.rejectLoanRequest).mockResolvedValueOnce({
        id: "loan-1",
        status: LoanStatus.REJECTED,
        rejectionReason: "Course project only",
      } as any);

      const req = new NextRequest("http://localhost:3000/api/v1/admin/loans/loan-1/reject", {
        method: "POST",
        body: JSON.stringify({ reason: "Course project only" }),
      });
      const res = await rejectLoan(req, { params: Promise.resolve({ id: "loan-1" }) });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.status).toBe("REJECTED");
      expect(json.rejection_reason).toBe("Course project only");
      expect(LoanService.rejectLoanRequest).toHaveBeenCalledWith("loan-1", "Course project only");
    });
  });
});
