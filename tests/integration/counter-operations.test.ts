import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST as checkoutLoan } from "@/app/api/v1/admin/loans/[id]/checkout/route";
import { POST as returnLoan } from "@/app/api/v1/admin/loans/[id]/return/route";
import { POST as extendLoan } from "@/app/api/v1/admin/loans/[id]/extend/route";
import { GET as getPickups } from "@/app/api/v1/admin/loans/pickups/route";
import { GET as getReturns } from "@/app/api/v1/admin/loans/returns/route";
import * as authSession from "@/lib/auth/session";
import { CounterService } from "@/services/counter.service";
import { Role, LoanStatus, DamageSeverity } from "@prisma/client";

vi.mock("@/services/counter.service", () => ({
  CounterService: {
    checkoutHandover: vi.fn(),
    returnHealthy: vi.fn(),
    returnDamaged: vi.fn(),
    extendLoanDuration: vi.fn(),
    getApprovedPickupsQueue: vi.fn(),
    getCheckedOutReturnsQueue: vi.fn(),
  },
}));

vi.mock("@/lib/auth/session", () => ({
  getSession: vi.fn(),
}));

describe("Phase 5: Integration Tests for Counter API Endpoints (T031)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockAdminUser = {
    id: "admin-1",
    email: "admin@univ.edu",
    fullName: "Lab Admin",
    role: Role.ADMIN,
    status: "ACTIVE" as any,
    department: "Engineering",
  };

  const mockStudentUser = {
    id: "student-1",
    email: "student@univ.edu",
    fullName: "Student",
    role: Role.STUDENT,
    status: "ACTIVE" as any,
    department: "Engineering",
  };

  describe("POST /api/v1/admin/loans/[id]/checkout", () => {
    it("should return 401 when unauthenticated", async () => {
      vi.mocked(authSession.getSession).mockResolvedValueOnce(null);

      const req = new NextRequest("http://localhost:3000/api/v1/admin/loans/loan-1/checkout", {
        method: "POST",
      });
      const res = await checkoutLoan(req, { params: Promise.resolve({ id: "loan-1" }) });

      expect(res.status).toBe(401);
    });

    it("should return 403 when user is not admin", async () => {
      vi.mocked(authSession.getSession).mockResolvedValueOnce(mockStudentUser);

      const req = new NextRequest("http://localhost:3000/api/v1/admin/loans/loan-1/checkout", {
        method: "POST",
      });
      const res = await checkoutLoan(req, { params: Promise.resolve({ id: "loan-1" }) });

      expect(res.status).toBe(403);
    });

    it("should return 200 on successful checkout", async () => {
      vi.mocked(authSession.getSession).mockResolvedValueOnce(mockAdminUser);
      vi.mocked(CounterService.checkoutHandover).mockResolvedValueOnce({
        id: "loan-1",
        status: LoanStatus.CHECKED_OUT,
        checkedOutAt: new Date("2026-10-15T10:00:00Z"),
        expectedReturnDate: new Date("2026-10-20T10:00:00Z"),
      } as any);

      const req = new NextRequest("http://localhost:3000/api/v1/admin/loans/loan-1/checkout", {
        method: "POST",
      });
      const res = await checkoutLoan(req, { params: Promise.resolve({ id: "loan-1" }) });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.status).toBe(LoanStatus.CHECKED_OUT);
      expect(CounterService.checkoutHandover).toHaveBeenCalledWith("loan-1", "admin-1");
    });
  });

  describe("POST /api/v1/admin/loans/[id]/return", () => {
    it("should process healthy return when condition is GOOD", async () => {
      vi.mocked(authSession.getSession).mockResolvedValueOnce(mockAdminUser);
      vi.mocked(CounterService.returnHealthy).mockResolvedValueOnce({
        id: "loan-1",
        status: LoanStatus.RETURNED,
        returnedAt: new Date(),
        stockCredited: "AVAILABLE",
      } as any);

      const req = new NextRequest("http://localhost:3000/api/v1/admin/loans/loan-1/return", {
        method: "POST",
        body: JSON.stringify({ condition: "GOOD" }),
      });
      const res = await returnLoan(req, { params: Promise.resolve({ id: "loan-1" }) });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.stock_credited).toBe("AVAILABLE");
      expect(CounterService.returnHealthy).toHaveBeenCalledWith("loan-1", "admin-1");
    });

    it("should process damaged return when condition is DAMAGED", async () => {
      vi.mocked(authSession.getSession).mockResolvedValueOnce(mockAdminUser);
      vi.mocked(CounterService.returnDamaged).mockResolvedValueOnce({
        id: "loan-1",
        status: LoanStatus.RETURNED,
        returnedAt: new Date(),
        stockCredited: "DAMAGED",
      } as any);

      const req = new NextRequest("http://localhost:3000/api/v1/admin/loans/loan-1/return", {
        method: "POST",
        body: JSON.stringify({
          condition: "DAMAGED",
          severity: DamageSeverity.MODERATE,
          notes: "Broken tripod mount",
        }),
      });
      const res = await returnLoan(req, { params: Promise.resolve({ id: "loan-1" }) });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.stock_credited).toBe("DAMAGED");
      expect(CounterService.returnDamaged).toHaveBeenCalledWith({
        loanId: "loan-1",
        adminId: "admin-1",
        severity: DamageSeverity.MODERATE,
        notes: "Broken tripod mount",
      });
    });
  });

  describe("POST /api/v1/admin/loans/[id]/extend", () => {
    it("should return 400 when additional_days is missing or invalid", async () => {
      vi.mocked(authSession.getSession).mockResolvedValueOnce(mockAdminUser);

      const req = new NextRequest("http://localhost:3000/api/v1/admin/loans/loan-1/extend", {
        method: "POST",
        body: JSON.stringify({ additional_days: 0 }),
      });
      const res = await extendLoan(req, { params: Promise.resolve({ id: "loan-1" }) });

      expect(res.status).toBe(400);
    });

    it("should return 200 on valid extension", async () => {
      vi.mocked(authSession.getSession).mockResolvedValueOnce(mockAdminUser);
      vi.mocked(CounterService.extendLoanDuration).mockResolvedValueOnce({
        id: "loan-1",
        durationDays: 7,
        expectedReturnDate: new Date("2026-10-22T10:00:00Z"),
      } as any);

      const req = new NextRequest("http://localhost:3000/api/v1/admin/loans/loan-1/extend", {
        method: "POST",
        body: JSON.stringify({ additional_days: 2 }),
      });
      const res = await extendLoan(req, { params: Promise.resolve({ id: "loan-1" }) });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.new_duration_days).toBe(7);
      expect(CounterService.extendLoanDuration).toHaveBeenCalledWith("loan-1", 2);
    });
  });

  describe("GET /api/v1/admin/loans/pickups", () => {
    it("should return pickups queue", async () => {
      vi.mocked(authSession.getSession).mockResolvedValueOnce(mockAdminUser);
      vi.mocked(CounterService.getApprovedPickupsQueue).mockResolvedValueOnce({
        loans: [{ id: "loan-1", status: LoanStatus.APPROVED }] as any,
        meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
      });

      const req = new NextRequest("http://localhost:3000/api/v1/admin/loans/pickups?search=test");
      const res = await getPickups(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.loans.length).toBe(1);
    });
  });

  describe("GET /api/v1/admin/loans/returns", () => {
    it("should return returns queue", async () => {
      vi.mocked(authSession.getSession).mockResolvedValueOnce(mockAdminUser);
      vi.mocked(CounterService.getCheckedOutReturnsQueue).mockResolvedValueOnce({
        loans: [{ id: "loan-1", status: LoanStatus.CHECKED_OUT }] as any,
        meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
      });

      const req = new NextRequest("http://localhost:3000/api/v1/admin/loans/returns?search=test");
      const res = await getReturns(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.loans.length).toBe(1);
    });
  });
});
