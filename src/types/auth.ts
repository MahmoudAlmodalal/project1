import { Role, UserStatus } from "@prisma/client";

export interface SessionUser {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  status: UserStatus;
  studentId?: string | null;
  department: string;
}

export interface AuthTokenPayload extends SessionUser {
  exp?: number;
  iat?: number;
}
