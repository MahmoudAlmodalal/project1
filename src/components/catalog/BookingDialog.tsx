"use client";

import React, { useState } from "react";
import { useDirection } from "@/components/layout/DirectionProvider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EquipmentItem } from "./EquipmentCard";
import { Calendar, Minus, Plus, AlertCircle, CheckCircle2 } from "lucide-react";

interface BookingDialogProps {
  equipment: EquipmentItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function BookingDialog({
  equipment,
  isOpen,
  onClose,
  onSuccess,
}: BookingDialogProps) {
  const { locale, t } = useDirection();
  const [durationDays, setDurationDays] = useState<number>(3);
  const [academicJustification, setAcademicJustification] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!equipment) return null;

  const handleDurationDecrease = () => {
    if (durationDays > 1) {
      setDurationDays((prev) => prev - 1);
    }
  };

  const handleDurationIncrease = () => {
    if (durationDays < 10) {
      setDurationDays((prev) => prev + 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!academicJustification.trim()) {
      setErrorMessage(
        t(
          "يرجى كتابة المبرر الأكاديمي للاستعارة والمقرر المعني.",
          "Please enter academic justification and associated course."
        )
      );
      return;
    }

    setIsSubmitting(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 650));
      const demoRequest = { equipmentId: equipment.id, durationDays, academicJustification: academicJustification.trim(), createdAt: new Date().toISOString() };
      const existing = JSON.parse(localStorage.getItem("borrowhub-demo-requests") || "[]");
      localStorage.setItem("borrowhub-demo-requests", JSON.stringify([...existing, demoRequest]));

      setSuccessMessage(
        t(
          "تم إرسال طلب الحجز بنجاح! بانتظار اعتماد مسؤول المعمل.",
          "Booking request submitted successfully! Awaiting admin approval."
        )
      );

      setTimeout(() => {
        setIsSubmitting(false);
        setAcademicJustification("");
        setDurationDays(3);
        setSuccessMessage(null);
        onClose();
        if (onSuccess) onSuccess();
      }, 1500);
    } catch {
      setErrorMessage(t("تعذر حفظ الطلب التجريبي.", "Could not save demo request."));
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg p-6">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-primary font-bold">
              {t("نموذج الحجز (SCR-04-M)", "Booking Modal (SCR-04-M)")}
            </Badge>
            <Badge variant="success">
              {t(`متاح (${equipment.availableQuantity})`, `Available (${equipment.availableQuantity})`)}
            </Badge>
          </div>
          <DialogTitle className="text-xl">
            {t("طلب استعارة عتاد معملي", "Request Equipment Loan")}
          </DialogTitle>
          <DialogDescription>
            {locale === "ar" ? equipment.nameAr : equipment.nameEn}
          </DialogDescription>
        </DialogHeader>

        {/* Feedback alerts */}
        {errorMessage && (
          <div className="flex items-center gap-2 rounded-lg bg-destructive/15 p-3 text-sm text-destructive font-medium border border-destructive/20">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-500/15 p-3 text-sm text-emerald-700 dark:text-emerald-400 font-medium border border-emerald-500/20">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 py-2">
          {/* Duration Stepper (1-10 days) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold">
                {t("مدة الاستعارة المطلوبة (أيام)", "Requested Duration (Days)")}
              </label>
              <span className="text-xs text-muted-foreground">
                {t("الحد الأقصى: 10 أيام", "Max: 10 days")}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleDurationDecrease}
                disabled={durationDays <= 1 || isSubmitting}
                className="h-9 w-9"
              >
                <Minus className="h-4 w-4" />
              </Button>

              <div className="flex items-center gap-2 font-bold text-lg">
                <Calendar className="h-5 w-5 text-primary" />
                <span>
                  {durationDays} {t("أيام تقويمية", "Calendar Days")}
                </span>
              </div>

              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleDurationIncrease}
                disabled={durationDays >= 10 || isSubmitting}
                className="h-9 w-9"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Academic Justification */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold">
                {t("المبرر الأكاديمي والمشروع", "Academic Justification & Project")}
                <span className="text-destructive ms-1">*</span>
              </label>
              <span className="text-xs text-muted-foreground">
                {t("إلزامي للمراجعة", "Mandatory for review")}
              </span>
            </div>
            <textarea
              required
              rows={3}
              value={academicJustification}
              onChange={(e) => setAcademicJustification(e.target.value)}
              disabled={isSubmitting}
              placeholder={t(
                "مثال: مشروع التخرج للفصل الثاني - تجارب الروبوتات المعملية واختبار المستشعرات تحت إشراف د. أحمد",
                "e.g. Graduation project semester 2 - robotics lab experiments under supervisor Dr. Ahmed"
              )}
              className="w-full rounded-lg border border-input bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50"
            />
          </div>

          {/* Policy Notice */}
          <div className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground space-y-1">
            <p className="font-semibold text-foreground">
              {t("سياسة الاستعارة وضوابط العهدة:", "Borrowing Policy & Liability:")}
            </p>
            <p>
              {t(
                "• تلتزم باستلام الجهاز خلال 48 ساعة من وقت الاعتماد وإلا سيلغى الحجز تلقائياً.",
                "• You must pick up the item within 48h of approval, otherwise reservation expires automatically."
              )}
            </p>
            <p>
              {t(
                "• الحد الأقصى لجهازين نشطين في نفس الوقت لكل طالب مسجل.",
                "• Maximum 2 active concurrent equipment loans per student."
              )}
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              {t("إلغاء", "Cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting || !academicJustification.trim()}>
              {isSubmitting ? t("جارٍ الإرسال...", "Submitting...") : t("تأكيد طلب الحجز", "Confirm Booking")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
