import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { CounterService } from "@/services/counter.service";
import { Role } from "@prisma/client";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "UNAUTHORIZED", message: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== Role.ADMIN) {
      return NextResponse.json(
        { error: "FORBIDDEN", message: "Counter checkout requires administrative privileges" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const updatedLoan = await CounterService.checkoutHandover(id, session.id);

    return NextResponse.json({
      success: true,
      loan_id: updatedLoan.id,
      status: updatedLoan.status,
      checked_out_at: updatedLoan.checkedOutAt,
      expected_return_date: updatedLoan.expectedReturnDate,
    });
  } catch (error: any) {
    const message = error?.message || "Internal server error";
    if (message.startsWith("LOAN_NOT_FOUND")) {
      return NextResponse.json({ error: "LOAN_NOT_FOUND", message }, { status: 404 });
    }
    if (message.startsWith("INVALID_STATUS") || message.startsWith("STOCK_INCONSISTENCY")) {
      return NextResponse.json({ error: "BAD_REQUEST", message }, { status: 400 });
    }
    return NextResponse.json({ error: "INTERNAL_ERROR", message }, { status: 500 });
  }
}
