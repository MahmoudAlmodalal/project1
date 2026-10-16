"use client";

import React from "react";
import Link from "next/link";
import { useDirection } from "./DirectionProvider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Languages, LogOut, User, LayoutDashboard, Compass } from "lucide-react";
import { SessionUser } from "@/types/auth";
import { BrandMark } from "./BrandMark";

interface HeaderProps {
  user?: SessionUser | null;
}

export function Header({ user }: HeaderProps) {
  const { locale, toggleLocale, t } = useDirection();

  const handleLogout = () => { window.location.href = "/login"; };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 sm:px-8 mx-auto">
        {/* Brand / Logo */}
        <Link href="/" className="flex items-center gap-3" aria-label={t("الصفحة الرئيسية لبورو هب", "BorrowHub home")}>
          <BrandMark />
          <Badge variant="secondary" className="hidden md:inline-flex rounded-full bg-primary/10 text-primary border-primary/15 text-[10px]">
            {t("نسخة تجريبية", "Demo")}
          </Badge>
        </Link>

        {/* Right action controls */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          <nav className="hidden lg:flex items-center gap-1 rounded-xl bg-muted/60 p-1" aria-label={t("التنقل الرئيسي", "Main navigation")}>
            <Button variant="ghost" size="sm" asChild className="h-8 px-3 text-xs font-medium">
              <Link href="/catalog"><Compass className="h-3.5 w-3.5 me-1.5" />{t("الكتالوج", "Catalog")}</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild className="h-8 px-3 text-xs font-medium">
              <Link href="/portal"><LayoutDashboard className="h-3.5 w-3.5 me-1.5" />{t("طلباتي", "My Loans")}</Link>
            </Button>
          </nav>
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
