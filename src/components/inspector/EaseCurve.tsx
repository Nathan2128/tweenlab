import { useMemo, useRef } from "react";
import { useFrame } from "../../hooks/animationContext";
import { sampleEase } from "../../lib/eases";

const W = 300;
const H = 170;
const PAD_X = 16;
const TOP = 32;
const BOTTOM = H - 32;
const PLOT_H = BOTTOM - TOP;

/**
 * Plots the ease curve. When `clip` is given, a dot travels along the curve in
 * sync with that tween's local progress on the master timeline.
 */
export function EaseCurve({ ease, clip }: { ease: string; clip?: { start: number; duration: number } | null }) {
  const dotRef = useRef<SVGCircleElement>(null);
  const trailRef = useRef<SVGLineElement>(null);
  const samples = useMemo(() => sampleEase(ease, 96), [ease]);
  const fn = useMemo(() => {
    const s = samples;
    return (t: number) => {
      if (!s.length) return t;
      const i = Math.min(s.length - 1, Math.max(0, t * (s.length - 1)));
      const lo = Math.floor(i);
      const hi = Math.min(s.length - 1, lo + 1);
      return s[lo] + (s[hi] - s[lo]) * (i - lo);
    };
  }, [samples]);

  const x = (t: number) => PAD_X + t * (W - PAD_X * 2);
  const y = (v: number) => BOTTOM - v * PLOT_H;

  const path = useMemo(() => {
    if (!samples.length) return "";
    return samples.map((v, i) => `${i ? "L" : "M"}${x(i / (samples.length - 1)).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  }, [samples]);

  useFrame((_, time) => {
    if (!clip || !dotRef.current) return;
    const local = clip.duration > 0 ? Math.max(0, Math.min(1, (time - clip.start) / clip.duration)) : 0;
    const cx = x(local);
    const cy = y(fn(local));
    dotRef.current.setAttribute("cx", cx.toFixed(1));
    dotRef.current.setAttribute("cy", cy.toFixed(1));
    if (trailRef.current) {
      trailRef.current.setAttribute("x1", cx.toFixed(1));
      trailRef.current.setAttribute("x2", cx.toFixed(1));
    }
  });

  return (
    <div className="ease__curve">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Ease curve for ${ease}`}>
        <defs>
          <linearGradient id="easeFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="var(--accent)" stopOpacity="0.28" />
            <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <line x1={PAD_X} x2={W - PAD_X} y1={y(0)} y2={y(0)} stroke="var(--line-strong)" strokeDasharray="3 4" />
        <line x1={PAD_X} x2={W - PAD_X} y1={y(1)} y2={y(1)} stroke="var(--line-strong)" strokeDasharray="3 4" />
        <text x={W - PAD_X} y={y(1) - 6} fill="var(--fg-3)" fontSize="9" fontFamily="var(--font-mono)" textAnchor="end">
          1
        </text>
        <text x={W - PAD_X} y={y(0) + 12} fill="var(--fg-3)" fontSize="9" fontFamily="var(--font-mono)" textAnchor="end">
          0
        </text>
        {path && <path d={`${path} L${x(1)},${y(0)} L${x(0)},${y(0)} Z`} fill="url(#easeFill)" stroke="none" />}
        {path ? (
          <path d={path} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <text x={W / 2} y={H / 2} fill="var(--coral)" fontSize="11" fontFamily="var(--font-mono)" textAnchor="middle">
            invalid ease
          </text>
        )}
        {clip && (
          <>
            <line ref={trailRef} x1={x(0)} x2={x(0)} y1={TOP - 8} y2={BOTTOM + 8} stroke="var(--fg-3)" strokeWidth="1" />
            <circle ref={dotRef} cx={x(0)} cy={y(0)} r="5" fill="var(--fg-0)" stroke="var(--bg-0)" strokeWidth="2" />
          </>
        )}
      </svg>
    </div>
  );
}
