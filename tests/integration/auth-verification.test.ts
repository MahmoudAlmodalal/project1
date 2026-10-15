import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST as registerHandler } from "@/app/api/v1/auth/register/route";
import { POST as loginHandler } from "@/app/api/v1/auth/login/route";
import { POST as logoutHandler } from "@/app/api/v1/auth/logout/route";
import { GET as listUsersHandler } from "@/app/api/v1/admin/users/route";
import { POST as approveUserHandler } from "@/app/api/v1/admin/users/[id]/approve/route";
import { POST as rejectUserHandler } from "@/app/api/v1/admin/users/[id]/reject/route";
import { AccountService } from "@/services/account.service";
import * as sessionModule from "@/lib/auth/session";
import { Role, UserStatus } from "@prisma/client";

vi.mock("@/services/account.service");
vi.mock("@/lib/auth/session", () => ({
  signToken: vi.fn().mockResolvedValue("mock-jwt-token"),
  verifyToken: vi.fn(),
  getSession: vi.fn(),
  setSessionCookie: vi.fn().mockResolvedValue(undefined),
  clearSessionCookie: vi.fn().mockResolvedValue(undefined),
}));

describe("Phase 7: Integration Tests for Auth & Admin User Verification (T044)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/v1/auth/register", () => {
    it("should successfully register student and return 201", async () => {
      vi.mocked(AccountService.registerStudent).mockResolvedValue({
        id: "mock-student-id",
        email: "khalid@university.edu.sa",
        fullName: "خالد بن عبد الله",
        studentId: "STD-2024-9981",
        department: "الهندسة",
        phone: "+966501234567",
        role: Role.STUDENT,
        status: UserStatus.PENDING_APPROVAL,
        passwordHash: "hash",
        rejectionReason: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const req = new NextRequest("http://localhost:3000/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: "خالد بن عبد الله",
          email: "khalid@university.edu.sa",
          student_id: "STD-2024-9981",
          department: "الهندسة",
          phone: "+966501234567",
          password: "StrongPassword123!",
        }),
      });

      const res = await registerHandler(req);
      const data = await res.json();

      expect(res.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.user.id).toBe("mock-student-id");
      expect(data.user.status).toBe("PENDING_APPROVAL");
    });

    it("should return 400 when registration validation fails", async () => {
      vi.mocked(AccountService.registerStudent).mockRejectedValue(
        new Error("INVALID_FULL_NAME: Full name is required")
      );

      const req = new NextRequest("http://localhost:3000/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: "",
          email: "khalid@university.edu.sa",
          student_id: "STD-2024-9981",
          department: "الهندسة",
          phone: "+966501234567",
          password: "Pass",
        }),
      });

      const res = await registerHandler(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe("INVALID_FULL_NAME");
    });
  });

  describe("POST /api/v1/auth/login", () => {
    it("should authenticate active user and return 200 with token", async () => {
      vi.mocked(AccountService.authenticateUser).mockResolvedValue({
        id: "mock-active-student",
        email: "student@university.edu.sa",
        fullName: "طالب معتمد",
        studentId: "STD-100",
        department: "علوم الحاسب",
        phone: "+966500000000",
        role: Role.STUDENT,
        status: UserStatus.ACTIVE,
        passwordHash: "hash",
        rejectionReason: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const req = new NextRequest("http://localhost:3000/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "student@university.edu.sa",
          password: "StrongPassword123!",
        }),
      });

      const res = await loginHandler(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.token).toBe("mock-jwt-token");
      expect(data.user.status).toBe("ACTIVE");
      expect(sessionModule.setSessionCookie).toHaveBeenCalled();
    });

    it("should return 403 when account is pending approval", async () => {
      vi.mocked(AccountService.authenticateUser).mockRejectedValue(
        new Error("ACCOUNT_PENDING: الحساب قيد المراجعة الإدارية من قبل مشرف المعمل")
      );

      const req = new NextRequest("http://localhost:3000/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "pending@university.edu.sa",
          password: "StrongPassword123!",
        }),
      });

      const res = await loginHandler(req);
      const data = await res.json();

      expect(res.status).toBe(403);
      expect(data.error).toBe("ACCOUNT_PENDING");
    });

    it("should return 401 on invalid credentials", async () => {
      vi.mocked(AccountService.authenticateUser).mockRejectedValue(
        new Error("INVALID_CREDENTIALS: User not found or invalid credentials")
      );

      const req = new NextRequest("http://localhost:3000/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "wrong@university.edu.sa",
          password: "WrongPassword!",
        }),
      });

      const res = await loginHandler(req);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toBe("INVALID_CREDENTIALS");
    });
  });

  describe("POST /api/v1/auth/logout", () => {
    it("should clear session cookie and return 200", async () => {
      const res = await logoutHandler();
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(sessionModule.clearSessionCookie).toHaveBeenCalled();
    });
  });

  describe("Admin User Endpoints", () => {
    it("GET /api/v1/admin/users should require ADMIN role", async () => {
      vi.mocked(sessionModule.getSession).mockResolvedValue({
        id: "student-1",
        email: "student@uni.edu",
        fullName: "Student",
        role: Role.STUDENT,
        status: UserStatus.ACTIVE,
        department: "CS",
      });

      const req = new NextRequest("http://localhost:3000/api/v1/admin/users");
      const res = await listUsersHandler(req);

      expect(res.status).toBe(403);
    });

    it("GET /api/v1/admin/users should return users list for ADMIN", async () => {
      vi.mocked(sessionModule.getSession).mockResolvedValue({
        id: "admin-1",
        email: "admin@uni.edu",
        fullName: "Admin",
        role: Role.ADMIN,
        status: UserStatus.ACTIVE,
        department: "IT",
      });

      vi.mocked(AccountService.listUsers).mockResolvedValue({
        users: [
          {
            id: "user-1",
            email: "student@uni.edu",
            fullName: "Student One",
            studentId: "123",
            department: "CS",
            phone: "+9665000",
            role: Role.STUDENT,
            status: UserStatus.PENDING_APPROVAL,
            rejectionReason: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
      });

      const req = new NextRequest("http://localhost:3000/api/v1/admin/users?status=PENDING_APPROVAL");
      const res = await listUsersHandler(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.users.length).toBe(1);
    });

    it("POST /api/v1/admin/users/[id]/approve should approve pending student", async () => {
      vi.mocked(sessionModule.getSession).mockResolvedValue({
        id: "admin-1",
        email: "admin@uni.edu",
        fullName: "Admin",
        role: Role.ADMIN,
        status: UserStatus.ACTIVE,
        department: "IT",
      });

      vi.mocked(AccountService.approveStudent).mockResolvedValue({
        id: "student-1",
        email: "student@uni.edu",
        fullName: "Student One",
        studentId: "123",
        department: "CS",
        phone: "+9665000",
        role: Role.STUDENT,
        status: UserStatus.ACTIVE,
        passwordHash: "hash",
        rejectionReason: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const req = new NextRequest("http://localhost:3000/api/v1/admin/users/student-1/approve", {
        method: "POST",
      });
      const res = await approveUserHandler(req, { params: Promise.resolve({ id: "student-1" }) });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.user.status).toBe("ACTIVE");
    });

    it("POST /api/v1/admin/users/[id]/reject should reject student with reason", async () => {
      vi.mocked(sessionModule.getSession).mockResolvedValue({
        id: "admin-1",
        email: "admin@uni.edu",
        fullName: "Admin",
        role: Role.ADMIN,
        status: UserStatus.ACTIVE,
        department: "IT",
      });

      vi.mocked(AccountService.rejectStudent).mockResolvedValue({
        id: "student-1",
        email: "student@uni.edu",
        fullName: "Student One",
        studentId: "123",
        department: "CS",
        phone: "+9665000",
        role: Role.STUDENT,
        status: UserStatus.REJECTED,
        passwordHash: "hash",
        rejectionReason: "وثائق غير مكتملة",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const req = new NextRequest("http://localhost:3000/api/v1/admin/users/student-1/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "وثائق غير مكتملة" }),
      });
      const res = await rejectUserHandler(req, { params: Promise.resolve({ id: "student-1" }) });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.user.status).toBe("REJECTED");
      expect(data.user.rejectionReason).toBe("وثائق غير مكتملة");
    });
  });
});
