/*
 * Pizza Home — Full Menu Page
 * Design: "Midnight Feast" — Category tabs with animated content switching
 * Features: Filter by category, search, add to cart — API-driven
 */

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, SlidersHorizontal, Loader2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartSidebar from "@/components/CartSidebar";
import MobileCartButton from "@/components/MobileCartButton";
import MenuItemCard from "@/components/MenuItemCard";
import { useCategories, useMenuItems } from "@/hooks/useMenu";

export default function Menu() {
  const { categories, loading: catsLoading } = useCategories();
  const { items: menuItems, loading: itemsLoading } = useMenuItems();
  const [activeCategory, setActiveCategory] = useState<number | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const filteredItems = useMemo(() => {
    let items = menuItems;
    if (activeCategory !== "all") {
      items = items.filter((item) => item.categoryId === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          (item.description || "").toLowerCase().includes(q)
      );
    }
    return items;
  }, [activeCategory, searchQuery, menuItems]);

  const loading = catsLoading || itemsLoading;

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <Header />

      {/* Page header */}
      <section className="pt-24 pb-8 sm:pt-28 sm:pb-12">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl text-white">
              Our <span className="fire-gradient-text">Menu</span>
            </h1>
            <p className="text-white/40 mt-2 max-w-lg">
              Explore our full range of hand-crafted pizzas, loaded burgers,
              fresh wraps, crispy sides, and refreshing drinks.
            </p>
          </motion.div>

          {/* Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="text"
                placeholder="Search menu items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-red-500/30 focus:ring-1 focus:ring-red-500/20 transition-all"
              />
            </div>
          </div>

          {/* Category tabs */}
          <div className="flex items-center gap-2 mt-5 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setActiveCategory("all")}
              className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeCategory === "all"
                  ? "fire-gradient text-white shadow-lg shadow-red-500/20"
                  : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/5"
              }`}
            >
              All Items
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  activeCategory === cat.id
                    ? "fire-gradient text-white shadow-lg shadow-red-500/20"
                    : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/5"
                }`}
              >
                <span>{cat.icon}</span>
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Menu grid */}
      <section className="pb-16 sm:pb-24">
        <div className="container">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={String(activeCategory) + searchQuery}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                {filteredItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                      <SlidersHorizontal className="w-8 h-8 text-white/20" />
                    </div>
                    <p className="font-display font-bold text-white/60 text-lg">
                      No items found
                    </p>
                    <p className="text-sm text-white/30 mt-1">
                      Try a different search or category
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                    {filteredItems.map((item, i) => (
                      <MenuItemCard key={item.id} item={item} index={i} />
                    ))}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          )}

          {!loading && filteredItems.length > 0 && (
            <p className="text-center text-xs text-white/20 mt-8">
              Showing {filteredItems.length} of {menuItems.length} items
            </p>
          )}
        </div>
      </section>

      <Footer />
      <CartSidebar />
      <MobileCartButton />
    </div>
  );
}
