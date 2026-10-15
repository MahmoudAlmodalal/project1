"use client";

import React, { useState } from "react";
import { useDirection } from "@/components/layout/DirectionProvider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2 } from "lucide-react";
import { DamageSeverity } from "@prisma/client";

interface DamageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { severity: DamageSeverity; notes: string }) => Promise<void>;
  equipmentName?: string;
  studentName?: string;
  isLoading?: boolean;
}

export function DamageModal({
  isOpen,
  onClose,
  onConfirm,
  equipmentName,
  studentName,
  isLoading = false,
}: DamageModalProps) {
  const { t } = useDirection();
  const [severity, setSeverity] = useState<DamageSeverity>(DamageSeverity.MODERATE);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim()) {
      setError(t("يرجى كتابة الملاحظات الفنية للضرر", "Please provide technical damage notes"));
      return;
    }

    setError(null);
    try {
      await onConfirm({
        severity,
        notes: notes.trim(),
      });
      setNotes("");
      setSeverity(DamageSeverity.MODERATE);
      onClose();
    } catch (err: any) {
      setError(err?.message || t("حدث خطأ أثناء تسجيل الضرر", "An error occurred while logging damage"));
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && !isLoading) {
      setNotes("");
      setSeverity(DamageSeverity.MODERATE);
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-500">
            <AlertTriangle className="h-5 w-5" />
            <span>{t("تسجيل تلف / عطل في المعدة", "Log Equipment Damage / Defect")}</span>
          </DialogTitle>
          <DialogDescription>
            {equipmentName
              ? t(
                  `تسجيل عطل للمعدة "${equipmentName}" المسترجعة من ${studentName || "الطالب"}. سيتم تحويل مخزونها إلى فئة التوالف/الصيانة.`,
                  `Logging defect for "${equipmentName}" returned by ${studentName || "student"}. Stock will be routed to damaged pool.`
                )
              : t(
                  "قم بتحديد مستوى الضرر وكتابة تقرير فني موجز لوصف المشكلة.",
                  "Select the severity level and provide concise technical defect notes."
                )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <label
              htmlFor="damage-severity"
              className="text-sm font-medium leading-none"
            >
              {t("مستوى خطورة الضرر", "Damage Severity")}
              <span className="text-destructive ms-1">*</span>
            </label>
            <select
              id="damage-severity"
              value={severity}
              onChange={(e) => setSeverity(e.target.value as DamageSeverity)}
              disabled={isLoading}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value={DamageSeverity.MINOR}>{t("طفيف (Minor) - خدوش سطحية قابلة للاستخدام", "Minor - cosmetic scratches, still functional")}</option>
              <option value={DamageSeverity.MODERATE}>{t("متوسط (Moderate) - خلل جزئي يحتاج صيانة فورية", "Moderate - partial defect requiring maintenance")}</option>
              <option value={DamageSeverity.SEVERE}>{t("شديد (Severe) - كسر أو عطل يمنع التشغيل", "Severe - broken or inoperable defect")}</option>
              <option value={DamageSeverity.TOTAL_LOSS}>{t("تلف كامل (Total Loss) - غير قابل للإصلاح", "Total Loss - unrepairable / destroyed")}</option>
            </select>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="damage-notes"
              className="text-sm font-medium leading-none"
            >
              {t("الملاحظات الفنية ووصف العطل", "Technical Notes & Defect Description")}
              <span className="text-destructive ms-1">*</span>
            </label>
            <textarea
              id="damage-notes"
              rows={3}
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                if (error) setError(null);
              }}
              placeholder={t(
                "مثال: كسر في حامل العدسة الجانبي نتيجة سقوط أثناء التصوير الميداني...",
                "e.g. Broken lens mount latch due to fall during field shoot..."
              )}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isLoading}
              required
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              {t("إلغاء", "Cancel")}
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={isLoading || !notes.trim()}
            >
              {isLoading && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              {t("تأكيد تسجيل الضرر والاسترجاع", "Confirm Damage & Return")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
