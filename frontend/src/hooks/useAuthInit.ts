import { useEffect } from "react";
import { useAuthStore } from "../store/authStore";

export function useAuthInit() {
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    const unsubscribe = initialize();
    return unsubscribe;
  }, [initialize]);
}

