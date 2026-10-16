"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useDirection } from "@/components/layout/DirectionProvider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { RejectDialog } from "@/components/admin/RejectDialog";
import {
  ClipboardList,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  GraduationCap,
  Calendar,
  AlertCircle,
  Loader2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Package,
} from "lucide-react";
type LoanStatus = "PENDING_REVIEW" | "APPROVED" | "CHECKED_OUT" | "OVERDUE" | "RETURNED";

interface LoanQueueItem {
  id: string;
  durationDays: number;
  academicJustification: string;
  status: LoanStatus;
  requestedAt: string;
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

import { DEMO_ADMIN_QUEUE } from "@/lib/demo-data";

export default function AdminReviewQueuePage() {
  const { t, locale } = useDirection();

  const [search, setSearch] = useState("");
  const [loans, setLoans] = useState<LoanQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [expandedLoanId, setExpandedLoanId] = useState<string | null>(null);

  // Reject modal state
  const [rejectingLoan, setRejectingLoan] = useState<LoanQueueItem | null>(null);
  const [isRejecting, setIsRejecting] = useState(false);

  const getFilteredDemoQueue = () => {
    let result = [...DEMO_ADMIN_QUEUE] as unknown as LoanQueueItem[];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (l) =>
          l.user.fullName.toLowerCase().includes(q) ||
          (l.user.studentId && l.user.studentId.includes(q)) ||
          l.equipment.nameAr.toLowerCase().includes(q) ||
          l.equipment.nameEn.toLowerCase().includes(q)
      );
    }
    return result;
  };

  const fetchQueue = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const params = new URLSearchParams();
      if (search.trim()) {
        params.set("search", search.trim());
      }
      const res = await fetch(`/api/v1/admin/loans?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.loans && data.loans.length > 0) {
          setLoans(data.loans);
        } else {
          setLoans(getFilteredDemoQueue());
        }
      } else {
        setLoans(getFilteredDemoQueue());
      }
    } catch {
      setLoans(getFilteredDemoQueue());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchQueue();
  };

  const handleApprove = async (loanId: string) => {
    setActionLoading(loanId);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/v1/admin/loans/${loanId}/approve`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await fetchQueue();
      } else {
        setErrorMessage(data.message || t("فشل اعتماد الطلب", "Failed to approve loan"));
      }
    } catch (err: any) {
      setErrorMessage(t("حدث خطأ أثناء الاعتماد", "An error occurred during approval"));
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirmReject = async (reason: string) => {
    if (!rejectingLoan) return;
    setIsRejecting(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/v1/admin/loans/${rejectingLoan.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRejectingLoan(null);
        await fetchQueue();
      } else {
        throw new Error(data.message || t("فشل رفض الطلب", "Failed to reject loan"));
      }
    } finally {
      setIsRejecting(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedLoanId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="flex-1 space-y-6 p-4 sm:p-8">
      {/* Header & Metrics */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {t("طابور مراجعة الطلبات (SCR-06)", "Admin Requests Review Queue (SCR-06)")}
            </h1>
            <Badge variant="outline" className="border-amber-500/50 text-amber-600 bg-amber-500/10">
              {loans.length} {t("طلبات بانتظار البت", "Pending")}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {t(
              "البت الفوري في طلبات استعارة الطلاب، حجز المخزون ذرياً، وبدء مهلة الاستلام لـ 48 ساعة.",
              "Review pending student loan requests, atomically reserve stock, and activate 48-hour pickup windows."
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchQueue}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            <span>{t("تحديث", "Refresh")}</span>
          </Button>
        </div>
      </div>

      {/* Global error alert */}
      {errorMessage && (
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setErrorMessage(null)}>
            {t("إغلاق", "Dismiss")}
          </Button>
        </div>
      )}

      {/* Search Bar */}
      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t(
                  "البحث باسم الطالب، الرقم الجامعي، أو اسم المعدة...",
                  "Search by student name, matriculation ID, or equipment name..."
                )}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="ps-9"
              />
            </div>
            <Button type="submit" disabled={loading}>
              {t("بحث", "Search")}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Loan Requests Table / List */}
      <Card>
        <CardHeader className="px-6 py-4 border-b">
          <CardTitle className="text-lg flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            <span>{t("قائمة الطلبات المعلقة", "Pending Loan Applications")}</span>
          </CardTitle>
          <CardDescription>
            {t(
              "الضغط على 'اعتماد' يخصم وحدة من المخزون المتاح وينقلها للمحجوز مع بدء مهلة 48 ساعة للاستلام.",
              "Approving atomically moves 1 unit from available to reserved and starts 48-hour pickup timer."
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p>{t("جاري تحميل طلبات الاستعارة...", "Loading requests queue...")}</p>
            </div>
          ) : loans.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground px-4">
              <Package className="h-12 w-12 text-muted-foreground/40 mb-3" />
              <p className="font-semibold text-foreground text-lg">
                {t("لا توجد طلبات معلقة حالياً", "No pending loan requests")}
              </p>
              <p className="text-sm mt-1 max-w-sm">
                {t(
                  "تم البت في جميع الطلبات المقدمة بنجاح، ستظهر الطلبات الجديدة هنا فور تقديم الطلاب لها.",
                  "All student loan applications have been reviewed. New requests will appear here automatically."
                )}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {loans.map((loan) => {
                const isExpanded = expandedLoanId === loan.id;
                const isProcessing = actionLoading === loan.id;
                const equipName = locale === "ar" ? loan.equipment.nameAr : loan.equipment.nameEn;
                const isStockAvailable = loan.equipment.availableQuantity > 0;

                return (
                  <div
                    key={loan.id}
                    className="p-4 sm:p-6 transition-colors hover:bg-muted/30"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      {/* Left: Equipment & Applicant info */}
                      <div className="flex items-start gap-4 flex-1">
                        <div className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-lg overflow-hidden border bg-muted shrink-0">
                          {loan.equipment.imageUrl ? (
                            <Image
                              src={loan.equipment.imageUrl}
                              alt={equipName}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <Package className="h-8 w-8 text-muted-foreground/40" />
                            </div>
                          )}
                        </div>

                        <div className="space-y-1 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-base sm:text-lg leading-tight">
                              {equipName}
                            </span>
                            <Badge
                              variant={isStockAvailable ? "outline" : "destructive"}
                              className={
                                isStockAvailable
                                  ? "border-emerald-500/50 text-emerald-600 bg-emerald-500/10"
                                  : ""
                              }
                            >
                              {isStockAvailable
                                ? t(`متوفر بالمخزن (${loan.equipment.availableQuantity})`, `In Stock (${loan.equipment.availableQuantity})`)
                                : t("نفد من المخزن (0)", "Out of stock (0)")}
                            </Badge>
                          </div>

                          {/* Applicant info pills */}
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground pt-1">
                            <span className="flex items-center gap-1 font-medium text-foreground">
                              <User className="h-3.5 w-3.5 text-primary" />
                              {loan.user.fullName}
                            </span>
                            {loan.user.studentId && (
                              <span className="flex items-center gap-1">
                                <GraduationCap className="h-3.5 w-3.5" />
                                {loan.user.studentId}
                              </span>
                            )}
                            <span>{loan.user.department}</span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {t(`المدة المطلوبة: ${loan.durationDays} أيام`, `Duration: ${loan.durationDays} days`)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {new Date(loan.requestedAt).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>

                          {/* Academic Purpose snippet */}
                          <p className="text-xs text-muted-foreground line-clamp-1 pt-1">
                            <strong className="text-foreground me-1">
                              {t("الغرض الأكاديمي:", "Purpose:")}
                            </strong>
                            {loan.academicJustification}
                          </p>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpand(loan.id)}
                          className="text-xs text-muted-foreground"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="h-4 w-4 me-1" />
                              {t("تفاصيل أقل", "Less")}
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-4 w-4 me-1" />
                              {t("كامل التفاصيل", "Details")}
                            </>
                          )}
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          className="border-destructive/30 text-destructive hover:bg-destructive/10"
                          onClick={() => setRejectingLoan(loan)}
                          disabled={isProcessing}
                        >
                          <XCircle className="h-4 w-4 me-1.5" />
                          <span>{t("رفض", "Reject")}</span>
                        </Button>

                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm"
                          onClick={() => handleApprove(loan.id)}
                          disabled={isProcessing || !isStockAvailable}
                        >
                          {isProcessing ? (
                            <Loader2 className="h-4 w-4 animate-spin me-1.5" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4 me-1.5" />
                          )}
                          <span>{t("اعتماد بنقرة واحدة", "Approve (1-Click)")}</span>
                        </Button>
                      </div>
                    </div>

                    {/* Expandable details drawer */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-2 gap-4 text-xs bg-muted/40 p-4 rounded-lg">
                        <div className="space-y-2">
                          <h4 className="font-semibold text-foreground text-sm">
                            {t("بيانات الطالب الأكاديمية والتواصل", "Student & Contact Details")}
                          </h4>
                          <div className="space-y-1">
                            <p><strong>{t("الاسم الكامل:", "Full Name:")}</strong> {loan.user.fullName}</p>
                            <p><strong>{t("الرقم الجامعي:", "Student ID:")}</strong> {loan.user.studentId || t("غير مسجل", "Not provided")}</p>
                            <p><strong>{t("الكلية / القسم:", "Department:")}</strong> {loan.user.department}</p>
                            <p><strong>{t("البريد الإلكتروني:", "Email:")}</strong> {loan.user.email}</p>
                            <p><strong>{t("رقم الجوال:", "Phone:")}</strong> {loan.user.phone}</p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h4 className="font-semibold text-foreground text-sm">
                            {t("مبررات الطلب وحالة المستودع", "Loan Details & Stock Status")}
                          </h4>
                          <div className="space-y-1">
                            <p><strong>{t("المدة المطلوبة:", "Requested Duration:")}</strong> {loan.durationDays} {t("أيام (الحد الأقصى 10)", "days (max 10)")}</p>
                            <p><strong>{t("الرصيد المتاح:", "Available Stock:")}</strong> {loan.equipment.availableQuantity} {t("قطع", "units")}</p>
                            <p><strong>{t("الرصيد المحجوز حالياً:", "Reserved Stock:")}</strong> {loan.equipment.reservedQuantity} {t("قطع", "units")}</p>
                            <p><strong>{t("مهلة الاستلام عند الاعتماد:", "Pickup Window:")}</strong> {t("48 ساعة من لحظة الاعتماد", "48 hours from approval")}</p>
                            <div className="pt-2">
                              <strong>{t("المبرر الأكاديمي والمشروع:", "Academic Justification:")}</strong>
                              <p className="mt-1 p-2 bg-background rounded border text-muted-foreground whitespace-pre-wrap">
                                {loan.academicJustification}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rejection Dialog with Mandatory Reason */}
      <RejectDialog
        isOpen={!!rejectingLoan}
        onClose={() => setRejectingLoan(null)}
        onConfirm={handleConfirmReject}
        applicantName={rejectingLoan?.user.fullName}
        equipmentName={
          rejectingLoan
            ? locale === "ar"
              ? rejectingLoan.equipment.nameAr
              : rejectingLoan.equipment.nameEn
            : undefined
        }
        isLoading={isRejecting}
      />
    </div>
  );
}
