# Pizza Home — Deployment & Setup Guide

**Version:** 2.0 | **Domain:** pizzahome.pk | **Author:** Manus AI

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Project Structure](#project-structure)
3. [Prerequisites](#prerequisites)
4. [VS Code Local Development Setup](#vs-code-local-development-setup)
5. [Database Setup (MySQL)](#database-setup-mysql)
6. [Environment Variables](#environment-variables)
7. [Deployment on Hostinger VPS](#deployment-on-hostinger-vps)
8. [Domain Connection (pizzahome.pk)](#domain-connection-pizzahomepk)
9. [Default Access Credentials](#default-access-credentials)
10. [Troubleshooting](#troubleshooting)

---

## System Overview

Pizza Home is a full-stack food ordering system built with **React 19 + Tailwind CSS 4** on the frontend and **Node.js + Express + MySQL** on the backend, with **Socket.io** for real-time communication. The system consists of seven interconnected modules, each accessible via its own URL path.

| Module | URL Path | Purpose |
|--------|----------|---------|
| Customer Website | `/` | Public-facing menu, cart, checkout, order placement |
| Menu Page | `/menu` | Full menu with category filters and search |
| Checkout | `/checkout` | Order form with COD payment |
| Order Tracking | `/track/:orderNumber` | Live order status for customers |
| Admin Panel | `/admin` | Dashboard, menu CRUD, order management, analytics |
| POS System | `/pos` | Walk-in order creation for counter staff |
| Kitchen Display | `/kitchen` | Real-time order feed for kitchen staff |
| Rider Panel | `/rider` | Delivery order management for riders |

All modules share a single codebase and a single MySQL database. Real-time updates flow through WebSocket (Socket.io) so that when an order is placed, the admin panel, kitchen display, and rider panel all update instantly.

---

## Project Structure

```
pizza_home/
├── client/                    # Frontend (React 19 + Tailwind 4)
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   │   ├── Header.tsx     # Navigation header
│   │   │   ├── Hero.tsx       # Landing page hero section
│   │   │   ├── HotDeals.tsx   # Deals carousel
│   │   │   ├── ExploreMenu.tsx# Category explorer
│   │   │   ├── CartSidebar.tsx # Slide-out cart
│   │   │   ├── MenuItemCard.tsx# Product card
│   │   │   ├── PinGate.tsx    # PIN authentication gate
│   │   │   ├── ImageUpload.tsx # S3 image upload component
│   │   │   └── Footer.tsx     # Site footer
│   │   ├── contexts/
│   │   │   └── CartContext.tsx # Cart state management
│   │   ├── hooks/
│   │   │   └── useMenu.ts     # API hooks for menu data
│   │   ├── pages/
│   │   │   ├── Home.tsx       # Landing page
│   │   │   ├── Menu.tsx       # Full menu page
│   │   │   ├── Checkout.tsx   # Checkout & order placement
│   │   │   ├── OrderTracking.tsx # Order status tracking
│   │   │   ├── admin/         # Admin panel pages
│   │   │   │   ├── AdminPanel.tsx
│   │   │   │   ├── AdminDashboard.tsx
│   │   │   │   ├── AdminOrders.tsx
│   │   │   │   ├── AdminMenu.tsx
│   │   │   │   ├── AdminDeals.tsx
│   │   │   │   └── AdminRiders.tsx
│   │   │   ├── pos/
│   │   │   │   └── POS.tsx    # Point of Sale system
│   │   │   ├── kitchen/
│   │   │   │   └── KitchenDisplay.tsx # Kitchen Display System
│   │   │   └── rider/
│   │   │       └── RiderPanel.tsx # Rider delivery panel
│   │   ├── App.tsx            # Route definitions
│   │   └── index.css          # Global styles & theme
│   └── index.html             # HTML entry point
├── server/
│   ├── _core/                 # Framework internals (DO NOT EDIT)
│   │   ├── index.ts           # Server entry point
│   │   ├── env.ts             # Environment variable loader
│   │   └── ...                # Auth, OAuth, context, etc.
│   ├── api.ts                 # All REST API endpoints
│   ├── socket.ts              # WebSocket event handlers
│   ├── db.ts                  # Database query helpers
│   ├── storage.ts             # S3 file storage helpers
│   └── routers.ts             # tRPC routers
├── drizzle/
│   ├── schema.ts              # Database schema (all tables)
│   └── migrations/            # SQL migration files
├── shared/
│   └── const.ts               # Shared constants
├── package.json
└── .env                       # Environment variables (create this)
```

---

## Prerequisites

Before setting up the project, ensure you have the following installed on your development machine.

| Software | Minimum Version | Download Link |
|----------|----------------|---------------|
| Node.js | 18.0+ (recommended 22.x) | [nodejs.org](https://nodejs.org) |
| pnpm | 8.0+ | `npm install -g pnpm` |
| MySQL | 8.0+ | [mysql.com](https://dev.mysql.com/downloads/) |
| VS Code | Latest | [code.visualstudio.com](https://code.visualstudio.com) |
| Git | 2.30+ | [git-scm.com](https://git-scm.com) |

Recommended VS Code extensions: ESLint, Prettier, Tailwind CSS IntelliSense, and TypeScript Vue Plugin (Volar).

---

## VS Code Local Development Setup

Follow these steps to get the project running locally on your machine.

**Step 1: Clone or Download the Project**

If you have the project as a ZIP file, extract it to a folder. If using Git, clone the repository:

```bash
git clone <your-repo-url> pizza_home
cd pizza_home
```

**Step 2: Install Dependencies**

Open a terminal in VS Code (Ctrl+`) and run:

```bash
pnpm install
```

This installs all frontend and backend dependencies including React, Express, Socket.io, Drizzle ORM, and Tailwind CSS.

**Step 3: Create the Environment File**

Create a `.env` file in the project root (see the [Environment Variables](#environment-variables) section below for the full list). At minimum, you need:

```env
DATABASE_URL=mysql://root:yourpassword@localhost:3306/pizza_home
JWT_SECRET=your-random-secret-key-here-minimum-32-chars
ADMIN_PIN=1234
KITCHEN_PIN=5678
RIDER_PIN=9999
```

**Step 4: Set Up the Database**

Create the MySQL database and run migrations:

```bash
mysql -u root -p -e "CREATE DATABASE pizza_home;"
pnpm db:push
```

**Step 5: Seed the Database (Optional)**

To populate the database with the default menu items and deals:

```bash
npx tsx server/seed.mjs
```

**Step 6: Start the Development Server**

```bash
pnpm dev
```

The server will start on `http://localhost:3000`. Open this URL in your browser to see the customer website. Navigate to `/admin` for the admin panel.

---

## Database Setup (MySQL)

The project uses MySQL (compatible with TiDB) via Drizzle ORM. The database schema includes the following tables.

| Table | Purpose |
|-------|---------|
| `users` | User accounts (admin, riders) |
| `categories` | Menu categories (Pizza, Burgers, Wraps, etc.) |
| `menuItems` | Individual menu items with prices and descriptions |
| `sizeVariants` | Size options for items (Small, Medium, Large) |
| `deals` | Special deals and combos |
| `dealItems` | Items included in each deal |
| `orders` | Customer orders with status tracking |
| `orderItems` | Individual items within each order |

**Creating the Database on Hostinger:**

If you are using Hostinger's MySQL hosting, log into hPanel, go to **Databases > MySQL Databases**, and create a new database. Note down the database name, username, password, and host (usually `localhost` or the IP provided).

**Running Migrations:**

After setting `DATABASE_URL` in your `.env` file, run:

```bash
pnpm db:push
```

This generates and applies all migration SQL files automatically. The schema supports the `only_full_group_by` SQL mode used by modern MySQL installations.

---

## Environment Variables

Create a `.env` file in the project root with the following variables. Variables marked as **Required** must be set for the application to function.

| Variable | Required | Description | Example Value |
|----------|----------|-------------|---------------|
| `DATABASE_URL` | Yes | MySQL connection string | `mysql://user:pass@host:3306/dbname` |
| `JWT_SECRET` | Yes | Secret key for JWT tokens (min 32 chars) | `a1b2c3d4e5f6...` |
| `ADMIN_PIN` | No | PIN for admin/POS access (default: 1234) | `1234` |
| `KITCHEN_PIN` | No | PIN for kitchen display access (default: 5678) | `5678` |
| `RIDER_PIN` | No | PIN for rider panel access (default: 9999) | `9999` |
| `PORT` | No | Server port (auto-assigned in production) | `3000` |
| `NODE_ENV` | No | Environment mode | `production` |

**Example `.env` file for production:**

```env
DATABASE_URL=mysql://pizza_user:StrongP@ss123@localhost:3306/pizza_home
JWT_SECRET=xK9mP2vL8nQ4wR7tY1uI5oA3sD6fG0hJ
ADMIN_PIN=1234
KITCHEN_PIN=5678
RIDER_PIN=9999
NODE_ENV=production
```

**Important:** Never commit the `.env` file to Git. Add it to `.gitignore`.

---

## Deployment on Hostinger VPS

This section covers deploying Pizza Home on a Hostinger VPS (Virtual Private Server). A VPS is required because the application uses Node.js with WebSocket support, which is not available on shared hosting.

### Step 1: Purchase and Access Your VPS

Log into your Hostinger account and purchase a VPS plan (KVM 1 or higher recommended). Once provisioned, you will receive an IP address and root SSH credentials. Connect via SSH:

```bash
ssh root@your-vps-ip
```

### Step 2: Install Required Software

Update the system and install Node.js, MySQL, Nginx, and PM2:

```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 22.x
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs

# Install pnpm
npm install -g pnpm

# Install MySQL 8
apt install -y mysql-server
mysql_secure_installation

# Install Nginx (reverse proxy)
apt install -y nginx

# Install PM2 (process manager)
npm install -g pm2

# Install Certbot (SSL)
apt install -y certbot python3-certbot-nginx
```

### Step 3: Create the Database

```bash
mysql -u root -p
```

Inside the MySQL shell:

```sql
CREATE DATABASE pizza_home;
CREATE USER 'pizza_user'@'localhost' IDENTIFIED BY 'YourStrongPassword123!';
GRANT ALL PRIVILEGES ON pizza_home.* TO 'pizza_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Step 4: Upload and Build the Project

Upload the project files to your VPS. You can use `scp`, `rsync`, or clone from Git:

```bash
# Option A: Clone from GitHub
cd /var/www
git clone <your-repo-url> pizza_home
cd pizza_home

# Option B: Upload via SCP from your local machine
scp -r ./pizza_home root@your-vps-ip:/var/www/pizza_home
```

Install dependencies and build:

```bash
cd /var/www/pizza_home
pnpm install
```

Create the `.env` file:

```bash
nano .env
```

Paste your environment variables (see section above), then save and exit.

Run database migrations and seed:

```bash
pnpm db:push
npx tsx server/seed.mjs
```

Build the production bundle:

```bash
pnpm build
```

### Step 5: Configure PM2 Process Manager

Create a PM2 ecosystem file:

```bash
nano ecosystem.config.cjs
```

```javascript
module.exports = {
  apps: [{
    name: 'pizza-home',
    script: 'dist/index.js',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M'
  }]
};
```

Start the application:

```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

### Step 6: Configure Nginx Reverse Proxy

Create an Nginx configuration file:

```bash
nano /etc/nginx/sites-available/pizzahome
```

```nginx
server {
    listen 80;
    server_name pizzahome.pk www.pizzahome.pk;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket support for Socket.io
    location /api/socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    client_max_body_size 10M;
}
```

Enable the site and restart Nginx:

```bash
ln -s /etc/nginx/sites-available/pizzahome /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### Step 7: Enable SSL (HTTPS)

```bash
certbot --nginx -d pizzahome.pk -d www.pizzahome.pk
```

Follow the prompts to complete SSL certificate installation. Certbot will automatically configure Nginx for HTTPS.

---

## Domain Connection (pizzahome.pk)

To connect your domain `pizzahome.pk` to your Hostinger VPS, follow these steps.

**Step 1:** Log into your domain registrar (where you purchased pizzahome.pk) and go to DNS management.

**Step 2:** Update the DNS records to point to your VPS IP address:

| Record Type | Name | Value | TTL |
|-------------|------|-------|-----|
| A | @ | `your-vps-ip` | 3600 |
| A | www | `your-vps-ip` | 3600 |
| CNAME | www | pizzahome.pk | 3600 |

**Step 3:** Wait for DNS propagation (can take up to 48 hours, usually 15-30 minutes). You can check propagation status at [dnschecker.org](https://dnschecker.org).

**Step 4:** Once DNS is propagated, run the Certbot command from Step 7 above to enable SSL.

If your domain is registered with Hostinger, you can manage DNS directly from hPanel under **Domains > DNS Zone Editor**.

---

## Default Access Credentials

The system uses PIN-based authentication for internal panels. These PINs can be changed via environment variables.

| Panel | Default PIN | Env Variable | URL |
|-------|-------------|-------------|-----|
| Admin Panel | `1234` | `ADMIN_PIN` | `/admin` |
| POS System | `1234` | `ADMIN_PIN` (shared) | `/pos` |
| Kitchen Display | `5678` | `KITCHEN_PIN` | `/kitchen` |
| Rider Panel | `9999` | `RIDER_PIN` | `/rider` |

The customer-facing pages (`/`, `/menu`, `/checkout`, `/track/:id`) require no authentication.

---

## Troubleshooting

**Problem: "Cannot connect to database"**
Verify your `DATABASE_URL` is correct and the MySQL server is running. Test the connection with: `mysql -u pizza_user -p -h localhost pizza_home`

**Problem: "Port already in use"**
Check what is using port 3000: `lsof -i :3000`. Kill the process or change the PORT in your `.env` file.

**Problem: "WebSocket connection failed"**
Ensure your Nginx configuration includes the WebSocket proxy headers (`Upgrade` and `Connection`). The Socket.io path is `/api/socket.io/`.

**Problem: "Images not loading"**
Menu item images are stored as CDN URLs. If you need to change images, use the admin panel's image upload feature which uploads to S3 storage.

**Problem: "Admin panel shows 'Something went wrong'"**
Clear your browser cache and cookies, then try again. If the issue persists, check the server logs: `pm2 logs pizza-home`

**Problem: "Orders not appearing in real-time"**
Verify Socket.io is connected by checking the browser console for `[socket] connected`. If not, ensure the Nginx WebSocket configuration is correct.

---

## Useful Commands

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm test` | Run test suite |
| `pnpm db:push` | Apply database migrations |
| `pm2 status` | Check running processes |
| `pm2 logs pizza-home` | View application logs |
| `pm2 restart pizza-home` | Restart the application |
| `nginx -t` | Test Nginx configuration |
| `systemctl restart nginx` | Restart Nginx |

---

**Built with care for Pizza Home, Chakwal.**
