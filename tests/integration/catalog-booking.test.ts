import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET as getCatalog } from "@/app/api/v1/equipment/route";
import { POST as postLoan, GET as getLoans } from "@/app/api/v1/loans/route";
import { POST as cancelLoan } from "@/app/api/v1/loans/[id]/cancel/route";
import * as authSession from "@/lib/auth/session";
import { LoanService } from "@/services/loan.service";

vi.mock("@/services/loan.service", () => ({
  LoanService: {
    getCatalog: vi.fn(),
    createBookingRequest: vi.fn(),
    getStudentLoans: vi.fn(),
    selfCancelRequest: vi.fn(),
  },
}));

vi.mock("@/lib/auth/session", () => ({
  getSession: vi.fn(),
}));

describe("Phase 3: Integration Tests for Catalog & Booking Endpoints", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/v1/equipment", () => {
    it("should return catalog items with search and category params", async () => {
      const mockResult = {
        data: [
          {
            id: "eq-1",
            nameAr: "كاميرا سوني",
            nameEn: "Sony Camera",
            availableQuantity: 2,
            isAvailable: true,
          },
        ],
        categories: [{ id: "cat-1", slug: "cameras", nameAr: "كاميرات", nameEn: "Cameras" }],
        meta: { total: 1, page: 1, limit: 12, totalPages: 1 },
      };

      vi.mocked(LoanService.getCatalog).mockResolvedValueOnce(mockResult as any);

      const req = new NextRequest("http://localhost:3000/api/v1/equipment?category=cameras&search=sony");
      const res = await getCatalog(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data.length).toBe(1);
      expect(LoanService.getCatalog).toHaveBeenCalledWith({
        category: "cameras",
        search: "sony",
        availableOnly: false,
        page: 1,
        limit: 12,
      });
    });
  });

  describe("POST /api/v1/loans", () => {
    it("should return 401 when user is not authenticated", async () => {
      vi.mocked(authSession.getSession).mockResolvedValueOnce(null);

      const req = new NextRequest("http://localhost:3000/api/v1/loans", {
        method: "POST",
        body: JSON.stringify({
          equipment_id: "eq-1",
          duration_days: 3,
          academic_justification: "Lab project",
        }),
      });

      const res = await postLoan(req);
      expect(res.status).toBe(401);
    });

    it("should return 403 when quota is exceeded", async () => {
      vi.mocked(authSession.getSession).mockResolvedValueOnce({
        id: "student-1",
        role: "STUDENT",
        status: "ACTIVE",
      } as any);

      vi.mocked(LoanService.createBookingRequest).mockRejectedValueOnce(
        new Error("QUOTA_EXCEEDED: Cannot have more than 2 active loans concurrently")
      );

      const req = new NextRequest("http://localhost:3000/api/v1/loans", {
        method: "POST",
        body: JSON.stringify({
          equipment_id: "eq-1",
          duration_days: 3,
          academic_justification: "Lab project",
        }),
      });

      const res = await postLoan(req);
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toBe("QUOTA_EXCEEDED");
    });

    it("should successfully create booking and return 201", async () => {
      vi.mocked(authSession.getSession).mockResolvedValueOnce({
        id: "student-1",
        role: "STUDENT",
        status: "ACTIVE",
      } as any);

      const mockLoan = {
        id: "loan-abc",
        equipmentId: "eq-1",
        durationDays: 5,
        academicJustification: "Robotics experimentation",
        status: "PENDING_REVIEW",
        requestedAt: new Date("2026-10-15T10:00:00Z"),
      };

      vi.mocked(LoanService.createBookingRequest).mockResolvedValueOnce(mockLoan as any);

      const req = new NextRequest("http://localhost:3000/api/v1/loans", {
        method: "POST",
        body: JSON.stringify({
          equipment_id: "eq-1",
          duration_days: 5,
          academic_justification: "Robotics experimentation",
        }),
      });

      const res = await postLoan(req);
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.loan.id).toBe("loan-abc");
    });
  });

  describe("POST /api/v1/loans/[id]/cancel", () => {
    it("should successfully self-cancel pending loan", async () => {
      vi.mocked(authSession.getSession).mockResolvedValueOnce({
        id: "student-1",
        role: "STUDENT",
        status: "ACTIVE",
      } as any);

      vi.mocked(LoanService.selfCancelRequest).mockResolvedValueOnce({
        id: "loan-abc",
        status: "CANCELLED",
      } as any);

      const req = new NextRequest("http://localhost:3000/api/v1/loans/loan-abc/cancel", {
        method: "POST",
      });

      const res = await cancelLoan(req, { params: Promise.resolve({ id: "loan-abc" }) });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.status).toBe("CANCELLED");
    });
  });
});
