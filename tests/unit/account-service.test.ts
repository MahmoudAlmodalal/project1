import { describe, it, expect, vi, beforeEach } from "vitest";
import { AccountService } from "@/services/account.service";
import prisma from "@/lib/db/prisma";
import { Role, UserStatus } from "@prisma/client";

vi.mock("@/lib/db/prisma", () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
  },
}));

describe("Phase 7: AccountService Unit Tests (T043)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("registerStudent", () => {
    it("should successfully register a student with PENDING_APPROVAL status", async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.user.create).mockImplementation((async ({ data }: any) => ({
        id: "mock-student-uuid",
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
        rejectionReason: null,
      })) as any);

      const result = await AccountService.registerStudent({
        fullName: "محمد أحمد",
        email: "mohammed@university.edu.sa",
        studentId: "STD-2024-1100",
        department: "الهندسة الكهربائية",
        phone: "+966501112233",
        password: "StrongPassword123!",
      });

      expect(result.id).toBe("mock-student-uuid");
      expect(result.email).toBe("mohammed@university.edu.sa");
      expect(result.role).toBe(Role.STUDENT);
      expect(result.status).toBe(UserStatus.PENDING_APPROVAL);
      expect(result.passwordHash).toBeDefined();
      expect(result.passwordHash).not.toBe("StrongPassword123!");
    });

    it("should throw error if email or studentId already exists", async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValue({
        id: "existing-user",
        email: "mohammed@university.edu.sa",
      } as any);

      await expect(
        AccountService.registerStudent({
          fullName: "محمد أحمد",
          email: "mohammed@university.edu.sa",
          studentId: "STD-2024-1100",
          department: "الهندسة الكهربائية",
          phone: "+966501112233",
          password: "StrongPassword123!",
        })
      ).rejects.toThrow("USER_ALREADY_EXISTS");
    });

    it("should throw error if password is weak (less than 8 chars)", async () => {
      await expect(
        AccountService.registerStudent({
          fullName: "محمد أحمد",
          email: "mohammed@university.edu.sa",
          studentId: "STD-2024-1100",
          department: "الهندسة الكهربائية",
          phone: "+966501112233",
          password: "short",
        })
      ).rejects.toThrow("WEAK_PASSWORD");
    });
  });

  describe("authenticateUser", () => {
    it("should authenticate active student and return user session", async () => {
      const { hashPassword } = await import("@/services/account.service");
      const passwordHash = hashPassword("ValidPass123!");

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: "user-123",
        email: "student@university.edu.sa",
        passwordHash,
        fullName: "طالب معتمد",
        studentId: "STD-100",
        department: "علوم الحاسب",
        phone: "+966500000000",
        role: Role.STUDENT,
        status: UserStatus.ACTIVE,
        rejectionReason: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const user = await AccountService.authenticateUser(
        "student@university.edu.sa",
        "ValidPass123!"
      );

      expect(user).toBeDefined();
      expect(user.id).toBe("user-123");
      expect(user.status).toBe(UserStatus.ACTIVE);
    });

    it("should throw INVALID_CREDENTIALS for wrong password", async () => {
      const { hashPassword } = await import("@/services/account.service");
      const passwordHash = hashPassword("CorrectPass123!");

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: "user-123",
        email: "student@university.edu.sa",
        passwordHash,
        fullName: "طالب",
        studentId: "STD-100",
        department: "علوم الحاسب",
        phone: "+966500000000",
        role: Role.STUDENT,
        status: UserStatus.ACTIVE,
        rejectionReason: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(
        AccountService.authenticateUser("student@university.edu.sa", "WrongPass123!")
      ).rejects.toThrow("INVALID_CREDENTIALS");
    });

    it("should throw ACCOUNT_PENDING if status is PENDING_APPROVAL", async () => {
      const { hashPassword } = await import("@/services/account.service");
      const passwordHash = hashPassword("CorrectPass123!");

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: "user-pending",
        email: "pending@university.edu.sa",
        passwordHash,
        fullName: "طالب جديد",
        studentId: "STD-999",
        department: "الفيزياء",
        phone: "+966500000000",
        role: Role.STUDENT,
        status: UserStatus.PENDING_APPROVAL,
        rejectionReason: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(
        AccountService.authenticateUser("pending@university.edu.sa", "CorrectPass123!")
      ).rejects.toThrow("ACCOUNT_PENDING");
    });

    it("should throw ACCOUNT_REJECTED if status is REJECTED", async () => {
      const { hashPassword } = await import("@/services/account.service");
      const passwordHash = hashPassword("CorrectPass123!");

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: "user-rejected",
        email: "rejected@university.edu.sa",
        passwordHash,
        fullName: "طالب مرفوض",
        studentId: "STD-888",
        department: "الفيزياء",
        phone: "+966500000000",
        role: Role.STUDENT,
        status: UserStatus.REJECTED,
        rejectionReason: "البيانات الأكاديمية غير مطابقة",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(
        AccountService.authenticateUser("rejected@university.edu.sa", "CorrectPass123!")
      ).rejects.toThrow("ACCOUNT_REJECTED: البيانات الأكاديمية غير مطابقة");
    });
  });

  describe("Admin approval and rejection", () => {
    it("should approve student and transition to ACTIVE", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: "user-pending",
        role: Role.STUDENT,
        status: UserStatus.PENDING_APPROVAL,
      } as any);

      vi.mocked(prisma.user.update).mockResolvedValue({
        id: "user-pending",
        status: UserStatus.ACTIVE,
        rejectionReason: null,
      } as any);

      const updated = await AccountService.approveStudent("user-pending");
      expect(updated.status).toBe(UserStatus.ACTIVE);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-pending" },
        data: { status: UserStatus.ACTIVE, rejectionReason: null },
      });
    });

    it("should reject student with mandatory reason", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: "user-pending",
        role: Role.STUDENT,
        status: UserStatus.PENDING_APPROVAL,
      } as any);

      vi.mocked(prisma.user.update).mockResolvedValue({
        id: "user-pending",
        status: UserStatus.REJECTED,
        rejectionReason: "رقم البطاقة الجامعية غير سليم",
      } as any);

      const updated = await AccountService.rejectStudent(
        "user-pending",
        "رقم البطاقة الجامعية غير سليم"
      );
      expect(updated.status).toBe(UserStatus.REJECTED);
      expect(updated.rejectionReason).toBe("رقم البطاقة الجامعية غير سليم");
    });

    it("should throw error if reject reason is empty", async () => {
      await expect(
        AccountService.rejectStudent("user-pending", "   ")
      ).rejects.toThrow("REJECTION_REASON_REQUIRED");
    });
  });
});
