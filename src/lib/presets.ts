import type { ElementKind, Project, StageElement, Tween } from "./types";
import { uid } from "./ids";

export const PALETTE = ["#ffb020", "#62d2ff", "#7cf2a6", "#ff6b5d", "#ff7ab6", "#c9b8ff", "#f2f1ee"];

export function el(kind: ElementKind, n: number, color: string, group = kind, text?: string): StageElement {
  return { id: `${kind}-${n}`, kind, group, color, ...(text ? { text } : {}) };
}

export function tw(partial: Partial<Tween> & { target: string }): Tween {
  return {
    id: uid(),
    method: "to",
    vars: {},
    fromVars: {},
    duration: 1,
    delay: 0,
    ease: "power2.out",
    repeat: 0,
    yoyo: false,
    stagger: 0,
    staggerFrom: "start",
    position: "",
    enabled: true,
    ...partial,
  };
}

export interface Preset {
  id: string;
  name: string;
  blurb: string;
  tags: string[];
  build: () => Project;
}

const base = (name: string, layout: Project["layout"] = "row"): Pick<Project, "version" | "name" | "layout" | "timeline"> => ({
  version: 1,
  name,
  layout,
  timeline: { repeat: 0, yoyo: false, repeatDelay: 0 },
});

export const PRESETS: Preset[] = [
  {
    id: "welcome",
    name: "Welcome sequence",
    blurb: "A short choreography that touches stagger, elastic and position parameters.",
    tags: ["timeline", "stagger", "elastic"],
    build: () => ({
      ...base("Welcome sequence"),
      timeline: { repeat: -1, yoyo: true, repeatDelay: 0.6 },
      elements: [el("box", 1, "#ffb020"), el("box", 2, "#ffb020"), el("box", 3, "#ffb020"), el("circle", 1, "#62d2ff")],
      tweens: [
        tw({ target: ".box", method: "from", vars: { y: 48, opacity: 0 }, duration: 0.8, ease: "power3.out", stagger: 0.08 }),
        tw({ target: "#circle-1", method: "from", vars: { scale: 0 }, duration: 1.1, ease: "elastic.out(1, 0.45)", position: "-=0.4" }),
        tw({ target: ".box", vars: { rotation: 90, borderRadius: 36 }, duration: 0.7, ease: "back.out(1.7)", stagger: 0.06, position: "-=0.6" }),
      ],
    }),
  },
  {
    id: "stagger-reveal",
    name: "Stagger reveal",
    blurb: "The classic entrance. Elements rise and fade in one after another.",
    tags: ["from", "stagger"],
    build: () => ({
      ...base("Stagger reveal"),
      timeline: { repeat: -1, yoyo: false, repeatDelay: 0.8 },
      elements: [1, 2, 3, 4, 5].map((n) => el("box", n, PALETTE[(n - 1) % 5])),
      tweens: [tw({ target: ".box", method: "from", vars: { y: 40, opacity: 0 }, duration: 0.9, ease: "power3.out", stagger: 0.09 })],
    }),
  },
  {
    id: "grid-wave",
    name: "Grid wave",
    blurb: "Nine tiles pop in from the center outward. Stagger with a `from` origin.",
    tags: ["stagger", "grid", "back"],
    build: () => ({
      ...base("Grid wave", "grid"),
      timeline: { repeat: -1, yoyo: true, repeatDelay: 0.5 },
      elements: Array.from({ length: 9 }, (_, i) => el("box", i + 1, i === 4 ? "#ffb020" : "#f2f1ee")),
      tweens: [
        tw({ target: ".box", method: "from", vars: { scale: 0, opacity: 0 }, duration: 0.7, ease: "back.out(1.7)", stagger: 0.07, staggerFrom: "center" }),
        tw({ target: ".box", vars: { rotation: 45, borderRadius: 36 }, duration: 0.6, ease: "power2.inOut", stagger: 0.05, staggerFrom: "edges", position: "-=0.2" }),
      ],
    }),
  },
  {
    id: "text-rise",
    name: "Text rise",
    blurb: "Each word lifts out of an invisible mask. Target the generated `.word` spans.",
    tags: ["text", "stagger", "from"],
    build: () => ({
      ...base("Text rise", "column"),
      timeline: { repeat: -1, yoyo: false, repeatDelay: 1 },
      elements: [el("text", 1, "#f2f1ee", "text", "Motion makes meaning"), el("pill", 1, "#ffb020")],
      tweens: [
        tw({ target: ".word", method: "from", vars: { yPercent: 110, opacity: 0, rotation: 6 }, duration: 0.9, ease: "power4.out", stagger: 0.08 }),
        tw({ target: "#pill-1", method: "from", vars: { scaleX: 0, transformOrigin: "left center" }, duration: 0.8, ease: "expo.out", position: "-=0.5" }),
      ],
    }),
  },
  {
    id: "elastic-pop",
    name: "Elastic pop",
    blurb: "A single circle springs into place. Tweak the elastic amplitude and period.",
    tags: ["elastic", "scale"],
    build: () => ({
      ...base("Elastic pop"),
      timeline: { repeat: -1, yoyo: false, repeatDelay: 0.7 },
      elements: [el("circle", 1, "#62d2ff")],
      tweens: [tw({ target: "#circle-1", method: "from", vars: { scale: 0, rotation: -90 }, duration: 1.4, ease: "elastic.out(1, 0.4)" })],
    }),
  },
  {
    id: "bounce-in",
    name: "Bounce drop",
    blurb: "Gravity, faked. A box falls in and bounces to rest.",
    tags: ["bounce", "from"],
    build: () => ({
      ...base("Bounce drop"),
      timeline: { repeat: -1, yoyo: false, repeatDelay: 0.6 },
      elements: [el("box", 1, "#ff6b5d"), el("box", 2, "#ffb020"), el("box", 3, "#7cf2a6")],
      tweens: [
        tw({ target: ".box", method: "from", vars: { y: -240, opacity: 0 }, duration: 1.3, ease: "bounce.out", stagger: 0.12 }),
        tw({ target: ".box", vars: { scaleY: 0.85, scaleX: 1.12, transformOrigin: "bottom center" }, duration: 0.12, ease: "power1.out", repeat: 1, yoyo: true, stagger: 0.12, position: "-=0.9" }),
      ],
    }),
  },
  {
    id: "card-flip",
    name: "Card flip",
    blurb: "A 3D flip using rotationY. The stage has perspective applied already.",
    tags: ["3d", "rotationY"],
    build: () => ({
      ...base("Card flip"),
      timeline: { repeat: -1, yoyo: true, repeatDelay: 0.5 },
      elements: [el("box", 1, "#c9b8ff"), el("box", 2, "#c9b8ff"), el("box", 3, "#c9b8ff")],
      tweens: [tw({ target: ".box", vars: { rotationY: 180, backgroundColor: "#ffb020" }, duration: 0.9, ease: "power3.inOut", stagger: 0.1 })],
    }),
  },
  {
    id: "loader",
    name: "Loader dots",
    blurb: "Three dots hop in sequence. A tween-level repeat inside a looping timeline.",
    tags: ["loop", "yoyo", "sine"],
    build: () => ({
      ...base("Loader dots"),
      timeline: { repeat: -1, yoyo: false, repeatDelay: 0.2 },
      elements: [el("circle", 1, "#ffb020"), el("circle", 2, "#ffb020"), el("circle", 3, "#ffb020")],
      tweens: [tw({ target: ".circle", vars: { y: -28, scale: 0.85 }, duration: 0.32, ease: "sine.inOut", repeat: 1, yoyo: true, stagger: 0.14 })],
    }),
  },
  {
    id: "morph",
    name: "Shape morph",
    blurb: "Square to circle, amber to cyan, with a lazy rotation. Yoyo brings it back.",
    tags: ["color", "borderRadius", "yoyo"],
    build: () => ({
      ...base("Shape morph"),
      timeline: { repeat: -1, yoyo: true, repeatDelay: 0.3 },
      elements: [el("box", 1, "#ffb020")],
      tweens: [tw({ target: "#box-1", vars: { borderRadius: 36, backgroundColor: "#62d2ff", rotation: 180, scale: 1.35 }, duration: 1.4, ease: "power2.inOut" })],
    }),
  },
  {
    id: "choreography",
    name: "Position parameters",
    blurb: "Overlapping steps with `<`, `-=` and absolute times. Watch the track view.",
    tags: ["timeline", "position"],
    build: () => ({
      ...base("Position parameters"),
      timeline: { repeat: -1, yoyo: true, repeatDelay: 0.5 },
      elements: [el("box", 1, "#ffb020"), el("box", 2, "#62d2ff"), el("box", 3, "#7cf2a6"), el("pill", 1, "#f2f1ee")],
      tweens: [
        tw({ target: "#box-1", vars: { x: 120, rotation: 180 }, duration: 0.8, ease: "power3.inOut" }),
        tw({ target: "#box-2", vars: { y: -70 }, duration: 0.8, ease: "power3.inOut", position: "<" }),
        tw({ target: "#box-3", vars: { x: -120, rotation: -180 }, duration: 0.8, ease: "power3.inOut", position: "<0.15" }),
        tw({ target: "#pill-1", method: "from", vars: { scaleX: 0, opacity: 0 }, duration: 0.6, ease: "expo.out", position: "-=0.3" }),
        tw({ target: ".box", vars: { scale: 0.7, borderRadius: 36 }, duration: 0.5, ease: "back.inOut(2)", stagger: 0.05, position: "+=0.1" }),
      ],
    }),
  },
  {
    id: "skew-slide",
    name: "Skew slide",
    blurb: "A pill slides in with skew and expo easing, a favourite for hero UI.",
    tags: ["expo", "skew", "xPercent"],
    build: () => ({
      ...base("Skew slide", "column"),
      timeline: { repeat: -1, yoyo: false, repeatDelay: 0.8 },
      elements: [el("pill", 1, "#ffb020"), el("pill", 2, "#f2f1ee"), el("pill", 3, "#62d2ff")],
      tweens: [tw({ target: ".pill", method: "from", vars: { xPercent: -160, skewX: 28, opacity: 0 }, duration: 1, ease: "expo.out", stagger: 0.1 })],
    }),
  },
  {
    id: "blank",
    name: "Blank stage",
    blurb: "Three boxes, no tweens. Start from nothing.",
    tags: ["empty"],
    build: () => ({
      ...base("Untitled animation"),
      elements: [el("box", 1, "#ffb020"), el("box", 2, "#ffb020"), el("box", 3, "#ffb020")],
      tweens: [],
    }),
  },
];

export function presetById(id: string): Preset | undefined {
  return PRESETS.find((p) => p.id === id);
}

export function defaultProject(): Project {
  return PRESETS[0].build();
}
