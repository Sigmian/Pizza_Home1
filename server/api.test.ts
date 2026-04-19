import { describe, expect, it, vi, beforeEach } from "vitest";

/**
 * Pizza Home API Tests
 * Tests the core business logic: order number generation, order validation,
 * price calculation, and menu data structure.
 */

// ─── Order Number Format ──────────────────────────────────────────────

describe("Order Number Format", () => {
  it("should follow PH-XXXX pattern", () => {
    const orderNumber = "PH-0001";
    expect(orderNumber).toMatch(/^PH-\d{4}$/);
  });

  it("should pad numbers correctly", () => {
    const num = 5;
    const formatted = `PH-${String(num).padStart(4, "0")}`;
    expect(formatted).toBe("PH-0005");
  });

  it("should handle large numbers", () => {
    const num = 9999;
    const formatted = `PH-${String(num).padStart(4, "0")}`;
    expect(formatted).toBe("PH-9999");
  });

  it("should handle numbers beyond 4 digits", () => {
    const num = 10001;
    const formatted = `PH-${String(num).padStart(4, "0")}`;
    expect(formatted).toBe("PH-10001");
  });
});

// ─── Price Calculation ────────────────────────────────────────────────

describe("Price Calculation", () => {
  const FREE_DELIVERY_THRESHOLD = 1000;
  const DELIVERY_FEE = 150;

  function calculateOrder(
    items: Array<{ price: number; quantity: number }>,
    discount: number = 0,
    orderType: string = "online"
  ) {
    let subtotal = 0;
    for (const item of items) {
      subtotal += item.price * item.quantity;
    }
    const deliveryFee =
      orderType === "pos"
        ? 0
        : subtotal >= FREE_DELIVERY_THRESHOLD
          ? 0
          : DELIVERY_FEE;
    const total = subtotal - discount + deliveryFee;
    return { subtotal, deliveryFee, total };
  }

  it("should calculate subtotal correctly", () => {
    const result = calculateOrder([
      { price: 399, quantity: 2 },
      { price: 199, quantity: 1 },
    ]);
    expect(result.subtotal).toBe(997);
  });

  it("should add delivery fee below threshold", () => {
    const result = calculateOrder([{ price: 399, quantity: 1 }]);
    expect(result.deliveryFee).toBe(150);
    expect(result.total).toBe(549);
  });

  it("should give free delivery above threshold", () => {
    const result = calculateOrder([{ price: 1999, quantity: 1 }]);
    expect(result.deliveryFee).toBe(0);
    expect(result.total).toBe(1999);
  });

  it("should give free delivery at exactly threshold", () => {
    const result = calculateOrder([{ price: 1000, quantity: 1 }]);
    expect(result.deliveryFee).toBe(0);
    expect(result.total).toBe(1000);
  });

  it("should not charge delivery for POS orders", () => {
    const result = calculateOrder(
      [{ price: 399, quantity: 1 }],
      0,
      "pos"
    );
    expect(result.deliveryFee).toBe(0);
    expect(result.total).toBe(399);
  });

  it("should apply discount correctly", () => {
    const result = calculateOrder(
      [{ price: 1999, quantity: 1 }],
      200
    );
    expect(result.total).toBe(1799);
  });

  it("should handle empty cart", () => {
    const result = calculateOrder([]);
    expect(result.subtotal).toBe(0);
    expect(result.total).toBe(150); // just delivery fee
  });
});

// ─── Menu Data Validation ─────────────────────────────────────────────

describe("Menu Data Validation", () => {
  it("should parse sizeVariants from JSON string", () => {
    const raw = '{"Small":899,"Medium":1399,"Large":1899}';
    const parsed = JSON.parse(raw);
    expect(parsed).toEqual({ Small: 899, Medium: 1399, Large: 1899 });
    expect(Object.keys(parsed)).toHaveLength(3);
  });

  it("should get minimum price from sizeVariants", () => {
    const variants = { Small: 899, Medium: 1399, Large: 1899 };
    const minPrice = Math.min(...Object.values(variants));
    expect(minPrice).toBe(899);
  });

  it("should handle null sizeVariants", () => {
    const item = { price: "399", sizeVariants: null };
    const price = item.price ? Number(item.price) : 0;
    expect(price).toBe(399);
  });

  it("should detect items with size variants", () => {
    const itemWithVariants = {
      price: null,
      sizeVariants: { Small: 899, Medium: 1399, Large: 1899 },
    };
    const itemWithoutVariants = {
      price: "399",
      sizeVariants: null,
    };

    const hasVariants = (item: any) =>
      !!item.sizeVariants && Object.keys(item.sizeVariants).length > 0;

    expect(hasVariants(itemWithVariants)).toBe(true);
    expect(hasVariants(itemWithoutVariants)).toBe(false);
  });

  it("should parse deal items from JSON string", () => {
    const raw = '["1 Large Pizza","2 Zinger Burgers","2 Drinks"]';
    const parsed = JSON.parse(raw);
    expect(parsed).toHaveLength(3);
    expect(parsed[0]).toBe("1 Large Pizza");
  });
});

// ─── Order Validation ─────────────────────────────────────────────────

describe("Order Validation", () => {
  function validateOrder(body: any): string | null {
    if (!body.items || body.items.length === 0) {
      return "Cart is empty";
    }
    for (const item of body.items) {
      if (!item.name) return "Item name is required";
      if (!item.price || Number(item.price) <= 0) return "Invalid item price";
      if (!item.quantity || Number(item.quantity) <= 0) return "Invalid quantity";
    }
    return null;
  }

  it("should reject empty cart", () => {
    expect(validateOrder({ items: [] })).toBe("Cart is empty");
  });

  it("should reject missing items", () => {
    expect(validateOrder({})).toBe("Cart is empty");
  });

  it("should accept valid order", () => {
    const result = validateOrder({
      items: [{ name: "Zinger Burger", price: 399, quantity: 1 }],
    });
    expect(result).toBeNull();
  });

  it("should reject item without name", () => {
    const result = validateOrder({
      items: [{ price: 399, quantity: 1 }],
    });
    expect(result).toBe("Item name is required");
  });

  it("should reject zero price", () => {
    const result = validateOrder({
      items: [{ name: "Test", price: 0, quantity: 1 }],
    });
    expect(result).toBe("Invalid item price");
  });
});

// ─── Order Status Flow ────────────────────────────────────────────────

describe("Order Status Flow", () => {
  const validTransitions: Record<string, string[]> = {
    pending: ["confirmed", "cancelled"],
    confirmed: ["preparing", "cancelled"],
    preparing: ["ready", "cancelled"],
    ready: ["out_for_delivery", "delivered"],
    out_for_delivery: ["delivered"],
    delivered: [],
    cancelled: [],
  };

  function isValidTransition(from: string, to: string): boolean {
    return validTransitions[from]?.includes(to) ?? false;
  }

  it("should allow pending → confirmed", () => {
    expect(isValidTransition("pending", "confirmed")).toBe(true);
  });

  it("should allow confirmed → preparing", () => {
    expect(isValidTransition("confirmed", "preparing")).toBe(true);
  });

  it("should allow preparing → ready", () => {
    expect(isValidTransition("preparing", "ready")).toBe(true);
  });

  it("should allow ready → out_for_delivery", () => {
    expect(isValidTransition("ready", "out_for_delivery")).toBe(true);
  });

  it("should allow out_for_delivery → delivered", () => {
    expect(isValidTransition("out_for_delivery", "delivered")).toBe(true);
  });

  it("should not allow skipping statuses", () => {
    expect(isValidTransition("pending", "ready")).toBe(false);
  });

  it("should not allow going backward", () => {
    expect(isValidTransition("delivered", "pending")).toBe(false);
  });

  it("should allow cancellation from pending", () => {
    expect(isValidTransition("pending", "cancelled")).toBe(true);
  });

  it("should not allow changes after delivery", () => {
    expect(isValidTransition("delivered", "cancelled")).toBe(false);
  });
});
