"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AdminHeader } from "@/components/layout/admin-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { adminCatalogApi } from "@/features/admin-catalog/api/admin-catalog.api";
import { ordersApi, Order } from "@/features/orders/api/orders.api";
import { kitchenApi } from "@/features/kitchen/api/kitchen.api";
import { adminUsersApi } from "@/features/admin-users/api/admin-users.api";
import { promotionsApi } from "@/features/promotions/api/promotions.api";
import { reviewsApi } from "@/features/reviews/api/reviews.api";
import {
  Utensils,
  Plus,
  ShoppingBag,
  ChefHat,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Users,
  TicketPercent,
  Star,
  BarChart3,
  Settings,
} from "lucide-react";
import { formatVND } from "@/lib/utils/currency";

export default function AdminDashboardPage() {
  const [dishCount, setDishCount] = useState<number>(0);
  const [categoryCount, setCategoryCount] = useState<number>(0);
  const [orderCount, setOrderCount] = useState<number>(0);
  const [kitchenCount, setKitchenCount] = useState<number>(0);
  const [customerCount, setCustomerCount] = useState<number>(0);
  const [couponCount, setCouponCount] = useState<number>(0);
  const [averageRating, setAverageRating] = useState<string>("5.0");
  const [estimatedRevenue, setEstimatedRevenue] = useState<number>(0);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [
          categories,
          dishesRes,
          ordersRes,
          kitchenQueue,
          customersRes,
          couponsRes,
          reviewsRes,
        ] = await Promise.allSettled([
          adminCatalogApi.getCategories(),
          adminCatalogApi.getDishes({ limit: 1 }),
          ordersApi.adminFindAll({ limit: 200 }),
          kitchenApi.getKitchenQueue(),
          adminUsersApi.getUsers({ role: "CUSTOMER", limit: 1 }),
          promotionsApi.getAdminCoupons({ is_active: true, limit: 100 }),
          reviewsApi.getAdminReviews({ limit: 50 }),
        ]);

        if (categories.status === "fulfilled") {
          setCategoryCount(categories.value.length);
        }

        if (dishesRes.status === "fulfilled") {
          const res = dishesRes.value;
          const total = Array.isArray(res) ? res.length : (res as any).total || 0;
          setDishCount(total);
        }

        if (ordersRes.status === "fulfilled") {
          const orders = ordersRes.value.items || [];
          setOrderCount(ordersRes.value.total || orders.length);
          setRecentOrders(orders.slice(0, 5));

          const rev = orders
            .filter((o) => o.payment_status === "PAID" || o.status === "COMPLETED")
            .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
          setEstimatedRevenue(rev);
        }

        if (kitchenQueue.status === "fulfilled") {
          setKitchenCount(kitchenQueue.value.length);
        }

        if (customersRes.status === "fulfilled") {
          setCustomerCount(customersRes.value.total);
        }

        if (couponsRes.status === "fulfilled") {
          setCouponCount(couponsRes.value.items.length);
        }

        if (reviewsRes.status === "fulfilled") {
          const list = reviewsRes.value.items;
          if (list.length > 0) {
            const avg = list.reduce((sum, r) => sum + r.rating, 0) / list.length;
            setAverageRating(avg.toFixed(1));
          }
        }
      } catch (err) {
        console.error("Failed to load dashboard stats:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadStats();
  }, []);

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <Badge variant="success" size="sm">Hoàn thành</Badge>;
      case "PREPARING":
      case "COOKING":
        return <Badge variant="warning" size="sm">Đang nấu</Badge>;
      case "DELIVERING":
        return <Badge variant="brand" size="sm">Đang giao</Badge>;
      case "CANCELLED":
        return <Badge variant="danger" size="sm">Đã hủy</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{status}</Badge>;
    }
  };

  return (
    <>
      <AdminHeader
        title="Bảng điều khiển Vị Việt"
        subtitle="Tổng quan hoạt động kinh doanh, thực đơn di sản, đơn hàng trực tuyến và vận hành nhà bếp"
        action={
          <div className="flex items-center gap-2">
            <Link href="/admin/menu/new">
              <Button variant="primary" size="sm">
                <Plus className="w-4 h-4 mr-1" />
                <span>Tạo món ăn mới</span>
              </Button>
            </Link>
          </div>
        }
      />

      <div className="p-6 space-y-6">
        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Menu Items */}
          <div className="bg-surface border border-border rounded-xl p-5 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Món trong thực đơn</p>
              <h3 className="text-2xl font-bold text-ink mt-1">
                {isLoading ? "..." : dishCount}
              </h3>
              <p className="text-[11px] text-brand-red font-medium mt-1">
                Thuộc {categoryCount} danh mục ẩm thực
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-brand-red/10 text-brand-red flex items-center justify-center shrink-0">
              <Utensils className="w-6 h-6" />
            </div>
          </div>

          {/* Card 2: Orders */}
          <div className="bg-surface border border-border rounded-xl p-5 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Đơn hàng trong hệ thống</p>
              <h3 className="text-2xl font-bold text-ink mt-1">
                {isLoading ? "..." : orderCount}
              </h3>
              <p className="text-[11px] text-emerald-600 font-medium mt-1">
                Dữ liệu đồng bộ trực tiếp
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <ShoppingBag className="w-6 h-6" />
            </div>
          </div>

          {/* Card 3: Kitchen Queue */}
          <div className="bg-surface border border-border rounded-xl p-5 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Đơn đang nấu KDS</p>
              <h3 className="text-2xl font-bold text-ink mt-1">
                {isLoading ? "..." : kitchenCount}
              </h3>
              <p className="text-[11px] text-amber-600 font-medium mt-1">
                Màn hình bếp trung tâm
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <ChefHat className="w-6 h-6" />
            </div>
          </div>

          {/* Card 4: Revenue */}
          <div className="bg-surface border border-border rounded-xl p-5 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Doanh thu ghi nhận</p>
              <h3 className="text-2xl font-bold text-brand-red font-mono mt-1">
                {isLoading ? "..." : formatVND(estimatedRevenue)}
              </h3>
              <p className="text-[11px] text-ink-muted font-medium mt-1">
                Thanh toán VNPAY & COD
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-brand-red/10 text-brand-red flex items-center justify-center shrink-0">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Mini Stats Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-surface border border-border rounded-xl p-4 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-ink-muted uppercase font-bold">Khách hàng hội viên</span>
              <div className="font-bold text-base text-ink">{isLoading ? "..." : `${customerCount} khách`}</div>
            </div>
          </div>

          <div className="bg-surface border border-border rounded-xl p-4 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <TicketPercent className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-ink-muted uppercase font-bold">Voucher đang chạy</span>
              <div className="font-bold text-base text-ink">{isLoading ? "..." : `${couponCount} mã ưu đãi`}</div>
            </div>
          </div>

          <div className="bg-surface border border-border rounded-xl p-4 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
              <Star className="w-5 h-5 fill-amber-500" />
            </div>
            <div>
              <span className="text-[11px] text-ink-muted uppercase font-bold">Đánh giá trung bình</span>
              <div className="font-bold text-base text-ink">{isLoading ? "..." : `${averageRating} / 5.0 ★`}</div>
            </div>
          </div>
        </div>

        {/* Row 2: Recent Orders & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Đơn hàng gần đây */}
          <div className="lg:col-span-2 bg-surface border border-border rounded-xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-brand-red" />
                <h3 className="text-sm font-bold text-ink uppercase tracking-wider">
                  Đơn hàng mới nhất trong hệ thống
                </h3>
              </div>
              <Link
                href="/staff/orders"
                className="text-xs font-semibold text-brand-red hover:underline flex items-center gap-1"
              >
                <span>Xem tất cả</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {isLoading ? (
              <div className="py-8 text-center text-xs text-ink-muted">
                Đang tải dữ liệu đơn hàng...
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="py-8 text-center text-xs text-ink-muted">
                Chưa có đơn hàng nào được ghi nhận
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-[10px] uppercase font-bold text-ink-muted border-b border-border">
                    <tr>
                      <th className="py-2.5 px-3">Mã đơn</th>
                      <th className="py-2.5 px-3">Khách nhận</th>
                      <th className="py-2.5 px-3">Tổng tiền</th>
                      <th className="py-2.5 px-3">Thanh toán</th>
                      <th className="py-2.5 px-3">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {recentOrders.map((o) => (
                      <tr key={o.id} className="hover:bg-surface-hover/50">
                        <td className="py-2.5 px-3 font-mono font-bold text-brand-red">
                          {o.order_code}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-ink">
                          {o.recipient_name}
                        </td>
                        <td className="py-2.5 px-3 font-bold font-mono text-ink">
                          {formatVND(Number(o.total_amount || 0))}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded bg-surface border border-border text-[10px] font-semibold">
                            {o.payment_method === "VNPAY" ? "VNPAY" : "COD"}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          {getOrderStatusBadge(o.status)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Quick Access Card */}
          <div className="bg-surface border border-border rounded-xl p-6 shadow-xs flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2 border-b border-border pb-3">
                <Sparkles className="w-5 h-5 text-turmeric" />
                <h3 className="text-sm font-bold text-ink uppercase tracking-wider">
                  Lối tắt quản trị nhanh
                </h3>
              </div>

              <div className="pt-3 space-y-2">
                <Link
                  href="/admin/promotions"
                  className="p-2.5 rounded-lg border border-border bg-surface-hover/40 hover:border-brand-red flex items-center justify-between text-xs transition-colors group"
                >
                  <span className="font-semibold text-ink group-hover:text-brand-red flex items-center gap-2">
                    <TicketPercent className="w-4 h-4 text-purple-600" /> Quản lý Khuyến mãi
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-ink-muted group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  href="/admin/customers"
                  className="p-2.5 rounded-lg border border-border bg-surface-hover/40 hover:border-brand-red flex items-center justify-between text-xs transition-colors group"
                >
                  <span className="font-semibold text-ink group-hover:text-brand-red flex items-center gap-2">
                    <Users className="w-4 h-4 text-sky-600" /> Quản lý Khách hàng & CRM
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-ink-muted group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  href="/admin/reviews"
                  className="p-2.5 rounded-lg border border-border bg-surface-hover/40 hover:border-brand-red flex items-center justify-between text-xs transition-colors group"
                >
                  <span className="font-semibold text-ink group-hover:text-brand-red flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" /> Đánh giá thực khách
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-ink-muted group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  href="/admin/reports"
                  className="p-2.5 rounded-lg border border-border bg-surface-hover/40 hover:border-brand-red flex items-center justify-between text-xs transition-colors group"
                >
                  <span className="font-semibold text-ink group-hover:text-brand-red flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-emerald-600" /> Báo cáo doanh thu & AOV
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-ink-muted group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  href="/admin/settings"
                  className="p-2.5 rounded-lg border border-border bg-surface-hover/40 hover:border-brand-red flex items-center justify-between text-xs transition-colors group"
                >
                  <span className="font-semibold text-ink group-hover:text-brand-red flex items-center gap-2">
                    <Settings className="w-4 h-4 text-ink-muted" /> Cấu hình bếp trung tâm
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-ink-muted group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            <div className="p-3 bg-cream/70 rounded-xl border border-turmeric/30 text-[11px] text-ink-muted">
              <span className="font-bold text-ink">Bếp Mẹ Vị Việt:</span> Toàn bộ hệ thống quản trị đã đồng bộ 100% dữ liệu thực tế.
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
