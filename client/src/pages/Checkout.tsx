/*
 * Pizza Home — Checkout Page
 * Design: "Midnight Feast" — Clean checkout with order summary
 * Places orders via API, shows confirmation with order number
 */

const [orderType, setOrderType] = useState("delivery");
const [tableNumber, setTableNumber] = useState("");
const [paymentMethod, setPaymentMethod] = useState("cod");

import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  User,
  Phone,
  MapPin,
  CreditCard,
  CheckCircle2,
  Truck,
  ShoppingBag,
  Loader2,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartSidebar from "@/components/CartSidebar";
import { useCart, FREE_DELIVERY_THRESHOLD, DELIVERY_FEE } from "@/contexts/CartContext";
import { toast } from "sonner";

export default function Checkout() {
  const { items, totalPrice, isFreeDelivery, clearCart } = useCart();
  const [, navigate] = useLocation();
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    notes: "",
  });

  const deliveryFee = isFreeDelivery ? 0 : DELIVERY_FEE;
  const grandTotal = totalPrice + deliveryFee;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim() || !form.phone.trim() || !form.address.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: form.name,
          customerPhone: form.phone,
          customerAddress: form.address,
          notes: form.notes,
          paymentMethod: "cod",
          orderType: "online",
          items: items.map((item) => ({
            menuItemId: item.menuItemId || null,
            dealId: item.dealId || null,
            name: item.name,
            size: item.size || null,
            price: item.price,
            quantity: item.quantity,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to place order");

      setOrderNumber(data.order.orderNumber);
      setOrderPlaced(true);
      clearCart();
      toast.success("Order placed successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to place order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-[#0A0A0A]">
        <Header />
        <div className="container pt-28 pb-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="max-w-md mx-auto text-center"
          >
            <div className="w-20 h-20 fire-gradient rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-500/30">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
            <h1 className="font-display font-bold text-3xl text-white mb-3">
              Order Confirmed!
            </h1>
            <p className="text-white/50 mb-2">
              Thank you for ordering from Pizza Home. Your delicious food is
              being prepared!
            </p>
            {orderNumber && (
              <div className="inline-block px-4 py-2 rounded-xl bg-white/5 border border-white/10 mb-4">
                <p className="text-xs text-white/40">Order Number</p>
                <p className="font-display font-bold text-xl text-orange-400">
                  {orderNumber}
                </p>
              </div>
            )}
            <p className="text-sm text-white/30 mb-8">
              We'll deliver your order to your doorstep. Estimated delivery time:
              30-45 minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href={orderNumber ? `/track/${orderNumber}` : "/"}
                className="px-6 py-3 fire-gradient rounded-xl text-white font-semibold text-sm shadow-lg shadow-red-500/25 hover:shadow-red-500/40 transition-all"
              >
                Track Order
              </Link>
              <Link
                href="/"
                className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-semibold text-sm hover:bg-white/10 transition-all"
              >
                Back to Home
              </Link>
            </div>
          </motion.div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <Header />

      <section className="pt-24 pb-16 sm:pt-28 sm:pb-24">
        <div className="container">
          <Link
            href="/menu"
            className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Menu
          </Link>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display font-bold text-3xl sm:text-4xl text-white mb-8"
          >
            Checkout
          </motion.h1>

          {items.length === 0 && !orderPlaced ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                <ShoppingBag className="w-10 h-10 text-white/20" />
              </div>
              <p className="font-display font-bold text-white/60 text-lg">
                Your cart is empty
              </p>
              <p className="text-sm text-white/30 mt-1 mb-6">
                Add some items before checking out
              </p>
              <Link
                href="/menu"
                className="px-6 py-3 fire-gradient rounded-xl text-white font-semibold text-sm shadow-lg shadow-red-500/25 hover:shadow-red-500/40 transition-all"
              >
                Browse Menu
              </Link>
            </div>
          ) : (
            <div className="grid lg:grid-cols-5 gap-8">
              {/* Form */}
              <motion.form
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                onSubmit={handleSubmit}
                className="lg:col-span-3 flex flex-col gap-6"
              >
                {/* Delivery info */}
                <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/5">
                  <h2 className="font-display font-bold text-lg text-white mb-5 flex items-center gap-2">
                    <Truck className="w-5 h-5 text-red-500" />
                    Delivery Information
                  </h2>

                  <div className="flex flex-col gap-4">
                    <div>
                      <label className="block text-sm text-white/50 mb-1.5">
                        Full Name *
                      </label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                        <input
                          type="text"
                          value={form.name}
                          onChange={(e) =>
                            setForm({ ...form, name: e.target.value })
                          }
                          placeholder="Enter your full name"
                          className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/5 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-red-500/30 focus:ring-1 focus:ring-red-500/20 transition-all"
                          required
                        />
                      </div>
                    </div>

                    {orderType === "delivery" && (
  <div>
    <label className="block text-sm text-white/50 mb-1.5">
      Delivery Address *
    </label>

    <div className="relative">
      <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-white/20" />

      <textarea
        value={form.address}
        onChange={(e) =>
          setForm({ ...form, address: e.target.value })
        }
        placeholder="Enter your full delivery address in Chakwal"
        rows={3}
        className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/5 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-red-500/30 focus:ring-1 focus:ring-red-500/20 transition-all resize-none"
        required
      />
    </div>
  </div>
)}

                    <div>
                      <label className="block text-sm text-white/50 mb-1.5">
                        Delivery Address *
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-white/20" />
                        <textarea
                          value={form.address}
                          onChange={(e) =>
                            setForm({ ...form, address: e.target.value })
                          }
                          placeholder="Enter your full delivery address in Chakwal"
                          rows={3}
                          className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/5 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-red-500/30 focus:ring-1 focus:ring-red-500/20 transition-all resize-none"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm text-white/50 mb-1.5">
                        Special Instructions (Optional)
                      </label>
                      <textarea
                        value={form.notes}
                        onChange={(e) =>
                          setForm({ ...form, notes: e.target.value })
                        }
                        placeholder="Any special requests? (e.g., extra sauce, no onions)"
                        rows={2}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/5 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-red-500/30 focus:ring-1 focus:ring-red-500/20 transition-all resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Payment method */}
                <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/5">
                  <h2 className="font-display font-bold text-lg text-white mb-4 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-red-500" />
                    Payment Method
                  </h2>
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border-2 border-red-500/30">
                    <div className="w-5 h-5 rounded-full fire-gradient flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        Cash on Delivery
                      </p>
                      <p className="text-xs text-white/40">
                        Pay when your order arrives
                      </p>
                    </div>
                  </div>
                </div>

                {/* Submit (mobile) */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="lg:hidden w-full py-4 fire-gradient rounded-xl text-white font-semibold text-base shadow-lg shadow-red-500/25 hover:shadow-red-500/40 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Placing Order...
                    </span>
                  ) : (
                    `Place Order — Rs. ${grandTotal.toLocaleString()}`
                  )}
                </button>
              </motion.form>

              {/* Order Summary */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="lg:col-span-2"
              >
                <div className="sticky top-24 p-6 rounded-2xl bg-white/[0.03] border border-white/5">
                  <h2 className="font-display font-bold text-lg text-white mb-5">
                    Order Summary
                  </h2>

                  <div className="flex flex-col gap-3 mb-5">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3"
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white truncate">
                            {item.name}
                          </p>
                          <p className="text-xs text-white/40">
                            x{item.quantity}
                          </p>
                        </div>
                        <span className="text-sm font-medium text-white flex-shrink-0">
                          Rs. {(item.price * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="h-px bg-white/5 mb-4" />

                  <div className="flex flex-col gap-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-white/40">Subtotal</span>
                      <span className="text-white">
                        Rs. {totalPrice.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/40">Delivery Fee</span>
                      {isFreeDelivery ? (
                        <span className="text-green-400 font-medium">FREE</span>
                      ) : (
                        <span className="text-white">
                          Rs. {deliveryFee.toLocaleString()}
                        </span>
                      )}
                    </div>
                    {!isFreeDelivery && (
                      <p className="text-[10px] text-orange-400">
                        Add Rs.{" "}
                        {(FREE_DELIVERY_THRESHOLD - totalPrice).toLocaleString()}{" "}
                        more for free delivery
                      </p>
                    )}
                  </div>

                  <div className="h-px bg-white/5 mb-4" />

                  <div className="flex justify-between items-center mb-5">
                    <span className="font-display font-bold text-white">
                      Total
                    </span>
                    <span className="font-display font-bold text-2xl text-white">
                      Rs. {grandTotal.toLocaleString()}
                    </span>
                  </div>

                  {/* Submit (desktop) */}
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => {
                      const formEl = document.querySelector("form");
                      if (formEl) formEl.requestSubmit();
                    }}
                    className="hidden lg:flex w-full items-center justify-center gap-2 py-4 fire-gradient rounded-xl text-white font-semibold text-base shadow-lg shadow-red-500/25 hover:shadow-red-500/40 active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Placing Order...
                      </>
                    ) : (
                      "Place Order"
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </section>

      <Footer />
      <CartSidebar />
    </div>
  );
}
