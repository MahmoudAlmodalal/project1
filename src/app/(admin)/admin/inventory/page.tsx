"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useDirection } from "@/components/layout/DirectionProvider";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  EquipmentFormDialog,
  CategoryOption,
  EquipmentEditData,
} from "@/components/admin/EquipmentFormDialog";
import {
  Boxes,
  CheckCircle2,
  Clock,
  RotateCcw,
  AlertTriangle,
  Plus,
  Search,
  Edit2,
  Archive,
  RefreshCw,
  SlidersHorizontal,
} from "lucide-react";

interface EquipmentRow {
  id: string;
  categoryId: string;
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
  isArchived: boolean;
  category?: CategoryOption;
}

interface InventoryStats {
  totalItems: number;
  totalQuantity: number;
  availableQuantity: number;
  reservedQuantity: number;
  borrowedQuantity: number;
  damagedQuantity: number;
}

import { DEMO_EQUIPMENT, DEMO_CATEGORIES } from "@/lib/demo-data";

export default function AdminInventoryPage() {
  const { locale, t } = useDirection();

  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [equipmentList, setEquipmentList] = useState<EquipmentRow[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>(DEMO_CATEGORIES);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [showArchived, setShowArchived] = useState<boolean>(false);

  // Modal dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EquipmentEditData | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const getFilteredDemoData = () => {
    let result = [...DEMO_EQUIPMENT] as unknown as EquipmentRow[];
    if (selectedCategory !== "ALL") {
      result = result.filter(
        (item) => item.categoryId === selectedCategory || (item.category as any)?.slug === selectedCategory
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
    if (!showArchived) {
      result = result.filter((item) => !item.isArchived);
    }
    return result;
  };

  const calculateStats = (items: EquipmentRow[]): InventoryStats => {
    return {
      totalItems: items.length,
      totalQuantity: items.reduce((sum, item) => sum + item.totalQuantity, 0),
      availableQuantity: items.reduce((sum, item) => sum + item.availableQuantity, 0),
      reservedQuantity: items.reduce((sum, item) => sum + item.reservedQuantity, 0),
      borrowedQuantity: items.reduce((sum, item) => sum + item.borrowedQuantity, 0),
      damagedQuantity: items.reduce((sum, item) => sum + item.damagedQuantity, 0),
    };
  };

  const fetchInventory = useCallback(async () => {
    setIsLoading(true);
    setActionError(null);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set("search", searchQuery.trim());
      if (selectedCategory !== "ALL") params.set("category_id", selectedCategory);
      if (showArchived) params.set("is_archived", "true");
      params.set("limit", "50");

      const res = await fetch(`/api/v1/admin/inventory?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.data && data.data.length > 0) {
          setEquipmentList(data.data);
          setCategories(data.categories || DEMO_CATEGORIES);
          setStats(data.stats || calculateStats(data.data));
        } else {
          const fallback = getFilteredDemoData();
          setEquipmentList(fallback);
          setCategories(DEMO_CATEGORIES);
          setStats(calculateStats(fallback));
        }
      } else {
        const fallback = getFilteredDemoData();
        setEquipmentList(fallback);
        setCategories(DEMO_CATEGORIES);
        setStats(calculateStats(fallback));
      }
    } catch (err: any) {
      console.warn("Using demo inventory data:", err);
      const fallback = getFilteredDemoData();
      setEquipmentList(fallback);
      setCategories(DEMO_CATEGORIES);
      setStats(calculateStats(fallback));
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedCategory, showArchived]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const handleOpenAddDialog = () => {
    setEditingItem(null);
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = (item: EquipmentRow) => {
    setEditingItem({
      id: item.id,
      categoryId: item.categoryId,
      nameAr: item.nameAr,
      nameEn: item.nameEn,
      descriptionAr: item.descriptionAr,
      descriptionEn: item.descriptionEn,
      imageUrl: item.imageUrl,
      totalQuantity: item.totalQuantity,
      availableQuantity: item.availableQuantity,
      reservedQuantity: item.reservedQuantity,
      borrowedQuantity: item.borrowedQuantity,
      damagedQuantity: item.damagedQuantity,
    });
    setIsDialogOpen(true);
  };

  const handleArchive = async (id: string, name: string) => {
    const confirmMsg = t(
      `هل أنت متأكد من رغبتك في أرشفة ${name}؟ ستصبح غير متاحة للحجز.`,
      `Are you sure you want to archive ${name}? It will no longer be available for booking.`
    );
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/v1/admin/inventory/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || t("فشلت عملية الأرشفة", "Failed to archive item"));
      }
      fetchInventory();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Boxes className="h-7 w-7 text-primary" />
            {t("إدارة كتالوج ومخزون المعدات (SCR-10)", "Equipment Inventory Management (SCR-10)")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t(
              "تتبع ومراقبة دورة حياة الأصول، وإضافة معدات جديدة، وتعديل كميات المخزون مباشرة",
              "Track asset lifecycle, add new equipment, and manage stock quantities in real time"
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => fetchInventory()} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 me-1.5 ${isLoading ? "animate-spin" : ""}`} />
            {t("تحديث", "Refresh")}
          </Button>
          <Button onClick={handleOpenAddDialog} className="shadow-sm">
            <Plus className="h-4 w-4 me-1.5" />
            {t("إضافة معدة جديدة", "Add Equipment")}
          </Button>
        </div>
      </div>

      {actionError && (
        <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive border border-destructive/20 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Aggregate KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <Card className="border shadow-xs">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase flex items-center justify-between">
              <span>{t("إجمالي العتاد", "Total Gear")}</span>
              <Boxes className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {isLoading && !stats ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-foreground">
                {stats?.totalQuantity || 0}
                <span className="text-xs font-normal text-muted-foreground ms-1">
                  ({stats?.totalItems || 0} {t("صنف", "items")})
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border shadow-xs border-success/30 bg-success/5">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-semibold text-success uppercase flex items-center justify-between">
              <span>{t("المتاح للحجز", "Available")}</span>
              <CheckCircle2 className="h-4 w-4 text-success" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {isLoading && !stats ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-success">{stats?.availableQuantity || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card className="border shadow-xs border-amber-500/30 bg-amber-500/5">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-semibold text-amber-600 uppercase flex items-center justify-between">
              <span>{t("المحجوز", "Reserved")}</span>
              <Clock className="h-4 w-4 text-amber-600" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {isLoading && !stats ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-amber-600">{stats?.reservedQuantity || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card className="border shadow-xs border-blue-500/30 bg-blue-500/5">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-semibold text-blue-600 uppercase flex items-center justify-between">
              <span>{t("المستعار الميداني", "Borrowed")}</span>
              <RotateCcw className="h-4 w-4 text-blue-600" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {isLoading && !stats ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-blue-600">{stats?.borrowedQuantity || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card className="border shadow-xs border-destructive/30 bg-destructive/5 col-span-2 md:col-span-1">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-semibold text-destructive uppercase flex items-center justify-between">
              <span>{t("التالف / الصيانة", "Damaged")}</span>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {isLoading && !stats ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-destructive">{stats?.damagedQuantity || 0}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 border shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="absolute start-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={t("البحث بالاسم أو المواصفات...", "Search by title or specs...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ps-9"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="ALL">{t("جميع التصنيفات", "All Categories")}</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {locale === "ar" ? c.nameAr : c.nameEn}
                  </option>
                ))}
              </select>
            </div>

            <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground cursor-pointer ps-2 border-s">
              <input
                type="checkbox"
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
                className="rounded border-input text-primary focus:ring-primary"
              />
              {t("عرض المؤرشف", "Show Archived")}
            </label>
          </div>
        </div>
      </Card>

      {/* Equipment Inventory Table */}
      <div className="rounded-xl border bg-card shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-sm">
            <thead className="bg-muted/50 border-b text-muted-foreground text-xs font-semibold">
              <tr>
                <th className="px-4 py-3.5 text-start">{t("المعدة", "Equipment")}</th>
                <th className="px-4 py-3.5 text-start">{t("التصنيف", "Category")}</th>
                <th className="px-4 py-3.5 text-center">{t("الإجمالي", "Total")}</th>
                <th className="px-4 py-3.5 text-center">{t("المتاح", "Available")}</th>
                <th className="px-4 py-3.5 text-center">{t("محجوز", "Reserved")}</th>
                <th className="px-4 py-3.5 text-center">{t("مستعار", "Borrowed")}</th>
                <th className="px-4 py-3.5 text-center">{t("تالف", "Damaged")}</th>
                <th className="px-4 py-3.5 text-center">{t("الحالة", "Status")}</th>
                <th className="px-4 py-3.5 text-end">{t("الإجراءات", "Actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={9} className="px-4 py-4">
                      <Skeleton className="h-6 w-full" />
                    </td>
                  </tr>
                ))
              ) : equipmentList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">
                    <Boxes className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p className="font-medium">
                      {t("لا توجد معدات مطابقة للبحث", "No equipment matching filters")}
                    </p>
                  </td>
                </tr>
              ) : (
                equipmentList.map((item) => {
                  const displayName = locale === "ar" ? item.nameAr : item.nameEn;
                  const displayCategory = item.category
                    ? locale === "ar"
                      ? item.category.nameAr
                      : item.category.nameEn
                    : "-";

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-muted/30 transition-colors ${
                        item.isArchived ? "opacity-60 bg-muted/10" : ""
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.imageUrl || "https://images.unsplash.com/photo-1516035069371-29a1b244cc32"}
                            alt={displayName}
                            className="h-10 w-10 rounded-md object-cover border shrink-0 bg-muted"
                          />
                          <div>
                            <div className="font-semibold text-foreground">{displayName}</div>
                            <div className="text-xs text-muted-foreground line-clamp-1 max-w-xs">
                              {locale === "ar" ? item.descriptionAr : item.descriptionEn}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-xs font-normal">
                          {displayCategory}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-foreground">
                        {item.totalQuantity}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-semibold text-success">{item.availableQuantity}</span>
                      </td>
                      <td className="px-4 py-3 text-center text-amber-600 font-medium">
                        {item.reservedQuantity}
                      </td>
                      <td className="px-4 py-3 text-center text-blue-600 font-medium">
                        {item.borrowedQuantity}
                      </td>
                      <td className="px-4 py-3 text-center text-destructive font-medium">
                        {item.damagedQuantity}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {item.isArchived ? (
                          <Badge variant="secondary" className="text-xs">
                            {t("مؤرشف", "Archived")}
                          </Badge>
                        ) : item.availableQuantity > 0 ? (
                          <Badge variant="default" className="text-xs bg-success text-success-foreground">
                            {t("نشط / متاح", "Active / Available")}
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="text-xs">
                            {t("نفد المخزون", "Out of Stock")}
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-end">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEditDialog(item)}
                            title={t("تعديل", "Edit")}
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          {!item.isArchived && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleArchive(item.id, displayName)}
                              disabled={item.reservedQuantity > 0 || item.borrowedQuantity > 0}
                              title={
                                item.reservedQuantity > 0 || item.borrowedQuantity > 0
                                  ? t("لا يمكن أرشفة معدة لديها حجوزات نشطة", "Cannot archive item with active loans")
                                  : t("أرشفة", "Archive")
                              }
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            >
                              <Archive className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SCR-10-M Form Dialog */}
      <EquipmentFormDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSuccess={() => {
          fetchInventory();
        }}
        categories={categories}
        initialData={editingItem}
      />
    </div>
  );
}
