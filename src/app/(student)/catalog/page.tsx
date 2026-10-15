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
import { DEMO_EQUIPMENT, DEMO_CATEGORIES } from "@/lib/demo-data";

interface Category {
  id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
}

export default function CatalogPage() {
  const { locale, t } = useDirection();
  const [items, setItems] = useState<EquipmentItem[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEMO_CATEGORIES);
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

  const getFilteredDemoData = () => {
    let result = [...DEMO_EQUIPMENT] as EquipmentItem[];
    if (selectedCategory !== "all") {
      result = result.filter(
        (item) => item.category?.id === selectedCategory || item.category?.slug === selectedCategory
      );
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (item) =>
          item.nameAr.toLowerCase().includes(q) ||
          item.nameEn.toLowerCase().includes(q) ||
          item.descriptionAr.toLowerCase().includes(q) ||
          item.descriptionEn.toLowerCase().includes(q)
      );
    }
    if (availableOnly) {
      result = result.filter((item) => item.availableQuantity > 0);
    }
    return result;
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
        if (result.data && result.data.length > 0) {
          setItems(result.data);
          if (result.categories && result.categories.length > 0) {
            setCategories(result.categories);
          }
        } else {
          // Fall back to filtered demo data
          setItems(getFilteredDemoData());
        }
      } else {
        setItems(getFilteredDemoData());
      }
    } catch (err) {
      console.warn("Using demo catalog data:", err);
      setItems(getFilteredDemoData());
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-2 border-b border-border/60">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            {t("كتالوج المعدات المعملية", "Laboratory Equipment Catalog")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl leading-relaxed">
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
          className="self-start sm:self-auto flex items-center gap-2 h-9 px-3.5 text-xs font-medium shadow-sm hover:bg-accent focus-visible:ring-2 focus-visible:ring-primary"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} aria-hidden="true" />
          <span>{t("تحديث المخزون", "Refresh Stock")}</span>
        </Button>
      </div>

      {/* Constraints Warning Alert if applicable */}
      {isDelinquent && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-destructive shadow-sm"
        >
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" aria-hidden="true" />
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
        <div
          role="status"
          className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-800 dark:text-amber-400 shadow-sm"
        >
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" aria-hidden="true" />
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
      <div className="flex flex-col gap-3 rounded-xl border border-border/80 bg-card p-3.5 sm:p-4 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
            <Input
              type="text"
              placeholder={t(
                "ابحث باسم المعدة أو المواصفات الفنية...",
                "Search by equipment name, camera, laptop, model..."
              )}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ps-9 h-10 text-sm focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>
          <Button type="submit" className="h-10 px-5 font-semibold shrink-0 shadow-sm">
            {t("بحث", "Search")}
          </Button>
          <Button
            type="button"
            variant={availableOnly ? "default" : "outline"}
            onClick={() => setAvailableOnly(!availableOnly)}
            className="h-10 shrink-0 font-medium"
          >
            <SlidersHorizontal className="h-4 w-4 me-1.5" aria-hidden="true" />
            {t("المتاح فقط", "Available Only")}
          </Button>
        </form>

        {/* Category Chips with Horizontal Scroll Affordance */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none">
          <Button
            size="sm"
            variant={selectedCategory === "all" ? "default" : "outline"}
            onClick={() => setSelectedCategory("all")}
            className="rounded-full text-xs h-7 px-3 shrink-0 transition-colors"
          >
            {t("الكل", "All")}
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat.id}
              size="sm"
              variant={selectedCategory === cat.slug || selectedCategory === cat.id ? "default" : "outline"}
              onClick={() => setSelectedCategory(cat.slug)}
              className="rounded-full text-xs h-7 px-3 shrink-0 transition-colors"
            >
              {locale === "ar" ? cat.nameAr : cat.nameEn}
            </Button>
          ))}
        </div>
      </div>

      {/* Catalog Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex flex-col space-y-3 rounded-xl border border-border/60 p-4 bg-card">
              <Skeleton className="aspect-[16/10] w-full rounded-lg" />
              <div className="flex justify-between items-center pt-1">
                <Skeleton className="h-3.5 w-1/3" />
                <Skeleton className="h-3.5 w-1/4" />
              </div>
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <div className="flex gap-2 pt-3 mt-auto">
                <Skeleton className="h-9 flex-1 rounded-md" />
                <Skeleton className="h-9 flex-1 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 p-12 text-center bg-card/50">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted/80 text-muted-foreground">
            <Layers className="h-7 w-7" aria-hidden="true" />
          </div>
          <h3 className="mt-4 text-base font-bold text-foreground">
            {t("لا توجد معدات مطابقة للبحث", "No matching equipment found")}
          </h3>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground max-w-sm">
            {t(
              "جرب تغيير كلمات البحث أو تصنيف الأجهزة أو إلغاء فلتر 'المتاح فقط'.",
              "Try adjusting your search query, selecting another category, or removing filters."
            )}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4 text-xs font-semibold h-9"
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
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
