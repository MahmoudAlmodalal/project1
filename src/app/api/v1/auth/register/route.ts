import { NextRequest, NextResponse } from "next/server";
import { AccountService } from "@/services/account.service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { full_name, email, student_id, department, phone, password } = body;

    const user = await AccountService.registerStudent({
      fullName: full_name,
      email,
      studentId: student_id,
      department,
      phone,
      password,
    });

    return NextResponse.json(
      {
        success: true,
        message: "تم تسجيل حسابك بنجاح وهو بانتظار اعتماد مسؤول المعمل",
        user: {
          id: user.id,
          full_name: user.fullName,
          email: user.email,
          role: user.role,
          status: user.status,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    const message = error.message || "Failed to register user";
    const [errorCode] = message.split(":");
    return NextResponse.json(
      { error: errorCode.trim(), message },
      { status: 400 }
    );
  }
}
