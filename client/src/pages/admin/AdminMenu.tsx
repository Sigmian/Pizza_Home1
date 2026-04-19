/*
 * Pizza Home — Admin Menu Management
 * CRUD for menu items with category filter, toggle active, edit modal
 */

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Loader2,
  X,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { toast } from "sonner";
import ImageUpload from "@/components/ImageUpload";

interface MenuItem {
  id: number;
  categoryId: number;
  name: string;
  description: string | null;
  price: string | null;
  sizeVariants: string | null;
  image: string | null;
  isActive: boolean;
  sortOrder: number;
}

interface Category {
  id: number;
  name: string;
  slug: string;
}

export default function AdminMenu() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [showForm, setShowForm] = useState(false);

  const fetchItems = useCallback(async () => {
    try {
      const [itemsRes, catsRes] = await Promise.all([
        fetch("/api/admin/menu-items"),
        fetch("/api/menu/categories"),
      ]);
      setItems(await itemsRes.json());
      setCategories(await catsRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const toggleActive = async (item: MenuItem) => {
    try {
      await fetch(`/api/admin/menu-items/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !item.isActive }),
      });
      toast.success(`${item.name} ${item.isActive ? "deactivated" : "activated"}`);
      fetchItems();
    } catch {
      toast.error("Failed to toggle item");
    }
  };

  const deleteItem = async (item: MenuItem) => {
    if (!confirm(`Deactivate "${item.name}"?`)) return;
    try {
      await fetch(`/api/admin/menu-items/${item.id}`, { method: "DELETE" });
      toast.success("Item deactivated");
      fetchItems();
    } catch {
      toast.error("Failed to delete item");
    }
  };

  const filtered = items.filter((item) => {
    if (filter !== "all" && item.categoryId !== Number(filter)) return false;
    if (search) return item.name.toLowerCase().includes(search.toLowerCase());
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search menu items..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/5 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-red-500/30"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-2.5 rounded-xl bg-white/5 border border-white/5 text-white text-sm"
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <button
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
          className="px-4 py-2.5 fire-gradient rounded-xl text-white text-sm font-medium flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Item
        </button>
      </div>

      {/* Items grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item) => {
          const cat = categories.find((c) => c.id === item.categoryId);
          let priceDisplay = "";
          if (item.sizeVariants) {
            try {
              const sv = JSON.parse(item.sizeVariants);
              if (Array.isArray(sv) && sv.length > 0) {
                priceDisplay = `Rs. ${sv[0].price} - ${sv[sv.length - 1].price}`;
              }
            } catch {
              priceDisplay = item.price ? `Rs. ${item.price}` : "";
            }
          } else {
            priceDisplay = item.price ? `Rs. ${Number(item.price).toLocaleString()}` : "";
          }

          return (
            <div
              key={item.id}
              className={`rounded-2xl bg-white/[0.03] border overflow-hidden transition-all ${
                item.isActive ? "border-white/5" : "border-red-500/10 opacity-60"
              }`}
            >
              {item.image && (
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-36 object-cover"
                />
              )}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="font-display font-bold text-white text-sm">
                      {item.name}
                    </h3>
                    <p className="text-xs text-white/30">{cat?.name || "Uncategorized"}</p>
                  </div>
                  <span className="text-sm font-bold text-orange-400 flex-shrink-0">
                    {priceDisplay}
                  </span>
                </div>
                {item.description && (
                  <p className="text-xs text-white/40 mb-3 line-clamp-2">
                    {item.description}
                  </p>
                )}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleActive(item)}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-all"
                    title={item.isActive ? "Deactivate" : "Activate"}
                  >
                    {item.isActive ? (
                      <ToggleRight className="w-4 h-4 text-green-400" />
                    ) : (
                      <ToggleLeft className="w-4 h-4 text-white/30" />
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setEditing(item);
                      setShowForm(true);
                    }}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-all"
                  >
                    <Pencil className="w-4 h-4 text-white/40" />
                  </button>
                  <button
                    onClick={() => deleteItem(item)}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/10 transition-all"
                  >
                    <Trash2 className="w-4 h-4 text-white/40 hover:text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <MenuItemForm
          item={editing}
          categories={categories}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
          onSaved={() => {
            setShowForm(false);
            setEditing(null);
            fetchItems();
          }}
        />
      )}
    </div>
  );
}

function MenuItemForm({
  item,
  categories,
  onClose,
  onSaved,
}: {
  item: MenuItem | null;
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: item?.name || "",
    description: item?.description || "",
    categoryId: item?.categoryId || categories[0]?.id || 1,
    price: item?.price ? Number(item.price) : "",
    image: item?.image || "",
    sortOrder: item?.sortOrder || 0,
    isActive: item?.isActive ?? true,
    hasSizeVariants: false,
    sizeVariants: [] as { size: string; price: number }[],
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (item?.sizeVariants) {
      try {
        const sv = JSON.parse(item.sizeVariants);
        if (Array.isArray(sv) && sv.length > 0) {
          setForm((f) => ({ ...f, hasSizeVariants: true, sizeVariants: sv }));
        }
      } catch {}
    }
  }, [item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body: any = {
        name: form.name,
        description: form.description || null,
        categoryId: Number(form.categoryId),
        image: form.image || null,
        sortOrder: Number(form.sortOrder),
        isActive: form.isActive,
      };

      if (form.hasSizeVariants && form.sizeVariants.length > 0) {
  body.sizeVariants = form.sizeVariants
    .filter((sv) => sv.size && sv.price !== null)
    .map((sv) => ({
      size: String(sv.size).trim(),
      price: Number(sv.price) || 0,
    }));

  body.price = null;
} else {
        body.price =
  form.price === "" || form.price === null
    ? null
    : Number(form.price);
        body.sizeVariants = null;
      }

      const url = item
        ? `/api/admin/menu-items/${item.id}`
        : "/api/admin/menu-items";
      const method = item ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Failed to save");
      toast.success(item ? "Item updated" : "Item created");
      onSaved();
    } catch {
      toast.error("Failed to save menu item");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#0F0F0F] border border-white/10 rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <h3 className="font-display font-bold text-white">
            {item ? "Edit Item" : "Add New Item"}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10">
            <X className="w-4 h-4 text-white/60" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <div>
            <label className="text-xs text-white/40 mb-1 block">Name *</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/5 text-white text-sm focus:outline-none focus:border-red-500/30"
              required
            />
          </div>
          <div>
            <label className="text-xs text-white/40 mb-1 block">Category</label>
            <select
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: Number(e.target.value) })}
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/5 text-white text-sm"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-white/40 mb-1 block">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/5 text-white text-sm focus:outline-none focus:border-red-500/30 resize-none"
            />
          </div>

          {/* Size variants toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setForm({ ...form, hasSizeVariants: !form.hasSizeVariants })}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                form.hasSizeVariants
                  ? "fire-gradient text-white"
                  : "bg-white/5 text-white/40"
              }`}
            >
              Size Variants
            </button>
            <span className="text-xs text-white/30">
              {form.hasSizeVariants ? "Multiple sizes" : "Single price"}
            </span>
          </div>

          {form.hasSizeVariants ? (
  <div className="flex flex-col gap-2">
    {form.sizeVariants.map((sv, i) => (
      <div key={i} className="flex gap-2">
        <input
          value={sv.size}
          onChange={(e) => {
            const arr = [...form.sizeVariants];
            arr[i] = { ...arr[i], size: e.target.value };
            setForm({ ...form, sizeVariants: arr });
          }}
          placeholder="Size (e.g. Small)"
          className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/5 text-white text-sm"
        />

        <input
          type="number"
          value={sv.price}
          onChange={(e) => {
            const arr = [...form.sizeVariants];
            arr[i] = {
              ...arr[i],
              price: e.target.value === "" ? 0 : Number(e.target.value),
            };
            setForm({ ...form, sizeVariants: arr });
          }}
          placeholder="Price"
          className="w-28 px-3 py-2 rounded-lg bg-white/5 border border-white/5 text-white text-sm"
        />

        <button
          type="button"
          onClick={() => {
            const arr = form.sizeVariants.filter((_, j) => j !== i);
            setForm({ ...form, sizeVariants: arr });
          }}
          className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20"
        >
          <X className="w-3 h-3 text-red-400" />
        </button>
      </div>
    ))}

    <button
      type="button"
      onClick={() =>
        setForm({
          ...form,
          sizeVariants: [...form.sizeVariants, { size: "Small", price: 0 }],
        })
      }
      className="text-xs text-red-400 hover:text-red-300"
    >
      + Add Size
    </button>
  </div>
) : (
  <div>
    <label className="text-xs text-white/40 mb-1 block">Price (Rs.)</label>
    <input
      type="number"
      value={form.price}
      onChange={(e) =>
        setForm({
          ...form,
          price: e.target.value === "" ? "" : Number(e.target.value),
        })
      }
      className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/5 text-white text-sm focus:outline-none focus:border-red-500/30"
    />
  </div>
)}
            <div>
              <label className="text-xs text-white/40 mb-1 block">Price (Rs.)</label>
              <input
                type="number"
                value={form.price}
               
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/5 text-white text-sm focus:outline-none focus:border-red-500/30"
              />
            </div>
          )

          <div>
            <label className="text-xs text-white/40 mb-1 block">Image</label>
            <ImageUpload
              value={form.image}
              onChange={(url) => setForm({ ...form, image: url })}
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 fire-gradient rounded-xl text-white font-semibold text-sm disabled:opacity-50"
          >
            {saving ? "Saving..." : item ? "Update Item" : "Create Item"}
          </button>
        </form>
      </div>
    </div>
  );
}