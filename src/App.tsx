
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { DataProvider } from "@/contexts/DataContext";
import { AppShell } from "@/components/layout/app-shell";
import Dashboard from "./pages/Dashboard";
import Accounts from "./pages/Accounts";
import Demand from "./pages/Demand";
import Analytics from "./pages/Analytics";
import NotFound from "./pages/NotFound";
import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App = () => {
  const [backendError, setBackendError] = useState(false);

  // Check backend connection on startup
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/health');
        if (!response.ok) {
          setBackendError(true);
        }
      } catch (error) {
        console.error('Backend connection error:', error);
        setBackendError(true);
      }
    };

    checkBackend();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <DataProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            
            {backendError && (
              <Alert variant="destructive" className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-[90%] max-w-md">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Backend Connection Error</AlertTitle>
                <AlertDescription>
                  Cannot connect to the Python backend. Make sure you start the backend with:
                  <pre className="mt-2 bg-black/10 p-2 rounded text-xs">
                    uvicorn backend_code:app --reload
                  </pre>
                </AlertDescription>
              </Alert>
            )}
            
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<Navigate to="/" replace />} />
                
                <Route element={<AppShell />}>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/accounts" element={<Accounts />} />
                  <Route path="/demand" element={<Demand />} />
                  <Route path="/analytics" element={<Analytics />} />
                </Route>
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </DataProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
