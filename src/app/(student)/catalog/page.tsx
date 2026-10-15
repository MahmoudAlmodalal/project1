"use client";

import React, { useEffect, useState, useTransition } from "react";
import { useDirection } from "@/components/layout/DirectionProvider";
import { EquipmentCard, EquipmentItem } from "@/components/catalog/EquipmentCard";
import { BookingDialog } from "@/components/catalog/BookingDialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, SlidersHorizontal, RefreshCw, AlertTriangle, Layers } from "lucide-react";

interface Category {
  id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
}

export default function CatalogPage() {
  const { locale, t } = useDirection();
  const [items, setItems] = useState<EquipmentItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [availableOnly, setAvailableOnly] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedItemForBooking, setSelectedItemForBooking] = useState<EquipmentItem | null>(null);

  // Student loan constraints
  const [hasMaxLoans, setHasMaxLoans] = useState<boolean>(false);
  const [isDelinquent, setIsDelinquent] = useState<boolean>(false);

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

  const fetchCatalog = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== "all") {
        params.append("category", selectedCategory);
      }
      if (searchQuery.trim()) {
        params.append("search", searchQuery.trim());
      }
      if (availableOnly) {
        params.append("available_only", "true");
      }

      const res = await fetch(`/api/v1/equipment?${params.toString()}`);
      if (res.ok) {
        const result = await res.json();
        setItems(result.data || []);
        if (result.categories && result.categories.length > 0) {
          setCategories(result.categories);
        }
      }
    } catch (err) {
      console.error("Failed to load catalog:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLoansQuota();
  }, []);

  useEffect(() => {
    fetchCatalog();
  }, [selectedCategory, availableOnly]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCatalog();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {t("كتالوج المعدات المعملية", "Laboratory Equipment Catalog")}
            </h1>
            <Badge variant="outline" className="font-mono text-xs">
              SCR-04
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {t(
              "استكشف وحجز الأجهزة المعملية المتاحة للطلاب والباحثين وفق معايير الجودة والاستعارة الفورية.",
              "Browse and reserve available lab equipment for students and researchers with 1-click booking."
            )}
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            fetchCatalog();
            fetchLoansQuota();
          }}
          className="self-start sm:self-auto flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          <span>{t("تحديث المخزون", "Refresh Stock")}</span>
        </Button>
      </div>

      {/* Constraints Warning Alert if applicable */}
      {isDelinquent && (
        <div className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-destructive">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <div className="text-sm">
            <span className="font-bold">
              {t("تنبيه: حسابك مقيد مؤقتاً!", "Warning: Your account is temporarily restricted!")}
            </span>{" "}
            {t(
              "توجد لديك أجهزة متأخرة لم يتم إرجاعها إلى الشباك، يرجى مراجعة إدارة المعمل فوراً.",
              "You have overdue items that have not been returned. Please check in with lab staff."
            )}
          </div>
        </div>
      )}

      {hasMaxLoans && !isDelinquent && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-800 dark:text-amber-400">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <div className="text-sm">
            <span className="font-bold">
              {t("تنبيه: تم بلوغ الحد الأقصى للحجز!", "Notice: Active loan quota reached!")}
            </span>{" "}
            {t(
              "لديك حالياً جهازين نشطين (قيد المراجعة أو معتمدين أو مستلمين). لا يمكنك حجز جهاز إضافي قبل إرجاع أحدهما.",
              "You currently have 2 active loans. Return or cancel one before requesting another."
            )}
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={t(
                "ابحث باسم المعدة أو المواصفات الفنية...",
                "Search by equipment name, camera, laptop, model..."
              )}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ps-9"
            />
          </div>
          <Button type="submit" className="font-semibold shrink-0">
            {t("بحث", "Search")}
          </Button>
          <Button
            type="button"
            variant={availableOnly ? "default" : "outline"}
            onClick={() => setAvailableOnly(!availableOnly)}
            className="shrink-0"
          >
            <SlidersHorizontal className="h-4 w-4 me-1.5" />
            {t("المتاح فقط", "Available Only")}
          </Button>
        </form>

        {/* Category Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1">
          <Button
            size="sm"
            variant={selectedCategory === "all" ? "default" : "outline"}
            onClick={() => setSelectedCategory("all")}
            className="rounded-full text-xs shrink-0"
          >
            {t("الكل", "All")}
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat.id}
              size="sm"
              variant={selectedCategory === cat.slug || selectedCategory === cat.id ? "default" : "outline"}
              onClick={() => setSelectedCategory(cat.slug)}
              className="rounded-full text-xs shrink-0"
            >
              {locale === "ar" ? cat.nameAr : cat.nameEn}
            </Button>
          ))}
        </div>
      </div>

      {/* Catalog Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex flex-col space-y-3 rounded-xl border p-4">
              <Skeleton className="h-48 w-full rounded-lg" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <div className="flex gap-2 pt-2">
                <Skeleton className="h-9 flex-1" />
                <Skeleton className="h-9 flex-1" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed p-12 text-center bg-muted/20">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Layers className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-bold">
            {t("لا توجد معدات مطابقة للبحث", "No matching equipment found")}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-sm">
            {t(
              "جرب تغيير كلمات البحث أو تصنيف الأجهزة أو إلغاء فلتر 'المتاح فقط'.",
              "Try adjusting your search query, selecting another category, or removing filters."
            )}
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("all");
              setAvailableOnly(false);
              fetchCatalog();
            }}
          >
            {t("إعادة ضبط الفلاتر", "Reset Filters")}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map((equipment) => (
            <EquipmentCard
              key={equipment.id}
              equipment={equipment}
              isDelinquent={isDelinquent}
              hasMaxLoans={hasMaxLoans}
              onRequestBooking={(item) => setSelectedItemForBooking(item)}
            />
          ))}
        </div>
      )}

      {/* Booking Dialog Modal (SCR-04-M) */}
      <BookingDialog
        equipment={selectedItemForBooking}
        isOpen={!!selectedItemForBooking}
        onClose={() => setSelectedItemForBooking(null)}
        onSuccess={() => {
          fetchCatalog();
          fetchLoansQuota();
        }}
      />
    </div>
  );
}
