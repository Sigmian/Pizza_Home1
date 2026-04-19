/*
 * Pizza Home — Admin Orders Management
 * Real-time order list with status updates, rider assignment, filtering
 */

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Search,
  Filter,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  ChefHat,
  Package,
  Loader2,
  RefreshCw,
  User,
  Phone,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";
import { io, Socket } from "socket.io-client";

// Admin notification sound
function playAdminNotification() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(660, ctx.currentTime);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.35);
    gain2.gain.setValueAtTime(0.25, ctx.currentTime + 0.35);
    gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.65);
    osc2.start(ctx.currentTime + 0.35);
    osc2.stop(ctx.currentTime + 0.65);
    setTimeout(() => ctx.close(), 1000);
  } catch (e) { /* ignore */ }
}

interface OrderItem {
  id: number;
  name: string;
  size: string | null;
  price: string;
  quantity: number;
  totalPrice: string;
}

interface Order {
  id: number;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string | null;
  orderType: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  subtotal: string;
  deliveryFee: string;
  discount: string;
  total: string;
  notes: string | null;
  riderId: number | null;
  createdAt: string;
  items: OrderItem[];
}

interface Rider {
  id: number;
  name: string | null;
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "Pending", color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20", icon: Clock },
  confirmed: { label: "Confirmed", color: "text-blue-400 bg-blue-500/10 border-blue-500/20", icon: CheckCircle2 },
  preparing: { label: "Preparing", color: "text-purple-400 bg-purple-500/10 border-purple-500/20", icon: ChefHat },
  ready: { label: "Ready", color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20", icon: Package },
  out_for_delivery: { label: "Out for Delivery", color: "text-orange-400 bg-orange-500/10 border-orange-500/20", icon: Truck },
  delivered: { label: "Delivered", color: "text-green-400 bg-green-500/10 border-green-500/20", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", color: "text-red-400 bg-red-500/10 border-red-500/20", icon: XCircle },
};

const statusFlow = ["pending", "confirmed", "preparing", "ready", "out_for_delivery", "delivered"];

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/orders");
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRiders = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/riders");
      const data = await res.json();
      setRiders(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    fetchOrders();
    fetchRiders();

    // WebSocket for real-time order updates
    const socket = io({ path: "/api/socket.io" });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join", "admin");
    });

    // Request browser notification permission on mount
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    socket.on("new_order", () => {
      fetchOrders();
      playAdminNotification();
      toast.info("New order received!", {
        icon: "\ud83d\udd14",
        duration: 5000,
        style: { background: "#1a1a1a", color: "#fff", border: "1px solid rgba(239,68,68,0.3)" },
      });
      // Browser notification (works even if tab is in background)
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Pizza Home - New Order!", {
          body: "A new order has been placed. Check the admin panel.",
          icon: "/favicon.ico",
        });
      }
    });

    socket.on("order_status_updated", () => {
      fetchOrders();
    });

    const interval = setInterval(fetchOrders, 30000);

    return () => {
      socket.disconnect();
      clearInterval(interval);
    };
  }, [fetchOrders, fetchRiders]);

  const updateStatus = async (orderId: number, status: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update");
      toast.success(`Order updated to ${status.replace(/_/g, " ")}`);
      fetchOrders();
    } catch (err) {
      toast.error("Failed to update order status");
    }
  };

  const assignRider = async (orderId: number, riderId: number) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/assign-rider`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ riderId }),
      });
      if (!res.ok) throw new Error("Failed to assign");
      toast.success("Rider assigned successfully");
      fetchOrders();
    } catch (err) {
      toast.error("Failed to assign rider");
    }
  };

  const getNextStatus = (current: string) => {
    const idx = statusFlow.indexOf(current);
    return idx >= 0 && idx < statusFlow.length - 1 ? statusFlow[idx + 1] : null;
  };

  const filtered = orders.filter((o) => {
    if (filter !== "all" && o.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerPhone.includes(q)
      );
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order #, name, or phone..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/5 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-red-500/30"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {["all", "pending", "confirmed", "preparing", "ready", "out_for_delivery", "delivered"].map(
            (s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  filter === s
                    ? "fire-gradient text-white"
                    : "bg-white/5 text-white/40 hover:text-white hover:bg-white/10"
                }`}
              >
                {s === "all" ? "All" : s.replace(/_/g, " ")}
              </button>
            )
          )}
        </div>
        <button
          onClick={fetchOrders}
          className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-all"
        >
          <RefreshCw className="w-4 h-4 text-white/40" />
        </button>
      </div>

      {/* Orders list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-white/30">No orders found</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((order) => {
            const sc = statusConfig[order.status] || statusConfig.pending;
            const StatusIcon = sc.icon;
            const next = getNextStatus(order.status);
            const isExpanded = expandedOrder === order.id;

            return (
              <div
                key={order.id}
                className="rounded-2xl bg-white/[0.03] border border-white/5 overflow-hidden hover:border-white/10 transition-all"
              >
                {/* Header row */}
                <div
                  className="flex items-center gap-4 p-4 cursor-pointer"
                  onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${sc.color}`}>
                    <StatusIcon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-display font-bold text-white text-sm">
                        #{order.orderNumber}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium border ${sc.color}`}>
                        {sc.label}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-white/5 text-white/40 border border-white/10">
                        {order.orderType === "walkin" ? "Walk-in" : "Online"}
                      </span>
                    </div>
                    <p className="text-xs text-white/40 mt-0.5">
                      {order.customerName} · {new Date(order.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-display font-bold text-white">
                      Rs. {Number(order.total).toLocaleString()}
                    </p>
                    <p className="text-xs text-white/30">
                      {order.items.length} items
                    </p>
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-white/5 pt-4">
                    <div className="grid sm:grid-cols-2 gap-4 mb-4">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-sm text-white/60">
                          <User className="w-3.5 h-3.5" />
                          {order.customerName}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-white/60">
                          <Phone className="w-3.5 h-3.5" />
                          {order.customerPhone}
                        </div>
                        {order.customerAddress && (
                          <div className="flex items-start gap-2 text-sm text-white/60">
                            <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                            {order.customerAddress}
                          </div>
                        )}
                        {order.notes && (
                          <p className="text-xs text-yellow-400/80 bg-yellow-500/5 rounded-lg px-3 py-2 border border-yellow-500/10">
                            Note: {order.notes}
                          </p>
                        )}
                      </div>

                      {/* Items */}
                      <div className="flex flex-col gap-1.5">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span className="text-white/60">
                              {item.quantity}x {item.name}
                              {item.size && <span className="text-white/30"> ({item.size})</span>}
                            </span>
                            <span className="text-white/80 font-medium">
                              Rs. {Number(item.totalPrice).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 pt-3 border-t border-white/5">
                      {next && order.status !== "cancelled" && (
                        <button
                          onClick={() => updateStatus(order.id, next)}
                          className="px-4 py-2 fire-gradient rounded-lg text-white text-xs font-medium"
                        >
                          Move to: {next.replace(/_/g, " ")}
                        </button>
                      )}
                      {order.status === "ready" && order.orderType !== "walkin" && (
                        <select
                          value={order.riderId || ""}
                          onChange={(e) => {
                            if (e.target.value) assignRider(order.id, Number(e.target.value));
                          }}
                          className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs"
                        >
                          <option value="">Assign Rider</option>
                          {riders.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.name || `Rider #${r.id}`}
                            </option>
                          ))}
                        </select>
                      )}
                      {order.status !== "cancelled" && order.status !== "delivered" && (
                        <button
                          onClick={() => updateStatus(order.id, "cancelled")}
                          className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/20"
                        >
                          Cancel Order
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
