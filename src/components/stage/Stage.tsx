import { useEffect, useRef, type CSSProperties } from "react";
import { Crosshair, Trash2, Rows3, Columns3, LayoutGrid } from "lucide-react";
import { useAnimation } from "../../hooks/animationContext";
import { useProject } from "../../store/project";
import { useEditor } from "../../store/editor";
import type { ElementKind, StageElement } from "../../lib/types";
import { Button, ColorField, IconButton, Segmented, TextField } from "../ui";
import "./stage.css";

const KINDS: { kind: ElementKind; label: string; icon: React.ReactNode }[] = [
  { kind: "box", label: "Box", icon: <svg viewBox="0 0 16 16"><rect x="2" y="2" width="12" height="12" rx="2.5" fill="currentColor" /></svg> },
  { kind: "circle", label: "Circle", icon: <svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="6.5" fill="currentColor" /></svg> },
  { kind: "pill", label: "Pill", icon: <svg viewBox="0 0 16 16"><rect x="1" y="5" width="14" height="6" rx="3" fill="currentColor" /></svg> },
  { kind: "ring", label: "Ring", icon: <svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="5.5" fill="none" stroke="currentColor" strokeWidth="2.5" /></svg> },
  { kind: "text", label: "Text", icon: <svg viewBox="0 0 16 16"><text x="8" y="12.5" textAnchor="middle" fontSize="12" fontWeight="700" fontFamily="var(--font-ui)" fill="currentColor">Aa</text></svg> },
];

export function KindIcon({ kind }: { kind: ElementKind }) {
  return <>{KINDS.find((k) => k.kind === kind)?.icon}</>;
}

export function Stage() {
  const { stageRef } = useAnimation();
  const elements = useProject((s) => s.project.elements);
  const layout = useProject((s) => s.project.layout);
  const selectedElementId = useProject((s) => s.selectedElementId);
  const selectElement = useProject((s) => s.selectElement);
  const addElement = useProject((s) => s.addElement);
  const setLayout = useProject((s) => s.setLayout);
  const runError = useEditor((s) => s.runError);
  const mode = useEditor((s) => s.mode);
  const selected = elements.find((e) => e.id === selectedElementId) ?? null;

  return (
    <div className="stagewrap">
      <div className="stagebar">
        <div className="stagebar__group">
          <span className="eyebrow">Add</span>
          {KINDS.map((k) => (
            <button key={k.kind} type="button" className="addel" data-tip={`Add ${k.label.toLowerCase()}`} data-tip-pos="bottom" onClick={() => addElement(k.kind)} aria-label={`Add ${k.label}`}>
              {k.icon}
            </button>
          ))}
        </div>
        <div className="stagebar__group">
          <Segmented
            ariaLabel="Stage layout"
            value={layout}
            onChange={setLayout}
            options={[
              { value: "row", label: <Rows3 size={14} style={{ transform: "rotate(90deg)" }} />, title: "Row" },
              { value: "column", label: <Columns3 size={14} style={{ transform: "rotate(90deg)" }} />, title: "Column" },
              { value: "grid", label: <LayoutGrid size={14} />, title: "Grid" },
            ]}
          />
        </div>
      </div>

      <div className="viewport">
        <div className="viewport__scroll" onPointerDown={(e) => e.target === e.currentTarget && selectElement(null)}>
          <div ref={stageRef} className={`stage stage--${layout}`} onPointerDown={(e) => e.target === e.currentTarget && selectElement(null)}>
            {elements.map((el) => (
              <StageEl key={el.id} el={el} selected={el.id === selectedElementId} onSelect={() => selectElement(el.id)} />
            ))}
          </div>
        </div>

        {runError && (
          <div className="viewport__error" role="alert">
            {runError}
          </div>
        )}

        {selected && mode === "builder" && <ElementPopover el={selected} />}

        <div className="viewport__meta">
          <span>
            {elements.length} element{elements.length === 1 ? "" : "s"}
          </span>
          <span>{layout}</span>
        </div>
      </div>
    </div>
  );
}

function StageEl({ el, selected, onSelect }: { el: StageElement; selected: boolean; onSelect: () => void }) {
  const style = { ["--c" as string]: el.color } as CSSProperties;
  const common = {
    id: el.id,
    className: el.group,
    "data-kind": el.kind,
    "data-selected": selected ? "true" : undefined,
    style,
    onPointerDown: (e: React.PointerEvent) => {
      e.stopPropagation();
      onSelect();
    },
  };
  if (el.kind === "text") {
    const words = (el.text ?? "").split(/\s+/).filter(Boolean);
    return (
      <p {...common}>
        {words.map((w, i) => (
          <span key={i}>
            <span className="word">{w}</span>
            {i < words.length - 1 ? " " : ""}
          </span>
        ))}
      </p>
    );
  }
  return <div {...common} />;
}

function ElementPopover({ el }: { el: StageElement }) {
  const updateElement = useProject((s) => s.updateElement);
  const removeElement = useProject((s) => s.removeElement);
  const selectElement = useProject((s) => s.selectElement);
  const selectedTweenId = useProject((s) => s.selectedTweenId);
  const updateTween = useProject((s) => s.updateTween);
  const notify = useEditor((s) => s.notify);
  const groupRef = useRef(el.group);
  useEffect(() => {
    groupRef.current = el.group;
  }, [el.group]);

  const setTarget = (t: string) => {
    if (!selectedTweenId) {
      notify("Select a tween in the Sequence panel first");
      return;
    }
    updateTween(selectedTweenId, { target: t });
    notify(`Tween now targets ${t}`, "success");
  };

  return (
    <div className="elpop" onPointerDown={(e) => e.stopPropagation()}>
      <div className="elpop__head">
        <span className="elpop__kind">
          <KindIcon kind={el.kind} />
        </span>
        <span className="id">#{el.id}</span>
        <IconButton label="Delete element" size="sm" onClick={() => removeElement(el.id)} className="btn--danger">
          <Trash2 />
        </IconButton>
        <IconButton label="Close" size="sm" onClick={() => selectElement(null)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </IconButton>
      </div>
      <div className="elpop__body">
        <div className="elpop__row">
          <span className="label">class</span>
          <TextField mono prefix="." value={el.group} onChange={(v) => updateElement(el.id, { group: v.replace(/[^a-zA-Z0-9_-]/g, "") || "box" })} ariaLabel="Class name" />
        </div>
        <div className="elpop__row">
          <span className="label">color</span>
          <ColorField value={el.color} onChange={(v) => updateElement(el.id, { color: v })} ariaLabel="Element color" />
        </div>
        {el.kind === "text" && (
          <div className="elpop__row">
            <span className="label">text</span>
            <TextField value={el.text ?? ""} onChange={(v) => updateElement(el.id, { text: v })} ariaLabel="Text content" />
          </div>
        )}
        <div className="elpop__actions">
          <Button size="xs" onClick={() => setTarget(`#${el.id}`)} title="Point the selected tween at this element">
            <Crosshair />#{el.id}
          </Button>
          <Button size="xs" onClick={() => setTarget(`.${el.group}`)} title="Point the selected tween at every element with this class">
            <Crosshair />.{el.group}
          </Button>
        </div>
      </div>
    </div>
  );
}
