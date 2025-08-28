import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "./components/layout/MainLayout";
import { Dashboard } from "./pages/Dashboard";
import { Customers } from "./pages/Customers";
import { Projects } from "./pages/Projects";
import { Admin } from "./pages/Admin";
import { Visit } from "./pages/Visit";
import { Auth } from "./pages/Auth";
import { GoogleCallback } from "./pages/GoogleCallback";
import { SimpleCallback } from "./pages/SimpleCallback";
import { TestCallback } from "./pages/TestCallback";
import NotFound from "./pages/NotFound";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/auth" element={<Auth />} />
          <Route path="/google/callback" element={<GoogleCallback />} />
          <Route path="/test/callback" element={<TestCallback />} />
          
          {/* Protected routes */}
          <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="customers" element={<Customers />} />
            <Route path="projects" element={<Projects />} />
            <Route path="visit/:customerId" element={<Visit />} />
            <Route path="reports" element={<div className="p-8 text-center text-muted-foreground">Reports page coming soon...</div>} />
            <Route path="admin" element={<Admin />} />
            <Route path="help" element={<div className="p-8 text-center text-muted-foreground">Help & Demo page coming soon...</div>} />
          </Route>
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
