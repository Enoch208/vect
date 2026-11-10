import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import "../../../styles/index.css";
import { Landing } from "../index.js";
import { PrimitivesGallery } from "./PrimitivesGallery.js";
import { Elevation } from "../blueprint/Elevation.js";
import { observatory, observatoryKeyBehindDoor } from "../../../fixtures/observatory.js";
import { Plan } from "../blueprint/Plan.js";
import { fluidUnit } from "../primitives/type.js";
import { findingCallouts } from "../blueprint/plan-callouts.js";
import { checkWorld } from "../../../verification/check-world.js";

const root = document.getElementById("root");
if (root === null) throw new Error("The #root element is missing from the landing harness");

const report = (event: string) => () => {
  document.body.dataset["lastLandingEvent"] = event;
};

createRoot(root).render(
  <StrictMode>
    {window.location.hash === "#plan" ? (
      <div className={`${fluidUnit} flex flex-col gap-10 bg-paper p-10`}>
        <Plan world={observatory} />
        <Plan
          world={observatoryKeyBehindDoor}
          callouts={findingCallouts(observatoryKeyBehindDoor, checkWorld(observatoryKeyBehindDoor))}
        />
      </div>
    ) : window.location.hash === "#elevation" ? (
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
