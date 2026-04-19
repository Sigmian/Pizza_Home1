/*
 * Pizza Home — PIN Gate Component
 * Protects admin, kitchen, POS, and rider panels with a simple PIN
 * PIN is stored in localStorage after successful entry
 */

import { useState, useEffect, useRef } from "react";
import { Shield, Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

interface PinGateProps {
  role: "admin" | "kitchen" | "pos" | "rider";
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const STORAGE_KEYS: Record<string, string> = {
  admin: "pizza_admin_auth",
  kitchen: "pizza_kitchen_auth",
  pos: "pizza_pos_auth",
  rider: "pizza_rider_auth",
};

export default function PinGate({ role, title, subtitle, icon, children }: PinGateProps) {
  const [authenticated, setAuthenticated] = useState(false);
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check if already authenticated
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEYS[role]);
    if (stored) {
      // Verify stored PIN is still valid
      verifyPin(stored, true);
    } else {
      setChecking(false);
    }
  }, [role]);

  const verifyPin = async (pinToVerify: string, silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: pinToVerify, role }),
      });
      const data = await res.json();
      if (data.valid) {
        localStorage.setItem(STORAGE_KEYS[role], pinToVerify);
        setAuthenticated(true);
        if (!silent) toast.success("Access granted!");
      } else {
        localStorage.removeItem(STORAGE_KEYS[role]);
        if (!silent) toast.error("Invalid PIN");
      }
    } catch {
      if (!silent) toast.error("Failed to verify PIN");
    } finally {
      setLoading(false);
      setChecking(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length < 4) {
      toast.error("PIN must be at least 4 digits");
      return;
    }
    verifyPin(pin);
  };

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEYS[role]);
    setAuthenticated(false);
    setPin("");
  };

  // Show loading while checking stored auth
  if (checking) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Show children if authenticated
  if (authenticated) {
    return <>{children}</>;
  }

  // PIN entry screen
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 fire-gradient rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-500/20">
            {icon || <Shield className="w-8 h-8 text-white" />}
          </div>
          <h1 className="font-display font-bold text-2xl text-white">{title}</h1>
          <p className="text-sm text-white/40 mt-1">
            {subtitle || "Enter your PIN to continue"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
            <input
              ref={inputRef}
              type={showPin ? "text" : "password"}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 8))}
              placeholder="Enter PIN"
              className="w-full pl-11 pr-12 py-3.5 rounded-xl bg-white/5 border border-white/5 text-white text-center text-xl tracking-[0.5em] placeholder:text-white/20 placeholder:tracking-normal placeholder:text-sm focus:outline-none focus:border-red-500/30 transition-colors"
              autoFocus
              inputMode="numeric"
            />
            <button
              type="button"
              onClick={() => setShowPin(!showPin)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/40"
            >
              {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading || pin.length < 4}
            className="w-full py-3.5 fire-gradient rounded-xl text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Verifying...
              </span>
            ) : (
              "Unlock"
            )}
          </button>

          <Link
            href="/"
            className="flex items-center justify-center gap-2 text-xs text-white/30 hover:text-white/50 transition-colors mt-2"
          >
            <ArrowLeft className="w-3 h-3" />
            Back to Website
          </Link>
        </form>

        <div className="mt-8 text-center">
          <p className="text-[10px] text-white/15">
            Default PINs — Admin: 1234 | Kitchen: 5678 | Rider: 9999
          </p>
        </div>
      </div>
    </div>
  );
}

// Export logout helper for use in panels
export function usePinLogout(role: string) {
  return () => {
    localStorage.removeItem(STORAGE_KEYS[role] || `pizza_${role}_auth`);
    window.location.href = "/";
  };
}
