import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export function ProtectedRoute() {
  const { initialized, status, user } = useAuthStore();
  const location = useLocation();

  if (!initialized || status === "loading" || status === "idle") {
    return (
      <div className="grid min-h-screen place-items-center bg-background text-sm text-muted-foreground">
        Securing your workspace...
      </div>
    );
  }

  if (status !== "authenticated" || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
