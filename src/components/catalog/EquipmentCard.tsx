"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useDirection } from "@/components/layout/DirectionProvider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Calendar, Eye, Layers } from "lucide-react";

export interface EquipmentItem {
  id: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  imageUrl: string;
  totalQuantity: number;
  availableQuantity: number;
  reservedQuantity: number;
  borrowedQuantity: number;
  damagedQuantity: number;
  isAvailable?: boolean;
  category?: {
    id: string;
    nameAr: string;
    nameEn: string;
    slug: string;
  };
}

interface EquipmentCardProps {
  equipment: EquipmentItem;
  onRequestBooking: (equipment: EquipmentItem) => void;
  isDelinquent?: boolean;
  hasMaxLoans?: boolean;
  isPendingApproval?: boolean;
}

export function EquipmentCard({
  equipment,
  onRequestBooking,
  isDelinquent = false,
  hasMaxLoans = false,
  isPendingApproval = false,
}: EquipmentCardProps) {
  const { locale, t } = useDirection();

  const isAvailable = equipment.availableQuantity > 0;
  const isActionDisabled = !isAvailable || isDelinquent || hasMaxLoans || isPendingApproval;

  const getDisabledReason = () => {
    if (isPendingApproval) return t("الحساب بانتظار الاعتماد", "Account pending approval");
    if (isDelinquent) return t("مقيد لوجود أجهزة متأخرة", "Blocked: overdue items");
    if (hasMaxLoans) return t("وصلت للحد الأقصى (جهازين)", "Max 2 active loans reached");
    if (!isAvailable) return t("غير متاح حالياً", "Out of stock");
    return "";
  };

  return (
    <Card className="flex flex-col overflow-hidden transition-all duration-200 hover:shadow-md border-border/80">
      {/* Thumbnail with overlay status badge */}
      <div className="relative aspect-[16/10] w-full bg-muted overflow-hidden">
        <img
          src={equipment.imageUrl}
          alt={locale === "ar" ? equipment.nameAr : equipment.nameEn}
          className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
          onError={(e) => {
            // fallback placeholder if image url is broken
            (e.target as HTMLImageElement).src =
              "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80";
          }}
        />
        <div className="absolute top-2.5 start-2.5 flex flex-wrap gap-1.5">
          {isAvailable ? (
            <Badge variant="success" className="font-semibold shadow-sm">
              {t(
                `متاح (${equipment.availableQuantity})`,
                `Available (${equipment.availableQuantity})`
              )}
            </Badge>
          ) : (
            <Badge variant="destructive" className="font-semibold shadow-sm">
              {t("غير متوفر", "Out of Stock")}
            </Badge>
          )}

          {equipment.category && (
            <Badge variant="secondary" className="shadow-sm backdrop-blur bg-background/80">
              {locale === "ar" ? equipment.category.nameAr : equipment.category.nameEn}
            </Badge>
          )}
        </div>
      </div>

      {/* Item info */}
      <CardContent className="flex-1 p-5">
        <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Layers className="h-3.5 w-3.5" />
            {t(`إجمالي المخزون: ${equipment.totalQuantity}`, `Total: ${equipment.totalQuantity}`)}
          </span>
          <span className="text-xs">
            {equipment.reservedQuantity > 0 &&
              t(`محجوز: ${equipment.reservedQuantity}`, `Reserved: ${equipment.reservedQuantity}`)}
          </span>
        </div>

        <h3 className="line-clamp-1 text-lg font-bold tracking-tight text-foreground">
          {locale === "ar" ? equipment.nameAr : equipment.nameEn}
        </h3>

        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground leading-relaxed">
          {locale === "ar" ? equipment.descriptionAr : equipment.descriptionEn}
        </p>
      </CardContent>

      {/* Action buttons */}
      <CardFooter className="grid grid-cols-2 gap-2.5 p-5 pt-0 border-t bg-muted/20">
        <Button variant="outline" size="sm" asChild className="w-full">
          <Link href={`/catalog/${equipment.id}`}>
            <Eye className="h-4 w-4 me-1.5" />
            {t("المواصفات", "Specs")}
          </Link>
        </Button>

        <Button
          size="sm"
          disabled={isActionDisabled}
          onClick={() => onRequestBooking(equipment)}
          className="w-full font-semibold"
          title={getDisabledReason()}
        >
          <Calendar className="h-4 w-4 me-1.5" />
          {isAvailable ? t("طلب حجز", "Book Now") : t("غير متاح", "Unavailable")}
        </Button>
      </CardFooter>

      {/* Disabled reason hint bar if applicable */}
      {isActionDisabled && (
        <div className="bg-amber-500/10 px-4 py-1.5 text-center text-xs text-amber-700 dark:text-amber-400 font-medium border-t border-amber-500/20">
          {getDisabledReason()}
        </div>
      )}
    </Card>
  );
}
