/**
 * Pizza Home — Admin Riders Management
 * Full CRUD: Add, Edit, Delete, Toggle Active
 */

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  X,
  ToggleLeft,
  ToggleRight,
  Bike,
  Phone,
  Mail,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";

interface Rider {
  id: number;
  name: string | null;
  phone: string | null;
  email: string | null;
  isActive: boolean;
  createdAt: string;
}

export default function AdminRiders() {
  const [riders, setRiders] = useState<Rider[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Rider | null>(null);

  const fetchRiders = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/riders");
      setRiders(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRiders();
  }, [fetchRiders]);

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this rider?")) return;
    try {
      await fetch(`/api/admin/riders/${id}`, { method: "DELETE" });
      toast.success("Rider deleted");
      fetchRiders();
    } catch (err) {
      toast.error("Failed to delete rider");
    }
  };

  const toggleActive = async (rider: Rider) => {
    try {
      await fetch(`/api/admin/riders/${rider.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !rider.isActive }),
      });
      toast.success(rider.isActive ? "Rider deactivated" : "Rider activated");
      fetchRiders();
    } catch (err) {
      toast.error("Failed to update rider");
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
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-display font-bold text-white">Riders</h2>
          <p className="text-sm text-white/40 mt-1">
            {riders.length} rider{riders.length !== 1 ? "s" : ""} registered
          </p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 fire-gradient rounded-xl text-white text-sm font-semibold"
        >
          <UserPlus className="w-4 h-4" />
          Add Rider
        </button>
      </div>

      {/* Riders Grid */}
      {riders.length === 0 ? (
        <div className="text-center py-20">
          <Bike className="w-12 h-12 text-white/10 mx-auto mb-3" />
          <p className="text-white/30 text-sm">No riders yet</p>
          <p className="text-white/20 text-xs mt-1">Click "Add Rider" to create one</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {riders.map((rider) => (
            <div
              key={rider.id}
              className={`bg-white/[0.03] border rounded-2xl p-5 transition-all ${
                rider.isActive ? "border-white/5" : "border-red-500/20 opacity-60"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center">
                    <Bike className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-sm">
                      {rider.name || "Unnamed"}
                    </h3>
                    <span className="text-[10px] text-white/30">ID: {rider.id}</span>
                  </div>
                </div>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    rider.isActive
                      ? "bg-green-500/10 text-green-400"
                      : "bg-red-500/10 text-red-400"
                  }`}
                >
                  {rider.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              {rider.phone && (
                <div className="flex items-center gap-2 text-xs text-white/40 mb-1">
                  <Phone className="w-3 h-3" />
                  {rider.phone}
                </div>
              )}
              {rider.email && (
                <div className="flex items-center gap-2 text-xs text-white/40 mb-3">
                  <Mail className="w-3 h-3" />
                  {rider.email}
                </div>
              )}

              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
                <button
                  onClick={() => {
                    setEditing(rider);
                    setShowForm(true);
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-white/5 text-white/60 hover:bg-white/10 text-xs transition-colors"
                >
                  <Pencil className="w-3 h-3" />
                  Edit
                </button>
                <button
                  onClick={() => toggleActive(rider)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-white/5 text-white/60 hover:bg-white/10 text-xs transition-colors"
                >
                  {rider.isActive ? (
                    <ToggleRight className="w-3 h-3 text-green-400" />
                  ) : (
                    <ToggleLeft className="w-3 h-3 text-red-400" />
                  )}
                  {rider.isActive ? "Deactivate" : "Activate"}
                </button>
                <button
                  onClick={() => handleDelete(rider.id)}
                  className="py-2 px-3 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showForm && (
        <RiderForm
          rider={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            fetchRiders();
          }}
        />
      )}
    </div>
  );
}

function RiderForm({
  rider,
  onClose,
  onSaved,
}: {
  rider: Rider | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: rider?.name || "",
    phone: rider?.phone || "",
    email: rider?.email || "",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }

    setSaving(true);
    try {
      const url = rider ? `/api/admin/riders/${rider.id}` : "/api/admin/riders";
      const method = rider ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("Failed");

      toast.success(rider ? "Rider updated" : "Rider created");
      onSaved();
    } catch (err) {
      toast.error("Failed to save rider");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-display font-bold text-white">
            {rider ? "Edit Rider" : "Add Rider"}
          </h3>
          <button onClick={onClose} className="text-white/40 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-white/40 mb-1 block">Name *</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Rider name"
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/5 text-white text-sm focus:outline-none focus:border-red-500/30"
              required
            />
          </div>

          <div>
            <label className="text-xs text-white/40 mb-1 block">Phone</label>
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="03xx-xxxxxxx"
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/5 text-white text-sm focus:outline-none focus:border-red-500/30"
            />
          </div>

          <div>
            <label className="text-xs text-white/40 mb-1 block">Email</label>
            <input
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="rider@example.com"
              type="email"
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/5 text-white text-sm focus:outline-none focus:border-red-500/30"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 fire-gradient rounded-xl text-white font-semibold text-sm disabled:opacity-50"
          >
            {saving ? "Saving..." : rider ? "Update Rider" : "Create Rider"}
          </button>
        </form>
      </div>
    </div>
  );
}
