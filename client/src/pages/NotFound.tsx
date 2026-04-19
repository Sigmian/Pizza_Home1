/*
 * Pizza Home — 404 Page
 * Design: "Midnight Feast" — Dark themed 404 with fire accents
 */

import { Link } from "wouter";
import { Pizza, Home, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md"
      >
        <div className="w-20 h-20 fire-gradient rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-500/30">
          <Pizza className="w-10 h-10 text-white" />
        </div>

        <h1 className="font-display font-bold text-7xl fire-gradient-text mb-2">
          404
        </h1>

        <h2 className="font-display font-bold text-xl text-white mb-3">
          Page Not Found
        </h2>

        <p className="text-sm text-white/40 mb-8 leading-relaxed">
          Oops! Looks like this page got lost on the way to delivery.
          <br />
          Let's get you back to something delicious.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 fire-gradient rounded-xl text-white font-semibold text-sm shadow-lg shadow-red-500/25 hover:shadow-red-500/40 transition-all"
          >
            <Home className="w-4 h-4" />
            Go Home
          </Link>
          <Link
            href="/menu"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-semibold text-sm hover:bg-white/10 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Browse Menu
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
