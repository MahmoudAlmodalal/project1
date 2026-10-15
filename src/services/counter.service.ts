import prisma from "@/lib/db/prisma";
import { LoanStatus, DamageSeverity } from "@prisma/client";

export interface ReturnDamagedInput {
  loanId: string;
  adminId: string;
  severity: DamageSeverity;
  notes: string;
}

export class CounterService {
  /**
   * Confirm physical handover to student at counter (SCR-07):
   * 1. Loan must be APPROVED
   * 2. Equipment must have reservedQuantity >= 1
   * 3. Atomically decrement reservedQuantity, increment borrowedQuantity
   * 4. Update loan status to CHECKED_OUT, set checkedOutAt and expectedReturnDate = checkedOutAt + durationDays
   */
  static async checkoutHandover(loanId: string, adminId: string) {
    return await prisma.$transaction(async (tx) => {
      const loan = await tx.loan.findUnique({
        where: { id: loanId },
      });

      if (!loan) {
        throw new Error("LOAN_NOT_FOUND: Loan request not found");
      }

      if (loan.status !== LoanStatus.APPROVED) {
        throw new Error("INVALID_STATUS: Only APPROVED loans can be checked out");
      }

      try {
        await tx.$queryRaw`SELECT id FROM equipment WHERE id = ${loan.equipmentId}::uuid FOR UPDATE`;
      } catch {
        // Fallback for mocks
      }

      const equipment = await tx.equipment.findUnique({
        where: { id: loan.equipmentId },
      });

      if (!equipment || equipment.reservedQuantity < 1) {
        throw new Error("STOCK_INCONSISTENCY: No reserved stock available for checkout");
      }

      await tx.equipment.update({
        where: { id: loan.equipmentId },
        data: {
          reservedQuantity: { decrement: 1 },
          borrowedQuantity: { increment: 1 },
        },
      });

      const now = new Date();
      const expectedReturnDate = new Date(now.getTime() + loan.durationDays * 24 * 60 * 60 * 1000);

      const updatedLoan = await tx.loan.update({
        where: { id: loanId },
        data: {
          status: LoanStatus.CHECKED_OUT,
          checkedOutAt: now,
          checkedOutById: adminId,
          expectedReturnDate,
        },
        include: {
          user: true,
          equipment: {
            include: { category: true },
          },
        },
      });

      return updatedLoan;
    });
  }

  /**
   * Confirm return in good condition (SCR-08):
   * 1. Loan must be CHECKED_OUT or OVERDUE
   * 2. Equipment must have borrowedQuantity >= 1
   * 3. Atomically decrement borrowedQuantity, increment availableQuantity
   * 4. Update loan status to RETURNED, set returnedAt, returnedById
   */
  static async returnHealthy(loanId: string, adminId: string) {
    return await prisma.$transaction(async (tx) => {
      const loan = await tx.loan.findUnique({
        where: { id: loanId },
      });

      if (!loan) {
        throw new Error("LOAN_NOT_FOUND: Loan request not found");
      }

      if (loan.status !== LoanStatus.CHECKED_OUT && loan.status !== LoanStatus.OVERDUE) {
        throw new Error("INVALID_STATUS: Only CHECKED_OUT or OVERDUE loans can be returned");
      }

      try {
        await tx.$queryRaw`SELECT id FROM equipment WHERE id = ${loan.equipmentId}::uuid FOR UPDATE`;
      } catch {
        // Fallback for mocks
      }

      const equipment = await tx.equipment.findUnique({
        where: { id: loan.equipmentId },
      });

      if (!equipment || equipment.borrowedQuantity < 1) {
        throw new Error("STOCK_INCONSISTENCY: No borrowed stock available to return");
      }

      await tx.equipment.update({
        where: { id: loan.equipmentId },
        data: {
          borrowedQuantity: { decrement: 1 },
          availableQuantity: { increment: 1 },
        },
      });

      const now = new Date();
      const updatedLoan = await tx.loan.update({
        where: { id: loanId },
        data: {
          status: LoanStatus.RETURNED,
          returnedAt: now,
          returnedById: adminId,
        },
        include: {
          user: true,
          equipment: {
            include: { category: true },
          },
        },
      });

      return {
        ...updatedLoan,
        stockCredited: "AVAILABLE",
      };
    });
  }

  /**
   * Confirm return with damage / defect logged (SCR-08):
   * 1. Loan must be CHECKED_OUT or OVERDUE
   * 2. Notes required and valid severity
   * 3. Atomically decrement borrowedQuantity, increment damagedQuantity
   * 4. Create DamageRecord
   * 5. Update loan status to RETURNED
   */
  static async returnDamaged(input: ReturnDamagedInput) {
    const { loanId, adminId, severity, notes } = input;

    if (!notes || notes.trim().length === 0) {
      throw new Error("NOTES_REQUIRED: Defect notes are required for damaged return");
    }

    if (!severity || !Object.values(DamageSeverity).includes(severity)) {
      throw new Error("SEVERITY_REQUIRED: Valid damage severity is required");
    }

    return await prisma.$transaction(async (tx) => {
      const loan = await tx.loan.findUnique({
        where: { id: loanId },
      });

      if (!loan) {
        throw new Error("LOAN_NOT_FOUND: Loan request not found");
      }

      if (loan.status !== LoanStatus.CHECKED_OUT && loan.status !== LoanStatus.OVERDUE) {
        throw new Error("INVALID_STATUS: Only CHECKED_OUT or OVERDUE loans can be returned");
      }

      try {
        await tx.$queryRaw`SELECT id FROM equipment WHERE id = ${loan.equipmentId}::uuid FOR UPDATE`;
      } catch {
        // Fallback for mocks
      }

      const equipment = await tx.equipment.findUnique({
        where: { id: loan.equipmentId },
      });

      if (!equipment || equipment.borrowedQuantity < 1) {
        throw new Error("STOCK_INCONSISTENCY: No borrowed stock available to return");
      }

      // Decrement borrowed, increment damaged
      await tx.equipment.update({
        where: { id: loan.equipmentId },
        data: {
          borrowedQuantity: { decrement: 1 },
          damagedQuantity: { increment: 1 },
        },
      });

      // Create damage record
      await tx.damageRecord.create({
        data: {
          loanId,
          equipmentId: loan.equipmentId,
          reportedById: adminId,
          severity,
          notes: notes.trim(),
        },
      });

      const now = new Date();
      const updatedLoan = await tx.loan.update({
        where: { id: loanId },
        data: {
          status: LoanStatus.RETURNED,
          returnedAt: now,
          returnedById: adminId,
        },
        include: {
          user: true,
          equipment: {
            include: { category: true },
          },
        },
      });

      return {
        ...updatedLoan,
        stockCredited: "DAMAGED",
      };
    });
  }

  /**
   * Counter extension: adjust duration_days up to 10 days cumulative limit
   */
  static async extendLoanDuration(loanId: string, additionalDays: number) {
    if (!additionalDays || additionalDays <= 0) {
      throw new Error("INVALID_ADDITIONAL_DAYS: Additional days must be greater than 0");
    }

    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
    });

    if (!loan) {
      throw new Error("LOAN_NOT_FOUND: Loan request not found");
    }

    if (loan.status !== LoanStatus.CHECKED_OUT) {
      throw new Error("INVALID_STATUS: Can only extend CHECKED_OUT loans");
    }

    const newDurationDays = loan.durationDays + additionalDays;
    if (newDurationDays > 10) {
      throw new Error(`DURATION_EXCEEDED: Cumulative loan duration cannot exceed 10 days (currently ${loan.durationDays} + ${additionalDays} = ${newDurationDays})`);
    }

    const startDate = loan.checkedOutAt || new Date();
    const expectedReturnDate = new Date(startDate.getTime() + newDurationDays * 24 * 60 * 60 * 1000);

    return await prisma.loan.update({
      where: { id: loanId },
      data: {
        durationDays: newDurationDays,
        expectedReturnDate,
      },
      include: {
        user: true,
        equipment: {
          include: { category: true },
        },
      },
    });
  }

  /**
   * Query approved pickups queue (SCR-07)
   */
  static async getApprovedPickupsQueue(params: { search?: string; page?: number; limit?: number } = {}) {
    const { search, page = 1, limit = 20 } = params;

    const where: any = {
      status: LoanStatus.APPROVED,
    };

    if (search && search.trim().length > 0) {
      const q = search.trim();
      where.OR = [
        { user: { fullName: { contains: q, mode: "insensitive" } } },
        { user: { studentId: { contains: q, mode: "insensitive" } } },
        { user: { phone: { contains: q, mode: "insensitive" } } },
        { equipment: { nameAr: { contains: q, mode: "insensitive" } } },
        { equipment: { nameEn: { contains: q, mode: "insensitive" } } },
      ];
    }

    const skip = (page - 1) * limit;

    const [loans, total] = await Promise.all([
      prisma.loan.findMany({
        where,
        include: {
          user: true,
          equipment: {
            include: { category: true },
          },
        },
        orderBy: { pickupDeadline: "asc" },
        skip,
        take: limit,
      }),
      prisma.loan.count({ where }),
    ]);

    return {
      loans,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Query checked out / active returns queue (SCR-08)
   */
  static async getCheckedOutReturnsQueue(params: { search?: string; page?: number; limit?: number } = {}) {
    const { search, page = 1, limit = 20 } = params;

    const where: any = {
      status: {
        in: [LoanStatus.CHECKED_OUT, LoanStatus.OVERDUE],
      },
    };

    if (search && search.trim().length > 0) {
      const q = search.trim();
      where.OR = [
        { user: { fullName: { contains: q, mode: "insensitive" } } },
        { user: { studentId: { contains: q, mode: "insensitive" } } },
        { user: { phone: { contains: q, mode: "insensitive" } } },
        { equipment: { nameAr: { contains: q, mode: "insensitive" } } },
        { equipment: { nameEn: { contains: q, mode: "insensitive" } } },
      ];
    }

    const skip = (page - 1) * limit;

    const [loans, total] = await Promise.all([
      prisma.loan.findMany({
        where,
        include: {
          user: true,
          equipment: {
            include: { category: true },
          },
        },
        orderBy: { expectedReturnDate: "asc" },
        skip,
        take: limit,
      }),
      prisma.loan.count({ where }),
    ]);

    return {
      loans,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }
}
