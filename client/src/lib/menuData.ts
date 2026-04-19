/*
 * Pizza Home — Menu Data
 * Design: "Midnight Feast" — Bold Dark Premium with Fire Accents
 * All prices in PKR (Rs.)
 */

export type Category = "pizza" | "burgers" | "wraps" | "sides" | "drinks";

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: Category;
  image: string;
  badge?: string;
}

export interface DealItem {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  badge?: string;
  featured?: boolean;
  items: string[];
}

export const categories: { id: Category; label: string; icon: string }[] = [
  { id: "pizza", label: "Pizza", icon: "🍕" },
  { id: "burgers", label: "Burgers", icon: "🍔" },
  { id: "wraps", label: "Wraps", icon: "🌯" },
  { id: "sides", label: "Sides", icon: "🍟" },
  { id: "drinks", label: "Drinks", icon: "🥤" },
];

export const HERO_IMAGE = "https://d2xsxph8kpxj0f.cloudfront.net/310519663484184647/FQJeneY9EDa2YDGZx2gkRq/hero-pizza-9dpJxVV3Hx2HrsUQyJQpce.webp";
export const DABANG_DEAL_IMAGE = "https://d2xsxph8kpxj0f.cloudfront.net/310519663484184647/FQJeneY9EDa2YDGZx2gkRq/dabang-deal-keQxgnUTKDeD6AM3rzE6nw.webp";
export const BURGER_IMAGE = "https://d2xsxph8kpxj0f.cloudfront.net/310519663484184647/FQJeneY9EDa2YDGZx2gkRq/burger-hero-T5KeHKZuWTNMiqxQBMvsx7.webp";
export const WRAPS_IMAGE = "https://d2xsxph8kpxj0f.cloudfront.net/310519663484184647/FQJeneY9EDa2YDGZx2gkRq/wraps-hero-4VMuH358Bm4AuArB7xRiGN.webp";
export const SIDES_IMAGE = "https://d2xsxph8kpxj0f.cloudfront.net/310519663484184647/FQJeneY9EDa2YDGZx2gkRq/sides-drinks-SV3mtXPk8Jvjgznw5ow7GH.webp";

export const menuItems: MenuItem[] = [
  // Pizzas
  {
    id: "p1",
    name: "Chicken Tikka Pizza",
    description: "Spicy chicken tikka, onions, green peppers & mozzarella on our signature crust",
    price: 899,
    category: "pizza",
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=400&fit=crop",
    badge: "Bestseller",
  },
  {
    id: "p2",
    name: "Pepperoni Feast",
    description: "Loaded with double pepperoni, extra mozzarella & our secret tomato sauce",
    price: 999,
    category: "pizza",
    image: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400&h=400&fit=crop",
  },
  {
    id: "p3",
    name: "BBQ Chicken Pizza",
    description: "Smoky BBQ chicken, caramelized onions, jalapeños & cheddar blend",
    price: 949,
    category: "pizza",
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=400&fit=crop",
  },
  {
    id: "p4",
    name: "Veggie Supreme",
    description: "Fresh mushrooms, bell peppers, olives, onions & tomatoes with herb seasoning",
    price: 799,
    category: "pizza",
    image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&h=400&fit=crop",
  },
  {
    id: "p5",
    name: "Fajita Pizza",
    description: "Seasoned chicken fajita, capsicum, onions & spicy mayo drizzle",
    price: 949,
    category: "pizza",
    image: "https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?w=400&h=400&fit=crop",
  },
  {
    id: "p6",
    name: "Malai Boti Pizza",
    description: "Creamy malai boti chicken, green chillies & garlic sauce on thin crust",
    price: 1049,
    category: "pizza",
    image: "https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=400&h=400&fit=crop",
    badge: "New",
  },

  // Burgers
  {
    id: "b1",
    name: "Zinger Burger",
    description: "Crispy fried chicken fillet, lettuce, mayo & our signature spicy sauce",
    price: 499,
    category: "burgers",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=400&fit=crop",
    badge: "Popular",
  },
  {
    id: "b2",
    name: "Smash Burger",
    description: "Double smashed beef patties, American cheese, pickles & special sauce",
    price: 599,
    category: "burgers",
    image: "https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400&h=400&fit=crop",
  },
  {
    id: "b3",
    name: "Chicken Cheese Burger",
    description: "Grilled chicken breast, melted cheddar, fresh veggies & garlic mayo",
    price: 549,
    category: "burgers",
    image: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=400&h=400&fit=crop",
  },
  {
    id: "b4",
    name: "Tower Burger",
    description: "Triple stacked chicken, hash brown, cheese slice & chipotle sauce",
    price: 699,
    category: "burgers",
    image: "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=400&h=400&fit=crop",
    badge: "Loaded",
  },

  // Wraps
  {
    id: "w1",
    name: "Chicken Shawarma",
    description: "Marinated grilled chicken, garlic sauce, pickles & fresh veggies in pita",
    price: 399,
    category: "wraps",
    image: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400&h=400&fit=crop",
    badge: "Bestseller",
  },
  {
    id: "w2",
    name: "Zinger Wrap",
    description: "Crispy zinger strip, coleslaw, cheese & spicy mayo in tortilla",
    price: 449,
    category: "wraps",
    image: "https://images.unsplash.com/photo-1600891964599-f61ba0e24092?w=400&h=400&fit=crop",
  },
  {
    id: "w3",
    name: "BBQ Ranch Wrap",
    description: "Grilled chicken, BBQ sauce, ranch dressing, lettuce & cheddar",
    price: 479,
    category: "wraps",
    image: "https://images.unsplash.com/photo-1562059390-a761a084768e?w=400&h=400&fit=crop",
  },

  // Sides
  {
    id: "s1",
    name: "French Fries",
    description: "Golden crispy fries seasoned with our special spice blend",
    price: 199,
    category: "sides",
    image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=400&fit=crop",
  },
  {
    id: "s2",
    name: "Chicken Nuggets (8pc)",
    description: "Crispy breaded chicken nuggets with dipping sauce",
    price: 349,
    category: "sides",
    image: "https://images.unsplash.com/photo-1562967914-608f82629710?w=400&h=400&fit=crop",
  },
  {
    id: "s3",
    name: "Loaded Fries",
    description: "Fries topped with cheese sauce, jalapeños & crispy chicken bits",
    price: 399,
    category: "sides",
    image: "https://images.unsplash.com/photo-1585109649139-366815a0d713?w=400&h=400&fit=crop",
    badge: "Cheesy",
  },
  {
    id: "s4",
    name: "Coleslaw",
    description: "Fresh creamy coleslaw with shredded cabbage & carrots",
    price: 149,
    category: "sides",
    image: "https://images.unsplash.com/photo-1625938145744-e380515399bf?w=400&h=400&fit=crop",
  },

  // Drinks
  {
    id: "d1",
    name: "Coca-Cola",
    description: "Chilled 500ml Coca-Cola",
    price: 120,
    category: "drinks",
    image: "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&h=400&fit=crop",
  },
  {
    id: "d2",
    name: "Pepsi",
    description: "Chilled 500ml Pepsi",
    price: 120,
    category: "drinks",
    image: "https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=400&h=400&fit=crop",
  },
  {
    id: "d3",
    name: "Fresh Lime Soda",
    description: "Freshly squeezed lime with soda water & mint",
    price: 179,
    category: "drinks",
    image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400&h=400&fit=crop",
  },
  {
    id: "d4",
    name: "Mint Margarita",
    description: "Refreshing mint margarita with crushed ice",
    price: 199,
    category: "drinks",
    image: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&h=400&fit=crop",
    badge: "Refreshing",
  },
];

export const deals: DealItem[] = [
  {
    id: "deal1",
    name: "Dabang Deal",
    description: "2 Large Pizzas + Fries + 2 Drinks — The ultimate feast for the whole family!",
    price: 1999,
    originalPrice: 2799,
    image: DABANG_DEAL_IMAGE,
    badge: "MOST POPULAR",
    featured: true,
    items: ["2x Large Pizza", "French Fries", "2x Drinks"],
  },
  {
    id: "deal2",
    name: "Solo Crunch Deal",
    description: "1 Zinger Burger + Fries + Drink — Perfect for one!",
    price: 699,
    originalPrice: 899,
    image: BURGER_IMAGE,
    badge: "VALUE",
    items: ["Zinger Burger", "French Fries", "1x Drink"],
  },
  {
    id: "deal3",
    name: "Pizza Party Deal",
    description: "1 Large Pizza + 4 Chicken Nuggets + 1.5L Drink",
    price: 1299,
    originalPrice: 1699,
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&h=400&fit=crop",
    badge: "PARTY",
    items: ["1x Large Pizza", "4x Nuggets", "1.5L Drink"],
  },
  {
    id: "deal4",
    name: "Wrap Combo",
    description: "2 Chicken Shawarmas + Fries + 2 Drinks",
    price: 999,
    originalPrice: 1299,
    image: WRAPS_IMAGE,
    items: ["2x Shawarma", "French Fries", "2x Drinks"],
  },
  {
    id: "deal5",
    name: "Burger Bonanza",
    description: "2 Smash Burgers + Loaded Fries + 2 Drinks",
    price: 1499,
    originalPrice: 1899,
    image: "https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=600&h=400&fit=crop",
    badge: "HOT",
    items: ["2x Smash Burger", "Loaded Fries", "2x Drinks"],
  },
  {
    id: "deal6",
    name: "Midnight Munch",
    description: "1 Pizza + 1 Burger + Fries + 2 Drinks — Late night cravings sorted!",
    price: 1599,
    originalPrice: 2099,
    image: SIDES_IMAGE,
    badge: "NEW",
    items: ["1x Pizza", "1x Burger", "Fries", "2x Drinks"],
  },
];

export const FREE_DELIVERY_THRESHOLD = 1000;
