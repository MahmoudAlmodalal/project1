import { describe, it, expect } from "vitest";
import { signToken, verifyToken } from "@/lib/auth/session";
import { SessionUser } from "@/types/auth";

describe("Phase 2: Auth Session Infrastructure", () => {
  const mockUser: SessionUser = {
    id: "test-user-id-123",
    email: "test.student@university.edu.sa",
    fullName: "طالب تجريبي",
    role: "STUDENT",
    status: "ACTIVE",
    studentId: "441001234",
    department: "كلية علوم الحاسب",
  };

  it("should successfully sign and verify a session JWT token", async () => {
    const token = await signToken(mockUser);
    expect(token).toBeDefined();
    expect(typeof token).toBe("string");

    const payload = await verifyToken(token);
    expect(payload).not.toBeNull();
    expect(payload?.id).toBe(mockUser.id);
    expect(payload?.email).toBe(mockUser.email);
    expect(payload?.role).toBe(mockUser.role);
    expect(payload?.status).toBe(mockUser.status);
    expect(payload?.studentId).toBe(mockUser.studentId);
  });

  it("should return null for malformed or invalid JWT tokens", async () => {
    const invalidPayload = await verifyToken("invalid.token.payload");
    expect(invalidPayload).toBeNull();
  });
});
