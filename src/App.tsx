import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/context/ThemeContext";
import { TripProvider } from "@/context/TripContext";

import GlobalLoadingIndicator from "@/components/GlobalLoadingIndicator";

import Index from "./pages/Index";
import Menu from "./pages/Menu";
import Weather from "./pages/Weather";
import TouristSpots from "./pages/TouristSpots";
import HiddenGems from "./pages/HiddenGems";
import Food from "./pages/Food";
import Events from "./pages/Events";
import Markets from "./pages/Markets";
import Transport from "./pages/Transport";
import Help from "./pages/Help";
import Install from "./pages/Install";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TripProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />

          <GlobalLoadingIndicator />

          <HashRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/menu" element={<Menu />} />
              <Route path="/weather" element={<Weather />} />
              <Route path="/tourist-spots" element={<TouristSpots />} />
              <Route path="/hidden-gems" element={<HiddenGems />} />
              <Route path="/food" element={<Food />} />
              <Route path="/events" element={<Events />} />
              <Route path="/markets" element={<Markets />} />
              <Route path="/transport" element={<Transport />} />
              <Route path="/help" element={<Help />} />
              <Route path="/install" element={<Install />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </HashRouter>
        </TooltipProvider>
      </TripProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
