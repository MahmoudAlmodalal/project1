"use client";

import React from "react";
import Link from "next/link";
import { useDirection } from "@/components/layout/DirectionProvider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Calendar, Eye, Layers, ShieldAlert, CheckCircle2 } from "lucide-react";

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
    if (isDelinquent) return t("مقيد: لديك أجهزة متأخرة", "Blocked: Overdue items");
    if (hasMaxLoans) return t("الحد الأقصى مستهلك (جهازين)", "Max 2 active loans reached");
    if (!isAvailable) return t("غير متوفر في المخزون", "Out of stock");
    return "";
  };

  const displayName = locale === "ar" ? equipment.nameAr : equipment.nameEn;
  const displayDesc = locale === "ar" ? equipment.descriptionAr : equipment.descriptionEn;
  const displayCategory = equipment.category
    ? locale === "ar"
      ? equipment.category.nameAr
      : equipment.category.nameEn
    : null;

  return (
    <Card className="group relative flex flex-col h-full overflow-hidden rounded-xl border border-border/70 bg-card transition-all duration-200 hover:border-primary/40 hover:shadow-lg hover:-translate-y-0.5 focus-within:ring-2 focus-within:ring-primary/40">
      {/* Media Header */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted/50">
        <img
          src={equipment.imageUrl}
          alt={displayName}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80";
          }}
        />

        {/* Gradient Scrim for Contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 pointer-events-none" />

        {/* Top Floating Status Badges */}
        <div className="absolute top-3 start-3 end-3 flex items-center justify-between pointer-events-none">
          {displayCategory && (
            <Badge
              variant="secondary"
              className="px-2.5 py-0.5 text-[11px] font-medium backdrop-blur-md bg-background/90 text-foreground border border-border/50 shadow-sm"
            >
              {displayCategory}
            </Badge>
          )}

          {isAvailable ? (
            <Badge className="ms-auto flex items-center gap-1 bg-emerald-600/95 text-white hover:bg-emerald-600 text-[11px] font-medium shadow-sm">
              <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
              <span>
                {t(
                  `متاح (${equipment.availableQuantity})`,
                  `${equipment.availableQuantity} Available`
                )}
              </span>
            </Badge>
          ) : (
            <Badge variant="destructive" className="ms-auto text-[11px] font-medium shadow-sm">
              {t("غير متوفر", "Out of Stock")}
            </Badge>
          )}
        </div>
      </div>

      {/* Content Container */}
      <CardContent className="flex flex-1 flex-col p-5">
        <div className="mb-2.5 flex items-center justify-between text-xs text-muted-foreground font-mono">
          <span className="inline-flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{t(`الإجمالي: ${equipment.totalQuantity}`, `Total: ${equipment.totalQuantity}`)}</span>
          </span>
          {equipment.reservedQuantity > 0 && (
            <span className="text-amber-600 dark:text-amber-400 font-sans">
              {t(`محجوز: ${equipment.reservedQuantity}`, `Reserved: ${equipment.reservedQuantity}`)}
            </span>
          )}
        </div>

        <h3 className="line-clamp-1 text-base font-bold text-foreground group-hover:text-primary transition-colors">
          <Link href={`/catalog/${equipment.id}`} className="focus:outline-none focus:underline">
            {displayName}
          </Link>
        </h3>

        <p className="mt-2 line-clamp-2 text-xs sm:text-sm leading-relaxed text-muted-foreground">
          {displayDesc}
        </p>

        {/* Fixed Height Inline Warning Area (Prevents Layout Shifting) */}
        <div className="mt-auto pt-4 min-h-[28px]">
          {isActionDisabled && (
            <div className="flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
              <ShieldAlert className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">{getDisabledReason()}</span>
            </div>
          )}
        </div>
      </CardContent>

      {/* Action Footer */}
      <CardFooter className="grid grid-cols-2 gap-2 p-4 pt-0">
        <Button
          variant="outline"
          size="sm"
          asChild
          className="h-9 w-full text-xs font-medium border-border/80 hover:bg-accent focus-visible:ring-2 focus-visible:ring-primary"
        >
          <Link href={`/catalog/${equipment.id}`}>
            <Eye className="h-3.5 w-3.5 me-1.5" aria-hidden="true" />
            <span>{t("المواصفات", "Specs")}</span>
          </Link>
        </Button>

        <Button
          size="sm"
          disabled={isActionDisabled}
          onClick={() => onRequestBooking(equipment)}
          className="h-9 w-full text-xs font-semibold shadow-sm transition-all active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-primary"
          aria-label={
            isActionDisabled
              ? `${displayName}: ${getDisabledReason()}`
              : `${t("طلب حجز", "Book Now")} ${displayName}`
          }
        >
          <Calendar className="h-3.5 w-3.5 me-1.5" aria-hidden="true" />
          <span>{isAvailable ? t("طلب حجز", "Book Now") : t("غير متاح", "Unavailable")}</span>
        </Button>
      </CardFooter>
    </Card>
  );
}
