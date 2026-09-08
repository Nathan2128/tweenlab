import { create } from "zustand";
import type { Framework } from "../lib/codegen";

export type EditorMode = "builder" | "code";
export type MobilePane = "sequence" | "stage" | "inspect" | "code";

interface EditorState {
  mode: EditorMode;
  /** Editable source, only meaningful in `code` mode */
  code: string;
  draft: string;
  runError: string | null;
  codeTab: Framework | "howto";
  panelOpen: boolean;
  panelHeight: number;
  guideOpen: boolean;
  shortcutsOpen: boolean;
  presetsOpen: boolean;
  toast: { id: number; text: string; kind: "info" | "success" | "error" } | null;
  mobilePane: MobilePane;
}

interface EditorActions {
  enterCodeMode: (code: string) => void;
  exitCodeMode: () => void;
  setDraft: (draft: string) => void;
  runDraft: () => void;
  setRunError: (e: string | null) => void;
  setCodeTab: (t: EditorState["codeTab"]) => void;
  setPanelOpen: (open: boolean) => void;
  setPanelHeight: (h: number) => void;
  setGuideOpen: (open: boolean) => void;
  setShortcutsOpen: (open: boolean) => void;
  setPresetsOpen: (open: boolean) => void;
  notify: (text: string, kind?: "info" | "success" | "error") => void;
  dismissToast: () => void;
  setMobilePane: (p: MobilePane) => void;
}

let toastSeq = 0;

export const useEditor = create<EditorState & EditorActions>()((set) => ({
  mode: "builder",
  code: "",
  draft: "",
  runError: null,
  codeTab: "vanilla",
  panelOpen: true,
  panelHeight: 300,
  guideOpen: false,
  shortcutsOpen: false,
  presetsOpen: false,
  toast: null,
  mobilePane: "stage",

  enterCodeMode: (code) => set({ mode: "code", code, draft: code, runError: null, codeTab: "vanilla" }),
  exitCodeMode: () => set({ mode: "builder", runError: null }),
  setDraft: (draft) => set({ draft }),
  runDraft: () => set((s) => ({ code: s.draft })),
  setRunError: (runError) => set({ runError }),
  setCodeTab: (codeTab) => set({ codeTab, panelOpen: true }),
  setPanelOpen: (panelOpen) => set({ panelOpen }),
  setPanelHeight: (panelHeight) => set({ panelHeight: Math.max(160, Math.min(720, panelHeight)) }),
  setGuideOpen: (guideOpen) => set({ guideOpen }),
  setShortcutsOpen: (shortcutsOpen) => set({ shortcutsOpen }),
  setPresetsOpen: (presetsOpen) => set({ presetsOpen }),
  notify: (text, kind = "info") => set({ toast: { id: ++toastSeq, text, kind } }),
  dismissToast: () => set({ toast: null }),
  setMobilePane: (mobilePane) => set({ mobilePane }),
}));
