import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { router } from "@/router/routes";
import { Preloader } from "@/components/motion";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 15_000, refetchOnWindowFocus: false },
  },
});

export const App = () => (
  <QueryClientProvider client={queryClient}>
    <RouterProvider router={router} />
    <Preloader />
  </QueryClientProvider>
);
