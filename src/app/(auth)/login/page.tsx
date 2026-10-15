"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDirection } from "@/components/layout/DirectionProvider";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Lock, Mail, AlertTriangle, AlertCircle, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useDirection();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingWarning, setPendingWarning] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setPendingWarning(null);

    if (!email || !password) {
      setErrorMessage(
        t(
          "يرجى إدخال البريد الإلكتروني الجامعي وكلمة المرور",
          "Please enter university email and password"
        )
      );
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === "ACCOUNT_PENDING") {
          setPendingWarning(
            t(
              "حسابك قيد المراجعة الإدارية من قبل مشرف المعمل. سيتم تفعيله خلال 24 ساعة.",
              "Your student account is pending approval by lab administration. It will be activated within 24 hours."
            )
          );
        } else if (data.error === "ACCOUNT_REJECTED") {
          setErrorMessage(
            data.message ||
              t(
                "تم رفض طلب تسجيل حسابك من قبل الإدارة.",
                "Your account registration was rejected by administration."
              )
          );
        } else {
          setErrorMessage(
            data.message ||
              t(
                "البريد الإلكتروني أو كلمة المرور غير صحيحة",
                "Invalid university email or password"
              )
          );
        }
        return;
      }

      // Successful login redirect based on role
      if (data.user.role === "ADMIN") {
        router.push("/admin/queue");
      } else {
        router.push("/catalog");
      }
      router.refresh();
    } catch {
      setErrorMessage(
        t(
          "حدث خطأ أثناء الاتصال بالخادم. يرجى المحاولة لاحقاً.",
          "Connection error. Please try again later."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg border-muted">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">
            {t("تسجيل الدخول", "Sign In")}
          </CardTitle>
          <CardDescription>
            {t(
              "أدخل بريدك الجامعي وكلمة المرور للوصول إلى المنصة",
              "Enter your university credentials to access the platform"
            )}
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {/* Pending Amber Banner */}
            {pendingWarning && (
              <div
                role="alert"
                className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-3.5 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/50 dark:text-amber-200"
              >
                <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold">
                    {t("الحساب قيد المراجعة", "Account Under Review")}
                  </p>
                  <p className="mt-0.5 text-xs text-amber-800 dark:text-amber-300">
                    {pendingWarning}
                  </p>
                </div>
              </div>
            )}

            {/* Error Red Banner */}
            {errorMessage && (
              <div
                role="alert"
                className="flex items-start gap-3 rounded-lg border border-red-300 bg-red-50 p-3.5 text-sm text-red-900 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-200"
              >
                <AlertCircle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
                <div className="flex-1">{errorMessage}</div>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-sm font-medium text-foreground block"
              >
                {t("البريد الإلكتروني الجامعي", "University Email")}
              </label>
              <div className="relative">
                <Mail className="absolute start-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  required
                  placeholder="name@university.edu.sa"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="ps-9"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password Field with toggle */}
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-sm font-medium text-foreground block"
              >
                {t("كلمة المرور", "Password")}
              </label>
              <div className="relative">
                <Lock className="absolute start-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="ps-9 pe-9"
                  disabled={loading}
                />
                <button
                  type="button"
                  aria-label={
                    showPassword
                      ? t("إخفاء كلمة المرور", "Hide password")
                      : t("إظهار كلمة المرور", "Show password")
                  }
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute end-3 top-3 text-muted-foreground hover:text-foreground focus:outline-none"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 me-2 animate-spin" />
                  {t("جارٍ التحقق...", "Verifying...")}
                </>
              ) : (
                t("تسجيل الدخول", "Sign In")
              )}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              {t("ليس لديك حساب طالب؟", "Don't have a student account?")}{" "}
              <Link
                href="/register"
                className="font-medium text-primary hover:underline"
              >
                {t("إنشاء حساب جديد (SCR-02)", "Register Student (SCR-02)")}
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
