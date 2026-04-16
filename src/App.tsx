import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { NexoProvider } from "@/components/NexoProvider";
import NexoSyncRoute from "@/components/NexoSyncRoute";
import Index from "./pages/Index";
import AuthCallback from "./pages/AuthCallback";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <NexoProvider>
        <BrowserRouter>
          <NexoSyncRoute>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </NexoSyncRoute>
        </BrowserRouter>
      </NexoProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
