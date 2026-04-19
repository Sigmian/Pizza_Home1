/*
 * Pizza Home — Order Tracking Page
 * Customers can track their order status in real-time
 * URL: /track/:orderNumber
 */

import { useState, useEffect, useRef } from "react";
import {
  Clock,
  CheckCircle2,
  ChefHat,
  Package,
  Truck,
  Home,
  XCircle,
  ArrowLeft,
  Loader2,
  Pizza,
  Phone,
} from "lucide-react";
import { Link, useParams } from "wouter";
import { io, Socket } from "socket.io-client";

interface OrderItem {
  id: number;
  name: string;
  size: string | null;
  price: string;
  quantity: number;
  totalPrice: string;
}

interface OrderData {
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
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

const statusSteps = [
  { key: "pending", label: "Order Placed", icon: Clock, description: "Your order has been received" },
  { key: "confirmed", label: "Confirmed", icon: CheckCircle2, description: "Restaurant has confirmed your order" },
  { key: "preparing", label: "Preparing", icon: ChefHat, description: "Your food is being prepared" },
  { key: "ready", label: "Ready", icon: Package, description: "Your order is ready" },
  { key: "out_for_delivery", label: "Out for Delivery", icon: Truck, description: "Rider is on the way" },
  { key: "delivered", label: "Delivered", icon: Home, description: "Order has been delivered" },
];

export default function OrderTracking() {
  const params = useParams<{ orderNumber: string }>();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [searchOrderNumber, setSearchOrderNumber] = useState(params.orderNumber || "");
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (params.orderNumber) {
      setSearchOrderNumber(params.orderNumber);
    }
  }, [params.orderNumber]);

  useEffect(() => {
    if (!searchOrderNumber) {
      setLoading(false);
      return;
    }

    const fetchOrder = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/orders/${searchOrderNumber}`);
        if (!res.ok) {
          if (res.status === 404) throw new Error("Order not found");
          throw new Error("Failed to fetch order");
        }
        const data = await res.json();
        setOrder(data);
      } catch (err: any) {
        setError(err.message);
        setOrder(null);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();

    // WebSocket for real-time updates
    const socket = io({ path: "/api/socket.io" });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join", `order_${searchOrderNumber}`);
    });

    socket.on("order_status_updated", (data: any) => {
      if (data.orderNumber === searchOrderNumber) {
        fetchOrder();
      }
    });

    // Poll every 30s as backup
    const interval = setInterval(fetchOrder, 30000);

    return () => {
      socket.disconnect();
      clearInterval(interval);
    };
  }, [searchOrderNumber]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setSearchOrderNumber(searchInput.trim().toUpperCase());
    }
  };

  const currentStepIndex = order
    ? statusSteps.findIndex((s) => s.key === order.status)
    : -1;

  const isCancelled = order?.status === "cancelled";

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Header */}
      <header className="bg-[#0F0F0F] border-b border-white/5 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <Link href="/" className="p-2 rounded-lg bg-white/5 hover:bg-white/10">
            <ArrowLeft className="w-4 h-4 text-white/60" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 fire-gradient rounded-lg flex items-center justify-center">
              <Pizza className="w-4 h-4 text-white" />
            </div>
            <h1 className="font-display font-bold text-white">Track Order</h1>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4">
        {/* Search form */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value.toUpperCase())}
              placeholder="Enter order number (e.g. PH-ABC123)"
              className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/5 text-white placeholder:text-white/25 focus:outline-none focus:border-red-500/30"
            />
            <button
              type="submit"
              className="px-6 py-3 fire-gradient rounded-xl text-white font-semibold text-sm"
            >
              Track
            </button>
          </div>
        </form>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-16 rounded-2xl bg-white/[0.03] border border-white/5">
            <XCircle className="w-12 h-12 text-red-500/40 mx-auto mb-3" />
            <p className="text-white/60 font-medium">{error}</p>
            <p className="text-white/30 text-sm mt-1">Please check the order number and try again</p>
          </div>
        ) : !order ? (
          <div className="text-center py-16 rounded-2xl bg-white/[0.03] border border-white/5">
            <Package className="w-12 h-12 text-white/10 mx-auto mb-3" />
            <p className="text-white/30">Enter your order number to track</p>
          </div>
        ) : (
          <>
            {/* Order header */}
            <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-5 mb-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="font-display font-bold text-xl text-white">
                    #{order.orderNumber}
                  </h2>
                  <p className="text-xs text-white/30 mt-0.5">
                    Placed {new Date(order.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-display font-bold text-xl text-white">
                    Rs. {Number(order.total).toLocaleString()}
                  </p>
                  <p className="text-xs text-white/30">
                    {order.paymentMethod === "cod" ? "Cash on Delivery" : "Paid"}
                  </p>
                </div>
              </div>
            </div>

            {/* Status timeline */}
            <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-5 mb-4">
              <h3 className="font-display font-bold text-white mb-5">Order Status</h3>

              {isCancelled ? (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                  <XCircle className="w-6 h-6 text-red-400" />
                  <div>
                    <p className="font-bold text-red-400">Order Cancelled</p>
                    <p className="text-xs text-red-400/60">This order has been cancelled</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-0">
                  {statusSteps.map((step, idx) => {
                    const StepIcon = step.icon;
                    const isCompleted = idx <= currentStepIndex;
                    const isCurrent = idx === currentStepIndex;

                    return (
                      <div key={step.key} className="flex gap-4">
                        {/* Timeline line + dot */}
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                              isCurrent
                                ? "fire-gradient shadow-lg shadow-red-500/30"
                                : isCompleted
                                ? "bg-green-500/20 border border-green-500/30"
                                : "bg-white/5 border border-white/10"
                            }`}
                          >
                            <StepIcon
                              className={`w-5 h-5 ${
                                isCurrent
                                  ? "text-white"
                                  : isCompleted
                                  ? "text-green-400"
                                  : "text-white/20"
                              }`}
                            />
                          </div>
                          {idx < statusSteps.length - 1 && (
                            <div
                              className={`w-0.5 h-8 ${
                                isCompleted && idx < currentStepIndex
                                  ? "bg-green-500/30"
                                  : "bg-white/5"
                              }`}
                            />
                          )}
                        </div>

                        {/* Step text */}
                        <div className="pb-6">
                          <p
                            className={`font-medium text-sm ${
                              isCurrent
                                ? "text-white"
                                : isCompleted
                                ? "text-green-400/80"
                                : "text-white/20"
                            }`}
                          >
                            {step.label}
                          </p>
                          <p
                            className={`text-xs mt-0.5 ${
                              isCurrent ? "text-white/50" : "text-white/20"
                            }`}
                          >
                            {step.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Order items */}
            <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-5">
              <h3 className="font-display font-bold text-white mb-3">Order Items</h3>
              <div className="flex flex-col gap-2">
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
              <div className="mt-3 pt-3 border-t border-white/5">
                <div className="flex justify-between text-sm">
                  <span className="text-white/40">Subtotal</span>
                  <span className="text-white/60">Rs. {Number(order.subtotal).toLocaleString()}</span>
                </div>
                {Number(order.deliveryFee) > 0 && (
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-white/40">Delivery Fee</span>
                    <span className="text-white/60">Rs. {Number(order.deliveryFee).toLocaleString()}</span>
                  </div>
                )}
                {Number(order.discount) > 0 && (
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-white/40">Discount</span>
                    <span className="text-green-400">-Rs. {Number(order.discount).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between mt-2 pt-2 border-t border-white/5">
                  <span className="font-display font-bold text-white">Total</span>
                  <span className="font-display font-bold text-white">
                    Rs. {Number(order.total).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Contact */}
            <div className="mt-4 text-center">
              <a
                href="tel:+923001234567"
                className="inline-flex items-center gap-2 text-sm text-white/30 hover:text-white/50 transition-colors"
              >
                <Phone className="w-3.5 h-3.5" />
                Need help? Call us
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
