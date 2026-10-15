"use client";

import React, { useState, useEffect } from "react";
import { useDirection } from "@/components/layout/DirectionProvider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Users,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Building,
  Mail,
  Hash,
  Phone,
  AlertTriangle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { UserStatus } from "@prisma/client";

interface UserItem {
  id: string;
  email: string;
  fullName: string;
  studentId: string | null;
  department: string;
  phone: string;
  role: string;
  status: UserStatus;
  rejectionReason: string | null;
  createdAt: string;
}

export default function AdminUsersPage() {
  const { t } = useDirection();

  const [activeTab, setActiveTab] = useState<UserStatus | "ALL">("PENDING_APPROVAL");
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Rejection modal state
  const [rejectModalUser, setRejectModalUser] = useState<UserItem | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectError, setRejectError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeTab !== "ALL") {
        params.set("status", activeTab);
      }
      if (search.trim()) {
        params.set("search", search.trim());
      }

      const res = await fetch(`/api/v1/admin/users?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (e) {
      console.error("Failed to fetch users", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [activeTab]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleApprove = async (userId: string) => {
    setActionLoading(userId);
    try {
      const res = await fetch(`/api/v1/admin/users/${userId}/approve`, {
        method: "POST",
      });
      if (res.ok) {
        await fetchUsers();
      }
    } catch (e) {
      console.error("Approve failed", e);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectModalUser) return;
    if (!rejectReason.trim()) {
      setRejectError(
        t(
          "يرجى توضيح سبب الرفض لإبلاغ الطالب",
          "Please specify the rejection reason to notify the student"
        )
      );
      return;
    }

    setActionLoading(rejectModalUser.id);
    setRejectError(null);

    try {
      const res = await fetch(`/api/v1/admin/users/${rejectModalUser.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason.trim() }),
      });

      if (res.ok) {
        setRejectModalUser(null);
        setRejectReason("");
        await fetchUsers();
      } else {
        const data = await res.json();
        setRejectError(data.message || t("فشل تسجيل الرفض", "Failed to reject user"));
      }
    } catch {
      setRejectError(t("خطأ في الاتصال بالخادم", "Server connection error"));
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: UserStatus) => {
    switch (status) {
      case "PENDING_APPROVAL":
        return (
          <Badge variant="outline" className="border-amber-500 text-amber-600 bg-amber-50 dark:bg-amber-950/30">
            <Clock className="h-3 w-3 me-1" />
            {t("قيد التدقيق والمراجعة", "Pending Review")}
          </Badge>
        );
      case "ACTIVE":
        return (
          <Badge variant="outline" className="border-emerald-500 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30">
            <CheckCircle2 className="h-3 w-3 me-1" />
            {t("معتمد ونشط", "Active & Approved")}
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge variant="outline" className="border-red-500 text-red-600 bg-red-50 dark:bg-red-950/30">
            <XCircle className="h-3 w-3 me-1" />
            {t("مرفوض", "Rejected")}
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-7 w-7 text-primary" />
            {t("إدارة واعتماد حسابات الطلاب (SCR-11)", "Student Account Verification (SCR-11)")}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t(
              "تدقيق ومراجعة طلبات تسجيل الطلاب الجامعيين وتفعيل صلاحيات استعارة العتاد بنقرة واحدة",
              "Review student registration requests and activate borrowing permissions with 1 click"
            )}
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={fetchUsers} disabled={loading} className="gap-2 self-start">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          {t("تحديث", "Refresh")}
        </Button>
      </div>

      {/* Tabs and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex items-center rounded-lg border bg-muted/40 p-1">
          <button
            onClick={() => setActiveTab("PENDING_APPROVAL")}
            className={`rounded-md px-3.5 py-1.5 text-sm font-medium transition-all ${
              activeTab === "PENDING_APPROVAL"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("قيد التدقيق (Pending)", "Pending Review")}
          </button>
          <button
            onClick={() => setActiveTab("ACTIVE")}
            className={`rounded-md px-3.5 py-1.5 text-sm font-medium transition-all ${
              activeTab === "ACTIVE"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("الحسابات المعتمدة (Active)", "Active")}
          </button>
          <button
            onClick={() => setActiveTab("REJECTED")}
            className={`rounded-md px-3.5 py-1.5 text-sm font-medium transition-all ${
              activeTab === "REJECTED"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("المرفوضة (Rejected)", "Rejected")}
          </button>
          <button
            onClick={() => setActiveTab("ALL")}
            className={`rounded-md px-3.5 py-1.5 text-sm font-medium transition-all ${
              activeTab === "ALL"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("الكل", "All Users")}
          </button>
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 max-w-sm w-full">
          <div className="relative w-full">
            <Search className="absolute start-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("بحث بالاسم، البريد أو الرقم الجامعي...", "Search name, email, student ID...")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ps-9"
            />
          </div>
          <Button type="submit" size="sm">
            {t("بحث", "Search")}
          </Button>
        </form>
      </div>

      {/* Users Table / Card List */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-3 text-sm text-muted-foreground">
                {t("جارٍ تحميل الحسابات...", "Loading accounts...")}
              </p>
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <h3 className="text-base font-semibold">
                {t("لا توجد طلبات في هذا التبويب", "No student accounts found in this tab")}
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mt-1">
                {t(
                  "لا توجد طلبات تسجيل جديدة مطابقة لمعايير البحث الحالية.",
                  "There are no registration requests matching your current filter criteria."
                )}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-start">
                <thead className="bg-muted/50 border-b text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-6 py-3.5 text-start">{t("الطالب", "Student")}</th>
                    <th className="px-6 py-3.5 text-start">{t("الرقم الجامعي", "Student ID")}</th>
                    <th className="px-6 py-3.5 text-start">{t("القسم الأكاديمي", "Department")}</th>
                    <th className="px-6 py-3.5 text-start">{t("الهاتف", "Phone")}</th>
                    <th className="px-6 py-3.5 text-start">{t("الحالة", "Status")}</th>
                    <th className="px-6 py-3.5 text-start">{t("تاريخ الطلب", "Date")}</th>
                    <th className="px-6 py-3.5 text-center">{t("الإجراءات", "Actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-foreground">{user.fullName}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                          <Mail className="h-3 w-3" />
                          {user.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs">
                        {user.studentId || "-"}
                      </td>
                      <td className="px-6 py-4 text-xs">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Building className="h-3 w-3" />
                          {user.department}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-mono">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {user.phone}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(user.status)}
                        {user.status === "REJECTED" && user.rejectionReason && (
                          <div className="text-xs text-red-600 mt-1 max-w-xs truncate" title={user.rejectionReason}>
                            {user.rejectionReason}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {user.status === "PENDING_APPROVAL" ? (
                            <>
                              <Button
                                size="sm"
                                variant="default"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 h-8 text-xs font-medium"
                                onClick={() => handleApprove(user.id)}
                                disabled={actionLoading === user.id}
                              >
                                {actionLoading === user.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                )}
                                {t("اعتماد (Approve)", "Approve")}
                              </Button>

                              <Button
                                size="sm"
                                variant="destructive"
                                className="gap-1.5 h-8 text-xs font-medium"
                                onClick={() => {
                                  setRejectModalUser(user);
                                  setRejectReason("");
                                  setRejectError(null);
                                }}
                                disabled={actionLoading === user.id}
                              >
                                <XCircle className="h-3.5 w-3.5" />
                                {t("رفض (Reject)", "Reject")}
                              </Button>
                            </>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">
                              {user.status === "ACTIVE" ? t("تم التفعيل", "Verified") : t("تم البت", "Processed")}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reject Modal Dialog */}
      <Dialog open={!!rejectModalUser} onOpenChange={(open) => !open && setRejectModalUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              {t("رفض تسجيل حساب الطالب", "Reject Student Registration")}
            </DialogTitle>
            <DialogDescription>
              {t(
                "يرجى كتابة سبب الرفض الإلزامي. سيظهر هذا السبب للطالب عند محاولته تسجيل الدخول.",
                "Please provide a mandatory reason for rejection. This explanation will be displayed to the student upon login."
              )}
            </DialogDescription>
          </DialogHeader>

          {rejectError && (
            <div className="rounded-md bg-destructive/15 p-3 text-xs text-destructive">
              {rejectError}
            </div>
          )}

          <div className="space-y-3 py-2">
            <div className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">
                {t("اسم الطالب: ", "Student: ")}
              </span>
              {rejectModalUser?.fullName} ({rejectModalUser?.studentId})
            </div>

            <textarea
              rows={3}
              required
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder={t(
                "مثال: الرقم الجامعي غير مسجل في عمادة القبول والتسجيل لهذا الفصل...",
                "e.g. Student ID is not currently enrolled for this semester..."
              )}
              className="w-full rounded-md border border-input bg-background p-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRejectModalUser(null)}
              disabled={!!actionLoading}
            >
              {t("إلغاء", "Cancel")}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleRejectSubmit}
              disabled={!rejectReason.trim() || !!actionLoading}
            >
              {actionLoading ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin me-1.5" />
                  {t("جارٍ الحفظ...", "Saving...")}
                </>
              ) : (
                t("تأكيد الرفض", "Confirm Rejection")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
