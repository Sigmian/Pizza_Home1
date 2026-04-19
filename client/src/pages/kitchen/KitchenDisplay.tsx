/*
 * Pizza Home — Kitchen Display System (KDS)
 * Real-time order feed with status management
 * Columns: Pending → Preparing → Ready
 */

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Clock,
  ChefHat,
  CheckCircle2,
  Package,
  Loader2,
  RefreshCw,
  ArrowLeft,
  Pizza,
  Bell,
} from "lucide-react";
import { Link } from "wouter";
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
  orderType: string;
  status: string;
  notes: string | null;
  createdAt: string;
  items: OrderItem[];
}

const statusColumns = [
  { key: "pending", label: "New Orders", icon: Bell, color: "border-yellow-500/30 bg-yellow-500/5" },
  { key: "confirmed", label: "Confirmed", icon: CheckCircle2, color: "border-blue-500/30 bg-blue-500/5" },
  { key: "preparing", label: "Preparing", icon: ChefHat, color: "border-purple-500/30 bg-purple-500/5" },
  { key: "ready", label: "Ready", icon: Package, color: "border-green-500/30 bg-green-500/5" },
];

// Generate a notification beep using Web Audio API
function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // First beep
    oscillator.frequency.setValueAtTime(880, ctx.currentTime); // A5
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    oscillator.start(ctx.currentTime);

    // Second beep
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.frequency.setValueAtTime(1100, ctx.currentTime + 0.2); // C#6
    gain2.gain.setValueAtTime(0.3, ctx.currentTime + 0.2);
    gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
    osc2.start(ctx.currentTime + 0.2);

    // Third beep (higher)
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.connect(gain3);
    gain3.connect(ctx.destination);
    osc3.frequency.setValueAtTime(1320, ctx.currentTime + 0.4); // E6
    gain3.gain.setValueAtTime(0.4, ctx.currentTime + 0.4);
    gain3.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.7);
    osc3.start(ctx.currentTime + 0.4);

    // Cleanup
    oscillator.stop(ctx.currentTime + 0.2);
    osc2.stop(ctx.currentTime + 0.4);
    osc3.stop(ctx.currentTime + 0.8);
    setTimeout(() => ctx.close(), 1000);
  } catch (e) {
    console.warn("Audio notification failed:", e);
  }
}

function KitchenDisplayInner() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const socketRef = useRef<Socket | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/kitchen/orders");
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();

    // Connect to WebSocket for real-time updates
    const socket = io({ path: "/api/socket.io" });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join", "kitchen");
    });

    socket.on("new_order", () => {
      fetchOrders();
      if (soundEnabled) playNotificationSound();
      toast.info("NEW ORDER!", {
        icon: "🔔",
        duration: 5000,
        style: { background: "#1a1a1a", color: "#fff", border: "1px solid rgba(239,68,68,0.3)" },
      });
    });

    socket.on("order_status_updated", () => {
      fetchOrders();
    });

    // Auto-refresh every 30 seconds as backup
    const interval = setInterval(fetchOrders, 30000);

    return () => {
      socket.disconnect();
      clearInterval(interval);
    };
  }, [fetchOrders]);

  const updateStatus = async (orderId: number, status: string) => {
    try {
      const res = await fetch(`/api/kitchen/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success(`Order moved to ${status}`);
      fetchOrders();
    } catch {
      toast.error("Failed to update order");
    }
  };

  const getTimeSince = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col">
      {/* Header */}
      <header className="bg-[#0F0F0F] border-b border-white/5 px-4 py-3 flex items-center gap-4">
        <Link href="/admin" className="p-2 rounded-lg bg-white/5 hover:bg-white/10">
          <ArrowLeft className="w-4 h-4 text-white/60" />
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 fire-gradient rounded-lg flex items-center justify-center">
            <ChefHat className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="font-display font-bold text-white text-sm">Kitchen Display</h1>
            <p className="text-[10px] text-white/30">{orders.length} active orders</p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              if (!soundEnabled) playNotificationSound();
            }}
            className={`p-2 rounded-lg transition-all ${
              soundEnabled
                ? "bg-green-500/10 text-green-400 hover:bg-green-500/20"
                : "bg-white/5 text-white/30 hover:bg-white/10"
            }`}
            title={soundEnabled ? "Sound ON" : "Sound OFF"}
          >
            <Bell className="w-4 h-4" />
          </button>
          <button
            onClick={fetchOrders}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all"
          >
            <RefreshCw className="w-4 h-4 text-white/40" />
          </button>
        </div>
      </header>

      {/* Kanban columns */}
      <div className="flex-1 p-4 overflow-x-auto">
        <div className="flex gap-4 min-w-[800px] h-full">
          {statusColumns.map((col) => {
            const colOrders = orders.filter((o) => o.status === col.key);
            const ColIcon = col.icon;

            return (
              <div key={col.key} className="flex-1 flex flex-col min-w-[200px]">
                {/* Column header */}
                <div className={`rounded-xl border p-3 mb-3 ${col.color}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ColIcon className="w-4 h-4" />
                      <span className="font-display font-bold text-white text-sm">
                        {col.label}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-white/60 bg-white/10 px-2 py-0.5 rounded-full">
                      {colOrders.length}
                    </span>
                  </div>
                </div>

                {/* Order cards */}
                <div className="flex-1 flex flex-col gap-3 overflow-y-auto">
                  {colOrders.map((order) => {
                    const nextStatus =
                      col.key === "pending"
                        ? "confirmed"
                        : col.key === "confirmed"
                        ? "preparing"
                        : col.key === "preparing"
                        ? "ready"
                        : null;

                    return (
                      <div
                        key={order.id}
                        className="rounded-xl bg-white/[0.03] border border-white/5 p-4 hover:border-white/10 transition-all"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-display font-bold text-white text-sm">
                            #{order.orderNumber}
                          </span>
                          <span className="text-[10px] text-white/30 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {getTimeSince(order.createdAt)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xs text-white/50">{order.customerName}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                            order.orderType === "walkin"
                              ? "bg-blue-500/10 text-blue-400"
                              : "bg-green-500/10 text-green-400"
                          }`}>
                            {order.orderType === "walkin" ? "Walk-in" : "Online"}
                          </span>
                        </div>

                        {/* Items */}
                        <div className="flex flex-col gap-1 mb-3">
                          {order.items.map((item) => (
                            <div key={item.id} className="text-xs text-white/60">
                              <span className="font-bold text-white/80">{item.quantity}x</span>{" "}
                              {item.name}
                              {item.size && (
                                <span className="text-white/30"> ({item.size})</span>
                              )}
                            </div>
                          ))}
                        </div>

                        {order.notes && (
                          <p className="text-[10px] text-yellow-400/80 bg-yellow-500/5 rounded-lg px-2 py-1.5 mb-3 border border-yellow-500/10">
                            📝 {order.notes}
                          </p>
                        )}

                        {nextStatus && (
                          <button
                            onClick={() => updateStatus(order.id, nextStatus)}
                            className="w-full py-2 fire-gradient rounded-lg text-white text-xs font-medium"
                          >
                            {nextStatus === "confirmed"
                              ? "Accept Order"
                              : nextStatus === "preparing"
                              ? "Start Preparing"
                              : "Mark Ready"}
                          </button>
                        )}
                      </div>
                    );
                  })}
                  {colOrders.length === 0 && (
                    <div className="text-center py-8 text-white/20 text-xs">
                      No orders
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function KitchenDisplay() {
  return (
    <PinGate
      role="kitchen"
      title="Kitchen Display"
      subtitle="Enter kitchen PIN to access"
      icon={<ChefHat className="w-8 h-8 text-white" />}
    >
      <KitchenDisplayInner />
    </PinGate>
  );
}
