/*
 * Pizza Home — POS (Point of Sale)
 * Walk-in order creation with menu grid, cart, and quick checkout
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  Printer,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  X,
  Pizza,
} from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import PinGate from "@/components/PinGate";

interface SizeVariant {
  size: string;
  price: number;
}

interface MenuItem {
  id: number;
  categoryId: number;
  name: string;
  price: string | null;
  sizeVariants: SizeVariant[] | null;
  image: string | null;
  isActive: boolean;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
}

interface Deal {
  id: number;
  name: string;
  price: string;
  image: string | null;
  isActive: boolean;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  size?: string;
  menuItemId?: number;
  dealId?: number;
}

function POSInner() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [discount, setDiscount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [lastOrder, setLastOrder] = useState<string | null>(null);
  const [lastOrderData, setLastOrderData] = useState<{
    orderNumber: string;
    items: typeof cart;
    subtotal: number;
    discount: number;
    total: number;
    customerName: string;
    date: string;
  } | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [itemsRes, catsRes, dealsRes] = await Promise.all([
        fetch("/api/menu/items"),
        fetch("/api/menu/categories"),
        fetch("/api/menu/deals"),
      ]);
      const items = await itemsRes.json();
      const parsedItems = items.map((item: any) => ({
        ...item,
        sizeVariants: typeof item.sizeVariants === "string" ? JSON.parse(item.sizeVariants) : item.sizeVariants,
      }));
      setMenuItems(parsedItems.filter((i: MenuItem) => i.isActive));
      setCategories(await catsRes.json());
      const d = await dealsRes.json();
      const parsedDeals = d.map((deal: any) => ({
        ...deal,
        items: typeof deal.items === "string" ? JSON.parse(deal.items) : deal.items,
      }));
      setDeals(parsedDeals.filter((d: Deal) => d.isActive));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const addToCart = (item: MenuItem, size?: string, price?: number) => {
    const cartId = size ? `item-${item.id}-${size}` : `item-${item.id}`;
    setCart((prev) => {
      const existing = prev.find((c) => c.id === cartId);
      if (existing) {
        return prev.map((c) =>
          c.id === cartId ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      const p = price || Number(item.price) || 0;
      return [
        ...prev,
        { id: cartId, name: size ? `${item.name} (${size})` : item.name, price: p, quantity: 1, size, menuItemId: item.id },
      ];
    });
  };

  const addDealToCart = (deal: Deal) => {
    const cartId = `deal-${deal.id}`;
    setCart((prev) => {
      const existing = prev.find((c) => c.id === cartId);
      if (existing) {
        return prev.map((c) =>
          c.id === cartId ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [
        ...prev,
        { id: cartId, name: deal.name, price: Number(deal.price), quantity: 1, dealId: deal.id },
      ];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => (c.id === id ? { ...c, quantity: c.quantity + delta } : c))
        .filter((c) => c.quantity > 0)
    );
  };

  const removeItem = (id: string) => setCart((prev) => prev.filter((c) => c.id !== id));

  const subtotal = useMemo(() => cart.reduce((s, c) => s + c.price * c.quantity, 0), [cart]);
  const total = subtotal - discount;

  const placeOrder = async () => {
    if (cart.length === 0) return toast.error("Cart is empty");
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: customerName || "Walk-in Customer",
          customerPhone: customerPhone || "N/A",
          customerAddress: null,
          orderType: "walkin",
          paymentMethod: "cash",
          notes: null,
          items: cart.map((c) => ({
            menuItemId: c.menuItemId || null,
            dealId: c.dealId || null,
            name: c.name,
            size: c.size || null,
            price: c.price,
            quantity: c.quantity,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setLastOrder(data.order.orderNumber);
      setLastOrderData({
        orderNumber: data.order.orderNumber,
        items: [...cart],
        subtotal,
        discount,
        total,
        customerName: customerName || "Walk-in Customer",
        date: new Date().toLocaleString(),
      });
      setShowReceipt(true);
      setCart([]);
      setCustomerName("");
      setCustomerPhone("");
      setDiscount(0);
      toast.success(`Order #${data.order.orderNumber} placed!`);
    } catch (err: any) {
      toast.error(err.message || "Failed to place order");
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = menuItems.filter((item) => {
    if (activeCategory !== "all" && activeCategory !== "deals" && item.categoryId !== Number(activeCategory))
      return false;
    if (search) return item.name.toLowerCase().includes(search.toLowerCase());
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col lg:flex-row">
      {/* Left: Menu grid */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* POS Header */}
        <header className="bg-[#0F0F0F] border-b border-white/5 px-4 py-3 flex items-center gap-4">
          <Link href="/admin" className="p-2 rounded-lg bg-white/5 hover:bg-white/10">
            <ArrowLeft className="w-4 h-4 text-white/60" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 fire-gradient rounded-lg flex items-center justify-center">
              <Pizza className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="font-display font-bold text-white text-sm">POS</h1>
              <p className="text-[10px] text-white/30">Walk-in Orders</p>
            </div>
          </div>
          <div className="relative flex-1 max-w-sm ml-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search items..."
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/5 border border-white/5 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-red-500/30"
            />
          </div>
        </header>

        {/* Category tabs */}
        <div className="px-4 py-3 flex gap-2 overflow-x-auto border-b border-white/5 scrollbar-hide">
          <button
            onClick={() => setActiveCategory("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              activeCategory === "all" ? "fire-gradient text-white" : "bg-white/5 text-white/40 hover:text-white"
            }`}
          >
            All Items
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(String(cat.id))}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                activeCategory === String(cat.id) ? "fire-gradient text-white" : "bg-white/5 text-white/40 hover:text-white"
              }`}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
          <button
            onClick={() => setActiveCategory("deals")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              activeCategory === "deals" ? "fire-gradient text-white" : "bg-white/5 text-white/40 hover:text-white"
            }`}
          >
            🔥 Deals
          </button>
        </div>

        {/* Items grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeCategory === "deals" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {deals.map((deal) => (
                <button
                  key={deal.id}
                  onClick={() => addDealToCart(deal)}
                  className="rounded-xl bg-white/[0.03] border border-white/5 hover:border-red-500/20 overflow-hidden text-left transition-all active:scale-95"
                >
                  {deal.image && (
                    <img src={deal.image} alt={deal.name} className="w-full h-24 object-cover" />
                  )}
                  <div className="p-3">
                    <p className="text-xs font-medium text-white truncate">{deal.name}</p>
                    <p className="text-xs font-bold text-orange-400 mt-1">
                      Rs. {Number(deal.price).toLocaleString()}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filtered.map((item) => {
                const sizes: SizeVariant[] = Array.isArray(item.sizeVariants) ? item.sizeVariants : [];

                return (
                  <div
                    key={item.id}
                    className="rounded-xl bg-white/[0.03] border border-white/5 hover:border-red-500/20 overflow-hidden transition-all"
                  >
                    {item.image && (
                      <img src={item.image} alt={item.name} className="w-full h-24 object-cover" />
                    )}
                    <div className="p-3">
                      <p className="text-xs font-medium text-white truncate">{item.name}</p>
                      {sizes.length > 0 ? (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {sizes.map((s) => (
                            <button
                              key={s.size}
                              onClick={() => addToCart(item, s.size, s.price)}
                              className="px-2 py-1 rounded-md bg-white/5 hover:bg-red-500/10 text-[10px] text-white/60 hover:text-white transition-all"
                            >
                              {s.size} · Rs.{s.price}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <button
                          onClick={() => addToCart(item)}
                          className="mt-2 w-full py-1.5 rounded-lg bg-white/5 hover:bg-red-500/10 text-xs text-white/60 hover:text-white transition-all"
                        >
                          Rs. {Number(item.price).toLocaleString()} · Add
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right: Cart */}
      <div className="w-full lg:w-96 bg-[#0F0F0F] border-l border-white/5 flex flex-col">
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-bold text-white flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-red-500" />
              Current Order
            </h2>
            {cart.length > 0 && (
              <button onClick={() => setCart([])} className="text-xs text-red-400 hover:text-red-300">
                Clear
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Customer name"
              className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/5 text-white text-xs placeholder:text-white/25"
            />
            <input
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="Phone"
              className="w-28 px-3 py-2 rounded-lg bg-white/5 border border-white/5 text-white text-xs placeholder:text-white/25"
            />
          </div>
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto p-4">
          {cart.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-10 h-10 text-white/10 mx-auto mb-2" />
              <p className="text-sm text-white/30">No items in cart</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white truncate">{item.name}</p>
                    <p className="text-xs text-orange-400 font-bold">
                      Rs. {(item.price * item.quantity).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => updateQty(item.id, -1)}
                      className="w-6 h-6 rounded-md bg-white/5 hover:bg-white/10 flex items-center justify-center"
                    >
                      <Minus className="w-3 h-3 text-white/60" />
                    </button>
                    <span className="text-xs font-bold text-white w-5 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQty(item.id, 1)}
                      className="w-6 h-6 rounded-md bg-white/5 hover:bg-white/10 flex items-center justify-center"
                    >
                      <Plus className="w-3 h-3 text-white/60" />
                    </button>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="w-6 h-6 rounded-md hover:bg-red-500/10 flex items-center justify-center ml-1"
                    >
                      <Trash2 className="w-3 h-3 text-white/30 hover:text-red-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Totals & checkout */}
        {cart.length > 0 && (
          <div className="p-4 border-t border-white/5">
            <div className="flex items-center gap-2 mb-3">
              <label className="text-xs text-white/40">Discount:</label>
              <input
                type="number"
                value={discount || ""}
                onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                placeholder="0"
                className="w-24 px-2 py-1.5 rounded-lg bg-white/5 border border-white/5 text-white text-xs"
              />
            </div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-white/40">Subtotal</span>
              <span className="text-white">Rs. {subtotal.toLocaleString()}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm mb-1">
                <span className="text-white/40">Discount</span>
                <span className="text-green-400">- Rs. {discount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between items-center mb-4 pt-2 border-t border-white/5">
              <span className="font-display font-bold text-white">Total</span>
              <span className="font-display font-bold text-xl text-white">
                Rs. {total.toLocaleString()}
              </span>
            </div>
            <button
              onClick={placeOrder}
              disabled={submitting}
              className="w-full py-3 fire-gradient rounded-xl text-white font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Place Order
                </>
              )}
            </button>
          </div>
        )}

        {/* Last order confirmation */}
        {lastOrder && (
          <div className="p-4 border-t border-white/5 bg-green-500/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-green-400 text-sm">
                <CheckCircle2 className="w-4 h-4" />
                Last order: <span className="font-bold">#{lastOrder}</span>
              </div>
              <button
                onClick={() => setShowReceipt(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-xs transition-all"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Receipt
              </button>
            </div>
          </div>
        )}

        {/* Receipt Modal */}
        {showReceipt && lastOrderData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setShowReceipt(false)}>
            <div className="bg-white text-black w-full max-w-sm rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()}>
              {/* Receipt content */}
              <div id="receipt-content" className="p-6">
                <div className="text-center mb-4">
                  <h2 className="text-xl font-bold">Pizza Home</h2>
                  <p className="text-xs text-gray-500">Chakwal, Pakistan</p>
                  <p className="text-xs text-gray-500">Tel: 0300-1234567</p>
                  <div className="border-b border-dashed border-gray-300 my-3" />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mb-2">
                  <span>Order: #{lastOrderData.orderNumber}</span>
                  <span>{lastOrderData.date}</span>
                </div>
                <div className="text-xs text-gray-500 mb-3">
                  Customer: {lastOrderData.customerName}
                </div>
                <div className="border-b border-dashed border-gray-300 mb-3" />
                {lastOrderData.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm mb-1">
                    <span>
                      {item.quantity}x {item.name}
                      {item.size ? ` (${item.size})` : ""}
                    </span>
                    <span>Rs. {(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
                <div className="border-b border-dashed border-gray-300 my-3" />
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>Rs. {lastOrderData.subtotal.toLocaleString()}</span>
                </div>
                {lastOrderData.discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>- Rs. {lastOrderData.discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold mt-2 pt-2 border-t border-dashed border-gray-300">
                  <span>TOTAL</span>
                  <span>Rs. {lastOrderData.total.toLocaleString()}</span>
                </div>
                <div className="text-center mt-4">
                  <p className="text-xs text-gray-400">Thank you for your order!</p>
                  <p className="text-xs text-gray-400">www.pizzahome.pk</p>
                </div>
              </div>
              {/* Print buttons */}
              <div className="flex gap-2 p-4 border-t border-gray-200">
                <button
                  onClick={() => setShowReceipt(false)}
                  className="flex-1 py-2 rounded-lg border border-gray-300 text-gray-600 text-sm hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    const content = document.getElementById("receipt-content");
                    if (!content) return;
                    const printWindow = window.open("", "_blank", "width=400,height=600");
                    if (!printWindow) return;
                    printWindow.document.write(`
                      <html><head><title>Receipt #${lastOrderData.orderNumber}</title>
                      <style>
                        body { font-family: monospace; padding: 20px; max-width: 300px; margin: 0 auto; }
                        * { box-sizing: border-box; }
                      </style></head><body>${content.innerHTML}</body></html>
                    `);
                    printWindow.document.close();
                    printWindow.print();
                  }}
                  className="flex-1 py-2 rounded-lg bg-black text-white text-sm hover:bg-gray-800 flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Print
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function POS() {
  return (
    <PinGate
      role="pos"
      title="Point of Sale"
      subtitle="Enter admin PIN to access POS"
      icon={<Pizza className="w-8 h-8 text-white" />}
    >
      <POSInner />
    </PinGate>
  );
}
