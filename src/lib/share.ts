import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from "lz-string";
import type { Project } from "./types";

const KEY = "p";
const STORAGE_KEY = "tweenlab:project";

export function encodeProject(p: Project): string {
  return compressToEncodedURIComponent(JSON.stringify(p));
}

export function decodeProject(s: string): Project | null {
  try {
    const json = decompressFromEncodedURIComponent(s);
    if (!json) return null;
    const p = JSON.parse(json);
    if (!p || p.version !== 1 || !Array.isArray(p.tweens) || !Array.isArray(p.elements)) return null;
    return p as Project;
  } catch {
    return null;
  }
}

export function shareUrl(p: Project): string {
  const url = new URL(window.location.href);
  url.hash = `${KEY}=${encodeProject(p)}`;
  return url.toString();
}

export function readProjectFromUrl(): Project | null {
  const hash = window.location.hash.replace(/^#/, "");
  if (!hash) return null;
  const params = new URLSearchParams(hash);
  const raw = params.get(KEY);
  return raw ? decodeProject(raw) : null;
}

export function clearUrlHash(): void {
  if (window.location.hash) history.replaceState(null, "", window.location.pathname + window.location.search);
}

export function saveLocal(p: Project): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {
    /* storage unavailable */
  }
}

export function loadLocal(): Project | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    return p && p.version === 1 ? (p as Project) : null;
  } catch {
    return null;
  }
}
