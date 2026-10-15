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
import { CalendarPlus, AlertCircle, Loader2 } from "lucide-react";

interface ExtensionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (additionalDays: number) => Promise<void>;
  currentDuration: number;
  equipmentName?: string;
  studentName?: string;
  isLoading?: boolean;
}

export function ExtensionModal({
  isOpen,
  onClose,
  onConfirm,
  currentDuration,
  equipmentName,
  studentName,
  isLoading = false,
}: ExtensionModalProps) {
  const { t } = useDirection();
  const maxAvailableExtension = Math.max(0, 10 - currentDuration);
  const [additionalDays, setAdditionalDays] = useState<number>(Math.min(2, maxAvailableExtension));
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (additionalDays <= 0) {
      setError(t("يجب أن تكون أيام التمديد يوماً واحداً على الأقل", "Extension must be at least 1 day"));
      return;
    }
    if (currentDuration + additionalDays > 10) {
      setError(
        t(
          `الحد الأقصى التراكمي للاستعارة هو 10 أيام (المدة الحالية: ${currentDuration} يوم)`,
          `Cumulative maximum duration is 10 days (current: ${currentDuration} days)`
        )
      );
      return;
    }

    setError(null);
    try {
      await onConfirm(additionalDays);
      onClose();
    } catch (err: any) {
      setError(err?.message || t("حدث خطأ أثناء تمديد الاستعارة", "An error occurred while extending loan"));
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && !isLoading) {
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <CalendarPlus className="h-5 w-5" />
            <span>{t("تمديد فترة الاستعارة", "Extend Loan Duration")}</span>
          </DialogTitle>
          <DialogDescription>
            {equipmentName
              ? t(
                  `تمديد استعارة "${equipmentName}" للطالب ${studentName || ""}. المدة الحالية: ${currentDuration} أيام (الحد الأقصى المسموح به: 10 أيام تراكمياً).`,
                  `Extend loan of "${equipmentName}" for ${studentName || "student"}. Current duration: ${currentDuration} days (max limit: 10 days cumulative).`
                )
              : t(
                  `تمديد فترة الإعارة حضورياً عند الكاونتر بما لا يتجاوز 10 أيام إجمالية.`,
                  "Extend loan duration at counter up to 10 days cumulative limit."
                )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="rounded-lg bg-muted/50 p-4 border space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("المدة السابقة:", "Current Duration:")}</span>
              <span className="font-semibold">{currentDuration} {t("أيام", "days")}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("الأيام الإضافية:", "Additional Days:")}</span>
              <span className="font-semibold text-primary">+{additionalDays} {t("أيام", "days")}</span>
            </div>
            <div className="flex justify-between text-sm pt-2 border-t">
              <span className="font-medium">{t("المدة الإجمالية الجديدة:", "New Total Duration:")}</span>
              <span className={`font-bold ${currentDuration + additionalDays > 10 ? "text-destructive" : "text-emerald-600 dark:text-emerald-400"}`}>
                {currentDuration + additionalDays} / 10 {t("أيام", "days")}
              </span>
            </div>
          </div>

          {maxAvailableExtension <= 0 ? (
            <div className="p-3 text-sm text-amber-700 bg-amber-50 dark:bg-amber-950/30 rounded-md border border-amber-200 dark:border-amber-900">
              {t("بلغت هذه الاستعارة الحد الأقصى المسموح به (10 أيام) ولا يمكن تمديدها أكثر.", "This loan has reached the maximum 10-day limit and cannot be extended further.")}
            </div>
          ) : (
            <div className="space-y-2">
              <label htmlFor="additional-days" className="text-sm font-medium leading-none">
                {t("عدد الأيام الإضافية المراد زيادتها:", "Additional days to add:")}
              </label>
              <div className="flex items-center gap-3">
                <input
                  id="additional-days"
                  type="range"
                  min={1}
                  max={maxAvailableExtension}
                  value={additionalDays}
                  onChange={(e) => setAdditionalDays(parseInt(e.target.value, 10))}
                  disabled={isLoading}
                  className="w-full accent-primary h-2 bg-muted rounded-lg cursor-pointer"
                />
                <span className="w-12 text-center font-bold px-2 py-1 bg-primary/10 text-primary rounded border border-primary/20">
                  +{additionalDays}
                </span>
              </div>
            </div>
          )}

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
              disabled={isLoading || maxAvailableExtension <= 0 || additionalDays <= 0}
            >
              {isLoading && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              {t("تأكيد التمديد", "Confirm Extension")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
