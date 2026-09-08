import { useEffect, useId, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import { fmtNum } from "../../lib/codegen";
import { clamp } from "../../lib/math";
import "./ui.css";

/* ---------- Button ---------- */
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "primary" | "ghost";
  size?: "md" | "sm" | "xs";
  danger?: boolean;
}
export function Button({ variant = "default", size = "md", danger, className = "", ...rest }: ButtonProps) {
  const cls = ["btn", variant !== "default" && `btn--${variant}`, size !== "md" && `btn--${size}`, danger && "btn--danger", className].filter(Boolean).join(" ");
  return <button type="button" className={cls} {...rest} />;
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  active?: boolean;
  size?: "md" | "sm";
  tipPos?: "top" | "bottom";
}
export function IconButton({ label, active, size = "md", tipPos, className = "", ...rest }: IconButtonProps) {
  const cls = ["iconbtn", size === "sm" && "iconbtn--sm", active && "is-active", className].filter(Boolean).join(" ");
  return <button type="button" className={cls} aria-label={label} data-tip={label} data-tip-pos={tipPos} {...rest} />;
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="kbd">{children}</kbd>;
}

/* ---------- Segmented ---------- */
interface SegmentedProps<T extends string> {
  value: T;
  options: { value: T; label: ReactNode; tone?: "accent" | "cyan" | "mint"; title?: string }[];
  onChange: (v: T) => void;
  full?: boolean;
  ariaLabel?: string;
}
export function Segmented<T extends string>({ value, options, onChange, full, ariaLabel }: SegmentedProps<T>) {
  return (
    <div className={`seg${full ? " seg--full" : ""}`} role="radiogroup" aria-label={ariaLabel}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          title={o.title}
          data-tone={o.tone}
          className={`seg__opt${o.value === value ? " is-active" : ""}`}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ---------- Switch ---------- */
export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: ReactNode }) {
  return (
    <label className="switch">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="switch__track" />
      {label && <span>{label}</span>}
    </label>
  );
}

/* ---------- Select ---------- */
interface SelectProps {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string; group?: string }[];
  mono?: boolean;
  ariaLabel?: string;
}
export function Select({ value, onChange, options, mono, ariaLabel }: SelectProps) {
  const groups = new Map<string, typeof options>();
  for (const o of options) {
    const g = o.group ?? "";
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g)!.push(o);
  }
  return (
    <div className={`field field--select${mono ? " field--mono" : ""}`}>
      <select value={value} onChange={(e) => onChange(e.target.value)} aria-label={ariaLabel} style={mono ? { fontFamily: "var(--font-mono)", fontSize: 12 } : undefined}>
        {[...groups.entries()].map(([g, opts]) =>
          g ? (
            <optgroup key={g} label={g}>
              {opts.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </optgroup>
          ) : (
            opts.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))
          ),
        )}
      </select>
    </div>
  );
}

/* ---------- Text field ---------- */
interface TextFieldProps {
  value: string;
  onChange: (v: string) => void;
  onCommit?: (v: string) => void;
  placeholder?: string;
  mono?: boolean;
  invalid?: boolean;
  prefix?: string;
  ariaLabel?: string;
  list?: string;
}
export function TextField({ value, onChange, onCommit, placeholder, mono, invalid, prefix, ariaLabel, list }: TextFieldProps) {
  return (
    <div className={`field${mono ? " field--mono" : ""}${invalid ? " field--invalid" : ""}`}>
      {prefix && <span className="field__prefix">{prefix}</span>}
      <input
        value={value}
        placeholder={placeholder}
        aria-label={ariaLabel}
        list={list}
        spellCheck={false}
        onChange={(e) => onChange(e.target.value)}
        onBlur={(e) => onCommit?.(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        }}
      />
    </div>
  );
}

/* ---------- Number field (typed + drag-to-scrub) ---------- */
interface NumberFieldProps {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  ariaLabel?: string;
  /** Drag sensitivity: value units per pixel */
  dragScale?: number;
}
export function NumberField({ value, onChange, min = -Infinity, max = Infinity, step = 1, unit, ariaLabel }: NumberFieldProps) {
  const [text, setText] = useState(fmtNum(value));
  const [editing, setEditing] = useState(false);
  const [lastValue, setLastValue] = useState(value);
  if (value !== lastValue) {
    // Derived state: mirror the prop unless the user is mid-edit.
    setLastValue(value);
    if (!editing) setText(fmtNum(value));
  }

  const commit = (raw: string) => {
    const n = Number(raw);
    if (Number.isFinite(n)) onChange(clamp(n, min, max));
    else setText(fmtNum(value));
    setEditing(false);
  };

  return (
    <div className="field field--mono">
      <input
        type="text"
        inputMode="decimal"
        value={text}
        aria-label={ariaLabel}
        onFocus={() => setEditing(true)}
        onChange={(e) => setText(e.target.value)}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          if (e.key === "ArrowUp" || e.key === "ArrowDown") {
            e.preventDefault();
            const dir = e.key === "ArrowUp" ? 1 : -1;
            const mult = e.shiftKey ? 10 : 1;
            const next = clamp(value + dir * step * mult, min, max);
            onChange(Number(next.toFixed(3)));
          }
        }}
      />
      {unit && <span className="field__unit">{unit}</span>}
    </div>
  );
}

/** A label that scrubs the value when dragged horizontally. */
export function ScrubLabel({ children, value, onChange, min = -Infinity, max = Infinity, step = 1, scale }: { children: ReactNode; value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; scale?: number }) {
  const start = useRef<{ x: number; v: number } | null>(null);
  const per = scale ?? (Number.isFinite(max) && Number.isFinite(min) ? (max - min) / 240 : step);
  return (
    <div
      className="numfield__label"
      title="Drag to scrub"
      onPointerDown={(e) => {
        start.current = { x: e.clientX, v: value };
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (!start.current) return;
        const dx = e.clientX - start.current.x;
        const raw = start.current.v + dx * per * (e.shiftKey ? 0.1 : 1);
        const snapped = Math.round(raw / step) * step;
        onChange(Number(clamp(snapped, min, max).toFixed(3)));
      }}
      onPointerUp={() => (start.current = null)}
      onPointerCancel={() => (start.current = null)}
    >
      {children}
    </div>
  );
}

export function Slider({ value, onChange, min, max, step, ariaLabel, disabled }: { value: number; onChange: (v: number) => void; min: number; max: number; step: number; ariaLabel?: string; disabled?: boolean }) {
  const fill = Number.isFinite(value) ? ((clamp(value, min, max) - min) / (max - min)) * 100 : 0;
  return (
    <input
      type="range"
      className="slider"
      min={min}
      max={max}
      step={step}
      value={Number.isFinite(value) ? value : min}
      aria-label={ariaLabel}
      disabled={disabled}
      style={{ ["--fill" as string]: `${fill}%` }}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  );
}

/* ---------- Color field ---------- */
export function ColorField({ value, onChange, ariaLabel }: { value: string; onChange: (v: string) => void; ariaLabel?: string }) {
  const id = useId();
  const [text, setText] = useState(value);
  const [lastValue, setLastValue] = useState(value);
  if (value !== lastValue) {
    setLastValue(value);
    setText(value);
  }
  const valid = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(text);
  return (
    <div className="colorfield">
      <label className="colorfield__swatch" style={{ background: value }} htmlFor={id} title="Pick a color">
        <input id={id} type="color" value={toHex6(value)} onChange={(e) => onChange(e.target.value)} aria-label={ariaLabel} />
      </label>
      <div className={`field field--mono${valid ? "" : " field--invalid"}`} style={{ flex: 1 }}>
        <input
          value={text}
          spellCheck={false}
          aria-label={ariaLabel ? `${ariaLabel} hex` : "Hex color"}
          onChange={(e) => {
            const v = e.target.value;
            setText(v);
            if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v)) onChange(v.toLowerCase());
          }}
          onBlur={() => setText(value)}
        />
      </div>
    </div>
  );
}

function toHex6(v: string): string {
  const m = /^#([0-9a-f]{3})$/i.exec(v);
  if (m) return "#" + m[1].split("").map((c) => c + c).join("");
  return /^#[0-9a-f]{6}$/i.test(v) ? v : "#000000";
}

/* ---------- Modal ---------- */
export function Modal({ open, onClose, title, subtitle, children, width }: { open: boolean; onClose: () => void; title: ReactNode; subtitle?: ReactNode; children: ReactNode; width?: number }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" style={width ? { width: `min(${width}px, 100%)` } : undefined}>
        <div className="modal__head">
          <div className="modal__title">
            <h2>{title}</h2>
            {subtitle && <span className="hint">{subtitle}</span>}
          </div>
          <IconButton label="Close" onClick={onClose} tipPos="bottom">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </IconButton>
        </div>
        <div className="modal__body">{children}</div>
      </div>
    </div>
  );
}
