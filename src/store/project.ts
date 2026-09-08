import { create } from "zustand";
import { temporal } from "zundo";
import type { ElementKind, Project, StageElement, StageLayout, TimelineSettings, Tween, VarValue } from "../lib/types";
import { nextElementId, uid } from "../lib/ids";
import { defaultProject, tw } from "../lib/presets";
import { propDef } from "../lib/properties";
import { PALETTE } from "../lib/presets";

interface ProjectState {
  project: Project;
  selectedTweenId: string | null;
  selectedElementId: string | null;
}

interface ProjectActions {
  setProject: (p: Project) => void;
  selectTween: (id: string | null) => void;
  selectElement: (id: string | null) => void;
  addTween: (init?: Partial<Tween>) => string;
  updateTween: (id: string, patch: Partial<Tween>) => void;
  setVar: (id: string, key: string, value: VarValue, which?: "vars" | "fromVars") => void;
  addVar: (id: string, key: string) => void;
  removeVar: (id: string, key: string) => void;
  removeTween: (id: string) => void;
  duplicateTween: (id: string) => void;
  moveTween: (fromIndex: number, toIndex: number) => void;
  addElement: (kind: ElementKind) => void;
  updateElement: (id: string, patch: Partial<StageElement>) => void;
  removeElement: (id: string) => void;
  setTimeline: (patch: Partial<TimelineSettings>) => void;
  setLayout: (layout: StageLayout) => void;
  setName: (name: string) => void;
}

export type ProjectStore = ProjectState & ProjectActions;

function throttleLeading<T extends (...args: never[]) => void>(fn: T, ms: number): T {
  let last = 0;
  return ((...args: Parameters<T>) => {
    const now = Date.now();
    if (now - last > ms) {
      last = now;
      fn(...args);
    }
  }) as T;
}

const firstTarget = (p: Project) => (p.elements[0] ? `.${p.elements[0].group}` : ".box");

export const useProject = create<ProjectStore>()(
  temporal(
    (set, get) => {
      const patchProject = (fn: (p: Project) => Project) => set((s) => ({ project: fn(s.project) }));
      const patchTween = (id: string, fn: (t: Tween) => Tween) =>
        patchProject((p) => ({ ...p, tweens: p.tweens.map((t) => (t.id === id ? fn(t) : t)) }));

      return {
        project: defaultProject(),
        selectedTweenId: null,
        selectedElementId: null,

        setProject: (project) => set({ project, selectedTweenId: project.tweens[0]?.id ?? null, selectedElementId: null }),
        selectTween: (id) => set({ selectedTweenId: id, selectedElementId: id ? null : get().selectedElementId }),
        selectElement: (id) => set({ selectedElementId: id }),

        addTween: (init) => {
          const p = get().project;
          const t = tw({ target: firstTarget(p), vars: { x: 160 }, ...init });
          patchProject((p) => ({ ...p, tweens: [...p.tweens, t] }));
          set({ selectedTweenId: t.id, selectedElementId: null });
          return t.id;
        },
        updateTween: (id, patch) => patchTween(id, (t) => ({ ...t, ...patch })),
        setVar: (id, key, value, which = "vars") => patchTween(id, (t) => ({ ...t, [which]: { ...t[which], [key]: value } })),
        addVar: (id, key) =>
          patchTween(id, (t) => {
            if (key in t.vars) return t;
            const def = propDef(key);
            const isFrom = t.method === "from";
            const vars = { ...t.vars, [key]: isFrom ? def.default : t.method === "fromTo" ? (def.rest ?? def.default) : def.default };
            const fromVars = t.method === "fromTo" ? { ...t.fromVars, [key]: def.default } : t.fromVars;
            return { ...t, vars, fromVars };
          }),
        removeVar: (id, key) =>
          patchTween(id, (t) => {
            const vars = { ...t.vars };
            const fromVars = { ...t.fromVars };
            delete vars[key];
            delete fromVars[key];
            return { ...t, vars, fromVars };
          }),
        removeTween: (id) => {
          const p = get().project;
          const idx = p.tweens.findIndex((t) => t.id === id);
          const next = p.tweens.filter((t) => t.id !== id);
          patchProject((p) => ({ ...p, tweens: next }));
          if (get().selectedTweenId === id) set({ selectedTweenId: next[Math.min(idx, next.length - 1)]?.id ?? null });
        },
        duplicateTween: (id) => {
          const p = get().project;
          const idx = p.tweens.findIndex((t) => t.id === id);
          if (idx < 0) return;
          const copy: Tween = { ...p.tweens[idx], id: uid(), vars: { ...p.tweens[idx].vars }, fromVars: { ...p.tweens[idx].fromVars } };
          const tweens = [...p.tweens];
          tweens.splice(idx + 1, 0, copy);
          patchProject((p) => ({ ...p, tweens }));
          set({ selectedTweenId: copy.id });
        },
        moveTween: (from, to) =>
          patchProject((p) => {
            const tweens = [...p.tweens];
            const [item] = tweens.splice(from, 1);
            tweens.splice(to, 0, item);
            return { ...p, tweens };
          }),

        addElement: (kind) => {
          const p = get().project;
          const id = nextElementId(kind, p.elements);
          const color = kind === "text" ? "#f2f1ee" : PALETTE[p.elements.length % 5];
          const element: StageElement = { id, kind, group: kind, color, ...(kind === "text" ? { text: "Hello motion" } : {}) };
          patchProject((p) => ({ ...p, elements: [...p.elements, element] }));
          set({ selectedElementId: id });
        },
        updateElement: (id, patch) => patchProject((p) => ({ ...p, elements: p.elements.map((e) => (e.id === id ? { ...e, ...patch } : e)) })),
        removeElement: (id) => {
          patchProject((p) => ({ ...p, elements: p.elements.filter((e) => e.id !== id) }));
          if (get().selectedElementId === id) set({ selectedElementId: null });
        },

        setTimeline: (patch) => patchProject((p) => ({ ...p, timeline: { ...p.timeline, ...patch } })),
        setLayout: (layout) => patchProject((p) => ({ ...p, layout })),
        setName: (name) => patchProject((p) => ({ ...p, name })),
      };
    },
    {
      partialize: (s) => ({ project: s.project }) as ProjectStore,
      equality: (a, b) => a.project === b.project,
      limit: 200,
      handleSet: (handleSet) => throttleLeading(handleSet, 400),
    },
  ),
);

export const undo = () => useProject.temporal.getState().undo();
export const redo = () => useProject.temporal.getState().redo();
export const clearHistory = () => useProject.temporal.getState().clear();

export function useSelectedTween(): Tween | null {
  return useProject((s) => s.project.tweens.find((t) => t.id === s.selectedTweenId) ?? null);
}
