import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import gsap from "gsap";
import App from "./App";

if (import.meta.env.DEV) {
  // Handy for poking at animations from the devtools console during development.
  (window as unknown as { __gsap: typeof gsap }).__gsap = gsap;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
