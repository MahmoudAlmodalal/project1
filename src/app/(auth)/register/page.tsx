"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDirection } from "@/components/layout/DirectionProvider";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, AlertCircle, Loader2, User, Mail, Hash, Building, Phone, Lock, Eye, EyeOff } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useDirection();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    studentId: "",
    department: "كلية علوم الحاسب والمعلومات (Computer Science)",
    phone: "",
    password: "",
    confirmPassword: "",
    policyAccepted: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const departments = [
    { ar: "كلية علوم الحاسب والمعلومات", en: "College of Computer & Info Sciences" },
    { ar: "قسم الهندسة الميكانيكية", en: "Mechanical Engineering" },
    { ar: "قسم الهندسة الكهربائية والإلكترونية", en: "Electrical & Electronic Engineering" },
    { ar: "قسم الروبوتات والذكاء الاصطناعي", en: "Robotics & Artificial Intelligence" },
    { ar: "كلية العلوم التطبيقية والفيزياء", en: "Applied Sciences & Physics" },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, textAr: "", textEn: "", color: "" };
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    if (score <= 1) return { score: 1, textAr: "ضعيفة", textEn: "Weak", color: "bg-red-500" };
    if (score === 2) return { score: 2, textAr: "متوسطة", textEn: "Medium", color: "bg-amber-500" };
    if (score >= 3) return { score: 3, textAr: "قوية", textEn: "Strong", color: "bg-emerald-500" };
    return { score: 0, textAr: "", textEn: "", color: "" };
  };

  const strength = getPasswordStrength(formData.password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage(t("كلمتا المرور غير متطابقتين", "Passwords do not match"));
      return;
    }

    if (formData.password.length < 8) {
      setErrorMessage(
        t(
          "كلمة المرور يجب أن تتكون من 8 خانات على الأقل",
          "Password must be at least 8 characters long"
        )
      );
      return;
    }

    if (!formData.policyAccepted) {
      setErrorMessage(
        t(
          "يجب الموافقة على التعهد بحفظ الأجهزة وسياسة المعمل",
          "You must accept the equipment custody terms and lab policy"
        )
      );
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: formData.fullName,
          email: formData.email,
          student_id: formData.studentId,
          department: formData.department,
          phone: formData.phone,
          password: formData.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === "USER_ALREADY_EXISTS") {
          setErrorMessage(
            t(
              "البريد الجامعي أو الرقم الأكاديمي مسجل مسبقاً في النظام",
              "University email or Student ID is already registered"
            )
          );
        } else {
          setErrorMessage(data.message || t("حدث خطأ أثناء التسجيل", "Failed to register"));
        }
        return;
      }

      setIsSuccess(true);
    } catch {
      setErrorMessage(
        t("تعذر الاتصال بالخادم. يرجى المحاولة لاحقاً", "Server connection error")
      );
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
        <Card className="w-full max-w-lg shadow-xl border-emerald-200 dark:border-emerald-950">
          <CardHeader className="text-center space-y-3">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <CardTitle className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
              {t("تم تسجيل حسابك بنجاح!", "Registration Successful!")}
            </CardTitle>
            <CardDescription className="text-base text-muted-foreground leading-relaxed">
              {t(
                "طلبك بانتظار اعتماد مشرف المعمل خلال 24 ساعة (حالة الحساب: قيد المراجعة). ستتمكن من تسجيل الدخول فور تدقيق واعتماد بياناتك الأكاديمية.",
                "Your request is pending lab administrator verification within 24 hours (Status: PENDING_APPROVAL). You can sign in once approved."
              )}
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center pt-2">
            <Button asChild className="w-full sm:w-auto px-8">
              <Link href="/login">
                {t("الذهاب لصفحة تسجيل الدخول (SCR-01)", "Go to Sign In (SCR-01)")}
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-xl border-muted">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">
            {t("تسجيل حساب طالب جديد (SCR-02)", "Student Registration (SCR-02)")}
          </CardTitle>
          <CardDescription>
            {t(
              "أدخل بياناتك الأكاديمية والشخصية لاعتماد حسابك في منصة استعارة العتاد",
              "Enter your academic and personal details to request platform borrowing access"
            )}
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {/* Error Banner */}
            {errorMessage && (
              <div
                role="alert"
                className="flex items-start gap-3 rounded-lg border border-red-300 bg-red-50 p-3.5 text-sm text-red-900 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-200"
              >
                <AlertCircle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
                <div className="flex-1">{errorMessage}</div>
              </div>
            )}

            {/* 2-Column Responsive Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="space-y-2">
                <label
                  htmlFor="fullName"
                  className="text-sm font-medium text-foreground block"
                >
                  {t("الاسم الكامل رباعياً", "Full Name")} *
                </label>
                <div className="relative">
                  <User className="absolute start-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    name="fullName"
                    required
                    placeholder={t("خالد عبد الله المنصور", "Khalid Al-Mansoor")}
                    value={formData.fullName}
                    onChange={handleChange}
                    className="ps-9"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Student ID */}
              <div className="space-y-2">
                <label
                  htmlFor="studentId"
                  className="text-sm font-medium text-foreground block"
                >
                  {t("الرقم الأكاديمي / الجامعي", "Student ID Number")} *
                </label>
                <div className="relative">
                  <Hash className="absolute start-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="studentId"
                    name="studentId"
                    required
                    placeholder="441009823"
                    value={formData.studentId}
                    onChange={handleChange}
                    className="ps-9"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* University Email */}
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-foreground block"
                >
                  {t("البريد الإلكتروني الجامعي", "University Email")} *
                </label>
                <div className="relative">
                  <Mail className="absolute start-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="student@university.edu.sa"
                    value={formData.email}
                    onChange={handleChange}
                    className="ps-9"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div className="space-y-2">
                <label
                  htmlFor="phone"
                  className="text-sm font-medium text-foreground block"
                >
                  {t("رقم الجوال الفعال", "Mobile Phone")} *
                </label>
                <div className="relative">
                  <Phone className="absolute start-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    name="phone"
                    required
                    placeholder="+966 50 123 4567"
                    value={formData.phone}
                    onChange={handleChange}
                    className="ps-9"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Department Dropdown */}
              <div className="space-y-2 md:col-span-2">
                <label
                  htmlFor="department"
                  className="text-sm font-medium text-foreground block"
                >
                  {t("القسم / التخصص الأكاديمي", "Department / Specialization")} *
                </label>
                <div className="relative">
                  <Building className="absolute start-3 top-3 h-4 w-4 text-muted-foreground" />
                  <select
                    id="department"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    disabled={loading}
                    className="flex h-10 w-full rounded-md border border-input bg-background ps-9 pe-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {departments.map((dep, idx) => (
                      <option key={idx} value={t(dep.ar, dep.en)}>
                        {t(dep.ar, dep.en)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-foreground block"
                >
                  {t("كلمة المرور", "Password")} *
                </label>
                <div className="relative">
                  <Lock className="absolute start-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
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
                {/* Strength meter */}
                {formData.password && (
                  <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                    <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full ${strength.color} transition-all duration-300`}
                        style={{ width: `${(strength.score / 3) * 100}%` }}
                      />
                    </div>
                    <span>{t(strength.textAr, strength.textEn)}</span>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <label
                  htmlFor="confirmPassword"
                  className="text-sm font-medium text-foreground block"
                >
                  {t("تأكيد كلمة المرور", "Confirm Password")} *
                </label>
                <div className="relative">
                  <Lock className="absolute start-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="ps-9"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Policy Checkbox */}
            <div className="flex items-start gap-3 rounded-lg border border-muted p-3 bg-muted/20 mt-4">
              <input
                id="policyAccepted"
                name="policyAccepted"
                type="checkbox"
                required
                checked={formData.policyAccepted}
                onChange={handleChange}
                disabled={loading}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label
                htmlFor="policyAccepted"
                className="text-xs text-muted-foreground leading-relaxed cursor-pointer"
              >
                {t(
                  "أتعهد بالمحافظة على كافة الأجهزة المعملية المستعارة وإعادتها في الموعد المحدد (بحد أقصى 10 أيام) بحالتها السليمة، والالتزام بلائحة الاستعارة الأكاديمية.",
                  "I pledge to preserve all borrowed lab equipment, return items on time (max 10 days) in good condition, and adhere strictly to lab policy."
                )}
              </label>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4 pt-2">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 me-2 animate-spin" />
                  {t("جارٍ تسجيل الحساب...", "Registering...")}
                </>
              ) : (
                t("إنشاء حساب طالب وإرسال الطلب", "Create Student Account & Submit")
              )}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              {t("لديك حساب مسجل بالفعل؟", "Already have an account?")}{" "}
              <Link
                href="/login"
                className="font-medium text-primary hover:underline"
              >
                {t("تسجيل الدخول (SCR-01)", "Sign In (SCR-01)")}
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
