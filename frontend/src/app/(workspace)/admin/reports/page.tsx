"use client";

import React, { useEffect, useState } from "react";
import { AdminHeader } from "@/components/layout/admin-header";
import { Calendar, RefreshCw, BarChart2, PieChart, ShoppingBag, CheckCircle2, DollarSign, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatVND } from "@/lib/utils/currency";
import { ordersApi, Order } from "@/features/orders/api/orders.api";

interface BestSeller {
  name: string;
  sold: number;
  revenue: number;
}

interface DailyRevenue {
  date: string;
  dayLabel: string;
  revenue: number;
  orderCount: number;
}

export default function AdminReportsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [completedOrdersCount, setCompletedOrdersCount] = useState<number>(0);
  const [averageOrderValue, setAverageOrderValue] = useState<number>(0);
  const [bestSellers, setBestSellers] = useState<BestSeller[]>([]);
  const [dailyData, setDailyData] = useState<DailyRevenue[]>([]);
  const [vnpayCount, setVnpayCount] = useState<number>(0);
  const [codCount, setCodCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  const loadReportData = async () => {
    setIsLoading(true);
    try {
      const res = await ordersApi.adminFindAll({ limit: 500 });
      const orderList = res.items || [];
      setOrders(orderList);

      const completed = orderList.filter(
        (o) => o.status === "COMPLETED" || o.payment_status === "PAID"
      );
      setCompletedOrdersCount(completed.length);

      const rev = completed.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
      setTotalRevenue(rev);

      const aov = completed.length > 0 ? Math.round(rev / completed.length) : 0;
      setAverageOrderValue(aov);

      // Thống kê phương thức thanh toán
      let vnpay = 0;
      let cod = 0;
      orderList.forEach((o) => {
        if (o.payment_method === "VNPAY") vnpay++;
        else cod++;
      });
      setVnpayCount(vnpay);
      setCodCount(cod);

      // Phân tích doanh thu 7 ngày gần nhất
      const daysMap = new Map<string, { revenue: number; count: number }>();
      const now = new Date();
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dateKey = d.toISOString().split("T")[0];
        daysMap.set(dateKey, { revenue: 0, count: 0 });
      }

      completed.forEach((o) => {
        const orderDate = new Date(o.created_at).toISOString().split("T")[0];
        if (daysMap.has(orderDate)) {
          const cur = daysMap.get(orderDate)!;
          cur.revenue += Number(o.total_amount || 0);
          cur.count += 1;
        }
      });

      const dayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
      const chartData: DailyRevenue[] = Array.from(daysMap.entries()).map(([dateStr, data]) => {
        const d = new Date(dateStr);
        return {
          date: dateStr,
          dayLabel: `${dayNames[d.getDay()]} (${d.getDate()}/${d.getMonth() + 1})`,
          revenue: data.revenue,
          orderCount: data.count,
        };
      });
      setDailyData(chartData);

      // Xếp hạng món bán chạy
      const dishMap = new Map<string, { sold: number; revenue: number }>();
      for (const ord of completed) {
        if (ord.items && Array.isArray(ord.items)) {
          for (const it of ord.items) {
            const key = it.dish_name || "Món ăn";
            const cur = dishMap.get(key) || { sold: 0, revenue: 0 };
            cur.sold += Number(it.quantity || 1);
            cur.revenue += Number(it.subtotal || (it.unit_price || 0) * (it.quantity || 1) || 0);
            dishMap.set(key, cur);
          }
        }
      }

      const topList: BestSeller[] = Array.from(dishMap.entries())
        .map(([name, data]) => ({ name, sold: data.sold, revenue: data.revenue }))
        .sort((a, b) => b.sold - a.sold)
        .slice(0, 5);

      setBestSellers(topList);
    } catch (err) {
      console.error("Failed to load report data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReportData();
  }, []);

  const maxDailyRevenue = Math.max(...dailyData.map((d) => d.revenue), 100000);

  return (
    <>
      <AdminHeader
        title="Báo cáo Doanh thu & Phân tích Vận hành"
        subtitle="Biểu đồ phân tích doanh số 7 ngày gần nhất, tỷ lệ hoàn tất đơn và hiệu suất thực đơn món ăn"
        action={
          <Button variant="outline" size="sm" onClick={loadReportData} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? "animate-spin" : ""}`} />
            <span>Làm mới số liệu</span>
          </Button>
        }
      />

      <div className="p-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-surface border border-border rounded-xl p-5 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs text-ink-muted uppercase font-bold">Tổng doanh thu thực tế</span>
              <h3 className="text-2xl font-bold text-brand-red font-mono mt-1">
                {isLoading ? "..." : formatVND(totalRevenue)}
              </h3>
              <span className="text-xs text-ink-muted mt-1 inline-block">
                Quyết toán từ các đơn hàng thành công
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-brand-red/10 text-brand-red flex items-center justify-center shrink-0">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-surface border border-border rounded-xl p-5 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs text-ink-muted uppercase font-bold">Tổng đơn hoàn thành</span>
              <h3 className="text-2xl font-bold text-ink mt-1">
                {isLoading ? "..." : `${completedOrdersCount} đơn`}
              </h3>
              <span className="text-xs text-emerald-600 font-semibold mt-1 inline-block">
                Tỷ lệ hoàn thành:{" "}
                {orders.length > 0 ? Math.round((completedOrdersCount / orders.length) * 100) : 100}%
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-surface border border-border rounded-xl p-5 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs text-ink-muted uppercase font-bold">Giá trị trung bình đơn (AOV)</span>
              <h3 className="text-2xl font-bold text-ink font-mono mt-1">
                {isLoading ? "..." : formatVND(averageOrderValue)}
              </h3>
              <span className="text-xs text-ink-muted mt-1 inline-block">
                Bình quân trên mỗi lượt giao nóng
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
              <ShoppingBag className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Biểu đồ Cột Doanh Thu 7 Ngày Gần Nhất */}
        <div className="bg-surface border border-border rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-brand-red" />
              <h3 className="text-sm font-bold text-ink uppercase tracking-wider">
                Doanh thu 7 ngày gần nhất (VNĐ)
              </h3>
            </div>
            <span className="text-xs text-ink-muted flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Dữ liệu trực tiếp từ cơ sở dữ liệu
            </span>
          </div>

          <div className="h-64 flex items-end justify-between gap-2 sm:gap-6 pt-6 pb-2 px-2">
            {dailyData.map((d, i) => {
              const heightPercent = Math.max((d.revenue / maxDailyRevenue) * 100, 6);
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <div className="text-[10px] font-mono text-ink-muted opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {formatVND(d.revenue)}
                  </div>
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className="w-full max-w-[48px] bg-gradient-to-t from-brand-red to-turmeric rounded-t-lg transition-all group-hover:brightness-110 shadow-xs relative"
                  >
                    {d.orderCount > 0 && (
                      <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-brand-red">
                        {d.orderCount}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-medium text-ink-muted text-center truncate max-w-[60px]">
                    {d.dayLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Row 2: Top Món Bán Chạy & Tỷ lệ Thanh toán */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Món Bán Chạy */}
          <div className="lg:col-span-2 bg-surface border border-border rounded-xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Utensils className="w-5 h-5 text-brand-red" />
                <h3 className="text-sm font-bold text-ink uppercase tracking-wider">
                  Top Món Ăn Bán Chạy Nhất ({bestSellers.length})
                </h3>
              </div>
              <span className="text-xs text-ink-muted">Xếp theo số phần đã bán</span>
            </div>

            {isLoading ? (
              <div className="py-8 text-center text-xs text-ink-muted">
                Đang tổng hợp dữ liệu món ăn...
              </div>
            ) : bestSellers.length === 0 ? (
              <div className="py-8 text-center text-xs text-ink-muted">
                Chưa có đơn hàng hoàn thành để xếp hạng món ăn
              </div>
            ) : (
              <div className="space-y-3">
                {bestSellers.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-xs p-3 rounded-xl bg-surface-hover/40 border border-border/50"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-6 h-6 rounded-full font-bold flex items-center justify-center text-xs shrink-0 ${
                          idx === 0
                            ? "bg-amber-500 text-white"
                            : idx === 1
                            ? "bg-slate-300 text-slate-800"
                            : idx === 2
                            ? "bg-amber-700 text-white"
                            : "bg-surface-hover text-ink"
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <span className="font-semibold text-sm text-ink">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-6">
                      <span className="text-ink-muted font-medium">{item.sold} phần</span>
                      <span className="font-bold text-brand-red font-mono text-sm">
                        {formatVND(item.revenue)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cơ cấu Phương thức Thanh toán */}
          <div className="bg-surface border border-border rounded-xl p-6 shadow-xs space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 border-b border-border pb-3">
                <PieChart className="w-5 h-5 text-brand-red" />
                <h3 className="text-sm font-bold text-ink uppercase tracking-wider">
                  Phương thức thanh toán
                </h3>
              </div>

              <div className="pt-4 space-y-4">
                <div className="p-4 rounded-xl bg-surface-hover/50 border border-border space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-ink">VNPAY Trực tuyến:</span>
                    <span className="font-bold font-mono text-brand-red">{vnpayCount} đơn</span>
                  </div>
                  <div className="w-full bg-border h-2 rounded-full overflow-hidden">
                    <div
                      style={{
                        width: `${orders.length > 0 ? (vnpayCount / orders.length) * 100 : 50}%`,
                      }}
                      className="bg-brand-red h-full rounded-full"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-surface-hover/50 border border-border space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-ink">Tiền mặt COD:</span>
                    <span className="font-bold font-mono text-ink">{codCount} đơn</span>
                  </div>
                  <div className="w-full bg-border h-2 rounded-full overflow-hidden">
                    <div
                      style={{
                        width: `${orders.length > 0 ? (codCount / orders.length) * 100 : 50}%`,
                      }}
                      className="bg-emerald-600 h-full rounded-full"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 bg-cream/70 rounded-xl border border-turmeric/30 text-[11px] text-ink-muted space-y-1">
              <span className="font-bold text-ink">💡 Lưu ý đối soát:</span>
              <p>Mọi giao dịch VNPAY được đồng bộ tự động qua IPN Webhook với độ trễ dưới 2 giây.</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
