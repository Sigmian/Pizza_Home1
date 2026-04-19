/*
 * Pizza Home — Admin Dashboard
 * Stats overview, sales chart, recent orders, top items
 */

import { useState, useEffect } from "react";
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Clock,
  Package,
  ArrowUpRight,
  Loader2,
  BarChart3,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

interface Stats {
  total: { orders: number; revenue: number };
  today: { orders: number; revenue: number };
  week: { orders: number; revenue: number };
  month: { orders: number; revenue: number };
  pendingOrders: number;
  topItems: { name: string; quantity: number; revenue: number }[];
  statusCounts: Record<string, number>;
  dailySales?: { date: string; orders: number; revenue: number }[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((d) => setStats(d))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
      </div>
    );
  }

  const cards = [
    {
      label: "Today's Revenue",
      value: `Rs. ${(stats?.today.revenue ?? 0).toLocaleString()}`,
      sub: `${stats?.today.orders ?? 0} orders`,
      icon: DollarSign,
      color: "text-green-400",
      bg: "bg-green-500/10",
    },
    {
      label: "This Week",
      value: `Rs. ${(stats?.week.revenue ?? 0).toLocaleString()}`,
      sub: `${stats?.week.orders ?? 0} orders`,
      icon: TrendingUp,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      label: "This Month",
      value: `Rs. ${(stats?.month.revenue ?? 0).toLocaleString()}`,
      sub: `${stats?.month.orders ?? 0} orders`,
      icon: ArrowUpRight,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
    },
    {
      label: "Pending Orders",
      value: String(stats?.pendingOrders ?? 0),
      sub: "Awaiting confirmation",
      icon: Clock,
      color: "text-orange-400",
      bg: "bg-orange-500/10",
    },
    {
      label: "Total Revenue",
      value: `Rs. ${(stats?.total.revenue ?? 0).toLocaleString()}`,
      sub: `${stats?.total.orders ?? 0} total orders`,
      icon: Package,
      color: "text-red-400",
      bg: "bg-red-500/10",
    },
  ];

  // Build chart data from dailySales or generate from current stats
  const chartData = stats?.dailySales?.length
    ? stats.dailySales.map((d) => ({
        date: new Date(d.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        orders: d.orders,
        revenue: d.revenue,
      }))
    : [
        {
          date: "Today",
          orders: stats?.today.orders ?? 0,
          revenue: stats?.today.revenue ?? 0,
        },
      ];

  // Status colors for the breakdown
  const statusColors: Record<string, string> = {
    pending: "bg-yellow-400",
    confirmed: "bg-blue-400",
    preparing: "bg-indigo-400",
    ready: "bg-cyan-400",
    out_for_delivery: "bg-orange-400",
    delivered: "bg-green-400",
    cancelled: "bg-red-400",
  };

  // Calculate total orders for percentage bar
  const totalStatusOrders = Object.values(stats?.statusCounts ?? {}).reduce(
    (a, b) => a + b,
    0
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-white/40 font-medium">
                {card.label}
              </span>
              <div
                className={`w-8 h-8 rounded-lg ${card.bg} flex items-center justify-center`}
              >
                <card.icon className={`w-4 h-4 ${card.color}`} />
              </div>
            </div>
            <p className="font-display font-bold text-xl text-white">
              {card.value}
            </p>
            <p className="text-xs text-white/30 mt-1">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Sales Chart */}
      <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/5">
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="w-5 h-5 text-red-400" />
          <h3 className="font-display font-bold text-white">Sales Analytics</h3>
        </div>
        {chartData.length >= 1 ? (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Revenue Area Chart */}
            <div>
              <p className="text-xs text-white/40 mb-3 font-medium">Revenue Trend</p>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
                    axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                  />
                  <YAxis
                    tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
                    axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#1a1a1a",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "12px",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                    formatter={(value: number) => [`Rs. ${value.toLocaleString()}`, "Revenue"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#ef4444"
                    fill="url(#revenueGrad)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Orders Bar Chart */}
            <div>
              <p className="text-xs text-white/40 mb-3 font-medium">Orders per Day</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
                    axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                  />
                  <YAxis
                    tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
                    axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#1a1a1a",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "12px",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="orders" fill="#f97316" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="text-center py-10 text-white/30 text-sm">
            <BarChart3 className="w-10 h-10 mx-auto mb-3 text-white/10" />
            <p>Charts will populate as more orders come in.</p>
            <p className="text-xs text-white/20 mt-1">
              Current: {stats?.total.orders ?? 0} order(s), Rs.{" "}
              {(stats?.total.revenue ?? 0).toLocaleString()} revenue
            </p>
          </div>
        )}
      </div>

      {/* Order status breakdown + Top items */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Status breakdown */}
        <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/5">
          <h3 className="font-display font-bold text-white mb-4">
            Orders by Status
          </h3>

          {/* Visual status bar */}
          {totalStatusOrders > 0 && (
            <div className="flex h-3 rounded-full overflow-hidden mb-4">
              {Object.entries(stats?.statusCounts ?? {}).map(([status, count]) => (
                <div
                  key={status}
                  className={`${statusColors[status] ?? "bg-white/30"} transition-all`}
                  style={{ width: `${(count / totalStatusOrders) * 100}%` }}
                  title={`${status}: ${count}`}
                />
              ))}
            </div>
          )}

          <div className="flex flex-col gap-3">
            {Object.entries(stats?.statusCounts ?? {}).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${statusColors[status] ?? "bg-white/30"}`}
                  />
                  <span className="text-sm text-white/60 capitalize">
                    {status.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">{count}</span>
                  {totalStatusOrders > 0 && (
                    <span className="text-xs text-white/30">
                      ({Math.round((count / totalStatusOrders) * 100)}%)
                    </span>
                  )}
                </div>
              </div>
            ))}
            {Object.keys(stats?.statusCounts ?? {}).length === 0 && (
              <p className="text-sm text-white/30">No orders yet</p>
            )}
          </div>
        </div>

        {/* Top items */}
        <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/5">
          <h3 className="font-display font-bold text-white mb-4">
            Top Selling Items
          </h3>
          <div className="flex flex-col gap-3">
            {(stats?.topItems ?? []).map((item, i) => {
              const maxQty = Math.max(
                ...(stats?.topItems ?? []).map((t) => t.quantity),
                1
              );
              return (
                <div key={item.name}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                          i === 0
                            ? "bg-yellow-500/20 text-yellow-400"
                            : i === 1
                            ? "bg-gray-400/20 text-gray-300"
                            : i === 2
                            ? "bg-orange-500/20 text-orange-400"
                            : "bg-white/5 text-white/40"
                        }`}
                      >
                        {i + 1}
                      </span>
                      <span className="text-sm text-white/80">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-white">
                        {item.quantity} sold
                      </span>
                      <p className="text-xs text-white/30">
                        Rs. {item.revenue.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="ml-9 h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-red-500 to-orange-400 transition-all"
                      style={{ width: `${(item.quantity / maxQty) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {(stats?.topItems ?? []).length === 0 && (
              <p className="text-sm text-white/30">No sales data yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
