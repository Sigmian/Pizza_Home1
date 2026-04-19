/*
 * Pizza Home — Admin Panel
 * Main layout with sidebar navigation
 * Routes: Dashboard, Orders, Menu, Deals, Riders, Settings
 */

import { useState } from "react";
import { Link, useLocation, Route, Switch } from "wouter";
import {
  LayoutDashboard,
  ShoppingCart,
  UtensilsCrossed,
  Tag,
  Users,
  Settings,
  Menu as MenuIcon,
  X,
  Pizza,
  LogOut,
  ChevronRight,
  Shield,
  ArrowLeft,
} from "lucide-react";
import AdminDashboard from "./AdminDashboard";
import AdminOrders from "./AdminOrders";
import AdminMenu from "./AdminMenu";
import AdminDeals from "./AdminDeals";
import AdminRiders from "./AdminRiders";
import PinGate, { usePinLogout } from "@/components/PinGate";

const navItems = [
  { path: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { path: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { path: "/admin/menu", label: "Menu Items", icon: UtensilsCrossed },
  { path: "/admin/deals", label: "Deals", icon: Tag },
  { path: "/admin/riders", label: "Riders", icon: Users },
];

function AdminPanelInner() {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const handleLogout = usePinLogout("admin");

  const isActive = (path: string, exact?: boolean) => {
    if (exact) return location === path;
    return location.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-[#0F0F0F] border-r border-white/5 z-50 flex flex-col transition-transform lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="p-5 border-b border-white/5 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-3">
            <div className="w-10 h-10 fire-gradient rounded-xl flex items-center justify-center">
              <Pizza className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-display font-bold text-white text-sm">
                Pizza Home
              </h1>
              <p className="text-[10px] text-white/30 uppercase tracking-wider">
                Admin Panel
              </p>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg bg-white/5 hover:bg-white/10"
          >
            <X className="w-4 h-4 text-white/60" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 overflow-y-auto">
          <div className="flex flex-col gap-1">
            {navItems.map((item) => {
              const active = isActive(item.path, item.exact);
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    active
                      ? "bg-red-500/10 text-red-400 border border-red-500/20"
                      : "text-white/50 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <item.icon className="w-4.5 h-4.5 flex-shrink-0" />
                  {item.label}
                  {active && (
                    <ChevronRight className="w-4 h-4 ml-auto text-red-400/50" />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-white/5 flex flex-col gap-1">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400/60 hover:text-red-400 hover:bg-red-500/5 transition-all w-full"
          >
            <LogOut className="w-4.5 h-4.5" />
            Logout
          </button>
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/40 hover:text-white hover:bg-white/5 transition-all"
          >
            <ArrowLeft className="w-4.5 h-4.5" />
            Back to Website
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-white/5 px-4 lg:px-6 py-3 flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-xl bg-white/5 hover:bg-white/10"
          >
            <MenuIcon className="w-5 h-5 text-white/60" />
          </button>
          <div className="flex-1">
            <h2 className="font-display font-bold text-white text-lg">
              {navItems.find((n) =>
                n.exact ? location === n.path : location.startsWith(n.path)
              )?.label || "Admin"}
            </h2>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6">
          <Switch>
            <Route path="/admin" component={AdminDashboard} />
            <Route path="/admin/orders" component={AdminOrders} />
            <Route path="/admin/menu" component={AdminMenu} />
            <Route path="/admin/deals" component={AdminDeals} />
            <Route path="/admin/riders" component={AdminRiders} />
          </Switch>
        </main>
      </div>
    </div>
  );
}

export default function AdminPanel() {
  return (
    <PinGate
      role="admin"
      title="Admin Panel"
      subtitle="Enter admin PIN to access"
      icon={<Shield className="w-8 h-8 text-white" />}
    >
      <AdminPanelInner />
    </PinGate>
  );
}
