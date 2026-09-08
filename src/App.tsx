import { useEffect, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { AlertCircle, Check, Code2, Film, ListOrdered, SlidersHorizontal } from "lucide-react";
import { AnimationProvider } from "./hooks/AnimationProvider";
import { useAnimation } from "./hooks/animationContext";
import { useProject, undo, redo, clearHistory } from "./store/project";
import { useEditor } from "./store/editor";
import { loadLocal, readProjectFromUrl, saveLocal } from "./lib/share";
import { TopBar } from "./components/TopBar";
import { Stage } from "./components/stage/Stage";
import { Transport } from "./components/transport/Transport";
import { TrackView } from "./components/transport/TrackView";
import { SequencePanel } from "./components/sequence/SequencePanel";
import { Inspector } from "./components/inspector/Inspector";
import { CodePanel } from "./components/code/CodePanel";
import { PresetsModal } from "./components/presets/PresetsModal";
import { ShortcutsModal } from "./components/guide/ShortcutsModal";
import { GuideModal } from "./components/guide/GuideModal";
import "./styles/base.css";
import "./styles/app.css";

gsap.registerPlugin(useGSAP);

/* Restore a shared or saved project before the first render. */
(() => {
  const fromUrl = readProjectFromUrl();
  const initial = fromUrl ?? loadLocal();
  if (initial) {
    useProject.getState().setProject(initial);
    clearHistory();
  }
  const first = useProject.getState().project.tweens[0];
  if (first) useProject.getState().selectTween(first.id);
})();

export default function App() {
  return (
    <AnimationProvider>
      <Shell />
    </AnimationProvider>
  );
}

function Shell() {
  const appRef = useRef<HTMLDivElement>(null);
  const anim = useAnimation();
  const mobilePane = useEditor((s) => s.mobilePane);
  const setMobilePane = useEditor((s) => s.setMobilePane);
  const toast = useEditor((s) => s.toast);
  const dismissToast = useEditor((s) => s.dismissToast);

  /* Persist to localStorage (debounced) */
  useEffect(() => {
    let t: number | undefined;
    const unsub = useProject.subscribe((s, prev) => {
      if (s.project === prev.project) return;
      window.clearTimeout(t);
      t = window.setTimeout(() => saveLocal(s.project), 400);
    });
    return () => {
      unsub();
      window.clearTimeout(t);
    };
  }, []);

  /* Toast lifetime */
  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(dismissToast, 2200);
    return () => window.clearTimeout(t);
  }, [toast, dismissToast]);

  /* Global keyboard shortcuts */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing = !!target?.closest("input, textarea, select, [contenteditable='true'], .cm-editor");
      const mod = e.metaKey || e.ctrlKey;
      const ed = useEditor.getState();
      const ps = useProject.getState();

      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        ed.setPresetsOpen(!ed.presetsOpen);
        return;
      }
      if (mod && e.key.toLowerCase() === "e") {
        e.preventDefault();
        ed.setPanelOpen(!ed.panelOpen);
        return;
      }
      if (typing) return;

      if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }
      if (mod && e.key.toLowerCase() === "d") {
        e.preventDefault();
        if (ps.selectedTweenId) ps.duplicateTween(ps.selectedTweenId);
        return;
      }
      if (mod) return;

      switch (e.key) {
        case " ":
          e.preventDefault();
          anim.toggle();
          break;
        case "r":
          anim.restart();
          break;
        case "R":
          anim.reverse();
          break;
        case "l":
        case "L":
          ps.setTimeline({ repeat: ps.project.timeline.repeat === -1 ? 0 : -1 });
          break;
        case "ArrowLeft":
          e.preventDefault();
          anim.step(e.shiftKey ? -0.5 : -0.1);
          break;
        case "ArrowRight":
          e.preventDefault();
          anim.step(e.shiftKey ? 0.5 : 0.1);
          break;
        case "?":
          ed.setShortcutsOpen(!ed.shortcutsOpen);
          break;
        case "Backspace":
        case "Delete":
          if (ps.selectedTweenId && ed.mode === "builder") ps.removeTween(ps.selectedTweenId);
          break;
        case "Escape":
          if (ed.presetsOpen || ed.guideOpen || ed.shortcutsOpen) {
            ed.setPresetsOpen(false);
            ed.setGuideOpen(false);
            ed.setShortcutsOpen(false);
          } else if (ps.selectedElementId) ps.selectElement(null);
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [anim]);

  /* Entrance choreography for the UI itself */
  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from("[data-intro='topbar']", { y: -14, opacity: 0, duration: 0.55 })
        .from(".pane--sequence", { x: -18, opacity: 0, duration: 0.6 }, "-=0.35")
        .from(".pane--inspector", { x: 18, opacity: 0, duration: 0.6 }, "<")
        .from(".pane--stage", { opacity: 0, scale: 0.985, transformOrigin: "50% 50%", duration: 0.7 }, "<0.05")
        .from(".codepanel", { y: 18, opacity: 0, duration: 0.55 }, "-=0.45")
        .from(".brand__dot", { scale: 0, duration: 0.6, ease: "back.out(3)" }, "-=0.5");
    },
    { scope: appRef },
  );

  return (
    <div className="app" ref={appRef}>
      <TopBar />
      <main className="workspace" data-mobile={mobilePane}>
        <aside className="pane pane--sequence pane--lockable" aria-label="Sequence">
          <SequencePanel />
        </aside>
        <section className="pane pane--stage" aria-label="Stage">
          <Stage />
          <Transport />
          <TrackView />
        </section>
        <aside className="pane pane--inspector pane--lockable" aria-label="Inspector">
          <Inspector />
        </aside>
        <div className="pane pane--code" aria-label="Code">
          <CodePanel />
        </div>
      </main>

      <nav className="mobile-nav" aria-label="Panels">
        {(
          [
            ["stage", "Stage", <Film key="i" />],
            ["sequence", "Sequence", <ListOrdered key="i" />],
            ["inspect", "Inspect", <SlidersHorizontal key="i" />],
            ["code", "Code", <Code2 key="i" />],
          ] as const
        ).map(([id, label, icon]) => (
          <button key={id} type="button" className={mobilePane === id ? "is-active" : ""} onClick={() => setMobilePane(id)}>
            {icon}
            {label}
          </button>
        ))}
      </nav>

      <PresetsModal />
      <ShortcutsModal />
      <GuideModal />

      {toast && (
        <div className={`toast toast--${toast.kind}`} role="status" key={toast.id}>
          {toast.kind === "success" ? <Check /> : toast.kind === "error" ? <AlertCircle /> : null}
          {toast.text}
        </div>
      )}
    </div>
  );
}
