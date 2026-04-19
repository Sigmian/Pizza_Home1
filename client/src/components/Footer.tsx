/*
 * Pizza Home — Footer
 * Design: "Midnight Feast" — Dark layered footer with fire gradient accents
 */

import { Link } from "wouter";
import { Pizza, Phone, MapPin, Clock, Facebook, Instagram, MessageCircle } from "lucide-react";

export default function Footer() {
  return (
    <footer id="contact" className="relative border-t border-white/5">
      {/* Top gradient line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500/30 to-transparent" />

      <div className="bg-[#080808]">
        <div className="container py-12 sm:py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
            {/* Brand */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl fire-gradient flex items-center justify-center">
                  <Pizza className="w-6 h-6 text-white" />
                </div>
                <div>
                  <span className="font-display font-bold text-lg text-white">
                    Pizza Home
                  </span>
                  <p className="text-[10px] text-white/40 uppercase tracking-wider">
                    Chakwal, Pakistan
                  </p>
                </div>
              </div>
              <p className="text-sm text-white/40 leading-relaxed">
                Taste that makes your heart smile. Premium fast food delivered
                fresh to your doorstep. Serving Chakwal with love since day one.
              </p>
              {/* Social links */}
              <div className="flex items-center gap-2 mt-2">
                <a
                  href="#"
                  onClick={(e) => { e.preventDefault(); }}
                  className="w-9 h-9 rounded-lg bg-white/5 hover:bg-blue-600/20 border border-white/5 hover:border-blue-500/30 flex items-center justify-center transition-all"
                >
                  <Facebook className="w-4 h-4 text-white/60 hover:text-blue-400" />
                </a>
                <a
                  href="#"
                  onClick={(e) => { e.preventDefault(); }}
                  className="w-9 h-9 rounded-lg bg-white/5 hover:bg-pink-600/20 border border-white/5 hover:border-pink-500/30 flex items-center justify-center transition-all"
                >
                  <Instagram className="w-4 h-4 text-white/60 hover:text-pink-400" />
                </a>
                <a
                  href="#"
                  onClick={(e) => { e.preventDefault(); }}
                  className="w-9 h-9 rounded-lg bg-white/5 hover:bg-green-600/20 border border-white/5 hover:border-green-500/30 flex items-center justify-center transition-all"
                >
                  <MessageCircle className="w-4 h-4 text-white/60 hover:text-green-400" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-display font-bold text-sm text-white mb-4 uppercase tracking-wider">
                Quick Links
              </h3>
              <ul className="flex flex-col gap-2.5">
                {[
                  { href: "/", label: "Home" },
                  { href: "/menu", label: "Full Menu" },
                  { href: "/#deals", label: "Hot Deals" },
                  { href: "/checkout", label: "Checkout" },
                ].map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/40 hover:text-orange-400 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h3 className="font-display font-bold text-sm text-white mb-4 uppercase tracking-wider">
                Contact Us
              </h3>
              <ul className="flex flex-col gap-3">
                <li className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-white/40">
                    Main Talagang Road, Chakwal, Punjab, Pakistan
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <span className="text-sm text-white/40">
                    0333-1234567
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-white/40">
                    <p>Mon - Sun: 11:00 AM - 11:00 PM</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Free Delivery CTA */}
            <div>
              <h3 className="font-display font-bold text-sm text-white mb-4 uppercase tracking-wider">
                Free Delivery
              </h3>
              <div className="p-4 rounded-xl bg-gradient-to-br from-red-600/10 to-orange-500/10 border border-red-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🛵</span>
                  <span className="font-display font-bold text-white">
                    FREE Delivery
                  </span>
                </div>
                <p className="text-sm text-white/50 mb-3">
                  On all orders above Rs. 1,000. Order now and save on delivery!
                </p>
                <Link
                  href="/menu"
                  className="inline-flex items-center gap-1.5 px-4 py-2 fire-gradient rounded-lg text-white text-sm font-semibold shadow-lg shadow-red-500/20 hover:shadow-red-500/30 transition-all"
                >
                  Order Now
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/5">
          <div className="container py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-white/30">
              &copy; {new Date().getFullYear()} Pizza Home Chakwal. All rights reserved.
            </p>
            <p className="text-xs text-white/20">
              Made with ❤️ for food lovers
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
