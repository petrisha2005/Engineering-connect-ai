import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export function PublicOnlyRoute() {
  const { initialized, status, user } = useAuthStore();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? "/dashboard";

  if (!initialized || status === "loading" || status === "idle") {
    return (
      <div className="grid min-h-screen place-items-center bg-background text-sm text-muted-foreground">
        Checking your session...
      </div>
    );
  }

  if (status === "authenticated" && user) {
    return <Navigate to={from} replace />;
  }

  return <Outlet />;
}
