import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { router } from "./routes/router";
import "./styles.css";
import { redirectToCanonicalLocalOrigin } from "./utils/localOrigin";

if (!redirectToCanonicalLocalOrigin()) {
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  );
}
