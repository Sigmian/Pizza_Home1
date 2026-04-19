import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { CartProvider } from "./contexts/CartContext";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

// Customer pages
import Home from "./pages/Home";
import Menu from "./pages/Menu";
import Checkout from "./pages/Checkout";

// Lazy-loaded panels
const AdminPanel = lazy(() => import("./pages/admin/AdminPanel"));
const POS = lazy(() => import("./pages/pos/POS"));
const KitchenDisplay = lazy(() => import("./pages/kitchen/KitchenDisplay"));
const RiderPanel = lazy(() => import("./pages/rider/RiderPanel"));
const OrderTracking = lazy(() => import("./pages/OrderTracking"));

function PageLoader() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        {/* Customer */}
        <Route path="/" component={Home} />
        <Route path="/menu" component={Menu} />
        <Route path="/checkout" component={Checkout} />
        <Route path="/track/:orderNumber" component={OrderTracking} />

        {/* Admin */}
        <Route path="/admin" component={AdminPanel} />
        <Route path="/admin/:rest*" component={AdminPanel} />

        {/* POS */}
        <Route path="/pos" component={POS} />

        {/* Kitchen Display */}
        <Route path="/kitchen" component={KitchenDisplay} />

        {/* Rider */}
        <Route path="/rider" component={RiderPanel} />
        <Route path="/rider/:rest*" component={RiderPanel} />

        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <CartProvider>
          <TooltipProvider>
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  background: '#1E1E1E',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#F5F5F5',
                },
              }}
            />
            <Router />
          </TooltipProvider>
        </CartProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
