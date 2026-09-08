import { BookOpen, Command, Link2, Redo2, Undo2, LayoutTemplate, Keyboard } from "lucide-react";
import { useStore } from "zustand";
import { Button, IconButton } from "./ui";
import { useProject, undo, redo } from "../store/project";
import { useEditor } from "../store/editor";
import { shareUrl } from "../lib/share";
import "./TopBar.css";

export function TopBar() {
  const name = useProject((s) => s.project.name);
  const setName = useProject((s) => s.setName);
  const project = useProject((s) => s.project);
  const pastStates = useStore(useProject.temporal, (s) => s.pastStates.length);
  const futureStates = useStore(useProject.temporal, (s) => s.futureStates.length);
  const setPresetsOpen = useEditor((s) => s.setPresetsOpen);
  const setGuideOpen = useEditor((s) => s.setGuideOpen);
  const setShortcutsOpen = useEditor((s) => s.setShortcutsOpen);
  const notify = useEditor((s) => s.notify);

  const share = async () => {
    const url = shareUrl(project);
    history.replaceState(null, "", url);
    try {
      await navigator.clipboard.writeText(url);
      notify("Share link copied to clipboard", "success");
    } catch {
      notify("Link is in the address bar — copy it from there", "info");
    }
  };

  return (
    <header className="topbar" data-intro="topbar">
      <div className="brand">
        <span className="brand__mark">
          <span className="brand__dot" aria-hidden />
          tweenlab
        </span>
        <span className="brand__sub">GSAP playground</span>
      </div>

      <div className="projname">
        <input value={name} onChange={(e) => setName(e.target.value)} aria-label="Animation name" spellCheck={false} />
      </div>

      <div className="topbar__actions">
        <IconButton label="Undo (⌘Z)" onClick={() => undo()} disabled={pastStates === 0} tipPos="bottom">
          <Undo2 />
        </IconButton>
        <IconButton label="Redo (⌘⇧Z)" onClick={() => redo()} disabled={futureStates === 0} tipPos="bottom">
          <Redo2 />
        </IconButton>
        <span className="topbar__sep topbar__hide-mobile" />
        <Button variant="ghost" size="sm" onClick={() => setPresetsOpen(true)} title="Browse presets (⌘K)">
          <LayoutTemplate />
          Presets
          <span className="topbar__hide-mobile" style={{ display: "inline-flex", gap: 2, marginLeft: 4, opacity: 0.6 }}>
            <Command size={11} />K
          </span>
        </Button>
        <IconButton label="Keyboard shortcuts (?)" onClick={() => setShortcutsOpen(true)} tipPos="bottom" className="topbar__hide-mobile">
          <Keyboard />
        </IconButton>
        <Button variant="ghost" size="sm" onClick={() => setGuideOpen(true)}>
          <BookOpen />
          <span className="topbar__hide-mobile">Guide</span>
        </Button>
        <Button variant="primary" size="sm" onClick={share}>
          <Link2 />
          Share
        </Button>
      </div>
    </header>
  );
}
