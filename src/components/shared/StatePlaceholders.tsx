"use client";

import React from "react";
import { useDirection } from "@/components/layout/DirectionProvider";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  Inbox,
  AlertCircle,
  RefreshCw,
  SearchX,
  FileQuestion,
  LucideIcon,
} from "lucide-react";

export interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  const { t } = useDirection();

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-xl border border-dashed border-border/80 bg-card/50",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-muted/80 text-muted-foreground mb-3 sm:mb-4">
        <Icon className="h-6 w-6 sm:h-7 sm:w-7" aria-hidden="true" />
      </div>
      <h3 className="text-base sm:text-lg font-bold text-foreground">
        {title || t("لا توجد بيانات متاحة", "No data available")}
      </h3>
      {description && (
        <p className="mt-1 text-xs sm:text-sm text-muted-foreground max-w-sm sm:max-w-md">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          variant="outline"
          size="sm"
          className="mt-4 text-xs font-semibold h-9"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title,
  message,
  onRetry,
  className,
}: ErrorStateProps) {
  const { t } = useDirection();

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-xl border border-destructive/20 bg-destructive/5 text-destructive",
        className
      )}
      role="alert"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-3">
        <AlertCircle className="h-6 w-6" aria-hidden="true" />
      </div>
      <h3 className="text-base font-bold">
        {title || t("حدث خطأ أثناء تحميل البيانات", "Error loading data")}
      </h3>
      {message && (
        <p className="mt-1 text-xs sm:text-sm text-muted-foreground max-w-md">
          {message}
        </p>
      )}
      {onRetry && (
        <Button
          onClick={onRetry}
          variant="outline"
          size="sm"
          className="mt-4 gap-2 text-xs font-semibold"
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          {t("إعادة المحاولة", "Retry")}
        </Button>
      )}
    </div>
  );
}

export interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export function TableSkeleton({
  rows = 5,
  columns = 5,
  className,
}: TableSkeletonProps) {
  return (
    <div className={cn("w-full divide-y divide-border/60", className)} aria-busy="true">
      {Array.from({ length: rows }).map((_, rIdx) => (
        <div
          key={rIdx}
          className="flex items-center gap-4 px-4 sm:px-6 py-4 animate-pulse"
        >
          {Array.from({ length: columns }).map((_, cIdx) => (
            <Skeleton
              key={cIdx}
              className={cn(
                "h-5 rounded-md",
                cIdx === 0
                  ? "w-1/4 sm:w-1/3"
                  : cIdx === columns - 1
                  ? "w-16 ms-auto"
                  : "w-16 sm:w-24"
              )}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export interface CatalogGridSkeletonProps {
  count?: number;
  className?: string;
}

export function CatalogGridSkeleton({
  count = 8,
  className,
}: CatalogGridSkeletonProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5",
        className
      )}
      aria-busy="true"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col space-y-3 rounded-xl border border-border/60 p-4 bg-card"
        >
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
  );
}
