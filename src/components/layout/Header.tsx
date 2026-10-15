"use client";

import React from "react";
import Link from "next/link";
import { useDirection } from "./DirectionProvider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Languages, LogOut, Package, User } from "lucide-react";
import { SessionUser } from "@/types/auth";

interface HeaderProps {
  user?: SessionUser | null;
}

export function Header({ user }: HeaderProps) {
  const { locale, toggleLocale, t } = useDirection();

  const handleLogout = async () => {
    try {
      await fetch("/api/v1/auth/logout", { method: "POST" });
      window.location.href = "/login";
    } catch {
      window.location.href = "/login";
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 sm:px-8 mx-auto">
        {/* Brand / Logo */}
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold shadow">
            <Package className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg leading-tight tracking-tight">
              {t("نظام بورو هب", "BorrowHub")}
            </span>
            <span className="text-xs text-muted-foreground hidden sm:inline">
              {t("إعارة وتجهيز العتاد المعملي", "Lab Equipment Loan Platform")}
            </span>
          </div>
        </Link>

        {/* Right action controls */}
        <div className="flex items-center gap-3">
          {/* Language Switcher */}
          <Button
            variant="outline"
            size="sm"
            onClick={toggleLocale}
            className="flex items-center gap-2 font-medium"
            title={t("التبديل إلى الإنجليزية", "Switch to Arabic")}
          >
            <Languages className="h-4 w-4" />
            <span>{locale === "ar" ? "English" : "العربية"}</span>
          </Button>

          {/* User profile / session pill */}
          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden md:flex flex-col text-end rtl:text-start">
                <span className="text-sm font-semibold leading-tight">
                  {user.fullName}
                </span>
                <span className="text-xs text-muted-foreground">
                  {user.email}
                </span>
              </div>
              <Badge
                variant={user.role === "ADMIN" ? "default" : "secondary"}
                className="hidden sm:inline-flex"
              >
                {user.role === "ADMIN"
                  ? t("مسؤول المعمل", "Lab Admin")
                  : t("طالب", "Student")}
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                title={t("تسجيل الخروج", "Sign Out")}
              >
                <LogOut className="h-4 w-4 text-muted-foreground hover:text-destructive" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">
                  <User className="h-4 w-4 me-1.5" />
                  {t("تسجيل الدخول", "Sign In")}
                </Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/register">
                  {t("حساب جديد", "Register")}
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
