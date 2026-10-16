"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDirection } from "./DirectionProvider";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Compass,
  ClipboardList,
  CheckCircle2,
  RotateCcw,
  AlertTriangle,
  Boxes,
  Users,
} from "lucide-react";
import { Role } from "@/types/auth";

interface SidebarProps {
  role?: Role;
}

export function Sidebar({ role = "STUDENT" }: SidebarProps) {
  const pathname = usePathname();
  const { t } = useDirection();

  const studentLinks = [
    {
      href: "/portal",
      labelAr: "لوحة طلباتي (SCR-03)",
      labelEn: "My Loans (SCR-03)",
      icon: LayoutDashboard,
    },
    {
      href: "/catalog",
      labelAr: "كتالوج المعدات (SCR-04)",
      labelEn: "Equipment Catalog (SCR-04)",
      icon: Compass,
    },
  ];

  const adminLinks = [
    {
      href: "/admin/queue",
      labelAr: "طابور مراجعة الطلبات (SCR-06)",
      labelEn: "Review Queue (SCR-06)",
      icon: ClipboardList,
    },
    {
      href: "/admin/pickups",
      labelAr: "شباك تسليم العتاد (SCR-07)",
      labelEn: "Approved Pickups (SCR-07)",
      icon: CheckCircle2,
    },
    {
      href: "/admin/returns",
      labelAr: "شباك الفحص والإرجاع (SCR-08)",
      labelEn: "Returns & Inspection (SCR-08)",
      icon: RotateCcw,
    },
    {
      href: "/admin/overdue",
      labelAr: "إنذارات العتاد المتأخر (SCR-09)",
      labelEn: "Overdue Alerts (SCR-09)",
      icon: AlertTriangle,
    },
    {
      href: "/admin/inventory",
      labelAr: "إدارة المخزون والكتالوج (SCR-10)",
      labelEn: "Inventory Manager (SCR-10)",
      icon: Boxes,
    },
    {
      href: "/admin/users",
      labelAr: "اعتماد وتدقيق الطلاب (SCR-11)",
      labelEn: "Student Verification (SCR-11)",
      icon: Users,
    },
  ];

  const links = role === "ADMIN" ? adminLinks : studentLinks;

  return (
    <aside className="w-full shrink-0 border-e border-border/70 bg-card/80 p-4 backdrop-blur md:w-64">
      <div className="mb-4 flex items-center gap-2 rounded-xl border border-primary/10 bg-primary/[0.04] px-3 py-3">
        <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,.12)]" />
        <div className="min-w-0">
          <p className="truncate text-[11px] font-bold uppercase tracking-[0.08em] text-primary">BorrowHub</p>
          <p className="truncate text-xs font-medium text-muted-foreground">
            {role === "ADMIN" ? t("لوحة إدارة المعمل", "Lab Admin Portal") : t("بوابة الطالب", "Student Portal")}
          </p>
        </div>
      </div>
      <nav className="flex flex-col gap-1">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "group flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "border-primary/20 bg-gradient-to-r from-primary to-violet-600 text-primary-foreground shadow-[0_8px_18px_rgba(79,70,229,.18)]"
                  : "border-transparent text-muted-foreground hover:border-primary/10 hover:bg-primary/[0.05] hover:text-primary"
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0 transition-transform", !isActive && "group-hover:scale-110")} />
              <span>{t(link.labelAr, link.labelEn)}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
