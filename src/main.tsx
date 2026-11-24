import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { DestroyRoute } from "./DestroyRoute.tsx";

const params = new URLSearchParams(window.location.search);
const isDestroy = params.get("mode") === "destroy";

createRoot(document.getElementById("root")!).render(
  <StrictMode>{isDestroy ? <DestroyRoute /> : <App />}</StrictMode>,
);
