import { useMemo } from "react";
import { X } from "lucide-react";
import { useProject, useSelectedTween } from "../../store/project";
import { useEditor } from "../../store/editor";
import { useAnimation } from "../../hooks/animationContext";
import { PROPS, PROP_GROUPS, propDef } from "../../lib/properties";
import type { StaggerFrom, Tween, TweenMethod } from "../../lib/types";
import { ColorField, IconButton, NumberField, ScrubLabel, Segmented, Select, Slider, Switch, TextField } from "../ui";
import { EasePicker } from "./EasePicker";
import "./inspector.css";

export function Inspector() {
  const tween = useSelectedTween();
  const mode = useEditor((s) => s.mode);
  return (
    <>
      <div className="pane__head">
        <div className="pane__title">Inspector</div>
        {tween && (
          <span className="eyebrow" style={{ color: "var(--fg-3)" }}>
            {tween.id.slice(0, 8)}
          </span>
        )}
      </div>
      <div className="pane__body">
        {tween ? (
          <TweenInspector tween={tween} />
        ) : (
          <div className="empty">
            <strong>Nothing selected</strong>
            <span>Pick a tween in the Sequence panel, or click a clip in the track view below the stage.</span>
          </div>
        )}
      </div>
      {mode === "code" && (
        <div className="pane__lock">
          <strong>Code mode</strong>
          The inspector only edits the visual sequence. Exit code mode to use it.
        </div>
      )}
    </>
  );
}

function TweenInspector({ tween }: { tween: Tween }) {
  const elements = useProject((s) => s.project.elements);
  const tweens = useProject((s) => s.project.tweens);
  const updateTween = useProject((s) => s.updateTween);
  const setVar = useProject((s) => s.setVar);
  const addVar = useProject((s) => s.addVar);
  const removeVar = useProject((s) => s.removeVar);
  const { clips } = useAnimation();

  const clip = useMemo(() => {
    const enabled = tweens.filter((t) => t.enabled);
    const idx = enabled.findIndex((t) => t.id === tween.id);
    const c = idx >= 0 ? clips[idx] : undefined;
    return c ? { start: c.start, duration: c.duration } : null;
  }, [clips, tweens, tween.id]);

  const targetOptions = useMemo(() => {
    const groups = [...new Set(elements.map((e) => `.${e.group}`))];
    const ids = elements.map((e) => `#${e.id}`);
    const extra = elements.some((e) => e.kind === "text") ? [".word"] : [];
    return [...groups, ...extra, ...ids];
  }, [elements]);

  const setMethod = (method: TweenMethod) => {
    if (method === tween.method) return;
    let vars = tween.vars;
    let fromVars = tween.fromVars;
    if (method === "fromTo") {
      if (tween.method === "from") {
        // origin values become the `from` object; destinations become rest values
        fromVars = { ...tween.vars };
        vars = Object.fromEntries(Object.keys(tween.vars).map((k) => [k, propDef(k).rest ?? propDef(k).default]));
      } else {
        fromVars = Object.fromEntries(Object.keys(tween.vars).map((k) => [k, tween.fromVars[k] ?? propDef(k).rest ?? propDef(k).default]));
      }
    } else if (tween.method === "fromTo" && method === "from") {
      vars = { ...tween.fromVars };
    }
    updateTween(tween.id, { method, vars, fromVars });
  };

  const available = PROPS.filter((p) => !(p.key in tween.vars));

  return (
    <>
      {/* ---------- Target ---------- */}
      <section className="section">
        <div className="section__head">
          <span className="eyebrow">Target</span>
        </div>
        <div className="insp__target-chips">
          {targetOptions.map((t) => (
            <button key={t} type="button" className={`chip${tween.target === t ? " is-active" : ""}`} onClick={() => updateTween(tween.id, { target: t })}>
              {t}
            </button>
          ))}
        </div>
        <TextField mono value={tween.target} onChange={(v) => updateTween(tween.id, { target: v })} ariaLabel="Target selector" placeholder=".box, #circle-1, .word" />
      </section>

      {/* ---------- Method ---------- */}
      <section className="section">
        <div className="section__head">
          <span className="eyebrow">Method</span>
        </div>
        <Segmented
          full
          ariaLabel="Tween method"
          value={tween.method}
          onChange={setMethod}
          options={[
            { value: "to", label: "to", tone: "accent", title: "Animate from the current state to these values" },
            { value: "from", label: "from", tone: "cyan", title: "Start at these values and animate to the current state" },
            { value: "fromTo", label: "fromTo", tone: "mint", title: "Define both the start and end explicitly" },
          ]}
        />
        <div className="hint insp__method-hint">
          {tween.method === "to" && "Animates from wherever the element currently is to the values below."}
          {tween.method === "from" && "Starts at the values below and animates back to the element's natural state. Great for entrances."}
          {tween.method === "fromTo" && "You control both ends. Handy when the natural state is ambiguous or set by other tweens."}
        </div>
      </section>

      {/* ---------- Properties ---------- */}
      <section className="section">
        <div className="section__head">
          <span className="eyebrow">Properties</span>
          <span className="hint">{tween.method === "fromTo" ? "from → to" : tween.method === "from" ? "start values" : "end values"}</span>
        </div>
        {Object.keys(tween.vars).length === 0 && <div className="hint">No properties yet. Add one below.</div>}
        {Object.keys(tween.vars).map((key) => (
          <PropertyRow key={key} tween={tween} propKey={key} onChange={(v, which) => setVar(tween.id, key, v, which)} onRemove={() => removeVar(tween.id, key)} />
        ))}
        <div className="addprop">
          <Select
            ariaLabel="Add property"
            value=""
            onChange={(k) => k && addVar(tween.id, k)}
            options={[{ value: "", label: "+ Add property…" }, ...PROP_GROUPS.flatMap((g) => available.filter((p) => p.group === g).map((p) => ({ value: p.key, label: p.label, group: g })))]}
          />
        </div>
      </section>

      {/* ---------- Timing ---------- */}
      <section className="section">
        <div className="section__head">
          <span className="eyebrow">Timing</span>
        </div>
        <div className="timing">
          <label className="fieldlabel">
            <span>Duration</span>
            <NumberField value={tween.duration} min={0} max={30} step={0.05} unit="s" onChange={(v) => updateTween(tween.id, { duration: v })} ariaLabel="Duration" />
          </label>
          <label className="fieldlabel">
            <span>Delay</span>
            <NumberField value={tween.delay} min={0} max={30} step={0.05} unit="s" onChange={(v) => updateTween(tween.id, { delay: v })} ariaLabel="Delay" />
          </label>
          <label className="fieldlabel">
            <span>Repeat {tween.repeat === -1 && <b>∞</b>}</span>
            <NumberField value={tween.repeat} min={-1} max={99} step={1} unit={tween.repeat === -1 ? "∞" : "×"} onChange={(v) => updateTween(tween.id, { repeat: Math.round(v) })} ariaLabel="Repeat" />
          </label>
          <label className="fieldlabel" style={{ justifyContent: "flex-end" }}>
            <span>&nbsp;</span>
            <Switch checked={tween.yoyo} onChange={(v) => updateTween(tween.id, { yoyo: v })} label="Yoyo" />
          </label>
          <label className="fieldlabel">
            <span>Stagger</span>
            <NumberField value={tween.stagger} min={0} max={5} step={0.01} unit="s" onChange={(v) => updateTween(tween.id, { stagger: v })} ariaLabel="Stagger" />
          </label>
          <label className="fieldlabel">
            <span>Stagger from</span>
            <Select
              ariaLabel="Stagger origin"
              value={tween.staggerFrom}
              onChange={(v) => updateTween(tween.id, { staggerFrom: v as StaggerFrom })}
              options={["start", "center", "end", "edges", "random"].map((v) => ({ value: v, label: v }))}
            />
          </label>
          <div className="fieldlabel timing__wide">
            <span>Position in timeline</span>
            <TextField mono value={tween.position} onChange={(v) => updateTween(tween.id, { position: v })} placeholder="end of timeline (default)" ariaLabel="Position parameter" />
            <div className="poschips">
              {[
                ["", "end"],
                ["<", "< with previous"],
                [">", "> after previous"],
                ["-=0.3", "-=0.3 overlap"],
                ["+=0.3", "+=0.3 gap"],
                ["0", "0 start"],
              ].map(([v, label]) => (
                <button key={v || "end"} type="button" className={`chip${tween.position === v ? " is-active" : ""}`} onClick={() => updateTween(tween.id, { position: v })}>
                  {label}
                </button>
              ))}
            </div>
            <div className="hint">
              Where this tween is inserted. <code>&lt;</code> starts it with the previous tween, <code>-=0.3</code> overlaps the previous end by 0.3s, a plain number is an absolute time.
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Ease ---------- */}
      <section className="section">
        <div className="section__head">
          <span className="eyebrow">Ease</span>
          <code style={{ fontSize: 11, color: "var(--accent)" }}>{tween.ease}</code>
        </div>
        <EasePicker value={tween.ease} onChange={(ease) => updateTween(tween.id, { ease })} clip={clip} />
      </section>

      <div style={{ height: 24 }} />
    </>
  );
}

function PropertyRow({ tween, propKey, onChange, onRemove }: { tween: Tween; propKey: string; onChange: (v: string | number, which: "vars" | "fromVars") => void; onRemove: () => void }) {
  const def = propDef(propKey);
  const value = tween.vars[propKey];
  const fromValue = tween.fromVars[propKey];
  const pair = tween.method === "fromTo";

  let control: React.ReactNode;
  if (def.type === "color") {
    control = pair ? (
      <div className="prop__ctrl prop__ctrl--pair">
        <ColorField value={String(fromValue ?? def.default)} onChange={(v) => onChange(v, "fromVars")} ariaLabel={`${propKey} from`} />
        <span className="prop__arrow">→</span>
        <ColorField value={String(value)} onChange={(v) => onChange(v, "vars")} ariaLabel={`${propKey} to`} />
      </div>
    ) : (
      <div className="prop__ctrl prop__ctrl--single">
        <ColorField value={String(value)} onChange={(v) => onChange(v, "vars")} ariaLabel={propKey} />
      </div>
    );
  } else if (def.type === "select") {
    const opts = (def.options ?? []).map((o) => ({ value: o, label: o }));
    control = pair ? (
      <div className="prop__ctrl prop__ctrl--pair">
        <Select value={String(fromValue ?? def.default)} onChange={(v) => onChange(v, "fromVars")} options={opts} mono ariaLabel={`${propKey} from`} />
        <span className="prop__arrow">→</span>
        <Select value={String(value)} onChange={(v) => onChange(v, "vars")} options={opts} mono ariaLabel={`${propKey} to`} />
      </div>
    ) : (
      <div className="prop__ctrl prop__ctrl--single">
        <Select value={String(value)} onChange={(v) => onChange(v, "vars")} options={opts} mono ariaLabel={propKey} />
      </div>
    );
  } else {
    const num = typeof value === "number" ? value : Number(value) || 0;
    const fromNum = typeof fromValue === "number" ? fromValue : Number(fromValue) || 0;
    const min = def.min ?? -1000;
    const max = def.max ?? 1000;
    const step = def.step ?? 1;
    control = pair ? (
      <div className="prop__ctrl prop__ctrl--pair">
        <NumberField value={fromNum} min={min * 2} max={max * 2} step={step} unit={def.unit} onChange={(v) => onChange(v, "fromVars")} ariaLabel={`${propKey} from`} />
        <span className="prop__arrow">→</span>
        <NumberField value={num} min={min * 2} max={max * 2} step={step} unit={def.unit} onChange={(v) => onChange(v, "vars")} ariaLabel={`${propKey} to`} />
      </div>
    ) : (
      <div className="prop__ctrl">
        <Slider value={num} min={min} max={max} step={step} onChange={(v) => onChange(v, "vars")} ariaLabel={`${propKey} slider`} />
        <NumberField value={num} min={min * 2} max={max * 2} step={step} unit={def.unit} onChange={(v) => onChange(v, "vars")} ariaLabel={propKey} />
      </div>
    );
    return (
      <div className="prop" title={def.hint}>
        <ScrubLabel value={num} min={min * 2} max={max * 2} step={step} onChange={(v) => onChange(v, "vars")}>
          <span>{def.label}</span>
        </ScrubLabel>
        {control}
        <IconButton size="sm" label="Remove property" onClick={onRemove}>
          <X />
        </IconButton>
      </div>
    );
  }

  return (
    <div className="prop" title={def.hint}>
      <div className="numfield__label" style={{ cursor: "default" }}>
        <span>{def.label}</span>
      </div>
      {control}
      <IconButton size="sm" label="Remove property" onClick={onRemove}>
        <X />
      </IconButton>
    </div>
  );
}
