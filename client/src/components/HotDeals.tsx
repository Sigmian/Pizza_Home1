/*
 * Pizza Home — Hot Deals Slider
 * Design: "Midnight Feast" — Auto-sliding carousel with fire gradient featured card
 * Uses Embla Carousel for touch/swipe support — API-driven
 */

import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, ShoppingCart, Flame, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useDeals, type ApiDeal } from "@/hooks/useMenu";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";

function DealCard({ deal }: { deal: ApiDeal }) {
  const { addItem } = useCart();

  const handleAddToCart = () => {
    addItem({
      id: `deal-${deal.id}`,
      dealId: deal.id,
      name: deal.name,
      price: Number(deal.price),
      image: deal.image || "",
    });
    toast.success(`${deal.name} added to cart!`);
  };

  const price = Number(deal.price);
  const originalPrice = deal.originalPrice ? Number(deal.originalPrice) : 0;
  const discount = originalPrice > 0
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;
  const dealItems = Array.isArray(deal.items) ? deal.items : [];

  return (
    <div
      className={`relative flex-[0_0_85%] sm:flex-[0_0_45%] lg:flex-[0_0_32%] min-w-0 mx-2 rounded-2xl overflow-hidden transition-all duration-300 group ${
        deal.isFeatured
          ? "border-2 border-red-500/40 shadow-lg shadow-red-500/10"
          : "border border-white/5 hover:border-white/10"
      }`}
      style={{ background: deal.isFeatured ? "linear-gradient(135deg, rgba(220,38,38,0.08), rgba(234,88,12,0.05))" : "rgba(255,255,255,0.03)" }}
    >
      {/* Badge */}
      {deal.badge && (
        <div className={`absolute top-3 left-3 z-10 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
          deal.isFeatured
            ? "fire-gradient text-white shadow-lg shadow-red-500/30"
            : "bg-white/10 text-white/80 backdrop-blur-sm"
        }`}>
          {deal.isFeatured && <Flame className="w-3 h-3 inline mr-1" />}
          {deal.badge}
        </div>
      )}

      {/* Discount badge */}
      {discount > 0 && (
        <div className="absolute top-3 right-3 z-10 px-2.5 py-1 rounded-full bg-green-500/20 text-green-400 text-[10px] font-bold">
          -{discount}%
        </div>
      )}

      {/* Image */}
      <div className="relative h-44 sm:h-48 overflow-hidden">
        <img
          src={deal.image || ""}
          alt={deal.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-3">
        <div>
          <h3 className="font-display font-bold text-lg text-white group-hover:text-orange-400 transition-colors">
            {deal.name}
          </h3>
          <p className="text-sm text-white/50 mt-1 line-clamp-2">
            {deal.description}
          </p>
        </div>

        {/* Deal items list */}
        {dealItems.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {dealItems.map((item, i) => (
              <span
                key={i}
                className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/60 border border-white/5"
              >
                {item}
              </span>
            ))}
          </div>
        )}

        {/* Price + CTA */}
        <div className="flex items-center justify-between mt-auto pt-2">
          <div className="flex items-baseline gap-2">
            <span className="font-display font-bold text-xl text-white">
              Rs. {price.toLocaleString()}
            </span>
            {originalPrice > 0 && (
              <span className="text-sm text-white/30 line-through">
                Rs. {originalPrice.toLocaleString()}
              </span>
            )}
          </div>
          <button
            onClick={handleAddToCart}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-95 ${
              deal.isFeatured
                ? "fire-gradient text-white shadow-lg shadow-red-500/20 hover:shadow-red-500/40"
                : "bg-white/10 text-white hover:bg-white/15 border border-white/5"
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

export default function HotDeals() {
  const { deals, loading } = useDeals();
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "start",
    skipSnaps: false,
  });
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(true);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
  }, [emblaApi, onSelect]);

  // Auto-scroll
  useEffect(() => {
    if (!emblaApi) return;
    const interval = setInterval(() => {
      emblaApi.scrollNext();
    }, 4000);
    return () => clearInterval(interval);
  }, [emblaApi]);

  return (
    <section id="deals" className="relative py-16 sm:py-24 overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-red-500/20 to-transparent" />

      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex items-end justify-between mb-8"
        >
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-5 h-5 text-red-500" />
              <span className="text-sm font-semibold text-red-500 uppercase tracking-wider">
                Hot Deals
              </span>
            </div>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-white">
              Today's Best{" "}
              <span className="fire-gradient-text">Offers</span>
            </h2>
            <p className="text-white/40 mt-2 max-w-md">
              Grab these limited-time deals before they're gone. Save big on your favorites!
            </p>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={scrollPrev}
              disabled={!canScrollPrev}
              className="p-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all disabled:opacity-30"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={scrollNext}
              disabled={!canScrollNext}
              className="p-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all disabled:opacity-30"
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
          </div>
        </motion.div>
      </div>

      <div className="container">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
          </div>
        ) : (
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex -ml-2">
              {deals.map((deal) => (
                <DealCard key={deal.id} deal={deal} />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex sm:hidden items-center justify-center gap-3 mt-6">
        <button
          onClick={scrollPrev}
          className="p-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <button
          onClick={scrollNext}
          className="p-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all"
        >
          <ChevronRight className="w-5 h-5 text-white" />
        </button>
      </div>
    </section>
  );
}
