import { useEditor } from "../../store/editor";
import { Kbd, Modal } from "../ui";
import "./guide.css";

const GROUPS: { title: string; items: [string[], string][] }[] = [
  {
    title: "Playback",
    items: [
      [["Space"], "Play / pause"],
      [["R"], "Restart from the beginning"],
      [["⇧", "R"], "Play in reverse"],
      [["←", "→"], "Step 0.1s (hold ⇧ for 0.5s)"],
      [["L"], "Toggle timeline loop"],
    ],
  },
  {
    title: "Editing",
    items: [
      [["⌘", "Z"], "Undo"],
      [["⌘", "⇧", "Z"], "Redo"],
      [["⌘", "D"], "Duplicate selected tween"],
      [["⌫"], "Delete selected tween"],
      [["Esc"], "Deselect / close"],
    ],
  },
  {
    title: "Panels",
    items: [
      [["⌘", "K"], "Browse presets"],
      [["⌘", "E"], "Toggle the code panel"],
      [["⌘", "⇧", "C"], "Copy current code"],
      [["⌘", "↵"], "Run code (in code mode)"],
      [["?"], "This cheatsheet"],
    ],
  },
];

export function ShortcutsModal() {
  const open = useEditor((s) => s.shortcutsOpen);
  const setOpen = useEditor((s) => s.setShortcutsOpen);
  return (
    <Modal open={open} onClose={() => setOpen(false)} title={<>Keyboard <em>shortcuts</em></>} width={720}>
      <div className="shortcuts">
        {GROUPS.map((g) => (
          <div key={g.title} className="shortcuts__group">
            <div className="eyebrow">{g.title}</div>
            {g.items.map(([keys, label]) => (
              <div key={label} className="shortcut">
                <span>{label}</span>
                <span className="shortcut__keys">
                  {keys.map((k) => (
                    <Kbd key={k}>{k}</Kbd>
                  ))}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </Modal>
  );
}
