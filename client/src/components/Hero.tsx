/*
 * Pizza Home — Hero Section
 * Design: "Midnight Feast" — Immersive full-width hero with fire gradient CTA
 * Split layout: Left text + CTA, Center featured pizza, Right offer highlight
 */

import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, Truck } from "lucide-react";
import { HERO_IMAGE } from "@/lib/menuData";

export default function Hero() {
  return (
    <section className="relative min-h-[100vh] flex items-center overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0A0A0A] via-[#0F0F0F] to-[#0A0A0A]" />
      
      {/* Subtle radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-red-600/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-orange-500/5 rounded-full blur-[100px]" />

      <div className="container relative z-10 pt-24 pb-12">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-4 items-center">
          {/* Left: Text + CTA */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="flex flex-col gap-6"
          >
            {/* Free delivery badge */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-red-600/20 to-orange-500/20 border border-red-500/20 w-fit"
            >
              <Truck className="w-4 h-4 text-orange-400" />
              <span className="text-sm font-medium text-orange-400">
                Free Delivery Above Rs. 1000
              </span>
            </motion.div>

            <div className="flex flex-col gap-3">
              <h1 className="font-display font-bold text-4xl sm:text-5xl lg:text-6xl xl:text-7xl text-white leading-[1.1] tracking-tight">
                Welcome to{" "}
                <span className="fire-gradient-text">Pizza Home</span>
              </h1>
              <p className="text-lg sm:text-xl text-white/60 max-w-lg leading-relaxed">
                Taste that makes your heart smile. Fresh ingredients, bold
                flavors, delivered hot to your doorstep in Chakwal.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/menu"
                className="inline-flex items-center gap-2 px-8 py-4 fire-gradient rounded-xl text-white font-semibold text-base shadow-lg shadow-red-500/25 hover:shadow-red-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
              >
                Order Now
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a
                href="#deals"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white/5 border border-white/10 text-white font-semibold text-base hover:bg-white/10 hover:border-white/15 transition-all duration-200"
              >
                View Deals
              </a>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-8 mt-4">
              <div className="flex flex-col">
                <span className="font-display font-bold text-2xl text-white">30+</span>
                <span className="text-xs text-white/40">Menu Items</span>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <div className="flex flex-col">
                <span className="font-display font-bold text-2xl text-white">4.8</span>
                <span className="text-xs text-white/40">Customer Rating</span>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <div className="flex flex-col">
                <span className="font-display font-bold text-2xl text-white">35 min</span>
                <span className="text-xs text-white/40">Fast Delivery</span>
              </div>
            </div>
          </motion.div>

          {/* Right: Featured Pizza Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="relative flex items-center justify-center"
          >
            {/* Glow behind image */}
            <div className="absolute w-[80%] h-[80%] bg-gradient-to-br from-red-600/20 via-orange-500/10 to-transparent rounded-full blur-[60px]" />
            
            <img
              src={HERO_IMAGE}
              alt="Delicious pepperoni pizza from Pizza Home"
              className="relative w-full max-w-lg lg:max-w-xl rounded-2xl shadow-2xl shadow-black/40"
              loading="eager"
            />

            {/* Floating deal badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="absolute -bottom-4 -left-4 sm:bottom-4 sm:left-4 glass-card rounded-2xl p-4 shadow-xl"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 fire-gradient rounded-xl flex items-center justify-center text-xl">
                  🔥
                </div>
                <div>
                  <p className="text-xs text-white/50 font-medium">Today's Special</p>
                  <p className="font-display font-bold text-white">Dabang Deal</p>
                  <p className="text-sm font-bold text-orange-400">Rs. 1050</p>
                </div>
              </div>
            </motion.div>

            {/* Floating rating badge */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.5 }}
              className="absolute -top-2 -right-2 sm:top-4 sm:right-4 glass-card rounded-2xl px-4 py-3 shadow-xl"
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">⭐</span>
                <div>
                  <p className="font-display font-bold text-white text-sm">4.8/5</p>
                  <p className="text-[10px] text-white/40">100+ Reviews</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0A0A0A] to-transparent" />
    </section>
  );
}
