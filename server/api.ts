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
  const num = (result[0]?.cnt ?? 0) + 1;
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

    const expected = pinMap[role];
    if (!expected) return res.json({ valid: false });

    res.json({ valid: pin === expected });
  });

  // ═══════════════════════════════════════════════════════════════════
  // PUBLIC: Menu & Deals
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
  .select()
  .from(menuItems)
  .where(eq(menuItems.isActive, true))
  .orderBy(menuItems.sortOrder);

const parsedItems = items.map((item: any) => ({
  ...item,
  sizeVariants: (() => {
  if (!item.sizeVariants) return null;

  if (typeof item.sizeVariants === "object") {
    return item.sizeVariants;
  }

  if (typeof item.sizeVariants === "string") {
    try {
      return JSON.parse(item.sizeVariants);
    } catch {
      return null;
    }
  }

  return null;
})(),
  price: item.price ? Number(item.price) : null,
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
        .orderBy(deals.sortOrder);
      res.json(d);
    } catch (err) {
      console.error("[API] GET /api/menu/deals error:", err);
      res.status(500).json({ error: "Failed to fetch deals" });
    }
  });

  // ═══════════════════════════════════════════════════════════════════
  // CUSTOMER: Place Order
  // ═══════════════════════════════════════════════════════════════════

  app.post("/api/orders", async (req: Request, res: Response) => {
    try {
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "Database unavailable" });

      const {
        customerName,
        customerPhone,
        customerAddress,
        items: cartItems,
        paymentMethod = "cod",
        notes,
        orderType = "online",
        discount = 0,
      } = req.body;

      if (!cartItems || cartItems.length === 0) {
        return res.status(400).json({ error: "Cart is empty" });
      }

      // Calculate totals
      let subtotal = 0;
      const processedItems: any[] = [];
      for (const item of cartItems) {
        const unitPrice = Number(item.price);
        const qty = Number(item.quantity);
        const totalPrice = unitPrice * qty;
        subtotal += totalPrice;
        processedItems.push({
          menuItemId: item.menuItemId || null,
          dealId: item.dealId || null,
          name: item.name,
          size: item.size || null,
          quantity: qty,
          unitPrice: String(unitPrice),
          totalPrice: String(totalPrice),
        });
      }

      const FREE_DELIVERY_THRESHOLD = 1000;
      const DELIVERY_FEE = 150;
      let deliveryFee = 0;

if (orderType === "delivery") {
  deliveryFee = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
}
      const total = subtotal - Number(discount) + deliveryFee;

      const orderNumber = await generateOrderNumber();

      // Insert order
      const [insertResult] = await db.insert(orders).values({
        orderNumber,
        customerName: customerName || null,
        customerPhone: customerPhone || null,
        customerAddress: customerAddress || null,
        orderType: orderType as "online" | "pos",
        status: "pending",
        paymentMethod: paymentMethod as "cod" | "cash" | "card",
        paymentStatus: paymentMethod === "cash" ? "paid" : "pending",
        subtotal: String(subtotal),
        deliveryFee: String(deliveryFee),
        discount: String(discount),
        total: String(total),
        notes: notes || null,
      });

      const orderId = (insertResult as any).insertId;

      // Insert order items
      for (const item of processedItems) {
        await db.insert(orderItems).values({
          orderId,
          ...item,
        });
      }

      // Insert status history
      await db.insert(orderStatusHistory).values({
        orderId,
        status: "pending",
        note: "Order placed",
      });

      // Fetch the complete order
      const [newOrder] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, orderId));

      const orderItemsList = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, orderId));

      const fullOrder = { ...newOrder, items: orderItemsList };

      // Emit real-time event
      emitNewOrder(fullOrder);

      // Auto-assign rider for online orders
      if (orderType === "online") {
        const availableRiders = await db
          .select()
          .from(users)
          .where(and(eq(users.role, "rider"), eq(users.isActive, true)));
        if (availableRiders.length > 0) {
          // Simple round-robin: pick the first available rider
          const rider = availableRiders[0];
          await db
            .update(orders)
            .set({ riderId: rider.id })
            .where(eq(orders.id, orderId));
          emitRiderAssignment(rider.id, fullOrder);
        }
      }

      res.status(201).json({
        success: true,
        order: fullOrder,
      });
    } catch (err) {
      console.error("[API] POST /api/orders error:", err);
      res.status(500).json({ error: "Failed to place order" });
    }
  });

  // ═══════════════════════════════════════════════════════════════════
  // ORDER: Get by ID or order number
  // ═══════════════════════════════════════════════════════════════════

  app.get("/api/orders/:identifier", async (req: Request, res: Response) => {
    try {
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "Database unavailable" });

      const { identifier } = req.params;
      let order;

      if (identifier.startsWith("PH-")) {
        [order] = await db
          .select()
          .from(orders)
          .where(eq(orders.orderNumber, identifier));
      } else {
        [order] = await db
          .select()
          .from(orders)
          .where(eq(orders.id, Number(identifier)));
      }

      if (!order) return res.status(404).json({ error: "Order not found" });

      const items = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, order.id));

      const history = await db
        .select()
        .from(orderStatusHistory)
        .where(eq(orderStatusHistory.orderId, order.id))
        .orderBy(orderStatusHistory.createdAt);

      res.json({ ...order, items, statusHistory: history });
    } catch (err) {
      console.error("[API] GET /api/orders/:id error:", err);
      res.status(500).json({ error: "Failed to fetch order" });
    }
  });

  // ═══════════════════════════════════════════════════════════════════
  // ADMIN: All Orders
  // ═══════════════════════════════════════════════════════════════════

  app.get("/api/admin/orders", async (req: Request, res: Response) => {
    try {
      const db = await getDb();
      if (!db) return res.json([]);

      const { status, limit = "50", offset = "0" } = req.query;

      let query = db.select().from(orders).orderBy(desc(orders.createdAt)).limit(Number(limit)).offset(Number(offset));

      const allOrders = await query;

      // Attach items to each order
      const ordersWithItems = await Promise.all(
        allOrders.map(async (order) => {
          const items = await db
            .select()
            .from(orderItems)
            .where(eq(orderItems.orderId, order.id));
          return { ...order, items };
        })
      );

      res.json(ordersWithItems);
    } catch (err) {
      console.error("[API] GET /api/admin/orders error:", err);
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  // ═══════════════════════════════════════════════════════════════════
  // ADMIN: Update Order Status
  // ═══════════════════════════════════════════════════════════════════

  app.patch("/api/admin/orders/:id/status", async (req: Request, res: Response) => {
    try {
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "Database unavailable" });

      const orderId = Number(req.params.id);
      const { status, note } = req.body;

      const validStatuses = ["pending", "confirmed", "preparing", "ready", "out_for_delivery", "delivered", "cancelled"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      await db
        .update(orders)
        .set({ status })
        .where(eq(orders.id, orderId));

      await db.insert(orderStatusHistory).values({
        orderId,
        status,
        note: note || `Status changed to ${status}`,
      });

      // If delivered, mark payment as paid
      if (status === "delivered") {
        await db
          .update(orders)
          .set({ paymentStatus: "paid" })
          .where(eq(orders.id, orderId));
      }

      const [updatedOrder] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, orderId));

      const items = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, orderId));

      const fullOrder = { ...updatedOrder, items };

      emitOrderStatusUpdate(fullOrder);

      res.json({ success: true, order: fullOrder });
    } catch (err) {
      console.error("[API] PATCH /api/admin/orders/:id/status error:", err);
      res.status(500).json({ error: "Failed to update order status" });
    }
  });

  // ═══════════════════════════════════════════════════════════════════
  // ADMIN: Assign Rider
  // ═══════════════════════════════════════════════════════════════════

  app.patch("/api/admin/orders/:id/assign-rider", async (req: Request, res: Response) => {
    try {
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "Database unavailable" });

      const orderId = Number(req.params.id);
      const { riderId } = req.body;

      await db
        .update(orders)
        .set({ riderId })
        .where(eq(orders.id, orderId));

      const [updatedOrder] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, orderId));

      const items = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, orderId));

      const fullOrder = { ...updatedOrder, items };

      emitRiderAssignment(riderId, fullOrder);
      emitOrderStatusUpdate(fullOrder);

      res.json({ success: true, order: fullOrder });
    } catch (err) {
      console.error("[API] PATCH /api/admin/orders/:id/assign-rider error:", err);
      res.status(500).json({ error: "Failed to assign rider" });
    }
  });

  // ═══════════════════════════════════════════════════════════════════
  // ADMIN: Dashboard Stats
  // ═══════════════════════════════════════════════════════════════════

  app.get("/api/admin/stats", async (_req: Request, res: Response) => {
    try {
      const db = await getDb();
      if (!db) return res.json({});

      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(todayStart);
      weekStart.setDate(weekStart.getDate() - 7);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      // Total orders & revenue
      const [totalStats] = await db
        .select({
          totalOrders: count(),
          totalRevenue: sum(orders.total),
        })
        .from(orders)
        .where(sql`${orders.status} != 'cancelled'`);

      // Today
      const [todayStats] = await db
        .select({
          orders: count(),
          revenue: sum(orders.total),
        })
        .from(orders)
        .where(and(
          gte(orders.createdAt, todayStart),
          sql`${orders.status} != 'cancelled'`
        ));

      // This week
      const [weekStats] = await db
        .select({
          orders: count(),
          revenue: sum(orders.total),
        })
        .from(orders)
        .where(and(
          gte(orders.createdAt, weekStart),
          sql`${orders.status} != 'cancelled'`
        ));

      // This month
      const [monthStats] = await db
        .select({
          orders: count(),
          revenue: sum(orders.total),
        })
        .from(orders)
        .where(and(
          gte(orders.createdAt, monthStart),
          sql`${orders.status} != 'cancelled'`
        ));

      // Pending orders count
      const [pendingCount] = await db
        .select({ count: count() })
        .from(orders)
        .where(eq(orders.status, "pending"));

      // Top selling items
      const topItems = await db
        .select({
          name: orderItems.name,
          totalQty: sum(orderItems.quantity),
          totalRevenue: sum(orderItems.totalPrice),
        })
        .from(orderItems)
        .groupBy(orderItems.name)
        .orderBy(desc(sum(orderItems.quantity)))
        .limit(5);

      // Orders by status
      const statusCounts = await db
        .select({
          status: orders.status,
          count: count(),
        })
        .from(orders)
        .groupBy(orders.status);

      // Daily sales for last 14 days
      const fourteenDaysAgo = new Date(todayStart);
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);
      const dailySalesRaw: any = await db.execute(
        sql`SELECT DATE(createdAt) as sale_date, COUNT(*) as order_count, COALESCE(SUM(total), 0) as total_revenue FROM orders WHERE createdAt >= ${fourteenDaysAgo} AND status != 'cancelled' GROUP BY sale_date ORDER BY sale_date`
      );
      const dailySales = (Array.isArray(dailySalesRaw) ? dailySalesRaw[0] : dailySalesRaw.rows ?? []) as any[];

      res.json({
        total: {
          orders: totalStats?.totalOrders ?? 0,
          revenue: Number(totalStats?.totalRevenue ?? 0),
        },
        today: {
          orders: todayStats?.orders ?? 0,
          revenue: Number(todayStats?.revenue ?? 0),
        },
        week: {
          orders: weekStats?.orders ?? 0,
          revenue: Number(weekStats?.revenue ?? 0),
        },
        month: {
          orders: monthStats?.orders ?? 0,
          revenue: Number(monthStats?.revenue ?? 0),
        },
        pendingOrders: pendingCount?.count ?? 0,
        topItems: topItems.map((t) => ({
          name: t.name,
          quantity: Number(t.totalQty ?? 0),
          revenue: Number(t.totalRevenue ?? 0),
        })),
        statusCounts: statusCounts.reduce((acc: any, s) => {
          acc[s.status] = s.count;
          return acc;
        }, {}),
        dailySales: dailySales.map((d: any) => ({
          date: d.sale_date,
          orders: Number(d.order_count ?? 0),
          revenue: Number(d.total_revenue ?? 0),
        })),
      });
    } catch (err) {
      console.error("[API] GET /api/admin/stats error:", err);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // ═══════════════════════════════════════════════════════════════════
  // ADMIN: Menu CRUD
  // ═══════════════════════════════════════════════════════════════════

  app.get("/api/admin/menu-items", async (_req: Request, res: Response) => {
    try {
      const db = await getDb();
      if (!db) return res.json([]);
      const items = await db.select().from(menuItems).orderBy(menuItems.sortOrder);
      res.json(items);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch menu items" });
    }
  });

  app.post("/api/admin/menu-items", async (req: Request, res: Response) => {
    try {
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "Database unavailable" });

      const data = req.body;
      if (data.sizeVariants) {
  let parsed = data.sizeVariants;

  // ensure array
  if (typeof parsed === "string") {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      parsed = [];
    }
  }

  if (Array.isArray(parsed)) {
    const cleanVariants = parsed
      .map((sv: any) => ({
        size: typeof sv.size === "string" ? sv.size.trim() : "",
        price: Number(sv.price),
      }))
      .filter((sv: any) => sv.size && !isNaN(sv.price) && sv.price > 0);

    data.sizeVariants = JSON.stringify(cleanVariants);
  } else {
    data.sizeVariants = null;
  }
}

      const [result] = await db.insert(menuItems).values(data);
      const id = (result as any).insertId;
      const [item] = await db.select().from(menuItems).where(eq(menuItems.id, id));
      res.status(201).json(item);
    } catch (err) {
      console.error("[API] POST /api/admin/menu-items error:", err);
      res.status(500).json({ error: "Failed to create menu item" });
    }
  });

  app.put("/api/admin/menu-items/:id", async (req: Request, res: Response) => {
    try {
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "Database unavailable" });

      const id = Number(req.params.id);
      const data = req.body;
      if (data.sizeVariants && Array.isArray(data.sizeVariants)) {
  const cleanVariants = data.sizeVariants
    .filter((sv: any) => sv.size && sv.price !== null)
    .map((sv: any) => ({
      size: String(sv.size).trim(),
      price: Number(sv.price) || 0,
    }));

  data.sizeVariants = JSON.stringify(cleanVariants);
}

      await db.update(menuItems).set(data).where(eq(menuItems.id, id));
      const [item] = await db.select().from(menuItems).where(eq(menuItems.id, id));
      res.json(item);
    } catch (err) {
      console.error("[API] PUT /api/admin/menu-items/:id error:", err);
      res.status(500).json({ error: "Failed to update menu item" });
    }
  });

  app.delete("/api/admin/menu-items/:id", async (req: Request, res: Response) => {
    try {
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "Database unavailable" });

      const id = Number(req.params.id);
      await db.update(menuItems).set({ isActive: false }).where(eq(menuItems.id, id));
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete menu item" });
    }
  });

  // ═══════════════════════════════════════════════════════════════════
  // ADMIN: Deals CRUD
  // ═══════════════════════════════════════════════════════════════════

  app.get("/api/admin/deals", async (_req: Request, res: Response) => {
    try {
      const db = await getDb();
      if (!db) return res.json([]);
      const d = await db.select().from(deals).orderBy(deals.sortOrder);
      res.json(d);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch deals" });
    }
  });

  app.post("/api/admin/deals", async (req: Request, res: Response) => {
    try {
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "Database unavailable" });

      const data = req.body;
      if (data.items && typeof data.items === "object") {
        data.items = JSON.stringify(data.items);
      }

      const [result] = await db.insert(deals).values(data);
      const id = (result as any).insertId;
      const [deal] = await db.select().from(deals).where(eq(deals.id, id));
      res.status(201).json(deal);
    } catch (err) {
      res.status(500).json({ error: "Failed to create deal" });
    }
  });

  app.put("/api/admin/deals/:id", async (req: Request, res: Response) => {
    try {
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "Database unavailable" });

      const id = Number(req.params.id);
      const data = req.body;
      if (data.items && typeof data.items === "object") {
        data.items = JSON.stringify(data.items);
      }

      await db.update(deals).set(data).where(eq(deals.id, id));
      const [deal] = await db.select().from(deals).where(eq(deals.id, id));
      res.json(deal);
    } catch (err) {
      res.status(500).json({ error: "Failed to update deal" });
    }
  });

  app.delete("/api/admin/deals/:id", async (req: Request, res: Response) => {
    try {
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "Database unavailable" });

      const id = Number(req.params.id);
      await db.update(deals).set({ isActive: false }).where(eq(deals.id, id));
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete deal" });
    }
  });

  // ═══════════════════════════════════════════════════════════════════
  // ADMIN: Users/Riders
  // ═══════════════════════════════════════════════════════════════════

  app.get("/api/admin/users", async (req: Request, res: Response) => {
    try {
      const db = await getDb();
      if (!db) return res.json([]);
      const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));
      res.json(allUsers);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.get("/api/admin/riders", async (_req: Request, res: Response) => {
    try {
      const db = await getDb();
      if (!db) return res.json([]);
      const riders = await db
        .select()
        .from(users)
        .where(eq(users.role, "rider"));
      res.json(riders);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch riders" });
    }
  });

  // ═══════════════════════════════════════════════════════════════════
  // RIDER: Get assigned orders
  // ═══════════════════════════════════════════════════════════════════

  app.get("/api/rider/:riderId/orders", async (req: Request, res: Response) => {
    try {
      const db = await getDb();
      if (!db) return res.json([]);

      const riderId = Number(req.params.riderId);
      const riderOrders = await db
        .select()
        .from(orders)
        .where(eq(orders.riderId, riderId))
        .orderBy(desc(orders.createdAt));

      const ordersWithItems = await Promise.all(
        riderOrders.map(async (order) => {
          const items = await db
            .select()
            .from(orderItems)
            .where(eq(orderItems.orderId, order.id));
          return { ...order, items };
        })
      );

      res.json(ordersWithItems);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch rider orders" });
    }
  });

  // ═══════════════════════════════════════════════════════════════════
  // RIDER: Update delivery status
  // ═══════════════════════════════════════════════════════════════════

  app.patch("/api/rider/orders/:id/status", async (req: Request, res: Response) => {
    try {
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "Database unavailable" });

      const orderId = Number(req.params.id);
      const { status } = req.body;

      const validStatuses = ["accepted", "picked_up", "out_for_delivery", "delivered"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: "Invalid status for rider" });
      }

      await db
        .update(orders)
        .set({ status, ...(status === "delivered" ? { paymentStatus: "paid" as const } : {}) })
        .where(eq(orders.id, orderId));

      await db.insert(orderStatusHistory).values({
        orderId,
        status,
        note: `Rider updated status to ${status}`,
      });

      const [updatedOrder] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, orderId));

      const items = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, orderId));

      const fullOrder = { ...updatedOrder, items };
      emitOrderStatusUpdate(fullOrder);

      res.json({ success: true, order: fullOrder });
    } catch (err) {
      res.status(500).json({ error: "Failed to update order status" });
    }
  });

  // ═══════════════════════════════════════════════════════════════════
  // KITCHEN: Get active orders
  // ═══════════════════════════════════════════════════════════════════

  app.get("/api/kitchen/orders", async (_req: Request, res: Response) => {
    try {
      const db = await getDb();
      if (!db) return res.json([]);

      const kitchenOrders = await db
        .select()
        .from(orders)
        .where(
          sql`${orders.status} IN ('pending', 'confirmed', 'preparing', 'ready')`
        )
        .orderBy(orders.createdAt);

      const ordersWithItems = await Promise.all(
        kitchenOrders.map(async (order) => {
          const items = await db
            .select()
            .from(orderItems)
            .where(eq(orderItems.orderId, order.id));
          return { ...order, items };
        })
      );

      res.json(ordersWithItems);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch kitchen orders" });
    }
  });

  // ═══════════════════════════════════════════════════════════════════
  // KITCHEN: Update order status
  // ═══════════════════════════════════════════════════════════════════

  app.patch("/api/kitchen/orders/:id/status", async (req: Request, res: Response) => {
    try {
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "Database unavailable" });

      const orderId = Number(req.params.id);
      const { status } = req.body;

      const validStatuses = ["confirmed", "preparing", "ready"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: "Invalid status for kitchen" });
      }

      await db
        .update(orders)
        .set({ status })
        .where(eq(orders.id, orderId));

      await db.insert(orderStatusHistory).values({
        orderId,
        status,
        note: `Kitchen updated status to ${status}`,
      });

      const [updatedOrder] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, orderId));

      const items = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, orderId));

      const fullOrder = { ...updatedOrder, items };
      emitOrderStatusUpdate(fullOrder);

      res.json({ success: true, order: fullOrder });
    } catch (err) {
      res.status(500).json({ error: "Failed to update order status" });
    }
  });

  // ═══════════════════════════════════════════════════════════════════
  // COUPONS
  // ═══════════════════════════════════════════════════════════════════

  // ═══════════════════════════════════════════════════════════════════
  // IMAGE UPLOAD
  // ═══════════════════════════════════════════════════════════════════

  app.post("/api/upload/image", async (req: Request, res: Response) => {
    try {
      const { data, contentType, filename } = req.body;
      if (!data) return res.status(400).json({ error: "No image data provided" });

      const buffer = Buffer.from(data, "base64");
      const ext = (filename || "image.jpg").split(".").pop() || "jpg";
      const key = `pizza-home/images/${nanoid(12)}.${ext}`;
      const result = await storagePut(key, buffer, contentType || "image/jpeg");
      res.json({ url: result.url, key: result.key });
    } catch (err) {
      console.error("[API] Image upload error:", err);
      res.status(500).json({ error: "Failed to upload image" });
    }
  });

  // ═══════════════════════════════════════════════════════════════════
  // ADMIN: Rider CRUD
  // ═══════════════════════════════════════════════════════════════════

  app.post("/api/admin/riders", async (req: Request, res: Response) => {
    try {
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "Database unavailable" });

      const { name, phone, email } = req.body;
      if (!name) return res.status(400).json({ error: "Name is required" });

      const openId = `rider_${nanoid(10)}`;
      await db.insert(users).values({
        openId,
        name,
        phone: phone || null,
        email: email || null,
        role: "rider",
        isActive: true,
      });

      const [rider] = await db.select().from(users).where(eq(users.openId, openId));
      res.json(rider);
    } catch (err) {
      console.error("[API] Create rider error:", err);
      res.status(500).json({ error: "Failed to create rider" });
    }
  });

  app.put("/api/admin/riders/:id", async (req: Request, res: Response) => {
    try {
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "Database unavailable" });

      const id = Number(req.params.id);
      const { name, phone, email, isActive } = req.body;

      await db.update(users).set({
        ...(name !== undefined ? { name } : {}),
        ...(phone !== undefined ? { phone } : {}),
        ...(email !== undefined ? { email } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
      }).where(eq(users.id, id));

      const [rider] = await db.select().from(users).where(eq(users.id, id));
      res.json(rider);
    } catch (err) {
      res.status(500).json({ error: "Failed to update rider" });
    }
  });

  app.delete("/api/admin/riders/:id", async (req: Request, res: Response) => {
    try {
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "Database unavailable" });

      const id = Number(req.params.id);
      await db.delete(users).where(eq(users.id, id));
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete rider" });
    }
  });

  // ═══════════════════════════════════════════════════════════════════
  // COUPONS
  // ═══════════════════════════════════════════════════════════════════

  app.post("/api/coupons/validate", async (req: Request, res: Response) => {
    try {
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "Database unavailable" });

      const { code, orderTotal } = req.body;
      const [coupon] = await db
        .select()
        .from(coupons)
        .where(and(eq(coupons.code, code.toUpperCase()), eq(coupons.isActive, true)));

      if (!coupon) return res.status(404).json({ error: "Invalid coupon code" });

      if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
        return res.status(400).json({ error: "Coupon has expired" });
      }
      if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
        return res.status(400).json({ error: "Coupon usage limit reached" });
      }
      if (coupon.minOrderAmount && orderTotal < Number(coupon.minOrderAmount)) {
        return res.status(400).json({ error: `Minimum order amount is Rs. ${coupon.minOrderAmount}` });
      }

      let discount = 0;
      if (coupon.discountType === "percentage") {
        discount = (orderTotal * Number(coupon.discountValue)) / 100;
      } else {
        discount = Number(coupon.discountValue);
      }

      res.json({ valid: true, discount, coupon });
    } catch (err) {
      res.status(500).json({ error: "Failed to validate coupon" });
    }
  });
}
