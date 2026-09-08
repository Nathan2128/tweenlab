import type { VarValue } from "./types";

export type PropGroup = "Transform" | "Appearance" | "Size";

export interface PropDef {
  key: string;
  label: string;
  group: PropGroup;
  type: "number" | "color" | "select";
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  default: VarValue;
  /** Value used as the resting/origin state when a fromTo pair is created */
  rest?: VarValue;
  options?: string[];
  hint?: string;
}

export const PROPS: PropDef[] = [
  { key: "x", label: "x", group: "Transform", type: "number", min: -400, max: 400, step: 1, unit: "px", default: 160, rest: 0, hint: "translateX" },
  { key: "y", label: "y", group: "Transform", type: "number", min: -300, max: 300, step: 1, unit: "px", default: -80, rest: 0, hint: "translateY" },
  { key: "xPercent", label: "xPercent", group: "Transform", type: "number", min: -300, max: 300, step: 1, unit: "%", default: 100, rest: 0, hint: "translateX relative to own width" },
  { key: "yPercent", label: "yPercent", group: "Transform", type: "number", min: -300, max: 300, step: 1, unit: "%", default: -100, rest: 0 },
  { key: "rotation", label: "rotation", group: "Transform", type: "number", min: -720, max: 720, step: 1, unit: "°", default: 360, rest: 0 },
  { key: "rotationX", label: "rotationX", group: "Transform", type: "number", min: -360, max: 360, step: 1, unit: "°", default: 180, rest: 0, hint: "3D flip around the x axis" },
  { key: "rotationY", label: "rotationY", group: "Transform", type: "number", min: -360, max: 360, step: 1, unit: "°", default: 180, rest: 0, hint: "3D flip around the y axis" },
  { key: "scale", label: "scale", group: "Transform", type: "number", min: 0, max: 3, step: 0.01, unit: "×", default: 1.5, rest: 1 },
  { key: "scaleX", label: "scaleX", group: "Transform", type: "number", min: 0, max: 3, step: 0.01, unit: "×", default: 1.5, rest: 1 },
  { key: "scaleY", label: "scaleY", group: "Transform", type: "number", min: 0, max: 3, step: 0.01, unit: "×", default: 1.5, rest: 1 },
  { key: "skewX", label: "skewX", group: "Transform", type: "number", min: -75, max: 75, step: 1, unit: "°", default: 20, rest: 0 },
  { key: "skewY", label: "skewY", group: "Transform", type: "number", min: -75, max: 75, step: 1, unit: "°", default: 20, rest: 0 },
  {
    key: "transformOrigin",
    label: "transformOrigin",
    group: "Transform",
    type: "select",
    default: "center",
    rest: "center",
    options: ["center", "top left", "top center", "top right", "left center", "right center", "bottom left", "bottom center", "bottom right"],
    hint: "Pivot point for rotation and scale",
  },
  { key: "opacity", label: "opacity", group: "Appearance", type: "number", min: 0, max: 1, step: 0.01, default: 0, rest: 1 },
  { key: "backgroundColor", label: "backgroundColor", group: "Appearance", type: "color", default: "#62d2ff", rest: "#ffb020" },
  { key: "color", label: "color", group: "Appearance", type: "color", default: "#ffb020", rest: "#f2f1ee", hint: "Text color" },
  { key: "borderRadius", label: "borderRadius", group: "Appearance", type: "number", min: 0, max: 64, step: 1, unit: "px", default: 36, rest: 12 },
  { key: "width", label: "width", group: "Size", type: "number", min: 8, max: 320, step: 1, unit: "px", default: 144, rest: 72 },
  { key: "height", label: "height", group: "Size", type: "number", min: 8, max: 320, step: 1, unit: "px", default: 144, rest: 72 },
];

export const PROP_MAP: Record<string, PropDef> = Object.fromEntries(PROPS.map((p) => [p.key, p]));

export const PROP_GROUPS: PropGroup[] = ["Transform", "Appearance", "Size"];

export function propDef(key: string): PropDef {
  return PROP_MAP[key] ?? { key, label: key, group: "Appearance", type: "number", default: 0 };
}
