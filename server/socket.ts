/**
 * Pizza Home — WebSocket Server (Socket.io)
 * Handles real-time events for KDS, Admin, Rider, and Customer order tracking.
 */

import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";

let io: Server | null = null;

export function initSocketIO(httpServer: HttpServer) {
  io = new Server(httpServer, {
    cors: { origin: "*" },
    path: "/api/socket.io",
  });

  io.on("connection", (socket: Socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // Join rooms based on role
    socket.on("join", (room: string) => {
      socket.join(room);
      console.log(`[Socket] ${socket.id} joined room: ${room}`);
    });

    socket.on("disconnect", () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getIO(): Server {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
}

// ─── Event Emitters ─────────────────────────────────────────────────

/** Broadcast new order to admin and kitchen */
export function emitNewOrder(order: any) {
  if (!io) return;
  io.to("admin").emit("new_order", order);
  io.to("kitchen").emit("new_order", order);
}

/** Broadcast order status change to all relevant rooms */
export function emitOrderStatusUpdate(order: any) {
  if (!io) return;
  io.to("admin").emit("order_status_updated", order);
  io.to("kitchen").emit("order_status_updated", order);
  io.to(`rider_${order.riderId}`).emit("order_status_updated", order);
  // Emit to room by order number (for customer tracking) and by order id
  io.to(`order_${order.orderNumber}`).emit("order_status_updated", order);
  io.to(`order_${order.id}`).emit("order_status_updated", order);
}

/** Notify a specific rider of a new assignment */
export function emitRiderAssignment(riderId: number, order: any) {
  if (!io) return;
  io.to(`rider_${riderId}`).emit("rider_assigned", order);
}
