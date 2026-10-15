"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useDirection } from "@/components/layout/DirectionProvider";
import { EquipmentItem } from "@/components/catalog/EquipmentCard";
import { BookingDialog } from "@/components/catalog/BookingDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowRight,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Layers,
  ShieldCheck,
  Tag,
  AlertTriangle,
} from "lucide-react";

export default function EquipmentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { locale, direction, t } = useDirection();
  const [equipment, setEquipment] = useState<EquipmentItem | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isBookingOpen, setIsBookingOpen] = useState<boolean>(false);

  // Student loan constraints
  const [hasMaxLoans, setHasMaxLoans] = useState<boolean>(false);
  const [isDelinquent, setIsDelinquent] = useState<boolean>(false);

  const equipmentId = params?.id as string;

  const fetchDetails = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/v1/equipment/${equipmentId}`);
      if (res.ok) {
        const json = await res.json();
        setEquipment(json.data);
      }
    } catch (err) {
      console.error("Error loading equipment details:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLoansQuota = async () => {
    try {
      const res = await fetch("/api/v1/loans");
      if (res.ok) {
        const data = await res.json();
        const loans: any[] = data.data || [];
        const activeLoans = loans.filter((l) =>
          ["PENDING_REVIEW", "APPROVED", "CHECKED_OUT"].includes(l.status)
        );
        const overdueLoans = loans.filter((l) => l.status === "OVERDUE");

        setHasMaxLoans(activeLoans.length >= 2);
        setIsDelinquent(overdueLoans.length > 0);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (equipmentId) {
      fetchDetails();
      fetchLoansQuota();
    }
  }, [equipmentId]);

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-96 md:col-span-2 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!equipment) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mb-3" />
        <h2 className="text-xl font-bold">
          {t("المعدة غير متوفرة أو تم أرشفتها", "Equipment not found or archived")}
        </h2>
        <Button asChild className="mt-4">
          <Link href="/catalog">{t("العودة إلى الكتالوج", "Return to Catalog")}</Link>
        </Button>
      </div>
    );
  }

  const isAvailable = equipment.availableQuantity > 0;
  const isActionDisabled = !isAvailable || isDelinquent || hasMaxLoans;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Breadcrumb / Back button */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/catalog" className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
            {direction === "rtl" ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
            <span>{t("العودة إلى كتالوج الأجهزة", "Back to Catalog")}</span>
          </Link>
        </Button>
        <Badge variant="outline" className="font-mono text-xs">
          SCR-05
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Image & Specifications Table */}
        <div className="lg:col-span-2 space-y-6">
          <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border bg-muted shadow-sm">
            <img
              src={equipment.imageUrl}
              alt={locale === "ar" ? equipment.nameAr : equipment.nameEn}
              className="h-full w-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80";
              }}
            />
            <div className="absolute top-4 start-4 flex gap-2">
              {isAvailable ? (
                <Badge variant="success" className="text-sm px-3 py-1 shadow">
                  {t(
                    `متاح فوراً (${equipment.availableQuantity})`,
                    `Available Now (${equipment.availableQuantity})`
                  )}
                </Badge>
              ) : (
                <Badge variant="destructive" className="text-sm px-3 py-1 shadow">
                  {t("غير متوفر في الرفوف", "Out of Stock")}
                </Badge>
              )}
            </div>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {locale === "ar" ? equipment.nameAr : equipment.nameEn}
            </h1>
            <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <Tag className="h-4 w-4" />
              <span>
                {equipment.category
                  ? locale === "ar"
                    ? equipment.category.nameAr
                    : equipment.category.nameEn
                  : t("عام", "General")}
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-3">
            <h3 className="font-bold text-lg">{t("الوصف والمواصفات المعملية", "Lab Specs & Description")}</h3>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-line text-sm sm:text-base">
              {locale === "ar" ? equipment.descriptionAr : equipment.descriptionEn}
            </p>
          </div>

          {/* Specifications Table */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">
                {t("جدول توزيع المخزون المعملي", "Laboratory Inventory Breakdown")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div className="rounded-lg bg-muted/40 p-3">
                  <div className="text-xs text-muted-foreground">{t("إجمالي الوحدات", "Total Units")}</div>
                  <div className="text-xl font-bold mt-1">{equipment.totalQuantity}</div>
                </div>
                <div className="rounded-lg bg-emerald-500/10 p-3 text-emerald-700 dark:text-emerald-400">
                  <div className="text-xs font-medium">{t("المتاح للحجز", "Available")}</div>
                  <div className="text-xl font-bold mt-1">{equipment.availableQuantity}</div>
                </div>
                <div className="rounded-lg bg-blue-500/10 p-3 text-blue-700 dark:text-blue-400">
                  <div className="text-xs font-medium">{t("محجوز معتمد", "Reserved")}</div>
                  <div className="text-xl font-bold mt-1">{equipment.reservedQuantity}</div>
                </div>
                <div className="rounded-lg bg-amber-500/10 p-3 text-amber-700 dark:text-amber-400">
                  <div className="text-xs font-medium">{t("مستعار حالياً", "Borrowed")}</div>
                  <div className="text-xl font-bold mt-1">{equipment.borrowedQuantity}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Sticky Reservation Action Card */}
        <div className="space-y-6">
          <Card className="sticky top-24 border-primary/20 shadow-md">
            <CardHeader className="bg-muted/30 border-b pb-4">
              <Badge variant="outline" className="w-fit mb-1 font-mono text-xs">
                {t("شباك الحجز السريع", "Quick Booking")}
              </Badge>
              <CardTitle className="text-xl">
                {isAvailable ? t("جاهز للاستعارة الفورية", "Ready for Booking") : t("العتاد غير متوفر", "Out of Stock")}
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4 pt-5">
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <span>{t("مدة الاستعارة: من 1 إلى 10 أيام", "Loan Duration: 1 to 10 days")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>{t("نافذة الاستلام: 48 ساعة بعد الاعتماد", "Pickup Window: 48h upon approval")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <span>{t("العهدة: شخصية تحت إشراف المشرف الأكاديمي", "Liability: Supervised academic project")}</span>
                </div>
              </div>

              {/* Booking Trigger Button */}
              <Button
                size="lg"
                disabled={isActionDisabled}
                onClick={() => setIsBookingOpen(true)}
                className="w-full font-bold shadow-md"
              >
                <Calendar className="h-5 w-5 me-2" />
                {isAvailable ? t("فتح طلب استعارة (SCR-04-M)", "Open Booking Form") : t("غير متاح حالياً", "Unavailable")}
              </Button>

              {/* Status Warning Details */}
              {isDelinquent && (
                <div className="rounded-lg bg-destructive/10 p-3 text-xs text-destructive font-medium border border-destructive/20">
                  {t(
                    "حسابك مقيد مؤقتاً بسبب وجود أجهزة متأخرة لم تسلم.",
                    "Your account is restricted due to overdue items."
                  )}
                </div>
              )}

              {hasMaxLoans && !isDelinquent && (
                <div className="rounded-lg bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-400 font-medium border border-amber-500/20">
                  {t(
                    "بلغت الحد الأقصى للاستعارات النشطة (جهازين).",
                    "You have reached the maximum active loan limit (2 items)."
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Booking Dialog Modal (SCR-04-M) */}
      <BookingDialog
        equipment={equipment}
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        onSuccess={() => {
          fetchDetails();
          fetchLoansQuota();
        }}
      />
    </div>
  );
}
