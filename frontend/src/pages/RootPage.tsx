import { Outlet } from "react-router-dom";
import { useAuthInit } from "../hooks/useAuthInit";

export function RootPage() {
  useAuthInit();
  return <Outlet />;
}

