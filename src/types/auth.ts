export type Role = "STUDENT" | "ADMIN";
export type UserStatus = "ACTIVE" | "PENDING_APPROVAL" | "SUSPENDED" | "REJECTED";
export interface SessionUser { id: string; email: string; fullName: string; role: Role; status: UserStatus; studentId?: string | null; }
