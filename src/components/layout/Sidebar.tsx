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
    <aside className="w-full md:w-64 shrink-0 border-e bg-card p-4">
      <div className="mb-4 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {role === "ADMIN" ? t("لوحة إدارة المعمل", "Lab Admin Portal") : t("بوابة الطالب", "Student Portal")}
      </div>
      <nav className="flex flex-col space-y-1">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{t(link.labelAr, link.labelEn)}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
