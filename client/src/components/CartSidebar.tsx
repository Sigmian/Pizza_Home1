/*
 * Pizza Home — Cart Sidebar
 * Design: "Midnight Feast" — Slide-out cart drawer with glassmorphism
 * Full cart: increment/decrement, remove, live totals, free delivery progress
 */

import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Minus, Trash2, ShoppingBag, Truck, ArrowRight } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { FREE_DELIVERY_THRESHOLD } from "@/contexts/CartContext";

export default function CartSidebar() {
  const {
    items,
    removeItem,
    incrementItem,
    decrementItem,
    clearCart,
    totalItems,
    totalPrice,
    isFreeDelivery,
    amountToFreeDelivery,
    isCartOpen,
    setIsCartOpen,
  } = useCart();

  const deliveryProgress = Math.min(
    100,
    (totalPrice / FREE_DELIVERY_THRESHOLD) * 100
  );

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCartOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-full sm:w-[420px] bg-[#0F0F0F] border-l border-white/5 z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 fire-gradient rounded-xl flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-lg text-white">
                    Your Cart
                  </h2>
                  <p className="text-xs text-white/40">
                    {totalItems} {totalItems === 1 ? "item" : "items"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>

            {/* Free delivery progress */}
            <div className="px-5 py-3 border-b border-white/5">
              {isFreeDelivery ? (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20">
                  <Truck className="w-4 h-4 text-green-400" />
                  <span className="text-sm font-medium text-green-400">
                    You've unlocked FREE delivery!
                  </span>
                </div>
              ) : totalItems > 0 ? (
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-white/40">
                      Add Rs. {amountToFreeDelivery.toLocaleString()} more for free delivery
                    </span>
                    <span className="text-orange-400 font-medium">
                      Rs. {FREE_DELIVERY_THRESHOLD.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <motion.div
                      className="h-full fire-gradient rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${deliveryProgress}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
              ) : null}
            </div>

            {/* Cart items */}
            <div className="flex-1 overflow-y-auto p-5">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                    <ShoppingBag className="w-10 h-10 text-white/20" />
                  </div>
                  <p className="font-display font-bold text-white/60 text-lg">
                    Your cart is empty
                  </p>
                  <p className="text-sm text-white/30 mt-1">
                    Add some delicious items to get started!
                  </p>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="mt-6 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-medium hover:bg-white/10 transition-all"
                  >
                    Browse Menu
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <AnimatePresence>
                    {items.map((item) => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: 50, height: 0 }}
                        className="flex gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5 group"
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm text-white truncate">
                            {item.name}
                          </h4>
                          <p className="text-sm font-bold text-orange-400 mt-0.5">
                            Rs. {(item.price * item.quantity).toLocaleString()}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              onClick={() => decrementItem(item.id)}
                              className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                            >
                              <Minus className="w-3.5 h-3.5 text-white/60" />
                            </button>
                            <span className="text-sm font-bold text-white w-6 text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => incrementItem(item.id)}
                              className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5 text-white/60" />
                            </button>
                          </div>
                        </div>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="self-start p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/10 transition-all"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {/* Clear cart */}
                  <button
                    onClick={clearCart}
                    className="text-xs text-white/30 hover:text-red-400 transition-colors mt-2 self-end"
                  >
                    Clear all items
                  </button>
                </div>
              )}
            </div>

            {/* Footer: Total + Checkout */}
            {items.length > 0 && (
              <div className="p-5 border-t border-white/5 bg-[#0A0A0A]">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-white/60 text-sm">Subtotal</span>
                  <span className="font-display font-bold text-xl text-white">
                    Rs. {totalPrice.toLocaleString()}
                  </span>
                </div>
                <Link
                  href="/checkout"
                  onClick={() => setIsCartOpen(false)}
                  className="flex items-center justify-center gap-2 w-full py-4 fire-gradient rounded-xl text-white font-semibold text-base shadow-lg shadow-red-500/25 hover:shadow-red-500/40 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200"
                >
                  Proceed to Checkout
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
