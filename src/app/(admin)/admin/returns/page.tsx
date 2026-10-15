"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useDirection } from "@/components/layout/DirectionProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DamageModal } from "@/components/admin/DamageModal";
import { ExtensionModal } from "@/components/admin/ExtensionModal";
import {
  RotateCcw,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  Phone,
  GraduationCap,
  Calendar,
  AlertCircle,
  Loader2,
  RefreshCw,
  CalendarPlus,
  ShieldAlert,
} from "lucide-react";
import { LoanStatus, DamageSeverity } from "@prisma/client";

interface ReturnQueueItem {
  id: string;
  durationDays: number;
  academicJustification: string;
  status: LoanStatus;
  checkedOutAt: string | null;
  expectedReturnDate: string | null;
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
    borrowedQuantity: number;
    damagedQuantity: number;
    category?: {
      nameAr: string;
      nameEn: string;
    };
  };
}

export default function ReturnsInspectionPage() {
  const { t, locale } = useDirection();

  const [search, setSearch] = useState("");
  const [loans, setLoans] = useState<ReturnQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Damage modal state
  const [damagingLoan, setDamagingLoan] = useState<ReturnQueueItem | null>(null);
  const [isDamaging, setIsDamaging] = useState(false);

  // Extension modal state
  const [extendingLoan, setExtendingLoan] = useState<ReturnQueueItem | null>(null);
  const [isExtending, setIsExtending] = useState(false);

  const fetchReturnsQueue = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const params = new URLSearchParams();
      if (search.trim()) {
        params.set("search", search.trim());
      }
      const res = await fetch(`/api/v1/admin/loans/returns?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLoans(data.loans || []);
      } else {
        const errorData = await res.json().catch(() => ({}));
        setErrorMessage(errorData.message || t("فشل تحميل قائمة الإرجاع والفحص", "Failed to load returns list"));
      }
    } catch (e: any) {
      setErrorMessage(t("تعذر الاتصال بالخادم", "Could not connect to server"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturnsQueue();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReturnsQueue();
  };

  // 1-Click Healthy Return
  const handleHealthyReturn = async (loanId: string) => {
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
        setSuccessMessage(t("تم استرجاع الجهاز بحالة سليمة وإعادته إلى المخزون المتاح فورياً", "Returned in good condition, stock restored to available"));
        await fetchReturnsQueue();
      } else {
        setErrorMessage(data.message || t("تعذر إتمام عملية الاسترجاع", "Return failed"));
      }
    } catch (err: any) {
      setErrorMessage(t("خطأ أثناء الاتصال بالخادم", "Network error"));
    } finally {
      setActionLoading(null);
    }
  };

  // Damaged Return confirmation
  const handleConfirmDamaged = async ({ severity, notes }: { severity: DamageSeverity; notes: string }) => {
    if (!damagingLoan) return;
    setIsDamaging(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/v1/admin/loans/${damagingLoan.id}/return`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          condition: "DAMAGED",
          severity,
          notes,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMessage(t("تم تسجيل تلف العتاد بنجاح وتحويل وحدته إلى مخزون الصيانة/التوالف", "Damage logged and item routed to maintenance pool"));
        await fetchReturnsQueue();
      } else {
        setErrorMessage(data.message || t("تعذر تسجيل الضرر", "Failed to log damage"));
      }
    } catch (err: any) {
      setErrorMessage(t("خطأ في الاتصال بالخادم", "Network error"));
    } finally {
      setIsDamaging(false);
      setDamagingLoan(null);
    }
  };

  // Extension confirmation
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
        setSuccessMessage(t("تم تمديد فترة الاستعارة بنجاح", "Loan duration extended successfully"));
        await fetchReturnsQueue();
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

  const formatDueDate = (dateStr: string | null, status: LoanStatus) => {
    if (!dateStr) return null;
    const dueDate = new Date(dateStr);
    const now = new Date();
    const isPast = dueDate.getTime() < now.getTime() || status === LoanStatus.OVERDUE;

    return (
      <div className={`flex items-center gap-1.5 text-xs font-medium ${isPast ? "text-destructive font-bold" : "text-muted-foreground"}`}>
        <Clock className="w-3.5 h-3.5" />
        <span>
          {isPast ? t("تاريخ الإرجاع المتأخر: ", "Overdue Return Date: ") : t("تاريخ الإرجاع المقرر: ", "Due Return Date: ")}
          {dueDate.toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <RotateCcw className="h-7 w-7 text-primary" />
            <span>{t("شباك الفحص والاسترجاع (SCR-08)", "Returns & Inspection Counter (SCR-08)")}</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t(
              "فحص المعدات المسترجعة، الإرجاع السليم الفوري بنقرة واحدة، أو تسجيل بلاغات التلف والأعطال.",
              "Inspect returned equipment, execute 1-click healthy returns, or record technical defect logs."
            )}
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchReturnsQueue()}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          <span>{t("تحديث القائمة", "Refresh")}</span>
        </Button>
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
            placeholder={t("بحث باسم الطالب، الرقم الجامعي، الهاتف، أو اسم الجهاز المستعار...", "Search by student name, ID, phone, or borrowed item...")}
            className="ps-9"
          />
        </div>
        <Button type="submit" variant="secondary">
          {t("بحث", "Search")}
        </Button>
      </form>

      {/* List */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-muted-foreground gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm">{t("جاري تحميل قائمة العتاد المستعار...", "Loading checked-out returns...")}</p>
        </div>
      ) : loans.length === 0 ? (
        <Card className="text-center py-16">
          <CardContent className="space-y-3">
            <CheckCircle2 className="h-12 w-12 text-muted-foreground mx-auto stroke-1" />
            <h3 className="text-lg font-semibold">{t("لا توجد أجهزة مستعارة قيد التداول حالياً", "No items currently checked out or due")}</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              {t(
                "عند تسليم العتاد المعتمد في شباك التسليم (SCR-07)، سيظهر فورياً هنا لمتابعة مدة الإعارة وإجراء الفحص عند الإرجاع.",
                "When equipment is handed over at SCR-07, it will appear here for return inspection and extension handling."
              )}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {loans.map((loan) => {
            const isOverdue = loan.status === LoanStatus.OVERDUE || (loan.expectedReturnDate && new Date(loan.expectedReturnDate).getTime() < Date.now());

            return (
              <Card key={loan.id} className={`overflow-hidden border transition-colors shadow-sm ${isOverdue ? "border-destructive/60 bg-destructive/5" : "border-border/70 hover:border-primary/40"}`}>
                <div className="p-5 flex flex-col lg:flex-row gap-5 items-start lg:items-center justify-between">
                  {/* Left: Info */}
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
                        {isOverdue ? (
                          <Badge variant="destructive" className="text-xs flex items-center gap-1">
                            <ShieldAlert className="h-3 w-3" />
                            {t("متأخر عن موعد الإرجاع", "Overdue")}
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            {t("مستعار نشط", "Checked Out")}
                          </Badge>
                        )}
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

                      {/* Dates */}
                      <div className="flex flex-wrap items-center gap-4 pt-1 text-xs">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{t("مدة الإعارة الإجمالية:", "Duration:")} <strong className="text-foreground">{loan.durationDays} {t("أيام", "days")}</strong></span>
                        </div>
                        {formatDueDate(loan.expectedReturnDate, loan.status)}
                      </div>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full lg:w-auto pt-3 lg:pt-0 border-t lg:border-t-0">
                    {/* Extension */}
                    {loan.durationDays < 10 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setExtendingLoan(loan)}
                        disabled={actionLoading === loan.id}
                        className="gap-1.5"
                      >
                        <CalendarPlus className="h-4 w-4" />
                        <span>{t("تمديد", "Extend")}</span>
                      </Button>
                    )}

                    {/* Healthy Return */}
                    <Button
                      onClick={() => handleHealthyReturn(loan.id)}
                      disabled={actionLoading === loan.id}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 font-medium"
                      size="sm"
                    >
                      {actionLoading === loan.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                      <span>{t("استرجاع سليم", "Healthy Return")}</span>
                    </Button>

                    {/* Mark Damaged */}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDamagingLoan(loan)}
                      disabled={actionLoading === loan.id}
                      className="gap-1.5"
                    >
                      <AlertTriangle className="h-4 w-4" />
                      <span>{t("تسجيل تلف / عطل", "Mark Damaged")}</span>
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Damage Modal */}
      {damagingLoan && (
        <DamageModal
          isOpen={!!damagingLoan}
          onClose={() => setDamagingLoan(null)}
          onConfirm={handleConfirmDamaged}
          equipmentName={locale === "ar" ? damagingLoan.equipment.nameAr : damagingLoan.equipment.nameEn}
          studentName={damagingLoan.user.fullName}
          isLoading={isDamaging}
        />
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
