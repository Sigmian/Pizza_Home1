/*
 * Pizza Home — Mobile Sticky Cart Button
 * Design: "Midnight Feast" — Floating fire gradient cart button on mobile
 */

import { ShoppingCart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/contexts/CartContext";

export default function MobileCartButton() {
  const { totalItems, totalPrice, setIsCartOpen } = useCart();

  if (totalItems === 0) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-40 sm:hidden">
      <AnimatePresence>
        <motion.button
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          onClick={() => setIsCartOpen(true)}
          className="w-full flex items-center justify-between px-5 py-4 fire-gradient rounded-2xl shadow-2xl shadow-red-500/30 active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <ShoppingCart className="w-5 h-5 text-white" />
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-white rounded-full flex items-center justify-center text-[9px] font-bold text-red-600">
                {totalItems}
              </span>
            </div>
            <span className="font-semibold text-white text-sm">
              View Cart
            </span>
          </div>
          <span className="font-display font-bold text-white">
            Rs. {totalPrice.toLocaleString()}
          </span>
        </motion.button>
      </AnimatePresence>
    </div>
  );
}
