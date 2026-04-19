/*
 * Pizza Home — Home Page
 * Design: "Midnight Feast" — Bold Dark Premium with Fire Accents
 * Sections: Hero → Hot Deals → Explore Menu → Footer
 */

import Header from "@/components/Header";
import Hero from "@/components/Hero";
import HotDeals from "@/components/HotDeals";
import ExploreMenu from "@/components/ExploreMenu";
import Footer from "@/components/Footer";
import CartSidebar from "@/components/CartSidebar";
import MobileCartButton from "@/components/MobileCartButton";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <Header />
      <Hero />
      <HotDeals />
      <ExploreMenu />
      <Footer />
      <CartSidebar />
      <MobileCartButton />
    </div>
  );
}
