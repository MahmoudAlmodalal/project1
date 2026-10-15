import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { CounterService } from "@/services/counter.service";
import { Role, DamageSeverity } from "@prisma/client";

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
        { error: "FORBIDDEN", message: "Counter returns require administrative privileges" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { condition, severity, notes } = body;

    let result;
    if (condition === "DAMAGED") {
      result = await CounterService.returnDamaged({
        loanId: id,
        adminId: session.id,
        severity: severity as DamageSeverity,
        notes: notes || "",
      });
    } else {
      result = await CounterService.returnHealthy(id, session.id);
    }

    return NextResponse.json({
      success: true,
      loan_id: result.id,
      status: result.status,
      returned_at: result.returnedAt,
      stock_credited: result.stockCredited,
    });
  } catch (error: any) {
    const message = error?.message || "Internal server error";
    if (message.startsWith("LOAN_NOT_FOUND")) {
      return NextResponse.json({ error: "LOAN_NOT_FOUND", message }, { status: 404 });
    }
    if (
      message.startsWith("INVALID_STATUS") ||
      message.startsWith("STOCK_INCONSISTENCY") ||
      message.startsWith("NOTES_REQUIRED") ||
      message.startsWith("SEVERITY_REQUIRED")
    ) {
      return NextResponse.json({ error: "BAD_REQUEST", message }, { status: 400 });
    }
    return NextResponse.json({ error: "INTERNAL_ERROR", message }, { status: 500 });
  }
}
