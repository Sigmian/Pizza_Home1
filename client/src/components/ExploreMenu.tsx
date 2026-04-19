/*
 * Pizza Home — Explore Menu Section
 * Design: "Midnight Feast" — Category cards CTA to open full menu page
 * API-driven categories
 */

import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, UtensilsCrossed, Loader2 } from "lucide-react";
import { useCategories } from "@/hooks/useMenu";
import { HERO_IMAGE, BURGER_IMAGE, WRAPS_IMAGE, SIDES_IMAGE } from "@/lib/menuData";

const categoryImages: Record<string, string> = {
  pizza: HERO_IMAGE,
  burgers: BURGER_IMAGE,
  wraps: WRAPS_IMAGE,
  sides: SIDES_IMAGE,
  drinks: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=300&h=300&fit=crop",
};

export default function ExploreMenu() {
  const { categories, loading } = useCategories();

  return (
    <section className="relative py-16 sm:py-24">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <UtensilsCrossed className="w-5 h-5 text-orange-400" />
            <span className="text-sm font-semibold text-orange-400 uppercase tracking-wider">
              Our Menu
            </span>
          </div>
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-white">
            Explore Our{" "}
            <span className="fire-gradient-text">Delicious Menu</span>
          </h2>
          <p className="text-white/40 mt-2 max-w-md mx-auto">
            From hand-tossed pizzas to loaded burgers — we've got something for every craving.
          </p>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
          </div>
        ) : (
          <>
            {/* Category cards grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-8">
              {categories.map((cat, i) => (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                >
                  <Link
                    href="/menu"
                    className="group relative block rounded-2xl overflow-hidden aspect-square border border-white/5 hover:border-red-500/30 transition-all duration-300"
                  >
                    <img
                      src={categoryImages[cat.slug] || categoryImages.pizza}
                      alt={cat.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent group-hover:from-red-900/60 transition-all duration-300" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <span className="text-2xl mb-1 block">{cat.icon}</span>
                      <h3 className="font-display font-bold text-white text-base">
                        {cat.name}
                      </h3>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Explore full menu CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex justify-center"
            >
              <Link
                href="/menu"
                className="inline-flex items-center gap-2 px-8 py-4 fire-gradient rounded-xl text-white font-semibold text-base shadow-lg shadow-red-500/25 hover:shadow-red-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
              >
                Explore Full Menu
                <ArrowRight className="w-5 h-5" />
              </Link>
            </motion.div>
          </>
        )}
      </div>
    </section>
  );
}
