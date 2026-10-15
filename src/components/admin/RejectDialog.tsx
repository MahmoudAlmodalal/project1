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
import { AlertCircle, Loader2 } from "lucide-react";

interface RejectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  applicantName?: string;
  equipmentName?: string;
  isLoading?: boolean;
}

export function RejectDialog({
  isOpen,
  onClose,
  onConfirm,
  applicantName,
  equipmentName,
  isLoading = false,
}: RejectDialogProps) {
  const { t } = useDirection();
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError(t("يرجى كتابة سبب الرفض الإلزامي", "Please provide a mandatory rejection reason"));
      return;
    }
    setError(null);
    try {
      await onConfirm(reason.trim());
      setReason("");
      onClose();
    } catch (err: any) {
      setError(err?.message || t("حدث خطأ أثناء حفظ الرفض", "An error occurred while rejecting"));
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && !isLoading) {
      setReason("");
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <span>{t("رفض طلب الاستعارة", "Reject Loan Request")}</span>
          </DialogTitle>
          <DialogDescription>
            {applicantName && equipmentName
              ? t(
                  `أنت على وشك رفض طلب الطالب ${applicantName} للمعدة "${equipmentName}". يرجى توضيح سبب الرفض لإشعار الطالب.`,
                  `You are about to reject the loan request of ${applicantName} for "${equipmentName}". Please state the reason for rejection.`
                )
              : t(
                  "يرجى تحديد سبب الرفض لإشعار الطالب. سبب الرفض إلزامي.",
                  "Please provide a reason for the rejection. This explanation is mandatory."
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

          <div className="space-y-2">
            <label
              htmlFor="rejection-reason"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {t("سبب الرفض الإلزامي", "Mandatory Rejection Reason")}
              <span className="text-destructive ms-1">*</span>
            </label>
            <textarea
              id="rejection-reason"
              rows={3}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError(null);
              }}
              placeholder={t(
                "مثال: الجهاز محجوز لمشروع تخرج آخر / الطالب غير مصرح له بهذه الفئة من المعدات...",
                "e.g. Device reserved for graduation project / student not authorized for this category..."
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
              disabled={isLoading || !reason.trim()}
            >
              {isLoading && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              {t("تأكيد الرفض", "Confirm Rejection")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
