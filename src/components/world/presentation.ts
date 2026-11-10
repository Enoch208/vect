import { createContext } from "react";

export type Presentation = {
  view: "follow" | "overview" | "elevation";
  labels: boolean;
};

export const PresentationContext = createContext<Presentation>({ view: "follow", labels: true });
