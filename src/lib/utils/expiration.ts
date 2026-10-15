import prisma from "@/lib/db/prisma";
import { LoanStatus } from "@prisma/client";

export interface SweepExpiredReservationsResult {
  expiredCount: number;
  expiredLoanIds: string[];
}

/**
 * Sweep approved loans whose 48-hour pickup deadline has passed without handover.
 * Atomically marks them as EXPIRED and returns the reserved stock back to available_quantity.
 */
export async function sweepExpiredReservations(
  now: Date = new Date()
): Promise<SweepExpiredReservationsResult> {
  return await prisma.$transaction(async (tx) => {
    // 1. Find all APPROVED loans where pickupDeadline is past
    const expiredLoans = await tx.loan.findMany({
      where: {
        status: LoanStatus.APPROVED,
        pickupDeadline: {
          lt: now,
        },
      },
      select: {
        id: true,
        equipmentId: true,
      },
    });

    if (expiredLoans.length === 0) {
      return { expiredCount: 0, expiredLoanIds: [] };
    }

    const expiredLoanIds = expiredLoans.map((l) => l.id);

    // 2. Mark loans as EXPIRED
    await tx.loan.updateMany({
      where: {
        id: { in: expiredLoanIds },
      },
      data: {
        status: LoanStatus.EXPIRED,
      },
    });

    // 3. Reconcile stock for each affected equipment
    // Count how many reservations expired per equipmentId
    const equipmentCounts = new Map<string, number>();
    for (const loan of expiredLoans) {
      equipmentCounts.set(
        loan.equipmentId,
        (equipmentCounts.get(loan.equipmentId) || 0) + 1
      );
    }

    for (const [equipId, count] of equipmentCounts.entries()) {
      await tx.equipment.update({
        where: { id: equipId },
        data: {
          reservedQuantity: { decrement: count },
          availableQuantity: { increment: count },
        },
      });
    }

    return {
      expiredCount: expiredLoans.length,
      expiredLoanIds,
    };
  });
}
