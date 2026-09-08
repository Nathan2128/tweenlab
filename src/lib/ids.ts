import type { ElementKind, StageElement } from "./types";

const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";

export function uid(prefix = "t"): string {
  let out = "";
  for (let i = 0; i < 6; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return `${prefix}_${out}`;
}

export function nextElementId(kind: ElementKind, elements: StageElement[]): string {
  const used = new Set(elements.map((e) => e.id));
  let n = 1;
  while (used.has(`${kind}-${n}`)) n++;
  return `${kind}-${n}`;
}
