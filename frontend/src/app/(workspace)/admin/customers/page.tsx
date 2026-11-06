"use client";

import React, { useEffect, useState } from "react";
import { AdminHeader } from "@/components/layout/admin-header";
import { Users, Search, RefreshCw, Eye, Lock, Unlock, X, CheckCircle2, AlertCircle, Phone, Mail, Calendar, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { adminUsersApi, AdminUserItem } from "@/features/admin-users/api/admin-users.api";

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<AdminUserItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "LOCKED">("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<AdminUserItem | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showToast = (type: "success" | "error", text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadCustomers = async () => {
    setIsLoading(true);
    try {
      const res = await adminUsersApi.getUsers({
        role: "CUSTOMER",
        search: searchTerm || undefined,
        limit: 100,
      });
      setCustomers(res.items);
    } catch (err) {
      console.error("Failed to load customers:", err);
      showToast("error", "Không thể tải danh sách khách hàng từ cơ sở dữ liệu.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadCustomers();
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleToggleBlockCustomer = async (c: AdminUserItem) => {
    const nextStatus = c.status === "ACTIVE" ? "LOCKED" : "ACTIVE";
    const actionText = nextStatus === "LOCKED" ? "khóa tài khoản" : "mở khóa tài khoản";

    if (!confirm(`Bạn có chắc chắn muốn ${actionText} của khách hàng "${c.full_name || c.email}"?`)) {
      return;
    }

    try {
      await adminUsersApi.updateUser(c.id, { status: nextStatus });
      setCustomers((prev) =>
        prev.map((item) => (item.id === c.id ? { ...item, status: nextStatus } : item))
      );
      if (selectedCustomer?.id === c.id) {
        setSelectedCustomer({ ...selectedCustomer, status: nextStatus });
      }
      showToast("success", `Đã ${actionText} thành công!`);
    } catch (err: any) {
      console.error("Failed to update customer status:", err);
      showToast("error", err?.message || "Không thể cập nhật trạng thái khách hàng.");
    }
  };

  const filteredCustomers = customers.filter((c) => {
    if (statusFilter === "ACTIVE") return c.status === "ACTIVE";
    if (statusFilter === "LOCKED") return c.status !== "ACTIVE";
    return true;
  });

  return (
    <>
      <AdminHeader
        title="Quản lý Khách hàng & CRM"
        subtitle="Hồ sơ khách hàng, thông tin liên lạc, lịch sử gia nhập và kiểm soát trạng thái tài khoản"
        action={
          <Button variant="outline" size="sm" onClick={loadCustomers} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? "animate-spin" : ""}`} />
            <span>Làm mới</span>
          </Button>
        }
      />

      <div className="p-6 space-y-6">
        {toastMessage && (
          <div
            className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-semibold ${
              toastMessage.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            {toastMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        )}

        {/* Filter Bar */}
        <div className="bg-surface border border-border rounded-xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo tên, email hoặc SĐT..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-surface border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-red"
            />
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === "ALL"
                  ? "bg-brand-red text-white"
                  : "bg-surface border border-border text-ink-muted hover:text-ink"
              }`}
            >
              Tất cả ({customers.length})
            </button>
            <button
              onClick={() => setStatusFilter("ACTIVE")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === "ACTIVE"
                  ? "bg-brand-red text-white"
                  : "bg-surface border border-border text-ink-muted hover:text-ink"
              }`}
            >
              Hoạt động ({customers.filter((c) => c.status === "ACTIVE").length})
            </button>
            <button
              onClick={() => setStatusFilter("LOCKED")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === "LOCKED"
                  ? "bg-brand-red text-white"
                  : "bg-surface border border-border text-ink-muted hover:text-ink"
              }`}
            >
              Tạm khóa ({customers.filter((c) => c.status !== "ACTIVE").length})
            </button>
          </div>
        </div>

        {/* Table View */}
        <div className="bg-surface border border-border rounded-xl p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-brand-red" />
            <h2 className="text-sm font-bold text-ink uppercase tracking-wider">
              Danh sách hội viên & khách hàng ({filteredCustomers.length})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-hover border-b border-border text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                <tr>
                  <th className="py-3 px-4">Họ và tên</th>
                  <th className="py-3 px-4">Số điện thoại</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4">Ngày tham gia</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-xs text-ink-muted">
                      Đang tải danh sách khách hàng từ cơ sở dữ liệu...
                    </td>
                  </tr>
                ) : filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-xs text-ink-muted">
                      Chưa có khách hàng nào phù hợp với tìm kiếm
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((c) => (
                    <tr key={c.id} className="hover:bg-surface-hover/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-ink text-sm">
                          {c.full_name || "Chưa đặt tên"}
                        </div>
                        <div className="text-[10px] text-ink-muted font-mono">ID: #{c.id}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-ink">
                        {c.phone || "—"}
                      </td>
                      <td className="py-3 px-4 text-xs text-ink-muted font-mono">
                        {c.email}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={c.status === "ACTIVE" ? "success" : "danger"}
                          size="sm"
                        >
                          {c.status === "ACTIVE" ? "Đang hoạt động" : "Tạm khóa"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-xs text-ink-muted">
                        {new Date(c.created_at).toLocaleDateString("vi-VN")}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedCustomer(c)}
                            className="p-1.5 text-ink-muted hover:text-brand-red rounded-lg hover:bg-surface border border-transparent hover:border-border transition-colors"
                            title="Xem chi tiết"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleBlockCustomer(c)}
                            className={`p-1.5 rounded-lg border border-transparent hover:border-border transition-colors ${
                              c.status === "ACTIVE"
                                ? "text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                            }`}
                            title={c.status === "ACTIVE" ? "Khóa tài khoản" : "Mở khóa"}
                          >
                            {c.status === "ACTIVE" ? (
                              <Lock className="w-4 h-4" />
                            ) : (
                              <Unlock className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Chi Tiết Khách Hàng */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-brand-red" />
                <h3 className="font-bold text-base text-ink">Hồ Sơ Khách Hàng</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="p-1 text-ink-muted hover:text-ink rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-surface-hover/50 rounded-xl">
                <div className="w-12 h-12 rounded-full bg-brand-red/10 text-brand-red font-bold text-lg flex items-center justify-center shrink-0">
                  {selectedCustomer.full_name?.charAt(0) || "U"}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-ink">{selectedCustomer.full_name || "Chưa đặt tên"}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={selectedCustomer.status === "ACTIVE" ? "success" : "danger"} size="sm">
                      {selectedCustomer.status === "ACTIVE" ? "Hoạt động" : "Tạm khóa"}
                    </Badge>
                    <span className="text-[11px] text-ink-muted font-mono">ID: #{selectedCustomer.id}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between p-2 rounded-lg bg-surface border border-border">
                  <span className="text-ink-muted flex items-center gap-2">
                    <Mail className="w-4 h-4 text-turmeric" /> Email:
                  </span>
                  <span className="font-mono font-semibold text-ink">{selectedCustomer.email}</span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-surface border border-border">
                  <span className="text-ink-muted flex items-center gap-2">
                    <Phone className="w-4 h-4 text-brand-red" /> Số điện thoại:
                  </span>
                  <span className="font-mono font-semibold text-ink">{selectedCustomer.phone || "Chưa cập nhật"}</span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-surface border border-border">
                  <span className="text-ink-muted flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-600" /> Ngày đăng ký:
                  </span>
                  <span className="font-semibold text-ink">
                    {new Date(selectedCustomer.created_at).toLocaleString("vi-VN")}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-surface border border-border">
                  <span className="text-ink-muted flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-sky-600" /> Quyền truy cập:
                  </span>
                  <span className="font-semibold text-ink">{selectedCustomer.role}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <Button
                variant={selectedCustomer.status === "ACTIVE" ? "danger" : "primary"}
                size="sm"
                onClick={() => handleToggleBlockCustomer(selectedCustomer)}
              >
                {selectedCustomer.status === "ACTIVE" ? (
                  <>
                    <Lock className="w-4 h-4 mr-1.5" /> Khóa tài khoản
                  </>
                ) : (
                  <>
                    <Unlock className="w-4 h-4 mr-1.5" /> Mở khóa tài khoản
                  </>
                )}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setSelectedCustomer(null)}>
                Đóng
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
