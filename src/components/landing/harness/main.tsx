import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import "../../../styles/index.css";
import { Landing } from "../index.js";
import { PrimitivesGallery } from "./PrimitivesGallery.js";
import { Elevation } from "../blueprint/Elevation.js";
import { observatory } from "../../../fixtures/observatory.js";

const root = document.getElementById("root");
if (root === null) throw new Error("The #root element is missing from the landing harness");

const report = (event: string) => () => {
  document.body.dataset["lastLandingEvent"] = event;
};

createRoot(root).render(
  <StrictMode>
    {window.location.hash === "#elevation" ? (
      <div className="bg-paper p-10">
        <Elevation world={observatory} />
      </div>
    ) : window.location.hash === "#primitives" ? (
      <PrimitivesGallery />
    ) : (
      <Landing
        onOpenStudio={report("open-studio")}
        onOpenExample={report("open-example")}
        onPrompt={(prompt) => {
          document.body.dataset["lastLandingEvent"] = `prompt:${prompt}`;
        }}
      />
    )}
  </StrictMode>,
);
