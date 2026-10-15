import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { CounterService } from "@/services/counter.service";
import { Role } from "@prisma/client";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "UNAUTHORIZED", message: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== Role.ADMIN) {
      return NextResponse.json(
        { error: "FORBIDDEN", message: "Counter extensions require administrative privileges" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { additional_days } = body;

    const days = parseInt(additional_days, 10);
    if (isNaN(days) || days <= 0) {
      return NextResponse.json(
        { error: "BAD_REQUEST", message: "additional_days must be a positive integer" },
        { status: 400 }
      );
    }

    const result = await CounterService.extendLoanDuration(id, days);

    return NextResponse.json({
      success: true,
      loan_id: result.id,
      new_duration_days: result.durationDays,
      expected_return_date: result.expectedReturnDate,
    });
  } catch (error: any) {
    const message = error?.message || "Internal server error";
    if (message.startsWith("LOAN_NOT_FOUND")) {
      return NextResponse.json({ error: "LOAN_NOT_FOUND", message }, { status: 404 });
    }
    if (message.startsWith("INVALID_STATUS") || message.startsWith("DURATION_EXCEEDED") || message.startsWith("INVALID_ADDITIONAL_DAYS")) {
      return NextResponse.json({ error: "BAD_REQUEST", message }, { status: 400 });
    }
    return NextResponse.json({ error: "INTERNAL_ERROR", message }, { status: 500 });
  }
}
