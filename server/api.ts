/**
 * Pizza Home — REST API Routes
 * Handles order placement, menu fetching, admin operations, rider operations.
 * All routes prefixed with /api/
 */

import { Express, Request, Response } from "express";
import { eq, desc, sql, and, gte, lte, count, sum } from "drizzle-orm";
import { getDb } from "./db";
import {
  menuCategories,
  menuItems,
  deals,
  orders,
  orderItems,
  orderStatusHistory,
  users,
  coupons,
} from "../drizzle/schema";
import { emitNewOrder, emitOrderStatusUpdate, emitRiderAssignment } from "./socket";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";

// ─── Helpers ──────────────────────────────────────────────────────────

async function generateOrderNumber(): Promise<string> {
  const db = await getDb();
  if (!db) return `PH-${Date.now()}`;
  const result = await db.select({ cnt: count() }).from(orders);
  const num = (Number(result[0]?.cnt) ?? 0) + 1;
  return `PH-${String(num).padStart(4, "0")}`;
}

// ─── Register Routes ──────────────────────────────────────────────────

export function registerApiRoutes(app: Express) {
  // ═══════════════════════════════════════════════════════════════════
  // AUTH: PIN Verification
  // ═══════════════════════════════════════════════════════════════════

  app.post("/api/auth/verify-pin", (req: Request, res: Response) => {
    const { pin, role } = req.body;
    const ADMIN_PIN = process.env.ADMIN_PIN || "1234";
    const KITCHEN_PIN = process.env.KITCHEN_PIN || "5678";
    const RIDER_PIN = process.env.RIDER_PIN || "9999";

    const pinMap: Record<string, string> = {
      admin: ADMIN_PIN,
      pos: ADMIN_PIN, // POS uses admin PIN
      kitchen: KITCHEN_PIN,
      rider: RIDER_PIN,
    };

    if (pin === pinMap[role]) {
      res.json({ success: true, role });
    } else {
      res.status(401).json({ success: false, message: "Invalid PIN" });
    }
  });

  // ═══════════════════════════════════════════════════════════════════
  // MENU & DEALS
  // ═══════════════════════════════════════════════════════════════════

  app.get("/api/menu/categories", async (_req: Request, res: Response) => {
    try {
      const db = await getDb();
      if (!db) return res.json([]);
      const cats = await db
        .select()
        .from(menuCategories)
        .where(eq(menuCategories.isActive, true))
        .orderBy(menuCategories.sortOrder);
      res.json(cats);
    } catch (err) {
      console.error("[API] GET /api/menu/categories error:", err);
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  app.get("/api/menu/items", async (_req: Request, res: Response) => {
    try {
      const db = await getDb();
      if (!db) return res.json([]);

      const items = await db
        .select()
        .from(menuItems)
        .where(eq(menuItems.isActive, true))
        .orderBy(menuItems.sortOrder);

      const parsedItems = items.map((item: any) => ({
        ...item,
        sizeVariants: (() => {
          if (!item.sizeVariants) return null;
          if (typeof item.sizeVariants === "object") return item.sizeVariants;
          if (typeof item.sizeVariants === "string") {
            try {
              return JSON.parse(item.sizeVariants);
            } catch {
              return null;
            }
          }
          return null;
        })(),
        price: item.price ? String(item.price) : null,
      }));

      res.json(parsedItems);
    } catch (err) {
      console.error("[API] GET /api/menu/items error:", err);
      res.status(500).json({ error: "Failed to fetch menu items" });
    }
  });

  app.get("/api/menu/deals", async (_req: Request, res: Response) => {
    try {
      const db = await getDb();
      if (!db) return res.json([]);
      const d = await db
        .select()
        .from(deals)
        .where(eq(deals.isActive, true))
        .orderBy(deals.id);

      const parsedDeals = d.map((deal: any) => ({
        ...deal,
        items: typeof deal.items === "string" ? JSON.parse(deal.items) : deal.items,
        price: String(deal.price),
      }));

      res.json(parsedDeals);
    } catch (err) {
      console.error("[API] GET /api/menu/deals error:", err);
      res.status(500).json({ error: "Failed to fetch deals" });
    }
  });

  // ═══════════════════════════════════════════════════════════════════
  // ORDERS
  // ═══════════════════════════════════════════════════════════════════

  app.post("/api/orders", async (req: Request, res: Response) => {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database not connected");

      const { customer, items, total, subtotal, discount, paymentMethod, couponCode } = req.body;

      const orderNumber = await generateOrderNumber();

      const [newOrder] = await db
        .insert(orders)
        .values({
          orderNumber,
          customerName: customer.name,
          customerPhone: customer.phone,
          customerAddress: customer.address,
          total: String(total),
          subtotal: String(subtotal),
          discount: String(discount || 0),
          paymentMethod: paymentMethod || "cod",
          paymentStatus: "pending",
          status: "pending",
        })
        .returning();

      // Insert items
      for (const item of items) {
        await db.insert(orderItems).values({
          orderId: newOrder.id,
          menuItemId: item.id,
          name: item.name,
          quantity: item.quantity,
          unitPrice: String(item.price),
          totalPrice: String(item.price * item.quantity),
          size: item.size || null,
        });
      }

      // Initial status history
      await db.insert(orderStatusHistory).values({
        orderId: newOrder.id,
        status: "pending",
        note: "Order placed",
      });

      emitNewOrder(newOrder);

      res.json({ success: true, order: newOrder });
    } catch (err) {
      console.error("[API] POST /api/orders error:", err);
      res.status(500).json({ error: "Failed to place order" });
    }
  });

  app.get("/api/orders/track/:orderNumber", async (req: Request, res: Response) => {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database not connected");

      const [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.orderNumber, req.params.orderNumber))
        .limit(1);

      if (!order) return res.status(404).json({ error: "Order not found" });

      const items = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, order.id));

      const history = await db
        .select()
        .from(orderStatusHistory)
        .where(eq(orderStatusHistory.orderId, order.id))
        .orderBy(desc(orderStatusHistory.createdAt));

      res.json({ order, items, history });
    } catch (err) {
      res.status(500).json({ error: "Failed to track order" });
    }
  });

  // ═══════════════════════════════════════════════════════════════════
  // ADMIN & KITCHEN & RIDER
  // ═══════════════════════════════════════════════════════════════════

  app.get("/api/admin/orders", async (_req: Request, res: Response) => {
    try {
      const db = await getDb();
      if (!db) return res.json([]);
      const allOrders = await db.select().from(orders).orderBy(desc(orders.createdAt));
      res.json(allOrders);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  app.patch("/api/admin/orders/:id/status", async (req: Request, res: Response) => {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database not connected");

      const { status, note } = req.body;
      const orderId = parseInt(req.params.id);

      await db.update(orders).set({ status }).where(eq(orders.id, orderId));

      await db.insert(orderStatusHistory).values({
        orderId,
        status,
        note: note || `Status updated to ${status}`,
      });

      const [updatedOrder] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
      if (updatedOrder) {
        emitOrderStatusUpdate(updatedOrder);
      }

      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to update status" });
    }
  });

  app.get("/api/admin/analytics", async (_req: Request, res: Response) => {
    try {
      const db = await getDb();
      if (!db) return res.json({});

      const totalOrders = await db.select({ val: count() }).from(orders);
      const totalRevenue = await db.select({ val: sum(orders.total) }).from(orders);
      
      res.json({
        totalOrders: Number(totalOrders[0]?.val) || 0,
        totalRevenue: Number(totalRevenue[0]?.val) || 0,
        recentOrders: 10, 
      });
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  app.get("/api/rider/orders", async (_req: Request, res: Response) => {
    try {
      const db = await getDb();
      if (!db) return res.json([]);
      const riderOrders = await db
        .select()
        .from(orders)
        .where(
          sql`${orders.status} IN ('ready', 'out_for_delivery', 'delivered')`
        )
        .orderBy(desc(orders.createdAt));
      res.json(riderOrders);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch rider orders" });
    }
  });
}
