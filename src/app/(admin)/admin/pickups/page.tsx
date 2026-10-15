"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useDirection } from "@/components/layout/DirectionProvider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ExtensionModal } from "@/components/admin/ExtensionModal";
import {
  CheckCircle2,
  Search,
  Clock,
  User,
  Phone,
  GraduationCap,
  Calendar,
  AlertCircle,
  Loader2,
  RefreshCw,
  PackageCheck,
  CalendarPlus,
  ShieldCheck,
} from "lucide-react";
import { LoanStatus } from "@prisma/client";

interface PickupQueueItem {
  id: string;
  durationDays: number;
  academicJustification: string;
  status: LoanStatus;
  requestedAt: string;
  approvedAt: string | null;
  pickupDeadline: string | null;
  user: {
    id: string;
    fullName: string;
    studentId: string | null;
    department: string;
    phone: string;
    email: string;
  };
  equipment: {
    id: string;
    nameAr: string;
    nameEn: string;
    imageUrl: string;
    availableQuantity: number;
    reservedQuantity: number;
    borrowedQuantity: number;
    category?: {
      nameAr: string;
      nameEn: string;
    };
  };
}

export default function ApprovedPickupsPage() {
  const { t, locale } = useDirection();

  const [search, setSearch] = useState("");
  const [pickups, setPickups] = useState<PickupQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Extension modal state
  const [extendingLoan, setExtendingLoan] = useState<PickupQueueItem | null>(null);
  const [isExtending, setIsExtending] = useState(false);

  const fetchPickups = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const params = new URLSearchParams();
      if (search.trim()) {
        params.set("search", search.trim());
      }
      const res = await fetch(`/api/v1/admin/loans/pickups?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setPickups(data.loans || []);
      } else {
        const errorData = await res.json().catch(() => ({}));
        setErrorMessage(errorData.message || t("فشل تحميل قائمة التسليمات المعتمدة", "Failed to load approved pickups"));
      }
    } catch (e: any) {
      setErrorMessage(t("تعذر الاتصال بالخادم", "Could not connect to server"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPickups();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPickups();
  };

  const handleCheckout = async (loanId: string) => {
    setActionLoading(loanId);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const res = await fetch(`/api/v1/admin/loans/${loanId}/checkout`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMessage(t("تم تسليم العتاد بنجاح وتحويل حالته إلى مستعار", "Equipment handed over successfully (checked out)"));
        await fetchPickups();
      } else {
        setErrorMessage(data.message || t("تعذر إتمام عملية التسليم", "Checkout failed"));
      }
    } catch (err: any) {
      setErrorMessage(t("خطأ أثناء الاتصال بالخادم", "Network error"));
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirmExtension = async (additionalDays: number) => {
    if (!extendingLoan) return;
    setIsExtending(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/v1/admin/loans/${extendingLoan.id}/extend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ additional_days: additionalDays }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMessage(t("تم تمديد فترة الإعارة بنجاح", "Loan duration extended successfully"));
        await fetchPickups();
      } else {
        setErrorMessage(data.message || t("تعذر تمديد الاستعارة", "Failed to extend loan"));
      }
    } catch (err: any) {
      setErrorMessage(t("خطأ في الاتصال بالخادم", "Network error"));
    } finally {
      setIsExtending(false);
      setExtendingLoan(null);
    }
  };

  const formatDeadlineCountdown = (deadlineStr: string | null) => {
    if (!deadlineStr) return null;
    const deadline = new Date(deadlineStr);
    const now = new Date();
    const diffMs = deadline.getTime() - now.getTime();
    if (diffMs <= 0) {
      return (
        <span className="text-destructive font-bold flex items-center gap-1">
          <Clock className="w-4 h-4" />
          {t("انتهت مهلة الـ 48 ساعة (بانتظار الإلغاء التلقائي)", "Expired (Pending automatic release)")}
        </span>
      );
    }
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return (
      <span className="text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
        <Clock className="w-4 h-4" />
        {t(`متبقي ${hours} س و ${mins} د للاستلام`, `${hours}h ${mins}m left for pickup`)}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <PackageCheck className="h-7 w-7 text-primary" />
            <span>{t("شباك تسليم العتاد المعتمد (SCR-07)", "Approved Pickups Counter (SCR-07)")}</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t(
              "التحقق من هوية الطالب الجامعية، وتسليم المعدات المحجوزة بنقرة واحدة لتحويلها فورياً إلى مستعارة.",
              "Verify student university credentials, and hand over reserved equipment with 1-click checkout."
            )}
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchPickups()}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          <span>{t("تحديث القائمة", "Refresh")}</span>
        </Button>
      </div>

      {/* Notification Banners */}
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

      {/* Filter / Search Bar */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("بحث باسم الطالب، الرقم الجامعي، الهاتف، أو اسم الجهاز...", "Search by student name, ID, phone, or equipment...")}
            className="ps-9"
          />
        </div>
        <Button type="submit" variant="secondary">
          {t("بحث", "Search")}
        </Button>
      </form>

      {/* Pickups Table / Cards */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-muted-foreground gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm">{t("جاري تحميل قائمة التسليمات المعتمدة...", "Loading approved pickups...")}</p>
        </div>
      ) : pickups.length === 0 ? (
        <Card className="text-center py-16">
          <CardContent className="space-y-3">
            <ShieldCheck className="h-12 w-12 text-muted-foreground mx-auto stroke-1" />
            <h3 className="text-lg font-semibold">{t("لا توجد طلبات معتمدة بانتظار التسليم حالياً", "No approved pickups pending handover")}</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              {t(
                "عندما يقوم مسؤولو المعمل باعتماد طلبات الاستعارة في شاشة المراجعة، ستظهر هنا فورياً مع مؤقت الـ 48 ساعة للتسليم.",
                "When lab staff approves requests in the review queue, they will appear here with a 48-hour pickup window."
              )}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {pickups.map((loan) => (
            <Card key={loan.id} className="overflow-hidden border border-border/70 hover:border-primary/40 transition-colors shadow-sm">
              <div className="p-5 flex flex-col lg:flex-row gap-5 items-start lg:items-center justify-between">
                {/* Equipment & Student Details */}
                <div className="flex items-start gap-4 flex-1">
                  <div className="relative w-20 h-20 rounded-md overflow-hidden bg-muted border shrink-0">
                    <Image
                      src={loan.equipment.imageUrl || "/placeholder-gear.jpg"}
                      alt={locale === "ar" ? loan.equipment.nameAr : loan.equipment.nameEn}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-base text-foreground">
                        {locale === "ar" ? loan.equipment.nameAr : loan.equipment.nameEn}
                      </h3>
                      <Badge variant="outline" className="text-xs bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800">
                        {t("معتمد - بانتظار الحضور", "Approved - Awaiting Pickup")}
                      </Badge>
                    </div>

                    {/* Student Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-1 gap-x-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span className="font-medium text-foreground">{loan.user.fullName}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <GraduationCap className="h-3.5 w-3.5 shrink-0" />
                        <span>{loan.user.studentId || loan.user.department}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 shrink-0" />
                        <a href={`tel:${loan.user.phone}`} className="hover:underline text-foreground">
                          {loan.user.phone}
                        </a>
                      </div>
                    </div>

                    {/* Justification & Countdown */}
                    <div className="flex flex-wrap items-center gap-4 pt-1 text-xs">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{t("مدة الاستعارة:", "Duration:")} <strong className="text-foreground">{loan.durationDays} {t("أيام", "days")}</strong></span>
                      </div>

                      {loan.pickupDeadline && formatDeadlineCountdown(loan.pickupDeadline)}
                    </div>
                  </div>
                </div>

                {/* Handover & Extension Actions */}
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full lg:w-auto pt-3 lg:pt-0 border-t lg:border-t-0">
                  <Button
                    onClick={() => handleCheckout(loan.id)}
                    disabled={actionLoading === loan.id}
                    className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-medium"
                  >
                    {actionLoading === loan.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    <span>{t("تأكيد التسليم اليدوي (Check Out)", "Confirm Handover")}</span>
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Extension Modal */}
      {extendingLoan && (
        <ExtensionModal
          isOpen={!!extendingLoan}
          onClose={() => setExtendingLoan(null)}
          onConfirm={handleConfirmExtension}
          currentDuration={extendingLoan.durationDays}
          equipmentName={locale === "ar" ? extendingLoan.equipment.nameAr : extendingLoan.equipment.nameEn}
          studentName={extendingLoan.user.fullName}
          isLoading={isExtending}
        />
      )}
    </div>
  );
}
