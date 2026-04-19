/*
 * Pizza Home — Menu Item Card
 * Supports items with size variants (pizza sizes) and single-price items
 * Design: "Midnight Feast" — Dark elevated card with fire gradient hover
 */

import { Plus, ShoppingCart, Check } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import type { ApiMenuItem } from "@/hooks/useMenu";
import { getItemPrice, hasSizeVariants } from "@/hooks/useMenu";

const normalizeSizes = (item: any) => {
  if (!item.sizeVariants) return null;

  // 🔥 CASE 1: string → parse
  if (typeof item.sizeVariants === "string") {
    try {
      return JSON.parse(item.sizeVariants);
    } catch {
      return null;
    }
  }

  // CASE 2: already object
  if (typeof item.sizeVariants === "object") {
    return item.sizeVariants;
  }

  // CASE 3: array
  if (Array.isArray(item.sizeVariants)) {
    const obj: Record<string, number> = {};
    item.sizeVariants.forEach((v: any) => {
      if (v.size && v.price) {
        obj[v.size] = Number(v.price);
      }
    });
    return obj;
  }

  return null;
};

interface MenuItemCardProps {
  item: ApiMenuItem;
  index?: number;
}

export default function MenuItemCard({ item, index = 0 }: MenuItemCardProps) {
  const { addItem } = useCart();
  const [justAdded, setJustAdded] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [showSizePicker, setShowSizePicker] = useState(false);

  console.log("SIZE VARIANTS:", item.sizeVariants);
  const normalizedSizes = normalizeSizes(item);
const hasVariants = normalizedSizes && Object.keys(normalizedSizes).length > 0;

const displayPrice = hasVariants
  ? (() => {
      const prices = Object.values(normalizedSizes || {})
        .map((p: any) => Number(p))
        .filter((p) => !isNaN(p));

      return prices.length ? Math.min(...prices) : 0;
    })()
  : Number(item.price || 0);

  const handleAddToCart = (size?: string) => {
    let price = displayPrice;
    let cartId = `item-${item.id}`;
    let cartName = item.name;

    if (hasVariants && normalizedSizes) {
  const sizeKey = size || Object.keys(normalizedSizes)[0];
  price = Number(normalizedSizes[sizeKey] || 0);
      cartId = `item-${item.id}-${sizeKey}`;
      cartName = `${item.name} (${sizeKey})`;
    }

    addItem({
      id: cartId,
      menuItemId: item.id,
      name: cartName,
      size: size || undefined,
      price,
      image: item.image || "",
    });

    toast.success(`${cartName} added to cart!`);
    setJustAdded(true);
    setShowSizePicker(false);
    setSelectedSize(null);
    setTimeout(() => setJustAdded(false), 1200);
  };

  const handleClick = () => {
    if (hasVariants) {
      setShowSizePicker(!showSizePicker);
    } else {
      handleAddToCart();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="group relative rounded-2xl overflow-hidden bg-white/[0.03] border border-white/5 hover:border-red-500/20 transition-all duration-300 hover:shadow-lg hover:shadow-red-500/5"
    >
      {/* Badge */}
      {item.badge && (
        <div className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-full fire-gradient text-[10px] font-bold text-white uppercase tracking-wider shadow-lg shadow-red-500/20">
          {item.badge}
        </div>
      )}

      {/* Image */}
      <div className="relative h-40 sm:h-44 overflow-hidden">
        <img
          src={item.image || ""}
          alt={item.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

        {/* Quick add button overlay */}
        <button
          onClick={handleClick}
          className={`absolute bottom-3 right-3 w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg transition-all duration-300 active:scale-90 ${
            justAdded
              ? "bg-green-500 shadow-green-500/30"
              : "fire-gradient shadow-red-500/30 hover:shadow-red-500/50 hover:scale-110"
          }`}
        >
          {justAdded ? (
            <Check className="w-5 h-5" />
          ) : (
            <Plus className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-2">
        <h3 className="font-display font-bold text-base text-white group-hover:text-orange-400 transition-colors line-clamp-1">
          {item.name}
        </h3>
        <p className="text-xs text-white/40 line-clamp-2 leading-relaxed">
          {item.description}
        </p>

        {/* Size Variants Picker */}
        {showSizePicker && hasVariants && normalizedSizes && (
          <div className="flex flex-col gap-1.5 mt-1">
            {Object.entries(normalizedSizes || {}).map(([size, price]) => (
              <button
                key={size}
                onClick={() => handleAddToCart(size)}
                className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-red-500/20 text-xs transition-all"
              >
                <span className="text-white/80">{size}</span>
                <span className="font-bold text-white">
  Rs. {Number(price || 0).toLocaleString()}
</span>
              </button>
            ))}
          </div>
        )}

        {/* Price + Add to cart */}
        <div className="flex items-center justify-between mt-auto pt-2">
          <div>
            {hasVariants ? (
              <span className="font-display font-bold text-lg text-white">
                from Rs. {displayPrice.toLocaleString()}
              </span>
            ) : (
              <span className="font-display font-bold text-lg text-white">
                Rs. {displayPrice.toLocaleString()}
              </span>
            )}
          </div>
          <button
            onClick={handleClick}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 active:scale-95 ${
              justAdded
                ? "bg-green-500/20 border border-green-500/30 text-green-400"
                : "bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-white/80 hover:text-white"
            }`}
          >
            {justAdded ? (
              <>
                <Check className="w-3.5 h-3.5" />
                Added
              </>
            ) : (
              <>
                <ShoppingCart className="w-3.5 h-3.5" />
                {hasVariants ? "Select Size" : "Add"}
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
