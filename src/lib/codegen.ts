import type { Project, StageElement, Tween, VarValue, Vars } from "./types";

export type Framework = "vanilla" | "react" | "vue" | "svelte" | "html";

export const FRAMEWORKS: { id: Framework; label: string; file: string }[] = [
  { id: "vanilla", label: "Vanilla JS", file: "animation.js" },
  { id: "react", label: "React", file: "Animation.jsx" },
  { id: "vue", label: "Vue", file: "Animation.vue" },
  { id: "svelte", label: "Svelte", file: "Animation.svelte" },
  { id: "html", label: "HTML + CSS", file: "index.html" },
];

const IND = "  ";
const MAX_WIDTH = 84;

export function fmtNum(n: number): string {
  if (!Number.isFinite(n)) return "0";
  return String(Number(n.toFixed(3)));
}

function fmtValue(v: VarValue): string {
  return typeof v === "number" ? fmtNum(v) : JSON.stringify(v);
}

type Pair = [string, string];

function varPairs(vars: Vars): Pair[] {
  return Object.entries(vars).map(([k, v]) => [k, fmtValue(v)]);
}

function timingPairs(t: Tween): Pair[] {
  const out: Pair[] = [["duration", fmtNum(t.duration)]];
  if (t.delay) out.push(["delay", fmtNum(t.delay)]);
  out.push(["ease", JSON.stringify(t.ease || "power2.out")]);
  if (t.repeat) out.push(["repeat", String(t.repeat)]);
  if (t.repeat && t.yoyo) out.push(["yoyo", "true"]);
  if (t.stagger) {
    out.push([
      "stagger",
      t.staggerFrom === "start" ? fmtNum(t.stagger) : `{ each: ${fmtNum(t.stagger)}, from: ${JSON.stringify(t.staggerFrom)} }`,
    ]);
  }
  return out;
}

function inlineObject(pairs: Pair[]): string {
  if (!pairs.length) return "{}";
  return `{ ${pairs.map(([k, v]) => `${k}: ${v}`).join(", ")} }`;
}

function expandedObject(pairs: Pair[], indent: string): string {
  if (!pairs.length) return "{}";
  return `{\n${pairs.map(([k, v]) => `${indent}${IND}${k}: ${v},`).join("\n")}\n${indent}}`;
}

function positionArg(position: string): string | null {
  const p = position.trim();
  if (!p) return null;
  if (/^-?\d+(\.\d+)?$/.test(p)) return p;
  return JSON.stringify(p);
}

/** Render one `tl.method(...)` statement, Prettier-style. */
export function tweenStatement(t: Tween, indent = "", receiver = "tl"): string {
  const target = JSON.stringify(t.target);
  const pos = positionArg(t.position);
  const objects: Pair[][] = t.method === "fromTo" ? [varPairs(t.fromVars), [...varPairs(t.vars), ...timingPairs(t)]] : [[...varPairs(t.vars), ...timingPairs(t)]];

  const inlineArgs = [target, ...objects.map(inlineObject), ...(pos ? [pos] : [])];
  const inline = `${indent}${receiver}.${t.method}(${inlineArgs.join(", ")});`;
  if (inline.length <= MAX_WIDTH) return inline;

  // Single object that doesn't fit: expand the object but keep the call on one line.
  if (objects.length === 1) {
    const args = [target, expandedObject(objects[0], indent), ...(pos ? [pos] : [])];
    return `${indent}${receiver}.${t.method}(${args.join(", ")});`;
  }

  // fromTo: break every argument onto its own line.
  const inner = indent + IND;
  const args = [target, ...objects.map((o) => (inlineObject(o).length + inner.length <= MAX_WIDTH ? inlineObject(o) : expandedObject(o, inner))), ...(pos ? [pos] : [])];
  return `${indent}${receiver}.${t.method}(\n${args.map((a) => inner + a).join(",\n")}\n${indent});`;
}

function timelineVars(p: Project): string {
  const pairs: Pair[] = [];
  if (p.timeline.repeat) pairs.push(["repeat", String(p.timeline.repeat)]);
  if (p.timeline.repeat && p.timeline.yoyo) pairs.push(["yoyo", "true"]);
  if (p.timeline.repeat && p.timeline.repeatDelay) pairs.push(["repeatDelay", fmtNum(p.timeline.repeatDelay)]);
  return pairs.length ? inlineObject(pairs) : "";
}

/** The animation body: timeline creation + tween statements. No imports. */
export function animationBody(p: Project, indent = ""): string {
  const tweens = p.tweens.filter((t) => t.enabled);
  const lines: string[] = [`${indent}const tl = gsap.timeline(${timelineVars(p)});`];
  if (!tweens.length) {
    lines.push("", `${indent}// Add a tween in the Sequence panel to get started.`);
    return lines.join("\n");
  }
  const statements = tweens.map((t) => tweenStatement(t, indent));
  const anyMultiline = statements.some((s) => s.includes("\n"));
  lines.push("");
  lines.push(statements.join(anyMultiline ? "\n\n" : "\n"));
  return lines.join("\n");
}

/* ---------- Markup ---------- */

export function elementTag(el: StageElement): string {
  return el.kind === "text" ? "p" : "div";
}

export function elementInner(el: StageElement): string {
  if (el.kind !== "text") return "";
  const words = (el.text ?? "").split(/\s+/).filter(Boolean);
  return words.map((w) => `<span class="word">${escapeHtml(w)}</span>`).join(" ");
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function markupHtml(p: Project, indent = "", jsx = false): string {
  const cls = jsx ? "className" : "class";
  const lines = p.elements.map((el) => {
    const tag = elementTag(el);
    const inner = elementInner(el);
    if (!inner) return `${indent}${IND}<${tag} id="${el.id}" ${cls}="${el.group}"${jsx ? " />" : `></${tag}>`}`;
    const innerJsx = jsx ? inner.replaceAll('class="word"', 'className="word"') : inner;
    return `${indent}${IND}<${tag} id="${el.id}" ${cls}="${el.group}">${innerJsx}</${tag}>`;
  });
  return lines.join("\n");
}

const KIND_CSS: Record<StageElement["kind"], string[]> = {
  box: ["width: 72px", "height: 72px", "border-radius: 12px"],
  circle: ["width: 72px", "height: 72px", "border-radius: 50%"],
  pill: ["width: 132px", "height: 44px", "border-radius: 999px"],
  ring: ["width: 72px", "height: 72px", "border-radius: 50%", "border: 6px solid currentColor"],
  text: ["margin: 0", "font: 600 34px/1.1 system-ui, sans-serif", "letter-spacing: -0.02em"],
};

function layoutCss(p: Project): string[] {
  switch (p.layout) {
    case "column":
      return ["display: flex", "flex-direction: column", "align-items: center", "justify-content: center", "gap: 24px"];
    case "grid":
      return ["display: grid", "grid-template-columns: repeat(3, max-content)", "justify-content: center", "align-content: center", "gap: 24px"];
    default:
      return ["display: flex", "flex-wrap: wrap", "align-items: center", "justify-content: center", "gap: 24px"];
  }
}

function rule(selector: string, decls: string[]): string {
  return `${selector} {\n${decls.map((d) => `${IND}${d};`).join("\n")}\n}`;
}

export function stylesCss(p: Project): string {
  const lines: string[] = [];
  lines.push(rule(".stage", [...layoutCss(p), "min-height: 320px", "padding: 48px", "perspective: 900px", "background: #0f0f10"]));
  const groups = new Map<string, StageElement>();
  for (const el of p.elements) if (!groups.has(el.group)) groups.set(el.group, el);
  for (const [group, el] of groups) lines.push(rule(`.${group}`, KIND_CSS[el.kind]));
  for (const el of p.elements) {
    const prop = el.kind === "ring" || el.kind === "text" ? "color" : "background";
    lines.push(`#${el.id} { ${prop}: ${el.color}; }`);
  }
  if (p.elements.some((e) => e.kind === "text")) lines.push(`.word { display: inline-block; }`);
  return lines.join("\n");
}

/* ---------- Framework outputs ---------- */

export function generateVanilla(p: Project): string {
  return `import gsap from "gsap";\n\n${animationBody(p)}\n`;
}

export function generateReact(p: Project): string {
  return `import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

export function Animation() {
  const scope = useRef(null);

  useGSAP(
    () => {
${animationBody(p, IND + IND + IND)}
    },
    { scope }
  );

  return (
    <div ref={scope} className="stage">
${markupHtml(p, IND + IND, true)}
    </div>
  );
}
`;
}

export function generateVue(p: Project): string {
  return `<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import gsap from "gsap";

const scope = ref(null);
let ctx;

onMounted(() => {
  ctx = gsap.context(() => {
${animationBody(p, IND + IND)}
  }, scope.value);
});

onUnmounted(() => ctx?.revert());
</script>

<template>
  <div ref="scope" class="stage">
${markupHtml(p, IND)}
  </div>
</template>
`;
}

export function generateSvelte(p: Project): string {
  return `<script>
  import { onMount } from "svelte";
  import gsap from "gsap";

  let scope;

  onMount(() => {
    const ctx = gsap.context(() => {
${animationBody(p, IND + IND + IND)}
    }, scope);

    return () => ctx.revert();
  });
</script>

<div bind:this={scope} class="stage">
${markupHtml(p, "")}
</div>
`;
}

export function generateHtml(p: Project): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(p.name || "GSAP animation")}</title>
    <style>
${stylesCss(p)
  .split("\n")
  .map((l) => (l ? IND + IND + IND + l : l))
  .join("\n")}
    </style>
  </head>
  <body>
    <div class="stage">
${markupHtml(p, IND + IND)}
    </div>

    <script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js"></script>
    <script>
${animationBody(p, IND + IND + IND)}
    </script>
  </body>
</html>
`;
}

export function generate(p: Project, framework: Framework): string {
  switch (framework) {
    case "react":
      return generateReact(p);
    case "vue":
      return generateVue(p);
    case "svelte":
      return generateSvelte(p);
    case "html":
      return generateHtml(p);
    default:
      return generateVanilla(p);
  }
}
