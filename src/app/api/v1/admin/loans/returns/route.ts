import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { CounterService } from "@/services/counter.service";
import { Role } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "UNAUTHORIZED", message: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== Role.ADMIN) {
      return NextResponse.json(
        { error: "FORBIDDEN", message: "Administrative privileges required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const result = await CounterService.getCheckedOutReturnsQueue({
      search,
      page,
      limit,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
