"use client";

import React, { useEffect, useState } from "react";
import { AdminHeader } from "@/components/layout/admin-header";
import { UserCog, Plus, RefreshCw, X, CheckCircle2, AlertCircle, Lock, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { adminUsersApi, AdminUserItem, AdminCreateUserInput } from "@/features/admin-users/api/admin-users.api";

export default function AdminStaffPage() {
  const [staffList, setStaffList] = useState<AdminUserItem[]>([]);
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingStaff, setEditingStaff] = useState<AdminUserItem | null>(null);
  const [newRole, setNewRole] = useState<string>("OPERATOR");
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form state tạo nhân viên mới
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("Viviet@2026");
  const [role, setRole] = useState<"ADMIN" | "OPERATOR" | "KITCHEN">("OPERATOR");

  const showToast = (type: "success" | "error", text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadStaff = async () => {
    setIsLoading(true);
    try {
      const res = await adminUsersApi.getUsers({ limit: 100 });
      // Lọc các vai trò nhân viên nội bộ (không lấy khách hàng thường)
      const internalStaff = res.items.filter((u) => u.role !== "CUSTOMER");
      setStaffList(internalStaff);
    } catch (err) {
      console.error("Failed to load staff list:", err);
      showToast("error", "Không thể tải danh sách nhân sự.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      showToast("error", "Vui lòng điền đầy đủ các trường bắt buộc.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: AdminCreateUserInput = {
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || undefined,
        password: password.trim(),
        role,
      };

      await adminUsersApi.createUser(payload);
      showToast("success", `Tạo thành công tài khoản nhân sự "${payload.full_name}"!`);
      setIsModalOpen(false);

      // Reset form
      setFullName("");
      setEmail("");
      setPhone("");
      setPassword("Viviet@2026");
      setRole("OPERATOR");

      await loadStaff();
    } catch (err: any) {
      console.error("Failed to create staff:", err);
      showToast("error", err?.message || "Lỗi khi tạo nhân viên mới. Vui lòng kiểm tra lại email.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!editingStaff) return;
    try {
      await adminUsersApi.updateUser(editingStaff.id, { role: newRole });
      setStaffList((prev) =>
        prev.map((s) => (s.id === editingStaff.id ? { ...s, role: newRole } : s))
      );
      showToast("success", `Đã cập nhật vai trò của "${editingStaff.full_name}" thành ${newRole}!`);
      setEditingStaff(null);
    } catch (err: any) {
      console.error("Failed to update staff role:", err);
      showToast("error", err?.message || "Không thể cập nhật quyền của nhân sự.");
    }
  };

  const handleToggleBlockStaff = async (st: AdminUserItem) => {
    const nextStatus = st.status === "ACTIVE" ? "LOCKED" : "ACTIVE";
    const actionText = nextStatus === "LOCKED" ? "khóa quyền truy cập" : "mở khóa quyền truy cập";

    if (!confirm(`Bạn có chắc muốn ${actionText} của "${st.full_name}"?`)) return;

    try {
      await adminUsersApi.updateUser(st.id, { status: nextStatus });
      setStaffList((prev) =>
        prev.map((item) => (item.id === st.id ? { ...item, status: nextStatus } : item))
      );
      showToast("success", `Đã ${actionText} thành công!`);
    } catch (err: any) {
      console.error("Failed to update staff status:", err);
      showToast("error", err?.message || "Không thể thay đổi trạng thái nhân sự.");
    }
  };

  const getRoleBadgeVariant = (r: string) => {
    switch (r) {
      case "ADMIN":
        return "danger";
      case "OPERATOR":
        return "brand";
      case "KITCHEN":
        return "warning";
      default:
        return "neutral";
    }
  };

  const filteredStaff = staffList.filter((s) => {
    if (roleFilter === "ALL") return true;
    return s.role === roleFilter;
  });

  return (
    <>
      <AdminHeader
        title="Nhân viên & Phân quyền RBAC"
        subtitle="Quản trị tài khoản nội bộ: Admin hệ thống, Điều phối đơn hàng, Bếp trưởng và Thu ngân"
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadStaff} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? "animate-spin" : ""}`} />
              <span>Làm mới</span>
            </Button>
            <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4 mr-1" />
              <span>Thêm nhân viên</span>
            </Button>
          </div>
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

        {/* Role Filter Tabs */}
        <div className="flex items-center gap-2">
          {["ALL", "ADMIN", "OPERATOR", "KITCHEN"].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                roleFilter === r
                  ? "bg-brand-red text-white"
                  : "bg-surface border border-border text-ink-muted hover:text-ink"
              }`}
            >
              {r === "ALL"
                ? `Tất cả (${staffList.length})`
                : r === "ADMIN"
                ? `Quản trị (${staffList.filter((s) => s.role === "ADMIN").length})`
                : r === "OPERATOR"
                ? `Điều phối (${staffList.filter((s) => s.role === "OPERATOR").length})`
                : `Nhà bếp (${staffList.filter((s) => s.role === "KITCHEN").length})`}
            </button>
          ))}
        </div>

        {/* Table View */}
        <div className="bg-surface border border-border rounded-xl p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <UserCog className="w-5 h-5 text-brand-red" />
            <h2 className="text-sm font-bold text-ink uppercase tracking-wider">
              Danh sách nhân sự nội bộ ({filteredStaff.length})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-hover border-b border-border text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                <tr>
                  <th className="py-3 px-4">Nhân viên</th>
                  <th className="py-3 px-4">Số điện thoại</th>
                  <th className="py-3 px-4">Email nội bộ</th>
                  <th className="py-3 px-4">Vai trò (Role)</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4">Ngày cấp tài khoản</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-xs text-ink-muted">
                      Đang tải danh sách nhân sự từ cơ sở dữ liệu...
                    </td>
                  </tr>
                ) : filteredStaff.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-xs text-ink-muted">
                      Chưa có nhân sự nào trong mục này
                    </td>
                  </tr>
                ) : (
                  filteredStaff.map((st) => (
                    <tr key={st.id} className="hover:bg-surface-hover/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-ink text-sm">
                          {st.full_name || "Nhân viên Vị Việt"}
                        </div>
                        <div className="text-[10px] text-ink-muted font-mono">ID: #{st.id}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-ink">
                        {st.phone || "—"}
                      </td>
                      <td className="py-3 px-4 text-xs font-mono text-ink-muted">
                        {st.email}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={getRoleBadgeVariant(st.role)} size="sm">
                          {st.role}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={st.status === "ACTIVE" ? "success" : "danger"}
                          size="sm"
                        >
                          {st.status === "ACTIVE" ? "Hoạt động" : "Tạm khóa"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-xs text-ink-muted">
                        {new Date(st.created_at).toLocaleDateString("vi-VN")}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingStaff(st);
                              setNewRole(st.role);
                            }}
                            className="px-2 py-1 text-xs text-brand-red hover:underline font-semibold"
                          >
                            Đổi vai trò
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleBlockStaff(st)}
                            className={`p-1.5 rounded-lg border border-transparent hover:border-border transition-colors ${
                              st.status === "ACTIVE"
                                ? "text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                            }`}
                            title={st.status === "ACTIVE" ? "Khóa tài khoản" : "Mở khóa"}
                          >
                            {st.status === "ACTIVE" ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
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

      {/* Modal Thêm Nhân Viên Mới */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <UserCog className="w-5 h-5 text-brand-red" />
                <h3 className="font-bold text-base text-ink">Thêm Nhân Sự Mới</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-ink-muted hover:text-ink rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                  Họ và tên nhân sự <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="VD: Nguyễn Văn An"
                  className="w-full h-10 px-3 bg-surface border border-border rounded-lg text-sm text-ink focus:outline-none focus:ring-1 focus:ring-brand-red"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                    Email đăng nhập <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="VD: an.nguyen@viviet.vn"
                    className="w-full h-10 px-3 bg-surface border border-border rounded-lg text-sm font-mono text-ink focus:outline-none focus:ring-1 focus:ring-brand-red"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="VD: 0988776655"
                    className="w-full h-10 px-3 bg-surface border border-border rounded-lg text-sm font-mono text-ink focus:outline-none focus:ring-1 focus:ring-brand-red"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                    Mật khẩu khởi tạo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-10 px-3 bg-surface border border-border rounded-lg text-sm font-mono text-ink focus:outline-none focus:ring-1 focus:ring-brand-red"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                    Phân quyền vai trò <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full h-10 px-3 bg-surface border border-border rounded-lg text-xs font-semibold text-ink focus:outline-none focus:ring-1 focus:ring-brand-red"
                  >
                    <option value="OPERATOR">OPERATOR - Quản lý đơn & Thu ngân</option>
                    <option value="KITCHEN">KITCHEN - Nhân viên Nhà Bếp (KDS)</option>
                    <option value="ADMIN">ADMIN - Toàn quyền Quản Trị Hệ Thống</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Hủy bỏ
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={isSubmitting}>
                  {isSubmitting ? "Đang tạo..." : "Tạo tài khoản"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Đổi Vai Trò Nhân Viên */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-sm text-ink">Phân Quyền Vai Trò</h3>
              <button
                type="button"
                onClick={() => setEditingStaff(null)}
                className="p-1 text-ink-muted hover:text-ink rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-ink-muted">
              Đang phân quyền cho: <strong className="text-ink">{editingStaff.full_name}</strong>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                Chọn vai trò mới
              </label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full h-10 px-3 bg-surface border border-border rounded-lg text-xs font-semibold text-ink focus:outline-none focus:ring-1 focus:ring-brand-red"
              >
                <option value="OPERATOR">OPERATOR - Quản lý đơn & Thu ngân</option>
                <option value="KITCHEN">KITCHEN - Màn hình Bếp KDS</option>
                <option value="ADMIN">ADMIN - Quản trị viên cấp cao</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button variant="outline" size="sm" onClick={() => setEditingStaff(null)}>
                Hủy
              </Button>
              <Button variant="primary" size="sm" onClick={handleUpdateRole}>
                Lưu thay đổi
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
