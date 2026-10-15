import React from "react";
import { Sidebar } from "@/components/layout/Sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col md:flex-row min-h-screen">
      <Sidebar role="ADMIN" />
      <div className="flex-1 p-4 sm:p-6 md:p-8 bg-background min-w-0">
        {children}
      </div>
    </div>
  );
}
