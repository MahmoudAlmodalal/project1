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
        setLoans(json.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch student loans:", err);
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
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {t("لوحة طلبات واستعارات الطالب", "Student Loan Portal")}
            </h1>
            <Badge variant="outline" className="font-mono text-xs">
              SCR-03
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {t(
              "متابعة حالة طلبات العتاد المعملي، مواعيد الاستلام، المهل الزمنية، وإلغاء الطلبات المعلقة.",
              "Track equipment requests, pickup windows, return deadlines, and manage pending applications."
            )}
          </p>
        </div>

        <Button asChild size="sm" className="self-start sm:self-auto font-semibold">
          <Link href="/catalog">
            <Plus className="h-4 w-4 me-1.5" />
            {t("حجز جهاز جديد", "Book Equipment")}
          </Link>
        </Button>
      </div>

      {/* Notifications */}
      {actionError && (
        <div className="flex items-center justify-between rounded-lg bg-destructive/15 p-3 text-sm text-destructive font-medium border border-destructive/20">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {actionSuccess && (
        <div className="flex items-center justify-between rounded-lg bg-emerald-500/15 p-3 text-sm text-emerald-700 dark:text-emerald-400 font-medium border border-emerald-500/20">
          <span>{actionSuccess}</span>
          <button onClick={() => setActionSuccess(null)}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-primary/20 bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t("الاستعارات النشطة", "Active Loans")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-3xl font-black">{activeLoans.length} / 2</div>
              <Badge variant={activeLoans.length >= 2 ? "warning" : "secondary"}>
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

        <Card className="border-destructive/20 bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-destructive uppercase tracking-wider">
              {t("الأجهزة المتأخرة", "Overdue Items")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-3xl font-black text-destructive">{overdueLoans.length}</div>
              {overdueLoans.length > 0 && (
                <Badge variant="destructive" className="animate-pulse">
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

        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t("الاستعارات المكتملة", "Completed Returns")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-3xl font-black">{completedLoans.length}</div>
              <Badge variant="outline">
                <CheckCircle2 className="h-3 w-3 text-emerald-600 me-1" />
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
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b flex items-center justify-between">
          <h2 className="text-lg font-bold">{t("سجل كافة الطلبات والاستعارات", "All Requests & Loan History")}</h2>
          <Button variant="outline" size="sm" onClick={fetchLoans} className="text-xs">
            {t("تحديث السجل", "Refresh History")}
          </Button>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-4 items-center">
                <Skeleton className="h-16 w-24 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-8 w-24" />
              </div>
            ))}
          </div>
        ) : loans.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <Calendar className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <h3 className="font-bold text-base">{t("لا توجد طلبات استعارة مسجلة بعد", "No loan requests recorded yet")}</h3>
            <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-4">
              {t(
                "تصفح كتالوج الأجهزة المعملية وقدم طلبك الأول لتنفيذ مشاريعك الأكاديمية.",
                "Explore laboratory equipment and make your first loan request for coursework."
              )}
            </p>
            <Button asChild size="sm">
              <Link href="/catalog">{t("الانتقال إلى الكتالوج", "Browse Catalog")}</Link>
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {loans.map((loan) => (
              <div
                key={loan.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:items-center justify-between transition-colors hover:bg-muted/10"
              >
                {/* Left: Thumbnail & Equipment Info */}
                <div className="flex items-start gap-4">
                  <img
                    src={loan.equipment.imageUrl}
                    alt={locale === "ar" ? loan.equipment.nameAr : loan.equipment.nameEn}
                    className="h-20 w-24 rounded-lg object-cover bg-muted shrink-0 border"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80";
                    }}
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base text-foreground">
                        {locale === "ar" ? loan.equipment.nameAr : loan.equipment.nameEn}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {t("المبرر الأكاديمي:", "Purpose:")} {loan.academicJustification}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-1">
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
                      <p className="text-xs font-semibold text-destructive mt-1">
                        {t("سبب الرفض:", "Rejection Reason:")} {loan.rejectionReason}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: Status badge & Self-cancel button */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0">
                  {getStatusBadge(loan.status)}

                  {loan.status === "PENDING_REVIEW" && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={cancellingLoanId === loan.id}
                      onClick={() => handleSelfCancel(loan.id)}
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20 h-8 text-xs font-semibold"
                    >
                      {cancellingLoanId === loan.id
                        ? t("جارٍ الإلغاء...", "Cancelling...")
                        : t("إلغاء الطلب (1-نقر)", "Cancel Request")}
                    </Button>
                  )}

                  {loan.status === "APPROVED" && loan.pickupDeadline && (
                    <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400">
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
