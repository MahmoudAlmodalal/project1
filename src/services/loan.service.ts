import prisma from "@/lib/db/prisma";
import { LoanStatus, UserStatus } from "@prisma/client";

export interface CreateBookingInput {
  userId: string;
  equipmentId: string;
  durationDays: number;
  academicJustification: string;
}

export interface EquipmentFilterParams {
  category?: string;
  search?: string;
  availableOnly?: boolean;
  page?: number;
  limit?: number;
}

export class LoanService {
  /**
   * Submit a new student booking request adhering to:
   * 1. Duration between 1 and 10 days
   * 2. Non-empty justification
   * 3. Student status must be ACTIVE
   * 4. Student must not have any OVERDUE loans
   * 5. Student active loans (PENDING_REVIEW, APPROVED, CHECKED_OUT) < 2
   * 6. Equipment must exist, not archived, and have availableQuantity > 0
   */
  static async createBookingRequest(input: CreateBookingInput) {
    const { userId, equipmentId, durationDays, academicJustification } = input;

    if (!durationDays || durationDays < 1 || durationDays > 10) {
      throw new Error("DURATION_INVALID: Loan duration must be between 1 and 10 days");
    }

    if (!academicJustification || academicJustification.trim().length === 0) {
      throw new Error("JUSTIFICATION_REQUIRED: Academic justification is mandatory");
    }

    // Check student status
    const student = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!student || student.status !== UserStatus.ACTIVE) {
      throw new Error("STUDENT_NOT_ACTIVE: Student account is not active or verified");
    }

    // Check for any overdue loans
    const overdueCount = await prisma.loan.count({
      where: {
        userId,
        status: LoanStatus.OVERDUE,
      },
    });

    if (overdueCount > 0) {
      throw new Error("STUDENT_OVERDUE_BLOCKED: Borrowing privileges suspended due to overdue loans");
    }

    // Check active loan quota (< 2)
    const activeLoanCount = await prisma.loan.count({
      where: {
        userId,
        status: {
          in: [LoanStatus.PENDING_REVIEW, LoanStatus.APPROVED, LoanStatus.CHECKED_OUT],
        },
      },
    });

    if (activeLoanCount >= 2) {
      throw new Error("QUOTA_EXCEEDED: Cannot have more than 2 active loans concurrently");
    }

    // Check equipment stock availability
    const equipment = await prisma.equipment.findUnique({
      where: { id: equipmentId },
    });

    if (!equipment || equipment.isArchived) {
      throw new Error("EQUIPMENT_NOT_FOUND: Equipment item not found or archived");
    }

    if (equipment.availableQuantity < 1) {
      throw new Error("OUT_OF_STOCK: Equipment item is currently out of stock");
    }

    // Create loan in PENDING_REVIEW
    return await prisma.loan.create({
      data: {
        userId,
        equipmentId,
        durationDays,
        academicJustification: academicJustification.trim(),
        status: LoanStatus.PENDING_REVIEW,
      },
    });
  }

  /**
   * Retrieve loans requested by a specific student
   */
  static async getStudentLoans(userId: string) {
    return await prisma.loan.findMany({
      where: { userId },
      include: {
        equipment: {
          include: { category: true },
        },
      },
      orderBy: { requestedAt: "desc" },
    });
  }

  /**
   * Permit student 1-click self-cancellation while loan is in PENDING_REVIEW
   */
  static async selfCancelRequest(loanId: string, userId: string) {
    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
    });

    if (!loan || loan.userId !== userId) {
      throw new Error("LOAN_NOT_FOUND: Loan request not found or unauthorized");
    }

    if (loan.status !== LoanStatus.PENDING_REVIEW) {
      throw new Error("CANNOT_CANCEL_NON_PENDING: Only pending requests can be self-cancelled");
    }

    return await prisma.loan.update({
      where: { id: loanId },
      data: { status: LoanStatus.CANCELLED },
    });
  }

  /**
   * Catalog listing with search, category filter, and pagination
   */
  static async getCatalog(params: EquipmentFilterParams = {}) {
    const { category, search, availableOnly, page = 1, limit = 12 } = params;

    const where: any = {
      isArchived: false,
    };

    if (category) {
      where.OR = [
        { categoryId: category },
        { category: { slug: category } },
      ];
    }

    if (search && search.trim().length > 0) {
      const q = search.trim();
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { nameAr: { contains: q, mode: "insensitive" } },
            { nameEn: { contains: q, mode: "insensitive" } },
            { descriptionAr: { contains: q, mode: "insensitive" } },
            { descriptionEn: { contains: q, mode: "insensitive" } },
          ],
        },
      ];
    }

    if (availableOnly) {
      where.availableQuantity = { gt: 0 };
    }

    const skip = (page - 1) * limit;

    const [data, total, categories] = await Promise.all([
      prisma.equipment.findMany({
        where,
        include: { category: true },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.equipment.count({ where }),
      prisma.category.findMany({ orderBy: { nameAr: "asc" } }),
    ]);

    const formattedData = data.map((item) => ({
      ...item,
      isAvailable: item.availableQuantity > 0,
    }));

    return {
      data: formattedData,
      categories,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Get equipment details by ID
   */
  static async getEquipmentById(id: string) {
    const item = await prisma.equipment.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!item || item.isArchived) {
      return null;
    }

    return {
      ...item,
      isAvailable: item.availableQuantity > 0,
    };
  }
}
