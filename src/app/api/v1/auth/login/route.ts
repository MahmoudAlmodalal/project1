import { NextRequest, NextResponse } from "next/server";
import { AccountService } from "@/services/account.service";
import { signToken, setSessionCookie } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    const user = await AccountService.authenticateUser(email, password);

    const sessionPayload = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      status: user.status,
      studentId: user.studentId,
      department: user.department,
    };

    const token = await signToken(sessionPayload);
    await setSessionCookie(token);

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        full_name: user.fullName,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error: any) {
    const message = error.message || "Failed to authenticate";
    const [errorCode] = message.split(":");

    if (errorCode === "ACCOUNT_PENDING") {
      return NextResponse.json(
        { error: "ACCOUNT_PENDING", message },
        { status: 403 }
      );
    }

    if (errorCode.startsWith("ACCOUNT_REJECTED")) {
      return NextResponse.json(
        { error: "ACCOUNT_REJECTED", message },
        { status: 403 }
      );
    }

    if (errorCode === "INVALID_CREDENTIALS") {
      return NextResponse.json(
        { error: "INVALID_CREDENTIALS", message },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "AUTH_ERROR", message },
      { status: 400 }
    );
  }
}
