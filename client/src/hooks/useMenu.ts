/*
 * Pizza Home — Menu API Hooks
 * Fetches menu categories, items, and deals from the backend API
 */

import { useState, useEffect, useMemo } from "react";

export interface ApiCategory {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface ApiMenuItem {
  id: number;
  categoryId: number;
  name: string;
  description: string | null;
  image: string | null;
  badge: string | null;
  price: string | null; // decimal comes as string
  sizeVariants: Record<string, number> | null;
  isActive: boolean;
  sortOrder: number;
}

export interface ApiDeal {
  id: number;
  name: string;
  description: string | null;
  image: string | null;
  badge: string | null;
  price: string;
  originalPrice: string | null;
  items: string[] | null;
  isFeatured: boolean;
  isActive: boolean;
  sortOrder: number;
}

export function useCategories() {
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/menu/categories")
      .then((r) => r.json())
      .then((data) => setCategories(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return { categories, loading };
}

export function useMenuItems() {
  const [items, setItems] = useState<ApiMenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/menu/items")
      .then((r) => r.json())
      .then((data: any[]) => {
        // Parse sizeVariants from JSON string if needed
        const parsed = data.map((item) => {
  let parsedSizes = null;

  if (item.sizeVariants) {
    try {
      const raw =
        typeof item.sizeVariants === "string"
          ? JSON.parse(item.sizeVariants)
          : item.sizeVariants;

      if (Array.isArray(raw)) {
        parsedSizes = {};

        raw.forEach((v: any) => {
          if (v.size && !isNaN(Number(v.price))) {
            parsedSizes[v.size] = Number(v.price);
          }
        });
      }
    } catch {
      parsedSizes = null;
    }
  }

  return {
    ...item,
    sizeVariants: parsedSizes,
  };
});
        setItems(parsed);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return { items, loading };
}

export function useDeals() {
  const [deals, setDeals] = useState<ApiDeal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/menu/deals")
      .then((r) => r.json())
      .then((data: any[]) => {
        // Parse items from JSON string if needed
        const parsed = data.map((deal) => ({
          ...deal,
          items:
            typeof deal.items === "string"
              ? JSON.parse(deal.items)
              : deal.items,
        }));
        setDeals(parsed);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return { deals, loading };
}

/** Helper to get the lowest price for display */
export function getItemPrice(item: ApiMenuItem): number {
  if (item.price) return Number(item.price);
  if (item.sizeVariants) {
    const prices = Object.values(item.sizeVariants)
  .map((p) => Number(p))
  .filter((p) => !isNaN(p) && p > 0);

return prices.length ? Math.min(...prices) : 0;
  }
  return 0;
}

/** Helper to check if item has size variants */
export function hasSizeVariants(item: ApiMenuItem): boolean {
  return (
  item.sizeVariants &&
  typeof item.sizeVariants === "object" &&
  Object.keys(item.sizeVariants).length > 0
);
}
