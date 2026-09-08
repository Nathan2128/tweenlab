import { useState } from "react";
import { EASE_DESCRIPTIONS, EASE_FAMILIES, EASE_TYPES, buildEaseString, isValidEase, parseEaseString, type EaseFamily } from "../../lib/eases";
import { Segmented, TextField } from "../ui";
import { EaseCurve } from "./EaseCurve";

export function EasePicker({ value, onChange, clip }: { value: string; onChange: (ease: string) => void; clip?: { start: number; duration: number } | null }) {
  const parsed = parseEaseString(value);
  const [custom, setCustom] = useState(value);
  const [lastValue, setLastValue] = useState(value);
  if (value !== lastValue) {
    setLastValue(value);
    setCustom(value);
  }
  const customValid = isValidEase(custom);

  const setFamily = (family: EaseFamily) => onChange(buildEaseString(family, parsed.type, family === parsed.family ? parsed.config : ""));

  return (
    <div>
      <div className="ease__fams">
        {EASE_FAMILIES.map((f) => (
          <button key={f} type="button" className={`chip${parsed.family === f ? " is-active" : ""}`} onClick={() => setFamily(f)}>
            {f}
          </button>
        ))}
      </div>
      <Segmented
        ariaLabel="Ease direction"
        full
        value={parsed.type}
        onChange={(t) => parsed.family !== "none" && onChange(buildEaseString(parsed.family, t, parsed.config))}
        options={EASE_TYPES.map((t) => ({ value: t, label: t }))}
      />
      <EaseCurve ease={value} clip={clip} />
      <div className="ease__desc">{EASE_DESCRIPTIONS[parsed.family]}</div>
      <div className="ease__custom">
        <TextField
          mono
          value={custom}
          invalid={!customValid}
          ariaLabel="Ease string"
          placeholder='e.g. back.out(1.7) or "steps(5)"'
          onChange={(v) => {
            setCustom(v);
            if (isValidEase(v)) onChange(v.trim());
          }}
        />
        <div className="hint" style={{ marginTop: 6 }}>
          Type any GSAP ease string. <code>back.out(2)</code> overshoots more, <code>elastic.out(1, 0.3)</code> wobbles longer, <code>steps(6)</code> snaps.
        </div>
      </div>
    </div>
  );
}
