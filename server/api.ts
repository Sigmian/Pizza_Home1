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
      pos: ADMIN_PIN,
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
        sizeVariants: typeof item.sizeVariants === "string" ? JSON.parse(item.sizeVariants) : item.sizeVariants,
        price: item.price ? String(item.price) : null,
      }));
      res.json(parsedItems);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch menu items" });
    }
  });

  app.get("/api/menu/deals", async (_req: Request, res: Response) => {
    try {
      const db = await getDb();
      if (!db) return res.json([]);
      const d = await db.select().from(deals).where(eq(deals.isActive, true));
      const parsedDeals = d.map((deal: any) => ({
        ...deal,
        items: typeof deal.items === "string" ? JSON.parse(deal.items) : deal.items,
        price: String(deal.price),
      }));
      res.json(parsedDeals);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch deals" });
    }
  });

  // ═══════════════════════════════════════════════════════════════════
  // ORDERS (Supports Online & POS)
  // ═══════════════════════════════════════════════════════════════════

  app.post("/api/orders", async (req: Request, res: Response) => {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database not connected");

      // Handle both nested 'customer' object (Web) and flat fields (POS)
      const { 
        customer, 
        customerName, customerPhone, customerAddress, 
        items, total, subtotal, discount, paymentMethod, orderType, notes 
      } = req.body;

      const orderNumber = await generateOrderNumber();

      const [newOrder] = await db
        .insert(orders)
        .values({
          orderNumber,
          customerName: customer?.name || customerName,
          customerPhone: customer?.phone || customerPhone,
          customerAddress: customer?.address || customerAddress,
          total: String(total || 0),
          subtotal: String(subtotal || total || 0),
          discount: String(discount || 0),
          paymentMethod: paymentMethod || "cod",
          orderType: orderType || "online",
          status: "pending",
          notes: notes || customer?.notes || "",
        })
        .returning();

      for (const item of items) {
        await db.insert(orderItems).values({
          orderId: newOrder.id,
          menuItemId: item.menuItemId || item.id || null,
          dealId: item.dealId || null,
          name: item.name,
          quantity: item.quantity,
          unitPrice: String(item.price),
          totalPrice: String(Number(item.price) * item.quantity),
          size: item.size || null,
        });
      }

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

  // Customer Tracking
  app.get("/api/orders/track/:orderNumber", async (req: Request, res: Response) => {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database not connected");

      const [order] = await db.select().from(orders).where(eq(orders.orderNumber, req.params.orderNumber)).limit(1);
      if (!order) return res.status(404).json({ error: "Order not found" });

      const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
      const history = await db.select().from(orderStatusHistory).where(eq(orderStatusHistory.orderId, order.id)).orderBy(desc(orderStatusHistory.createdAt));

      res.json({ order, items, history });
    } catch (err) {
      res.status(500).json({ error: "Failed to track order" });
    }
  });

  // Compatibility route for older frontend calls
  app.get("/api/orders/:orderNumber", async (req: Request, res: Response) => {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database not connected");
      const [order] = await db.select().from(orders).where(eq(orders.orderNumber, req.params.orderNumber)).limit(1);
      if (!order) return res.status(404).json({ error: "Order not found" });
      res.json(order);
    } catch (err) {
      res.status(500).json({ error: "Error fetching order" });
    }
  });

  // ═══════════════════════════════════════════════════════════════════
  // ADMIN & RIDERS
  // ═══════════════════════════════════════════════════════════════════

  app.get("/api/admin/orders", async (_req: Request, res: Response) => {
    try {
      const db = await getDb();
      if (!db) return res.json([]);
      const allOrders = await db.select().from(orders).orderBy(desc(orders.createdAt));
      
      // Attach items to each order for AdminPanel/AdminOrders
      const enriched = await Promise.all(allOrders.map(async (o) => {
        const items = await db.select().from(orderItems).where(eq(orderItems.orderId, o.id));
        return { ...o, items };
      }));
      
      res.json(enriched);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  app.get("/api/admin/riders", async (_req: Request, res: Response) => {
    try {
      const db = await getDb();
      if (!db) return res.json([]);
      const riders = await db.select().from(users).where(eq(users.role, "rider"));
      res.json(riders);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch riders" });
    }
  });

  app.patch("/api/admin/orders/:id/assign-rider", async (req: Request, res: Response) => {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database not connected");
      const { riderId } = req.body;
      const orderId = parseInt(req.params.id);

      await db.update(orders).set({ riderId, status: "out_for_delivery" }).where(eq(orders.id, orderId));
      await db.insert(orderStatusHistory).values({ orderId, status: "out_for_delivery", note: "Rider assigned" });

      const [updated] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
      if (updated) {
        emitRiderAssignment(riderId, updated);
        emitOrderStatusUpdate(updated);
      }
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to assign rider" });
    }
  });

  app.patch("/api/admin/orders/:id/status", async (req: Request, res: Response) => {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database not connected");
      const { status, note } = req.body;
      const orderId = parseInt(req.params.id);

      await db.update(orders).set({ status }).where(eq(orders.id, orderId));
      await db.insert(orderStatusHistory).values({ orderId, status, note: note || `Status: ${status}` });

      const [updated] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
      if (updated) emitOrderStatusUpdate(updated);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to update status" });
    }
  });

  // ═══════════════════════════════════════════════════════════════════
  // RIDER ENDPOINTS
  // ═══════════════════════════════════════════════════════════════════

  app.get("/api/rider/:riderId/orders", async (req: Request, res: Response) => {
    try {
      const db = await getDb();
      if (!db) return res.json([]);
      const riderId = parseInt(req.params.riderId);
      const riderOrders = await db.select().from(orders).where(eq(orders.riderId, riderId)).orderBy(desc(orders.createdAt));
      res.json(riderOrders);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch rider orders" });
    }
  });

  app.patch("/api/rider/orders/:id/status", async (req: Request, res: Response) => {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database not connected");
      const { status, note } = req.body;
      const orderId = parseInt(req.params.id);

      await db.update(orders).set({ status }).where(eq(orders.id, orderId));
      await db.insert(orderStatusHistory).values({ orderId, status, note: note || `Rider update: ${status}` });

      const [updated] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
      if (updated) emitOrderStatusUpdate(updated);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to update rider order status" });
    }
  });
}
