import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { getSiteContent } from "@/lib/supabaseClient";
import { mergeCmsContent } from "@/lib/cms";
import { applySiteTheme, readCachedSiteTheme } from "@/lib/theme";
import { SessionProvider } from "./components/SessionProvider";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Admin from "./pages/Admin";
import PublicCatalog from "./pages/PublicCatalog";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ThemeBootstrap() {
  useEffect(() => {
    applySiteTheme(readCachedSiteTheme(), false);
    let active = true;
    getSiteContent()
      .then((savedContent) => {
        if (active && savedContent) applySiteTheme(mergeCmsContent(savedContent).theme, true);
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);
  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <SessionProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ThemeBootstrap />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/productos" element={<PublicCatalog kind="products" />} />
            <Route path="/produtos" element={<PublicCatalog kind="products" />} />
            <Route path="/servicios" element={<PublicCatalog kind="services" />} />
            <Route path="/contacto" element={<PublicCatalog kind="contact" />} />
            {/* Compatibility routes kept for links from earlier versions. */}
            <Route path="/servicos" element={<PublicCatalog kind="services" />} />
            <Route path="/contato" element={<PublicCatalog kind="contact" />} />
            <Route path="/galeria" element={<PublicCatalog kind="gallery" />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </SessionProvider>
  </QueryClientProvider>
);

export default App;
