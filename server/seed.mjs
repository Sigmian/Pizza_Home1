/**
 * Pizza Home — Seed Script
 * Populates menu categories, menu items, and deals from exact spec.
 * Run: node server/seed.mjs
 */

import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import {
  menuCategories,
  menuItems,
  deals,
} from "../drizzle/schema.ts";

const db = drizzle(process.env.DATABASE_URL);

async function seed() {
  console.log("🌱 Seeding Pizza Home database...");

  // ─── Categories ───────────────────────────────────────────────
  const cats = [
    { name: "Pizza", slug: "pizza", icon: "🍕", sortOrder: 1 },
    { name: "Burgers", slug: "burgers", icon: "🍔", sortOrder: 2 },
    { name: "Wraps", slug: "wraps", icon: "🌯", sortOrder: 3 },
    { name: "Sides", slug: "sides", icon: "🍟", sortOrder: 4 },
    { name: "Drinks", slug: "drinks", icon: "🥤", sortOrder: 5 },
  ];

  await db.insert(menuCategories).values(cats);
  console.log("✅ Categories seeded");

  // Get inserted category IDs
  const allCats = await db.select().from(menuCategories);
  const catMap = {};
  for (const c of allCats) {
    catMap[c.slug] = c.id;
  }

  // ─── Menu Items ───────────────────────────────────────────────
  const items = [
    // Pizzas (with size variants)
    {
      categoryId: catMap.pizza,
      name: "Chicken Fajita",
      description: "Seasoned chicken fajita, capsicum, onions & spicy mayo drizzle on our signature crust",
      image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=400&fit=crop",
      badge: "Bestseller",
      sizeVariants: JSON.stringify({ Small: 899, Medium: 1399, Large: 1899 }),
      sortOrder: 1,
    },
    {
      categoryId: catMap.pizza,
      name: "Chicken Tikka",
      description: "Spicy chicken tikka, onions, green peppers & mozzarella on our signature crust",
      image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=400&fit=crop",
      sizeVariants: JSON.stringify({ Small: 899, Medium: 1399, Large: 1899 }),
      sortOrder: 2,
    },
    {
      categoryId: catMap.pizza,
      name: "Pepperoni Pizza",
      description: "Loaded with double pepperoni, extra mozzarella & our secret tomato sauce",
      image: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400&h=400&fit=crop",
      sizeVariants: JSON.stringify({ Small: 999, Medium: 1499, Large: 1999 }),
      sortOrder: 3,
    },
    {
      categoryId: catMap.pizza,
      name: "BBQ Pizza",
      description: "Smoky BBQ chicken, caramelized onions, jalapeños & cheddar blend",
      image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&h=400&fit=crop",
      sizeVariants: JSON.stringify({ Small: 949, Medium: 1449, Large: 1949 }),
      sortOrder: 4,
    },

    // Burgers (single price)
    {
      categoryId: catMap.burgers,
      name: "Zinger Burger",
      description: "Crispy fried chicken fillet, lettuce, mayo & our signature spicy sauce",
      image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=400&fit=crop",
      badge: "Popular",
      price: "399",
      sortOrder: 1,
    },
    {
      categoryId: catMap.burgers,
      name: "Beef Burger",
      description: "Juicy beef patty, American cheese, pickles & special sauce",
      image: "https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400&h=400&fit=crop",
      price: "449",
      sortOrder: 2,
    },
    {
      categoryId: catMap.burgers,
      name: "Chicken Cheese Burger",
      description: "Grilled chicken breast, melted cheddar, fresh veggies & garlic mayo",
      image: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=400&h=400&fit=crop",
      price: "499",
      sortOrder: 3,
    },

    // Wraps
    {
      categoryId: catMap.wraps,
      name: "Chicken Wrap",
      description: "Marinated grilled chicken, garlic sauce, pickles & fresh veggies in tortilla",
      image: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400&h=400&fit=crop",
      price: "349",
      sortOrder: 1,
    },
    {
      categoryId: catMap.wraps,
      name: "BBQ Wrap",
      description: "Grilled chicken, BBQ sauce, ranch dressing, lettuce & cheddar in tortilla",
      image: "https://images.unsplash.com/photo-1562059390-a761a084768e?w=400&h=400&fit=crop",
      price: "399",
      sortOrder: 2,
    },

    // Sides
    {
      categoryId: catMap.sides,
      name: "Fries",
      description: "Golden crispy fries seasoned with our special spice blend",
      image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=400&fit=crop",
      price: "199",
      sortOrder: 1,
    },
    {
      categoryId: catMap.sides,
      name: "Loaded Fries",
      description: "Fries topped with cheese sauce, jalapeños & crispy chicken bits",
      image: "https://images.unsplash.com/photo-1585109649139-366815a0d713?w=400&h=400&fit=crop",
      badge: "Cheesy",
      price: "399",
      sortOrder: 2,
    },
    {
      categoryId: catMap.sides,
      name: "Nuggets (6 pcs)",
      description: "Crispy breaded chicken nuggets with dipping sauce",
      image: "https://images.unsplash.com/photo-1562967914-608f82629710?w=400&h=400&fit=crop",
      price: "349",
      sortOrder: 3,
    },

    // Drinks
    {
      categoryId: catMap.drinks,
      name: "Coke (500ml)",
      description: "Chilled 500ml Coca-Cola",
      image: "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&h=400&fit=crop",
      price: "120",
      sortOrder: 1,
    },
    {
      categoryId: catMap.drinks,
      name: "1.5L Drink",
      description: "Chilled 1.5L soft drink",
      image: "https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=400&h=400&fit=crop",
      price: "250",
      sortOrder: 2,
    },
    {
      categoryId: catMap.drinks,
      name: "Mint Margarita",
      description: "Refreshing mint margarita with crushed ice",
      image: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&h=400&fit=crop",
      badge: "Refreshing",
      price: "199",
      sortOrder: 3,
    },
  ];

  await db.insert(menuItems).values(items);
  console.log("✅ Menu items seeded");

  // ─── Deals ────────────────────────────────────────────────────
  const DABANG_DEAL_IMAGE = "https://d2xsxph8kpxj0f.cloudfront.net/310519663484184647/FQJeneY9EDa2YDGZx2gkRq/dabang-deal-keQxgnUTKDeD6AM3rzE6nw.webp";
  const HERO_IMAGE = "https://d2xsxph8kpxj0f.cloudfront.net/310519663484184647/FQJeneY9EDa2YDGZx2gkRq/hero-pizza-9dpJxVV3Hx2HrsUQyJQpce.webp";

  const dealData = [
    {
      name: "Dabang Deal",
      description: "1 Large Pizza + 2 Zinger Burgers + 2 Drinks — The ultimate feast!",
      image: DABANG_DEAL_IMAGE,
      badge: "MOST POPULAR",
      price: "1999",
      items: JSON.stringify(["1 Large Pizza", "2 Zinger Burgers", "2 Drinks"]),
      isFeatured: true,
      sortOrder: 1,
    },
    {
      name: "Family Feast",
      description: "2 Large Pizzas + 1 Fries + 1.5L Drink — Feed the whole family!",
      image: HERO_IMAGE,
      badge: "FAMILY",
      price: "2999",
      items: JSON.stringify(["2 Large Pizzas", "1 Fries", "1.5L Drink"]),
      isFeatured: false,
      sortOrder: 2,
    },
    {
      name: "Student Deal",
      description: "1 Medium Pizza + 1 Drink — Perfect for students!",
      image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&h=400&fit=crop",
      badge: "STUDENT",
      price: "999",
      items: JSON.stringify(["1 Medium Pizza", "1 Drink"]),
      isFeatured: false,
      sortOrder: 3,
    },
  ];

  await db.insert(deals).values(dealData);
  console.log("✅ Deals seeded");

  console.log("🎉 Seeding complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
