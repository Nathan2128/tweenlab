import gsap from "gsap";

export const EASE_FAMILIES = ["none", "power1", "power2", "power3", "power4", "sine", "expo", "circ", "back", "elastic", "bounce"] as const;
export type EaseFamily = (typeof EASE_FAMILIES)[number];
export const EASE_TYPES = ["in", "out", "inOut"] as const;
export type EaseType = (typeof EASE_TYPES)[number];

export const EASE_DESCRIPTIONS: Record<EaseFamily, string> = {
  none: "Linear. Constant speed, no acceleration.",
  power1: "Gentle. Barely-there acceleration.",
  power2: "The workhorse. Natural, subtle momentum.",
  power3: "Punchy. Fast start or stop with a long settle.",
  power4: "Dramatic. Snaps hard, drifts long.",
  sine: "Soft sinusoidal curve. Great for loops.",
  expo: "Exponential. Extremely sharp then glides.",
  circ: "Circular arc. Abrupt at one end.",
  back: "Overshoots the target, then returns.",
  elastic: "Springs past the target and oscillates.",
  bounce: "Bounces against the end value like a ball.",
};

export function parseEaseString(ease: string): { family: EaseFamily; type: EaseType; config: string } {
  if (!ease || ease === "none" || ease === "linear") return { family: "none", type: "out", config: "" };
  const m = /^([a-zA-Z0-9]+)(?:\.(in|out|inOut))?(\(.*\))?$/.exec(ease.trim());
  if (!m) return { family: "power2", type: "out", config: "" };
  const family = (EASE_FAMILIES as readonly string[]).includes(m[1]) ? (m[1] as EaseFamily) : "power2";
  const type = (m[2] as EaseType) || "out";
  return { family, type, config: m[3] ?? "" };
}

export function buildEaseString(family: EaseFamily, type: EaseType, config = ""): string {
  if (family === "none") return "none";
  return `${family}.${type}${config}`;
}

/** Sample an ease into `n` points in [0,1]. Returns [] for invalid eases. */
export function sampleEase(ease: string, n = 64): number[] {
  const fn = gsap.parseEase(ease);
  if (!fn) return [];
  const out: number[] = [];
  for (let i = 0; i <= n; i++) out.push(fn(i / n));
  return out;
}

export function isValidEase(ease: string): boolean {
  return !!gsap.parseEase(ease);
}
