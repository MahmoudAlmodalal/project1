"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useDirection } from "@/components/layout/DirectionProvider";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  AlertTriangle,
  Search,
  CheckCircle2,
  Clock,
  User,
  Phone,
  Mail,
  GraduationCap,
  Calendar,
  AlertCircle,
  Loader2,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
} from "lucide-react";

interface OverdueLoanItem {
  loan_id: string;
  duration_days: number;
  student: {
    id: string;
    full_name: string;
    student_id: string | null;
    department: string;
    phone: string;
    email: string;
  };
  equipment: {
    id: string;
    name_ar: string;
    name_en: string;
    image_url: string;
    category?: {
      name_ar: string;
      name_en: string;
    };
  };
  checked_out_at: string | null;
  expected_return_date: string | null;
  days_overdue: number;
}

export default function OverdueDashboardPage() {
  const { t, locale } = useDirection();

  const [search, setSearch] = useState("");
  const [overdueLoans, setOverdueLoans] = useState<OverdueLoanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchOverdueLoans = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const params = new URLSearchParams();
      if (search.trim()) {
        params.set("search", search.trim());
      }
      const res = await fetch(`/api/v1/admin/overdue?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setOverdueLoans(data.data || []);
      } else {
        const errData = await res.json().catch(() => ({}));
        setErrorMessage(
          errData.message ||
            t("فشل تحميل قائمة الأجهزة المتأخرة", "Failed to load overdue equipment")
        );
      }
    } catch (e: any) {
      setErrorMessage(t("تعذر الاتصال بالخادم", "Could not connect to server"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverdueLoans();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOverdueLoans();
  };

  // Immediate Return Action: returns item healthy and immediately restores student eligibility
  const handleImmediateReturn = async (loanId: string, studentName: string) => {
    setActionLoading(loanId);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const res = await fetch(`/api/v1/admin/loans/${loanId}/return`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ condition: "GOOD" }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMessage(
          t(
            `تم استرجاع الجهاز بنجاح وإعادة تفعيل صلاحيات الاستعارة فورياً للطالب (${studentName})`,
            `Equipment returned successfully. Borrowing privileges immediately reinstated for (${studentName})`
          )
        );
        await fetchOverdueLoans();
      } else {
        setErrorMessage(data.message || t("تعذر إتمام عملية الاسترجاع الفوري", "Immediate return failed"));
      }
    } catch (err: any) {
      setErrorMessage(t("خطأ أثناء الاتصال بالخادم", "Network error"));
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <AlertTriangle className="h-7 w-7 text-destructive" />
            <span>{t("لوحة إنذارات العتاد المتأخر (SCR-09)", "Overdue Equipment Alerts Dashboard (SCR-09)")}</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t(
              "متابعة الأجهزة المتأخرة عن موعد الإرجاع، التواصل المباشر مع الطلاب المخالفين، والإرجاع الفوري لفك حظر الاستعارة.",
              "Track past-due equipment, directly contact delinquent students, and execute immediate return to unblock borrowing privileges."
            )}
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchOverdueLoans()}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          <span>{t("تحديث اللوحة", "Refresh")}</span>
        </Button>
      </div>

      {/* KPI Alert Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-destructive/10 text-destructive rounded-full shrink-0">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                {t("إجمالي العتاد المتأخر", "Total Overdue Items")}
              </p>
              <h3 className="text-2xl font-bold text-destructive">
                {overdueLoans.length}
              </h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full shrink-0">
              <User className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                {t("الطلاب المحظورين تلقائياً", "Auto-Blocked Students")}
              </p>
              <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {new Set(overdueLoans.map((l) => l.student.id)).size}
              </h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-500/40 bg-emerald-500/5">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full shrink-0">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                {t("سياسة إعادة التفعيل", "Reinstatement Policy")}
              </p>
              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 mt-1">
                {t("إلغاء الحظر تلقائي وفوري عند الاسترجاع", "Instant auto-unblock upon check-in")}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-xs underline ms-4">
            {t("إغلاق", "Dismiss")}
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-xs underline ms-4">
            {t("إغلاق", "Dismiss")}
          </button>
        </div>
      )}

      {/* Search */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t(
              "بحث باسم الطالب المتأخر، الرقم الجامعي، الهاتف، أو اسم الجهاز...",
              "Search by delinquent student name, ID, phone, or equipment..."
            )}
            className="ps-9"
          />
        </div>
        <Button type="submit" variant="secondary">
          {t("بحث", "Search")}
        </Button>
      </form>

      {/* Overdue Loans List */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-muted-foreground gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-destructive" />
          <p className="text-sm">{t("جاري تحميل قائمة الأجهزة المتأخرة...", "Loading overdue items...")}</p>
        </div>
      ) : overdueLoans.length === 0 ? (
        <Card className="text-center py-16">
          <CardContent className="space-y-3">
            <ShieldCheck className="h-12 w-12 text-emerald-500 mx-auto stroke-1" />
            <h3 className="text-lg font-semibold">{t("لا توجد أجهزة متأخرة حالياً", "No overdue equipment")}</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              {t(
                "رائع! جميع الأجهزة المستعارة ضمن فترة الاستعارة المقررة، أو تمت إعادتها إلى شباك الفحص بنجاح.",
                "All checked-out equipment are currently within their approved loan periods."
              )}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {overdueLoans.map((item) => (
            <Card
              key={item.loan_id}
              className="overflow-hidden border-2 border-destructive/50 bg-destructive/5 shadow-sm hover:border-destructive transition-all"
            >
              <div className="p-5 flex flex-col lg:flex-row gap-5 items-start lg:items-center justify-between">
                {/* Gear & Student Details */}
                <div className="flex items-start gap-4 flex-1">
                  <div className="relative w-20 h-20 rounded-md overflow-hidden bg-muted border shrink-0">
                    <Image
                      src={item.equipment.image_url || "/placeholder-gear.jpg"}
                      alt={locale === "ar" ? item.equipment.name_ar : item.equipment.name_en}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-base text-foreground">
                        {locale === "ar" ? item.equipment.name_ar : item.equipment.name_en}
                      </h3>
                      {/* High-Contrast Alert Badge */}
                      <Badge variant="destructive" className="font-bold text-xs flex items-center gap-1.5 px-2.5 py-0.5">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        <span>
                          {t(`متأخر بمقدار ${item.days_overdue} يوم`, `${item.days_overdue} days overdue`)}
                        </span>
                      </Badge>
                      <Badge variant="outline" className="text-xs bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-300">
                        {t("الحساب مقيد مؤقتاً", "Account Blocked")}
                      </Badge>
                    </div>

                    {/* Student Contact Channels */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-2 gap-x-4 text-xs">
                      <div className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span className="font-semibold text-foreground">{item.student.full_name}</span>
                      </div>

                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <GraduationCap className="h-3.5 w-3.5 shrink-0" />
                        <span>{item.student.student_id || item.student.department}</span>
                      </div>

                      {/* Direct Phone Call Link */}
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <a
                          href={`tel:${item.student.phone}`}
                          className="font-medium text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1"
                        >
                          <span>{item.student.phone}</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>

                      {/* Direct Email Link */}
                      <div className="flex items-center gap-1.5 sm:col-span-2">
                        <Mail className="h-3.5 w-3.5 text-primary shrink-0" />
                        <a
                          href={`mailto:${item.student.email}?subject=${encodeURIComponent(
                            `إنذار عاجل: تأخر إرجاع معدة (${item.equipment.name_ar})`
                          )}`}
                          className="text-primary hover:underline flex items-center gap-1"
                        >
                          <span>{item.student.email}</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>

                    {/* Return Due Timeline */}
                    <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{t("تاريخ الاستلام:", "Checked Out:")} <strong className="text-foreground">{formatDate(item.checked_out_at)}</strong></span>
                      </div>

                      <div className="flex items-center gap-1 text-destructive font-medium">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{t("كان مقرراً إرجاعه في:", "Due Date Was:")} <strong>{formatDate(item.expected_return_date)}</strong></span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Immediate Return Action */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto pt-3 lg:pt-0 border-t lg:border-t-0">
                  <Button
                    onClick={() => handleImmediateReturn(item.loan_id, item.student.full_name)}
                    disabled={actionLoading === item.loan_id}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium gap-2 shadow-sm"
                  >
                    {actionLoading === item.loan_id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RotateCcw className="h-4 w-4" />
                    )}
                    <span>{t("استرجاع فوري وفك الحظر", "Immediate Return & Unblock")}</span>
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
