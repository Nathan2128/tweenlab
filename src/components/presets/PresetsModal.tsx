import { useEditor } from "../../store/editor";
import { useProject } from "../../store/project";
import { PRESETS, type Preset } from "../../lib/presets";
import { Modal } from "../ui";
import "./presets.css";

export function PresetsModal() {
  const open = useEditor((s) => s.presetsOpen);
  const setOpen = useEditor((s) => s.setPresetsOpen);
  const exitCodeMode = useEditor((s) => s.exitCodeMode);
  const setProject = useProject((s) => s.setProject);
  const notify = useEditor((s) => s.notify);

  const load = (p: Preset) => {
    exitCodeMode();
    setProject(p.build());
    setOpen(false);
    notify(`Loaded “${p.name}”`, "success");
  };

  return (
    <Modal open={open} onClose={() => setOpen(false)} title={<>Start from a <em>preset</em></>} subtitle="Each one is a real project you can pull apart. Undo brings your current work back." width={920}>
      <div className="presets">
        {PRESETS.map((p) => {
          const proj = p.build();
          return (
            <button key={p.id} type="button" className="preset" onClick={() => load(p)}>
              <div className={`preset__stage preset__stage--${proj.layout}`}>
                {proj.elements.slice(0, 9).map((el) => (
                  <span key={el.id} className={`preset__el preset__el--${el.kind}`} style={{ background: el.kind === "ring" || el.kind === "text" ? "transparent" : el.color, borderColor: el.color, color: el.color }}>
                    {el.kind === "text" ? "Aa" : ""}
                  </span>
                ))}
              </div>
              <div className="preset__body">
                <div className="preset__name">{p.name}</div>
                <div className="preset__blurb">{p.blurb}</div>
                <div className="preset__tags">
                  {p.tags.map((t) => (
                    <span key={t}>{t}</span>
                  ))}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </Modal>
  );
}
