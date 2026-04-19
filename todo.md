# Pizza Home — Full-Scale Food Ordering System TODO

## Phase 1: Upgrade & Architecture
- [x] Upgrade to web-db-user (backend + DB)
- [x] Plan DB schema (orders, menu_items, deals, users, riders)
- [x] Plan API routes

## Phase 2: Backend — DB, APIs, Auth, WebSocket
- [x] Create DB tables (menu_items, deals, orders, order_items, users)
- [x] Seed menu data from exact spec
- [x] Build auth system (admin login, rider login)
- [x] Build REST APIs: /api/menu, /api/orders, /api/auth, /api/users
- [x] Set up WebSocket (socket.io) for real-time

## Phase 3: Customer Website Updates
- [x] Replace static menuData with API-driven data
- [x] Update menu to support pizza sizes (Small/Medium/Large)
- [x] Update deals to match exact spec (3 deals)
- [x] Wire order placement to backend API
- [x] Order confirmation + tracking link

## Phase 4: Admin Panel
- [x] Admin login page
- [x] Dashboard (total orders, revenue, daily/weekly stats, top items)
- [x] Menu management (CRUD items, prices, images)
- [x] Order management (view all, change status)
- [x] User/rider management
- [x] Analytics (sales graphs, order trends) — recharts charts added

## Phase 5: POS System
- [x] POS page with quick item selection
- [x] Manual order creation (walk-in)
- [x] Discount application
- [x] Receipt print view — receipt modal with print functionality
- [x] Cash handling

## Phase 6: Kitchen Display System (KDS)
- [x] Large readable UI showing incoming orders
- [x] Real-time auto-update via WebSocket
- [x] Status: New → Preparing → Ready
- [x] Sorted by time

## Phase 7: Rider Panel
- [x] Rider login
- [x] View assigned orders
- [x] Accept/reject orders
- [x] Mark as delivered
- [x] Customer info display

## Phase 8: Order Tracking (Customer)
- [x] Order tracking page with live status
- [x] Status steps: Received → Preparing → Out for Delivery → Delivered
- [x] Real-time updates via WebSocket

## Phase 9: Real-time Notifications
- [x] Chef notification on new order (KDS)
- [x] Admin notification on new order
- [x] Auto rider assignment
- [x] Customer order confirmation
- [x] WebSocket event broadcasting

## Phase 10: Polish & Testing
- [x] Fix sizeVariants NaN parsing (useMenu.ts, POS.tsx)
- [x] Fix POS double-parsing of sizeVariants
- [x] Fix Vite stale import cache for OrderTracking
- [x] Fix admin/rider route matching in App.tsx
- [x] Fix socket event name mismatches
- [x] Fix API path mismatches (POS, AdminMenu, OrderTracking)
- [x] Write vitest tests (31 tests passing)
- [x] End-to-end order flow test
- [x] Mobile responsiveness fine-tuning
- [x] PIN gate authentication for Admin, POS, Kitchen, Rider
- [x] Verify Rider PinGate end-to-end: unlock, view orders, accept/reject
- [x] Test mobile viewport responsiveness on key pages

## Phase 11: Production Hardening (New Requirements)
- [x] KDS: Add sound notification (Web Audio API beep) on new order
- [x] Admin: Image upload for menu items (S3 via storagePut instead of URL input)
- [x] Admin: Image upload for deals (S3 via storagePut instead of URL input)
- [x] Admin: Full CRUD for riders (add/edit/delete from admin panel)
- [x] Rider: Accept → Picked Up → Delivered multi-step flow
- [x] Admin: Browser notification permission + sound on new order
- [x] Admin: Top products chart rendering verification
- [x] Deployment guide: Hostinger + VS Code + pizzahome.pk domain setup
- [x] End-to-end retest after all enhancements
