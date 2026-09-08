import { useMemo, useRef } from "react";
import { useAnimation, useFrame } from "../../hooks/animationContext";
import { useProject } from "../../store/project";
import { useEditor } from "../../store/editor";

export function TrackView() {
  const anim = useAnimation();
  const { clips, transport } = anim;
  const tweens = useProject((s) => s.project.tweens);
  const selectedTweenId = useProject((s) => s.selectedTweenId);
  const selectTween = useProject((s) => s.selectTween);
  const mode = useEditor((s) => s.mode);
  const playheadRef = useRef<HTMLDivElement>(null);
  const drag = useRef(false);

  const enabled = useMemo(() => tweens.filter((t) => t.enabled), [tweens]);
  const span = useMemo(() => {
    if (!transport.infinite && transport.duration > 0) return transport.duration;
    const max = clips.reduce((m, c) => Math.max(m, c.start + c.totalDuration), 0);
    return max > 0 ? max : 1;
  }, [clips, transport.duration, transport.infinite]);

  const ticks = useMemo(() => {
    const step = span <= 2 ? 0.25 : span <= 5 ? 0.5 : span <= 12 ? 1 : span <= 30 ? 2 : 5;
    const out: number[] = [];
    for (let t = 0; t <= span + 1e-6; t += step) out.push(Number(t.toFixed(3)));
    return out;
  }, [span]);

  useFrame((_, time) => {
    if (playheadRef.current) playheadRef.current.style.left = `${Math.min(100, (time / span) * 100)}%`;
  });

  const seekFromEvent = (e: React.PointerEvent<HTMLDivElement>) => {
    if (transport.infinite) return;
    const rect = e.currentTarget.getBoundingClientRect();
    anim.seek((e.clientX - rect.left) / rect.width);
  };

  return (
    <div className="track" data-intro="track">
      <div
        className="track__inner"
        onPointerDown={(e) => {
          drag.current = true;
          e.currentTarget.setPointerCapture(e.pointerId);
          seekFromEvent(e);
        }}
        onPointerMove={(e) => drag.current && seekFromEvent(e)}
        onPointerUp={() => (drag.current = false)}
      >
        <div className="track__ruler">
          {ticks.map((t) => (
            <div key={t} className="track__tick" style={{ left: `${(t / span) * 100}%` }}>
              <span>{t}s</span>
            </div>
          ))}
        </div>
        {clips.length === 0 ? (
          <div className="track__empty">No clips yet.</div>
        ) : (
          <div className="track__rows">
            {clips.map((c) => {
              const tween = mode === "builder" ? enabled[c.index] : undefined;
              const label = tween ? tween.target : c.label;
              const width = c.isInfinite ? 100 - (c.start / span) * 100 : (c.totalDuration / span) * 100;
              return (
                <div key={c.index} className="track__row">
                  <div className="track__label" title={label}>
                    {label}
                  </div>
                  <div
                    className={`track__clip${tween && tween.id === selectedTweenId ? " is-selected" : ""}${c.isInfinite ? " is-infinite" : ""}`}
                    data-method={tween?.method}
                    style={{ left: `${(c.start / span) * 100}%`, width: `${Math.max(0.5, width)}%` }}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      if (tween) selectTween(tween.id);
                    }}
                    title={`${label} · ${c.start.toFixed(2)}s → ${(c.start + c.totalDuration).toFixed(2)}s`}
                  >
                    {tween ? `${tween.method} ${Object.keys(tween.vars).join(" ")}` : label}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div className="track__playhead" ref={playheadRef} />
      </div>
    </div>
  );
}
