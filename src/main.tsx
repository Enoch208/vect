import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import "./styles/index.css";
import { App } from "./app/App.js";
import { AppBoundary } from "./app/AppBoundary.js";

const root = document.getElementById("root");
if (root === null) throw new Error("The #root element is missing from index.html");

createRoot(root).render(
  <StrictMode>
    <AppBoundary>
      <App />
    </AppBoundary>
  </StrictMode>,
);
