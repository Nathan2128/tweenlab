import { useMemo } from "react";
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Copy, Eye, EyeOff, GripVertical, Plus, Trash2 } from "lucide-react";
import { useProject } from "../../store/project";
import { useEditor } from "../../store/editor";
import type { Tween } from "../../lib/types";
import { fmtNum } from "../../lib/codegen";
import { Button, IconButton, NumberField, Switch } from "../ui";
import "./sequence.css";

export function SequencePanel() {
  const tweens = useProject((s) => s.project.tweens);
  const addTween = useProject((s) => s.addTween);
  const moveTween = useProject((s) => s.moveTween);
  const mode = useEditor((s) => s.mode);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const ids = useMemo(() => tweens.map((t) => t.id), [tweens]);

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    moveTween(ids.indexOf(String(active.id)), ids.indexOf(String(over.id)));
  };

  return (
    <>
      <div className="pane__head">
        <div className="pane__title">
          Sequence <span className="count">{tweens.length}</span>
        </div>
        <Button size="xs" onClick={() => addTween()} title="Add a tween to the end of the timeline">
          <Plus /> Tween
        </Button>
      </div>
      <div className="pane__body">
        {tweens.length === 0 ? (
          <div className="empty">
            <strong>No tweens yet</strong>
            <span>Add one to start animating the elements on stage.</span>
            <Button variant="primary" size="sm" onClick={() => addTween()}>
              <Plus /> Add tween
            </Button>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={ids} strategy={verticalListSortingStrategy}>
              <div className="seq__list">
                {tweens.map((t, i) => (
                  <TweenCard key={t.id} tween={t} index={i} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
      <TimelineSettings />
      {mode === "code" && (
        <div className="pane__lock">
          <strong>Code mode</strong>
          The sequence is paused while you edit code by hand. Exit code mode in the code panel to keep using these controls.
        </div>
      )}
    </>
  );
}

function summarize(t: Tween): string {
  const keys = Object.keys(t.vars);
  if (!keys.length) return "no properties";
  return keys
    .slice(0, 4)
    .map((k) => `${k} ${typeof t.vars[k] === "number" ? fmtNum(t.vars[k] as number) : String(t.vars[k])}`)
    .join(" · ")
    .concat(keys.length > 4 ? ` +${keys.length - 4}` : "");
}

function TweenCard({ tween, index }: { tween: Tween; index: number }) {
  const selected = useProject((s) => s.selectedTweenId === tween.id);
  const selectTween = useProject((s) => s.selectTween);
  const updateTween = useProject((s) => s.updateTween);
  const removeTween = useProject((s) => s.removeTween);
  const duplicateTween = useProject((s) => s.duplicateTween);
  const setMobilePane = useEditor((s) => s.setMobilePane);

  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: tween.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`tcard${selected ? " is-selected" : ""}${tween.enabled ? "" : " is-disabled"}${isDragging ? " is-dragging" : ""}`}
      data-method={tween.method}
      onClick={() => {
        selectTween(tween.id);
        if (window.matchMedia("(max-width: 960px)").matches) setMobilePane("inspect");
      }}
      onKeyDown={(e) => e.key === "Enter" && selectTween(tween.id)}
      tabIndex={0}
      role="button"
      aria-pressed={selected}
    >
      <button type="button" ref={setActivatorNodeRef} className="tcard__grip" aria-label="Drag to reorder" {...attributes} {...listeners} onClick={(e) => e.stopPropagation()}>
        <GripVertical />
      </button>
      <div className="tcard__main">
        <div className="tcard__top">
          <span className="tcard__method">{tween.method}</span>
          <span className="tcard__target">{tween.target}</span>
        </div>
        <div className="tcard__props">{summarize(tween)}</div>
        <div className="tcard__meta">
          <span>{fmtNum(tween.duration)}s</span>
          <span>{tween.ease}</span>
          {tween.stagger > 0 && <span>stagger {fmtNum(tween.stagger)}</span>}
          {tween.repeat !== 0 && <span>repeat {tween.repeat === -1 ? "∞" : tween.repeat}</span>}
          {tween.position && <span className="pos">@ {tween.position}</span>}
        </div>
      </div>
      <div className="tcard__side">
        <span className="tcard__index">{String(index + 1).padStart(2, "0")}</span>
        <div className="tcard__actions" onClick={(e) => e.stopPropagation()}>
          <IconButton size="sm" label={tween.enabled ? "Disable" : "Enable"} onClick={() => updateTween(tween.id, { enabled: !tween.enabled })}>
            {tween.enabled ? <Eye /> : <EyeOff />}
          </IconButton>
          <IconButton size="sm" label="Duplicate" onClick={() => duplicateTween(tween.id)}>
            <Copy />
          </IconButton>
          <IconButton size="sm" label="Delete" onClick={() => removeTween(tween.id)}>
            <Trash2 />
          </IconButton>
        </div>
      </div>
    </div>
  );
}

function TimelineSettings() {
  const tl = useProject((s) => s.project.timeline);
  const setTimeline = useProject((s) => s.setTimeline);
  return (
    <div className="seq__foot">
      <div className="seq__tl">
        <div className="section__head" style={{ marginBottom: 10 }}>
          <span className="eyebrow">Timeline</span>
          <Switch checked={tl.repeat === -1} onChange={(v) => setTimeline({ repeat: v ? -1 : 0 })} label="Loop" />
        </div>
        <div className="grid2">
          <label className="fieldlabel">
            <span>Repeat {tl.repeat === -1 ? "(∞)" : ""}</span>
            <NumberField value={tl.repeat} min={-1} max={99} step={1} onChange={(v) => setTimeline({ repeat: Math.round(v) })} unit={tl.repeat === -1 ? "∞" : "×"} ariaLabel="Timeline repeat" />
          </label>
          <label className="fieldlabel">
            <span>Repeat delay</span>
            <NumberField value={tl.repeatDelay} min={0} max={10} step={0.1} onChange={(v) => setTimeline({ repeatDelay: v })} unit="s" ariaLabel="Repeat delay" />
          </label>
        </div>
        <div style={{ marginTop: 10 }}>
          <Switch checked={tl.yoyo} onChange={(v) => setTimeline({ yoyo: v })} label="Yoyo — play back in reverse on each repeat" />
        </div>
      </div>
    </div>
  );
}
