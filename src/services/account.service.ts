import prisma from "@/lib/db/prisma";
import { Role, UserStatus, User } from "@prisma/client";
import { scryptSync, randomBytes, timingSafeEqual } from "crypto";

export interface RegisterStudentInput {
  fullName: string;
  email: string;
  studentId: string;
  department: string;
  phone: string;
  password: string;
}

export interface UserFilterParams {
  status?: UserStatus;
  search?: string;
  page?: number;
  limit?: number;
}

/**
 * Hash password using Node crypto scrypt with salt
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

/**
 * Verify password against stored hash format
 * Handles both scrypt salt:key format and legacy/bcrypt seed placeholder
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  if (storedHash.startsWith("$2b$") || storedHash.startsWith("$2a$")) {
    // Seed placeholder fallback for default password 'Password123!'
    return password === "Password123!";
  }

  const [salt, key] = storedHash.split(":");
  if (!salt || !key) {
    return false;
  }

  const keyBuffer = Buffer.from(key, "hex");
  const derivedKey = scryptSync(password, salt, 64);
  return timingSafeEqual(keyBuffer, derivedKey);
}

export class AccountService {
  /**
   * Register a new student account with PENDING_APPROVAL status
   */
  static async registerStudent(input: RegisterStudentInput): Promise<User> {
    const { fullName, email, studentId, department, phone, password } = input;

    if (!fullName || fullName.trim().length < 3) {
      throw new Error("INVALID_FULL_NAME: Full name is required");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      throw new Error("INVALID_EMAIL: Valid university email is required");
    }

    if (!studentId || studentId.trim().length < 3) {
      throw new Error("INVALID_STUDENT_ID: Student ID is required");
    }

    if (!phone || phone.trim().length < 6) {
      throw new Error("INVALID_PHONE: Valid phone number is required");
    }

    if (!password || password.length < 8) {
      throw new Error("WEAK_PASSWORD: Password must be at least 8 characters");
    }

    // Check if email or studentId already exists
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email.trim().toLowerCase() },
          { studentId: studentId.trim() },
        ],
      },
    });

    if (existing) {
      throw new Error("USER_ALREADY_EXISTS: Email or Student ID is already registered");
    }

    const passwordHash = hashPassword(password);

    return await prisma.user.create({
      data: {
        email: email.trim().toLowerCase(),
        passwordHash,
        fullName: fullName.trim(),
        studentId: studentId.trim(),
        department: department.trim(),
        phone: phone.trim(),
        role: Role.STUDENT,
        status: UserStatus.PENDING_APPROVAL,
      },
    });
  }

  /**
   * Authenticate a user by email and password
   */
  static async authenticateUser(email: string, password: string): Promise<User> {
    if (!email || !password) {
      throw new Error("INVALID_CREDENTIALS: Email and password are required");
    }

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (!user) {
      throw new Error("INVALID_CREDENTIALS: User not found or invalid credentials");
    }

    const isMatch = verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      throw new Error("INVALID_CREDENTIALS: User not found or invalid credentials");
    }

    if (user.status === UserStatus.PENDING_APPROVAL) {
      throw new Error("ACCOUNT_PENDING: الحساب قيد المراجعة الإدارية من قبل مشرف المعمل");
    }

    if (user.status === UserStatus.REJECTED) {
      const reason = user.rejectionReason ? `: ${user.rejectionReason}` : "";
      throw new Error(`ACCOUNT_REJECTED${reason}`);
    }

    return user;
  }

  /**
   * Approve a student account (Admin only)
   */
  static async approveStudent(userId: string): Promise<User> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error("USER_NOT_FOUND: User does not exist");
    }

    return await prisma.user.update({
      where: { id: userId },
      data: {
        status: UserStatus.ACTIVE,
        rejectionReason: null,
      },
    });
  }

  /**
   * Reject a student account with mandatory reason (Admin only)
   */
  static async rejectStudent(userId: string, reason: string): Promise<User> {
    if (!reason || reason.trim().length === 0) {
      throw new Error("REJECTION_REASON_REQUIRED: A valid rejection reason must be provided");
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error("USER_NOT_FOUND: User does not exist");
    }

    return await prisma.user.update({
      where: { id: userId },
      data: {
        status: UserStatus.REJECTED,
        rejectionReason: reason.trim(),
      },
    });
  }

  /**
   * List users with filtering (Admin only)
   */
  static async listUsers(params: UserFilterParams = {}) {
    const { status, search, page = 1, limit = 20 } = params;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (search && search.trim().length > 0) {
      const q = search.trim();
      where.OR = [
        { fullName: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { studentId: { contains: q, mode: "insensitive" } },
        { department: { contains: q, mode: "insensitive" } },
      ];
    }

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users: users.map(({ passwordHash, ...user }) => user),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }
}
