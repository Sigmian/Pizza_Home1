/*
 * Pizza Home — Rider Panel
 * Shows assigned orders, accept/reject, mark delivered
 * Uses WebSocket for real-time assignment notifications
 */

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Bike,
  Package,
  MapPin,
  Phone,
  User,
  Clock,
  CheckCircle2,
  Truck,
  Loader2,
  RefreshCw,
  ArrowLeft,
  Navigation,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { io, Socket } from "socket.io-client";
import PinGate from "@/components/PinGate";

interface OrderItem {
  id: number;
  name: string;
  size: string | null;
  quantity: number;
}

interface Order {
  id: number;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string | null;
  status: string;
  total: string;
  paymentMethod: string;
  paymentStatus: string;
  notes: string | null;
  createdAt: string;
  items: OrderItem[];
}

function RiderPanelInner() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [riderId, setRiderId] = useState<number | null>(null);
  const [riderIdInput, setRiderIdInput] = useState("");
  const socketRef = useRef<Socket | null>(null);

  // Simple rider ID entry (in production, this would be auth-based)
  const savedRiderId = typeof window !== "undefined" ? localStorage.getItem("pizza_rider_id") : null;

  useEffect(() => {
    if (savedRiderId) {
      setRiderId(Number(savedRiderId));
    }
  }, [savedRiderId]);

  const fetchOrders = useCallback(async () => {
    if (!riderId) return;
    try {
      const res = await fetch(`/api/rider/${riderId}/orders`);
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [riderId]);

  useEffect(() => {
    if (!riderId) return;

    fetchOrders();

    const socket = io({ path: "/api/socket.io" });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join", `rider_${riderId}`);
    });

    socket.on("rider_assigned", () => {
      fetchOrders();
      toast.info("New delivery assigned!", { icon: "📦" });
    });

    socket.on("order_status_updated", () => {
      fetchOrders();
    });

    const interval = setInterval(fetchOrders, 30000);

    return () => {
      socket.disconnect();
      clearInterval(interval);
    };
  }, [riderId, fetchOrders]);

  const updateStatus = async (orderId: number, status: string) => {
    try {
      const res = await fetch(`/api/rider/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success(status === "delivered" ? "Order delivered!" : "Status updated");
      fetchOrders();
    } catch {
      toast.error("Failed to update status");
    }
  };

  const loginAsRider = () => {
    const id = Number(riderIdInput);
    if (!id) return toast.error("Enter a valid rider ID");
    localStorage.setItem("pizza_rider_id", String(id));
    setRiderId(id);
  };

  // Rider ID entry screen (after PIN gate)
  if (!riderId) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-16 h-16 fire-gradient rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Bike className="w-8 h-8 text-white" />
            </div>
            <h1 className="font-display font-bold text-2xl text-white">Select Rider</h1>
            <p className="text-sm text-white/40 mt-1">Enter your Rider ID to view assignments</p>
          </div>
          <div className="flex flex-col gap-3">
            <input
              type="number"
              value={riderIdInput}
              onChange={(e) => setRiderIdInput(e.target.value)}
              placeholder="Rider ID"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/5 text-white text-center text-lg placeholder:text-white/25 focus:outline-none focus:border-red-500/30"
              onKeyDown={(e) => e.key === "Enter" && loginAsRider()}
            />
            <button
              onClick={loginAsRider}
              className="w-full py-3 fire-gradient rounded-xl text-white font-semibold"
            >
              Continue
            </button>
            <Link
              href="/"
              className="text-center text-xs text-white/30 hover:text-white/50"
            >
              Back to Website
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const activeOrders = orders.filter((o) => !["delivered", "cancelled"].includes(o.status));
  const completedOrders = orders.filter((o) => ["delivered", "cancelled"].includes(o.status));

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col">
      {/* Header */}
      <header className="bg-[#0F0F0F] border-b border-white/5 px-4 py-3 flex items-center gap-4">
        <Link href="/" className="p-2 rounded-lg bg-white/5 hover:bg-white/10">
          <ArrowLeft className="w-4 h-4 text-white/60" />
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 fire-gradient rounded-lg flex items-center justify-center">
            <Bike className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="font-display font-bold text-white text-sm">Rider #{riderId}</h1>
            <p className="text-[10px] text-white/30">{activeOrders.length} active deliveries</p>
          </div>
        </div>
        <div className="ml-auto flex gap-2">
          <button onClick={fetchOrders} className="p-2 rounded-lg bg-white/5 hover:bg-white/10">
            <RefreshCw className="w-4 h-4 text-white/40" />
          </button>
          <button
            onClick={() => {
              localStorage.removeItem("pizza_rider_id");
              setRiderId(null);
            }}
            className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-white/40"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="flex-1 p-4 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
          </div>
        ) : (
          <>
            {/* Active deliveries */}
            <h2 className="font-display font-bold text-white mb-3 flex items-center gap-2">
              <Truck className="w-4 h-4 text-red-500" />
              Active Deliveries
            </h2>

            {activeOrders.length === 0 ? (
              <div className="text-center py-12 rounded-2xl bg-white/[0.03] border border-white/5 mb-6">
                <Package className="w-10 h-10 text-white/10 mx-auto mb-2" />
                <p className="text-sm text-white/30">No active deliveries</p>
                <p className="text-xs text-white/20 mt-1">New orders will appear here when assigned</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3 mb-6">
                {activeOrders.map((order) => (
                  <div
                    key={order.id}
                    className="rounded-2xl bg-white/[0.03] border border-white/5 p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-display font-bold text-white">
                          #{order.orderNumber}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${
                          order.status === "ready"
                            ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                            : order.status === "out_for_delivery"
                            ? "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                            : "bg-white/5 text-white/40 border border-white/10"
                        }`}>
                          {order.status.replace(/_/g, " ")}
                        </span>
                      </div>
                      <span className="font-display font-bold text-white">
                        Rs. {Number(order.total).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex flex-col gap-2 mb-3">
                      <div className="flex items-center gap-2 text-sm text-white/60">
                        <User className="w-3.5 h-3.5 flex-shrink-0" />
                        {order.customerName}
                      </div>
                      <a
                        href={`tel:${order.customerPhone}`}
                        className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300"
                      >
                        <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                        {order.customerPhone}
                      </a>
                      {order.customerAddress && (
                        <div className="flex items-start gap-2 text-sm text-white/60">
                          <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                          {order.customerAddress}
                        </div>
                      )}
                    </div>

                    {/* Items */}
                    <div className="bg-white/[0.02] rounded-lg p-3 mb-3">
                      {order.items.map((item) => (
                        <div key={item.id} className="text-xs text-white/60">
                          <span className="font-bold text-white/80">{item.quantity}x</span>{" "}
                          {item.name}
                          {item.size && <span className="text-white/30"> ({item.size})</span>}
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-white/30 mb-3">
                      <Clock className="w-3 h-3" />
                      {new Date(order.createdAt).toLocaleString()}
                      <span className="mx-1">·</span>
                      {order.paymentMethod === "cod" ? "Cash on Delivery" : "Paid"}
                    </div>

                    {/* Navigate to address */}
                    {order.customerAddress && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.customerAddress)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 py-2 mb-2 rounded-xl bg-blue-500/10 text-blue-400 text-xs font-medium hover:bg-blue-500/20 transition-colors"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        Open in Google Maps
                      </a>
                    )}

                    {/* Actions — multi-step flow */}
                    <div className="flex gap-2">
                      {(order.status === "ready" || order.status === "confirmed" || order.status === "preparing") && (
                        <button
                          onClick={() => updateStatus(order.id, "accepted")}
                          className="flex-1 py-2.5 fire-gradient rounded-xl text-white text-sm font-medium flex items-center justify-center gap-2"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Accept Order
                        </button>
                      )}
                      {order.status === "accepted" && (
                        <button
                          onClick={() => updateStatus(order.id, "picked_up")}
                          className="flex-1 py-2.5 bg-cyan-500 hover:bg-cyan-600 rounded-xl text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                        >
                          <Package className="w-4 h-4" />
                          Mark Picked Up
                        </button>
                      )}
                      {order.status === "picked_up" && (
                        <button
                          onClick={() => updateStatus(order.id, "out_for_delivery")}
                          className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 rounded-xl text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                        >
                          <Navigation className="w-4 h-4" />
                          Out for Delivery
                        </button>
                      )}
                      {order.status === "out_for_delivery" && (
                        <button
                          onClick={() => updateStatus(order.id, "delivered")}
                          className="flex-1 py-2.5 bg-green-500 hover:bg-green-600 rounded-xl text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Mark Delivered
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Completed */}
            {completedOrders.length > 0 && (
              <>
                <h2 className="font-display font-bold text-white/40 mb-3 text-sm">
                  Completed ({completedOrders.length})
                </h2>
                <div className="flex flex-col gap-2">
                  {completedOrders.slice(0, 10).map((order) => (
                    <div
                      key={order.id}
                      className="rounded-xl bg-white/[0.02] border border-white/5 p-3 flex items-center justify-between opacity-60"
                    >
                      <div>
                        <span className="font-display font-bold text-white text-sm">
                          #{order.orderNumber}
                        </span>
                        <p className="text-xs text-white/30">{order.customerName}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-white">
                          Rs. {Number(order.total).toLocaleString()}
                        </span>
                        <p className="text-[10px] text-green-400">Delivered</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function RiderPanel() {
  return (
    <PinGate
      role="rider"
      title="Rider Panel"
      subtitle="Enter rider PIN to access"
      icon={<Bike className="w-8 h-8 text-white" />}
    >
      <RiderPanelInner />
    </PinGate>
  );
}
