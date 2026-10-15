"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useDirection } from "@/components/layout/DirectionProvider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Calendar,
  Layers,
  ArrowRight,
  ArrowLeft,
  X,
  Plus,
} from "lucide-react";

interface LoanRecord {
  id: string;
  durationDays: number;
  academicJustification: string;
  status:
    | "PENDING_REVIEW"
    | "APPROVED"
    | "REJECTED"
    | "CANCELLED"
    | "EXPIRED"
    | "CHECKED_OUT"
    | "RETURNED"
    | "OVERDUE";
  requestedAt: string;
  approvedAt?: string | null;
  pickupDeadline?: string | null;
  checkedOutAt?: string | null;
  expectedReturnDate?: string | null;
  returnedAt?: string | null;
  rejectionReason?: string | null;
  equipment: {
    id: string;
    nameAr: string;
    nameEn: string;
    imageUrl: string;
    category?: {
      nameAr: string;
      nameEn: string;
    };
  };
}

import { DEMO_STUDENT_LOANS } from "@/lib/demo-data";

export default function StudentPortalPage() {
  const { locale, direction, t } = useDirection();
  const [loans, setLoans] = useState<LoanRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [cancellingLoanId, setCancellingLoanId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchLoans = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/loans");
      if (res.ok) {
        const json = await res.json();
        if (json.data && json.data.length > 0) {
          setLoans(json.data);
        } else {
          setLoans(DEMO_STUDENT_LOANS as LoanRecord[]);
        }
      } else {
        setLoans(DEMO_STUDENT_LOANS as LoanRecord[]);
      }
    } catch (err) {
      console.warn("Using demo loans data:", err);
      setLoans(DEMO_STUDENT_LOANS as LoanRecord[]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, []);

  const handleSelfCancel = async (loanId: string) => {
    setActionError(null);
    setActionSuccess(null);
    setCancellingLoanId(loanId);

    try {
      const res = await fetch(`/api/v1/loans/${loanId}/cancel`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        setActionError(data.message || t("فشل إلغاء الطلب.", "Failed to cancel request."));
      } else {
        setActionSuccess(t("تم إلغاء طلب الاستعارة بنجاح.", "Loan request cancelled successfully."));
        fetchLoans();
      }
    } catch {
      setActionError(t("تعذر الاتصال بالخادم.", "Network error."));
    } finally {
      setCancellingLoanId(null);
    }
  };

  // KPIs
  const activeLoans = loans.filter((l) =>
    ["PENDING_REVIEW", "APPROVED", "CHECKED_OUT"].includes(l.status)
  );
  const overdueLoans = loans.filter((l) => l.status === "OVERDUE");
  const completedLoans = loans.filter((l) => l.status === "RETURNED");

  const getStatusBadge = (status: LoanRecord["status"]) => {
    switch (status) {
      case "PENDING_REVIEW":
        return (
          <Badge variant="warning" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{t("قيد المراجعة", "Pending Review")}</span>
          </Badge>
        );
      case "APPROVED":
        return (
          <Badge variant="info" className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            <span>{t("معتمد للاستلام (خلال 48س)", "Approved (48h pickup)")}</span>
          </Badge>
        );
      case "CHECKED_OUT":
        return (
          <Badge variant="success" className="flex items-center gap-1">
            <Layers className="h-3 w-3" />
            <span>{t("مستعار بحوزتك", "Checked Out")}</span>
          </Badge>
        );
      case "RETURNED":
        return (
          <Badge variant="outline" className="flex items-center gap-1 text-muted-foreground">
            <RotateCcw className="h-3 w-3" />
            <span>{t("تم الإرجاع", "Returned")}</span>
          </Badge>
        );
      case "OVERDUE":
        return (
          <Badge variant="destructive" className="flex items-center gap-1 font-bold animate-pulse">
            <AlertTriangle className="h-3 w-3" />
            <span>{t("متأخر عن الموعد!", "Overdue!")}</span>
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge variant="outline" className="text-muted-foreground">
            <XCircle className="h-3 w-3 me-1" />
            <span>{t("ملغي", "Cancelled")}</span>
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge variant="destructive">
            <X className="h-3 w-3 me-1" />
            <span>{t("مرفوض", "Rejected")}</span>
          </Badge>
        );
      case "EXPIRED":
        return (
          <Badge variant="outline" className="text-muted-foreground">
            <span>{t("منتهي الصلاحية (عدم استلام)", "Expired")}</span>
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-2 border-b border-border/60">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            {t("لوحة طلبات واستعارات الطالب", "Student Loan Portal")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl leading-relaxed">
            {t(
              "متابعة حالة طلبات العتاد المعملي، مواعيد الاستلام، المهل الزمنية، وإلغاء الطلبات المعلقة.",
              "Track equipment requests, pickup windows, return deadlines, and manage pending applications."
            )}
          </p>
        </div>

        <Button asChild size="sm" className="self-start sm:self-auto h-9 px-4 font-semibold shadow-sm focus-visible:ring-2 focus-visible:ring-primary">
          <Link href="/catalog">
            <Plus className="h-4 w-4 me-1.5" aria-hidden="true" />
            <span>{t("حجز جهاز جديد", "Book Equipment")}</span>
          </Link>
        </Button>
      </div>

      {/* Notifications */}
      {actionError && (
        <div
          role="alert"
          className="flex items-center justify-between rounded-xl bg-destructive/10 p-3.5 text-sm text-destructive font-medium border border-destructive/20 shadow-sm"
        >
          <span>{actionError}</span>
          <button
            onClick={() => setActionError(null)}
            className="p-1 rounded-md hover:bg-destructive/20 transition-colors"
            aria-label={t("إغلاق التنبيه", "Dismiss alert")}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {actionSuccess && (
        <div
          role="status"
          className="flex items-center justify-between rounded-xl bg-emerald-500/10 p-3.5 text-sm text-emerald-700 dark:text-emerald-400 font-medium border border-emerald-500/20 shadow-sm"
        >
          <span>{actionSuccess}</span>
          <button
            onClick={() => setActionSuccess(null)}
            className="p-1 rounded-md hover:bg-emerald-500/20 transition-colors"
            aria-label={t("إغلاق التنبيه", "Dismiss notice")}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border border-border/80 bg-card shadow-sm hover:border-primary/30 transition-colors">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t("الاستعارات النشطة", "Active Loans")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-3xl font-black tracking-tight">{activeLoans.length} / 2</div>
              <Badge variant={activeLoans.length >= 2 ? "warning" : "secondary"} className="text-xs font-medium">
                {activeLoans.length >= 2
                  ? t("وصلت للحد الأقصى", "Max Quota Reached")
                  : t("متاح حجز إضافي", "Quota Available")}
              </Badge>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {t("الحد المسموح به هو جهازين نشطين في نفس الوقت.", "Allowed limit is 2 concurrent active items.")}
            </p>
          </CardContent>
        </Card>

        <Card className="border border-destructive/30 bg-destructive/5 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-destructive uppercase tracking-wider">
              {t("الأجهزة المتأخرة", "Overdue Items")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-3xl font-black text-destructive tracking-tight">{overdueLoans.length}</div>
              {overdueLoans.length > 0 && (
                <Badge variant="destructive" className="motion-safe:animate-pulse font-semibold">
                  {t("حظر مؤقت للحجز", "Blocked")}
                </Badge>
              )}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {overdueLoans.length > 0
                ? t("يجب إرجاع العتاد فوراً لشباك الفحص.", "Return items immediately to restore booking.")
                : t("لا توجد أجهزة متأخرة على حسابك.", "No overdue records on your account.")}
            </p>
          </CardContent>
        </Card>

        <Card className="border border-border/80 bg-card shadow-sm hover:border-emerald-500/30 transition-colors">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t("الاستعارات المكتملة", "Completed Returns")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-3xl font-black tracking-tight">{completedLoans.length}</div>
              <Badge variant="outline" className="text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/5">
                <CheckCircle2 className="h-3 w-3 me-1" aria-hidden="true" />
                {t("سجل نظيف", "Good Standing")}
              </Badge>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {t("سجل تسليم الأجهزة السليمة خلال الفصل.", "Returned in good condition this term.")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Loans List Table / Cards */}
      <div className="rounded-xl border border-border/80 bg-card shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-border/70 flex items-center justify-between bg-muted/20">
          <h2 className="text-base sm:text-lg font-bold text-foreground">
            {t("سجل كافة الطلبات والاستعارات", "All Requests & Loan History")}
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLoans}
            className="text-xs h-8 px-3 font-medium hover:bg-card"
          >
            {t("تحديث السجل", "Refresh History")}
          </Button>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-4 items-center">
                <Skeleton className="h-20 w-24 rounded-lg shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
                <Skeleton className="h-9 w-24 rounded-md" />
              </div>
            ))}
          </div>
        ) : loans.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted/80 text-muted-foreground mb-3">
              <Calendar className="h-7 w-7" aria-hidden="true" />
            </div>
            <h3 className="font-bold text-base text-foreground">
              {t("لا توجد طلبات استعارة مسجلة بعد", "No loan requests recorded yet")}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mt-1 mb-5 leading-relaxed">
              {t(
                "تصفح كتالوج الأجهزة المعملية وقدم طلبك الأول لتنفيذ مشاريعك الأكاديمية.",
                "Explore laboratory equipment and make your first loan request for coursework."
              )}
            </p>
            <Button asChild size="sm" className="h-9 px-4 font-semibold shadow-sm">
              <Link href="/catalog">{t("الانتقال إلى الكتالوج", "Browse Catalog")}</Link>
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-border/70">
            {loans.map((loan) => (
              <div
                key={loan.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:items-center justify-between transition-colors hover:bg-muted/15"
              >
                {/* Left: Thumbnail & Equipment Info */}
                <div className="flex items-start gap-4 min-w-0">
                  <img
                    src={loan.equipment.imageUrl}
                    alt={locale === "ar" ? loan.equipment.nameAr : loan.equipment.nameEn}
                    className="h-20 w-24 rounded-lg object-cover bg-muted shrink-0 border border-border/80 shadow-sm"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80";
                    }}
                  />
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base text-foreground truncate">
                        {locale === "ar" ? loan.equipment.nameAr : loan.equipment.nameEn}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">
                      <span className="font-medium text-foreground/80">{t("المبرر الأكاديمي:", "Purpose:")}</span>{" "}
                      {loan.academicJustification}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground pt-1 font-mono">
                      <span>
                        {t("المدة:", "Duration:")} {loan.durationDays} {t("أيام", "days")}
                      </span>
                      <span>•</span>
                      <span>
                        {t("تاريخ الطلب:", "Requested:")}{" "}
                        {new Date(loan.requestedAt).toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US")}
                      </span>
                      {loan.expectedReturnDate && (
                        <>
                          <span>•</span>
                          <span className="font-semibold text-foreground">
                            {t("موعد الإرجاع:", "Return By:")}{" "}
                            {new Date(loan.expectedReturnDate).toLocaleDateString(
                              locale === "ar" ? "ar-SA" : "en-US"
                            )}
                          </span>
                        </>
                      )}
                    </div>

                    {loan.rejectionReason && (
                      <p className="text-xs font-semibold text-destructive mt-1 flex items-center gap-1.5">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        <span>{t("سبب الرفض:", "Rejection Reason:")} {loan.rejectionReason}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: Status badge & Self-cancel button */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2.5 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-border/60">
                  {getStatusBadge(loan.status)}

                  {loan.status === "PENDING_REVIEW" && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={cancellingLoanId === loan.id}
                      onClick={() => handleSelfCancel(loan.id)}
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30 h-8 text-xs font-semibold shadow-sm"
                    >
                      {cancellingLoanId === loan.id
                        ? t("جارٍ الإلغاء...", "Cancelling...")
                        : t("إلغاء الطلب (1-نقر)", "Cancel Request")}
                    </Button>
                  )}

                  {loan.status === "APPROVED" && loan.pickupDeadline && (
                    <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                      {t(
                        `الموعد الأخير للاستلام: ${new Date(loan.pickupDeadline).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}`,
                        `Pickup deadline: ${new Date(loan.pickupDeadline).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}`
                      )}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
