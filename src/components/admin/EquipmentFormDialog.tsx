"use client";

import React, { useState, useEffect } from "react";
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
import { Input } from "@/components/ui/input";
import { AlertCircle, Loader2 } from "lucide-react";

export interface CategoryOption {
  id: string;
  nameAr: string;
  nameEn: string;
}

export interface EquipmentEditData {
  id?: string;
  categoryId: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  imageUrl: string;
  totalQuantity: number;
  availableQuantity?: number;
  reservedQuantity?: number;
  borrowedQuantity?: number;
  damagedQuantity?: number;
}

interface EquipmentFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categories: CategoryOption[];
  initialData?: EquipmentEditData | null;
}

export function EquipmentFormDialog({
  isOpen,
  onClose,
  onSuccess,
  categories,
  initialData,
}: EquipmentFormDialogProps) {
  const { locale, t } = useDirection();
  const isEditing = Boolean(initialData?.id);

  const [categoryId, setCategoryId] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [descriptionAr, setDescriptionAr] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [totalQuantity, setTotalQuantity] = useState<number>(1);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setCategoryId(initialData.categoryId || (categories[0]?.id || ""));
      setNameAr(initialData.nameAr || "");
      setNameEn(initialData.nameEn || "");
      setDescriptionAr(initialData.descriptionAr || "");
      setDescriptionEn(initialData.descriptionEn || "");
      setImageUrl(initialData.imageUrl || "");
      setTotalQuantity(initialData.totalQuantity ?? 1);
    } else {
      setCategoryId(categories[0]?.id || "");
      setNameAr("");
      setNameEn("");
      setDescriptionAr("");
      setDescriptionEn("");
      setImageUrl("");
      setTotalQuantity(1);
    }
    setErrorMessage(null);
  }, [initialData, categories, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!categoryId) {
      setErrorMessage(t("يرجى اختيار التصنيف", "Please select a category"));
      return;
    }

    if (!nameAr.trim() || !nameEn.trim()) {
      setErrorMessage(t("يرجى إدخال اسم المعدة بالعربية والإنجليزية", "Please enter equipment name in both Arabic and English"));
      return;
    }

    if (!descriptionAr.trim() || !descriptionEn.trim()) {
      setErrorMessage(t("يرجى إدخال وصف المعدة بالعربية والإنجليزية", "Please enter description in both Arabic and English"));
      return;
    }

    if (totalQuantity < 0) {
      setErrorMessage(t("الكمية الإجمالية لا يمكن أن تكون سالبة", "Total quantity cannot be negative"));
      return;
    }

    setIsSubmitting(true);

    try {
      const endpoint = isEditing
        ? `/api/v1/admin/inventory/${initialData!.id}`
        : `/api/v1/admin/inventory`;
      const method = isEditing ? "PATCH" : "POST";

      const payload: any = {
        categoryId,
        nameAr: nameAr.trim(),
        nameEn: nameEn.trim(),
        descriptionAr: descriptionAr.trim(),
        descriptionEn: descriptionEn.trim(),
        imageUrl: imageUrl.trim() || "https://images.unsplash.com/photo-1516035069371-29a1b244cc32",
        totalQuantity,
      };

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || t("فشلت عملية حفظ المعدة", "Failed to save equipment"));
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || t("حدث خطأ أثناء حفظ المعدة", "An error occurred while saving"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing
              ? t("تعديل بيانات العتاد والمخزون", "Edit Equipment & Stock (SCR-10-M)")
              : t("إضافة معدة جديدة للكتالوج", "Add New Equipment (SCR-10-M)")}
          </DialogTitle>
          <DialogDescription>
            {t(
              "أدخل المواصفات الفنية والكمية المتوفرة. ستنعكس التغييرات فوراً على كتالوج الطلاب.",
              "Enter technical specifications and available quantity. Changes propagate immediately to the student catalog."
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {errorMessage && (
            <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                {t("الاسم بالعربية *", "Arabic Name *")}
              </label>
              <Input
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                placeholder={t("مثال: كاميرا سوني الفا A7 III", "e.g. Sony Alpha A7 III")}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                {t("الاسم بالإنجليزية *", "English Name *")}
              </label>
              <Input
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                placeholder="e.g. Sony Alpha A7 III Mirrorless"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                {t("التصنيف *", "Category *")}
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                required
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {locale === "ar" ? c.nameAr : c.nameEn}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                {t("الكمية الإجمالية الكلية *", "Total Quantity *")}
              </label>
              <Input
                type="number"
                min="0"
                value={totalQuantity}
                onChange={(e) => setTotalQuantity(parseInt(e.target.value, 10) || 0)}
                required
              />
              {isEditing && initialData && (
                <div className="text-[11px] text-muted-foreground flex gap-2 flex-wrap">
                  <span>{t(`متاح: ${initialData.availableQuantity ?? 0}`, `Available: ${initialData.availableQuantity ?? 0}`)}</span>
                  <span>{t(`محجوز: ${initialData.reservedQuantity ?? 0}`, `Reserved: ${initialData.reservedQuantity ?? 0}`)}</span>
                  <span>{t(`مستعار: ${initialData.borrowedQuantity ?? 0}`, `Borrowed: ${initialData.borrowedQuantity ?? 0}`)}</span>
                  <span>{t(`تالف: ${initialData.damagedQuantity ?? 0}`, `Damaged: ${initialData.damagedQuantity ?? 0}`)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              {t("رابط صورة المعدة (URL)", "Image URL")}
            </label>
            <Input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://images.unsplash.com/photo-..."
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              {t("الوصف والمواصفات بالعربية *", "Arabic Description & Specs *")}
            </label>
            <textarea
              value={descriptionAr}
              onChange={(e) => setDescriptionAr(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              placeholder={t("مواصفات الجهاز وملحقاته...", "Specifications and accessories...")}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              {t("الوصف والمواصفات بالإنجليزية *", "English Description & Specs *")}
            </label>
            <textarea
              value={descriptionEn}
              onChange={(e) => setDescriptionEn(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              placeholder="Detailed specifications and accessories..."
              required
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              {t("إلغاء", "Cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin me-2" />
                  {t("جارٍ الحفظ...", "Saving...")}
                </>
              ) : (
                t(isEditing ? "حفظ التعديلات" : "إضافة للكتالوج", isEditing ? "Save Changes" : "Add to Catalog")
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
