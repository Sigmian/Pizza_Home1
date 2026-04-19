/*
 * Pizza Home — Admin Deals Management
 * CRUD for deals with items, pricing, toggle active
 */

import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, Loader2, X, ToggleLeft, ToggleRight, Star } from "lucide-react";
import { toast } from "sonner";
import ImageUpload from "@/components/ImageUpload";

interface Deal {
  id: number;
  name: string;
  description: string | null;
  items: string | null;
  price: string;
  originalPrice: string | null;
  image: string | null;
  isFeatured: boolean;
  isActive: boolean;
  sortOrder: number;
}

export default function AdminDeals() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Deal | null>(null);
  const [showForm, setShowForm] = useState(false);

  const fetchDeals = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/deals");
      setDeals(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  const toggleActive = async (deal: Deal) => {
    try {
      await fetch(`/api/admin/deals/${deal.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !deal.isActive }),
      });
      toast.success(`${deal.name} ${deal.isActive ? "deactivated" : "activated"}`);
      fetchDeals();
    } catch {
      toast.error("Failed to toggle deal");
    }
  };

  const deleteDeal = async (deal: Deal) => {
    if (!confirm(`Deactivate "${deal.name}"?`)) return;
    try {
      await fetch(`/api/admin/deals/${deal.id}`, { method: "DELETE" });
      toast.success("Deal deactivated");
      fetchDeals();
    } catch {
      toast.error("Failed to delete deal");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-white/40">{deals.length} deals</p>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="px-4 py-2.5 fire-gradient rounded-xl text-white text-sm font-medium flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Deal
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {deals.map((deal) => {
          let itemsList: string[] = [];
          try {
            const parsed = JSON.parse(deal.items || "[]");
            itemsList = Array.isArray(parsed) ? parsed : [];
          } catch {}

          return (
            <div
              key={deal.id}
              className={`rounded-2xl bg-white/[0.03] border overflow-hidden transition-all ${
                deal.isActive ? "border-white/5" : "border-red-500/10 opacity-60"
              }`}
            >
              {deal.image && (
                <img src={deal.image} alt={deal.name} className="w-full h-36 object-cover" />
              )}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-display font-bold text-white text-sm">{deal.name}</h3>
                      {deal.isFeatured && <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />}
                    </div>
                    {deal.description && (
                      <p className="text-xs text-white/40 mt-1 line-clamp-2">{deal.description}</p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-sm font-bold text-orange-400">
                      Rs. {Number(deal.price).toLocaleString()}
                    </span>
                    {deal.originalPrice && (
                      <p className="text-xs text-white/30 line-through">
                        Rs. {Number(deal.originalPrice).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
                {itemsList.length > 0 && (
                  <div className="text-xs text-white/30 mb-3">
                    {itemsList.join(" • ")}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleActive(deal)} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10">
                    {deal.isActive ? <ToggleRight className="w-4 h-4 text-green-400" /> : <ToggleLeft className="w-4 h-4 text-white/30" />}
                  </button>
                  <button onClick={() => { setEditing(deal); setShowForm(true); }} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10">
                    <Pencil className="w-4 h-4 text-white/40" />
                  </button>
                  <button onClick={() => deleteDeal(deal)} className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/10">
                    <Trash2 className="w-4 h-4 text-white/40" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showForm && (
        <DealForm
          deal={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={() => { setShowForm(false); setEditing(null); fetchDeals(); }}
        />
      )}
    </div>
  );
}

function DealForm({
  deal,
  onClose,
  onSaved,
}: {
  deal: Deal | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  let initialItems: string[] = [];
  try {
    initialItems = JSON.parse(deal?.items || "[]");
  } catch {}

  const [form, setForm] = useState({
    name: deal?.name || "",
    description: deal?.description || "",
    price: deal?.price || "",
    originalPrice: deal?.originalPrice || "",
    image: deal?.image || "",
    isFeatured: deal?.isFeatured ?? false,
    isActive: deal?.isActive ?? true,
    sortOrder: deal?.sortOrder || 0,
    items: initialItems.length > 0 ? initialItems : [""],
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {
        name: form.name,
        description: form.description || null,
        price: form.price,
        originalPrice: form.originalPrice || null,
        image: form.image || null,
        isFeatured: form.isFeatured,
        isActive: form.isActive,
        sortOrder: Number(form.sortOrder),
        items: form.items.filter((i) => i.trim()),
      };

      const url = deal ? `/api/admin/deals/${deal.id}` : "/api/admin/deals";
      const method = deal ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success(deal ? "Deal updated" : "Deal created");
      onSaved();
    } catch {
      toast.error("Failed to save deal");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#0F0F0F] border border-white/10 rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <h3 className="font-display font-bold text-white">{deal ? "Edit Deal" : "Add New Deal"}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10">
            <X className="w-4 h-4 text-white/60" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <div>
            <label className="text-xs text-white/40 mb-1 block">Name *</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/5 text-white text-sm" required />
          </div>
          <div>
            <label className="text-xs text-white/40 mb-1 block">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/5 text-white text-sm resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-white/40 mb-1 block">Price (Rs.) *</label>
              <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/5 text-white text-sm" required />
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1 block">Original Price</label>
              <input type="number" value={form.originalPrice} onChange={(e) => setForm({ ...form, originalPrice: e.target.value })} className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/5 text-white text-sm" />
            </div>
          </div>
          <div>
            <label className="text-xs text-white/40 mb-1 block">Deal Items</label>
            {form.items.map((item, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input
                  value={item}
                  onChange={(e) => {
                    const arr = [...form.items];
                    arr[i] = e.target.value;
                    setForm({ ...form, items: arr });
                  }}
                  placeholder={`Item ${i + 1}`}
                  className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/5 text-white text-sm"
                />
                {form.items.length > 1 && (
                  <button type="button" onClick={() => setForm({ ...form, items: form.items.filter((_, j) => j !== i) })} className="p-2 rounded-lg bg-red-500/10">
                    <X className="w-3 h-3 text-red-400" />
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={() => setForm({ ...form, items: [...form.items, ""] })} className="text-xs text-red-400 hover:text-red-300">+ Add Item</button>
          </div>
          <div>
            <label className="text-xs text-white/40 mb-1 block">Image</label>
            <ImageUpload
              value={form.image}
              onChange={(url) => setForm({ ...form, image: url })}
            />
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-white/60 cursor-pointer">
              <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} className="rounded" />
              Featured
            </label>
          </div>
          <button type="submit" disabled={saving} className="w-full py-3 fire-gradient rounded-xl text-white font-semibold text-sm disabled:opacity-50">
            {saving ? "Saving..." : deal ? "Update Deal" : "Create Deal"}
          </button>
        </form>
      </div>
    </div>
  );
}
