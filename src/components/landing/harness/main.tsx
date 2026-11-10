import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import "../../../styles/index.css";
import { PrimitivesGallery } from "./PrimitivesGallery.js";

const root = document.getElementById("root");
if (root === null) throw new Error("The #root element is missing from the landing harness");

createRoot(root).render(
  <StrictMode>
    <PrimitivesGallery />
  </StrictMode>,
);
