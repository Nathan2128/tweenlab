import { useRef } from "react";
import { Pause, Play, Repeat, Rewind, SkipBack } from "lucide-react";
import { useAnimation, useFrame } from "../../hooks/animationContext";
import { useProject } from "../../store/project";
import { IconButton, Segmented } from "../ui";
import "./transport.css";

export function Transport() {
  const anim = useAnimation();
  const { transport } = anim;
  const repeat = useProject((s) => s.project.timeline.repeat);
  const setTimeline = useProject((s) => s.setTimeline);
  const curRef = useRef<HTMLSpanElement>(null);

  useFrame((_, time) => {
    if (curRef.current) curRef.current.textContent = time.toFixed(2);
  });

  return (
    <div className="transport">
      <div className="transport__buttons">
        <IconButton label="Restart (R)" onClick={anim.restart}>
          <SkipBack />
        </IconButton>
        <button type="button" className="playbtn" onClick={anim.toggle} aria-label={transport.playing ? "Pause" : "Play"} data-tip={`${transport.playing ? "Pause" : "Play"} (Space)`}>
          {transport.playing ? <Pause fill="currentColor" strokeWidth={0} /> : <Play className="play" fill="currentColor" strokeWidth={0} />}
        </button>
        <IconButton label="Reverse (⇧R)" onClick={anim.reverse} active={transport.reversed}>
          <Rewind />
        </IconButton>
      </div>

      <div className="timecode" aria-live="off">
        <span className="timecode__cur" ref={curRef}>
          0.00
        </span>
        <span className="timecode__sep">/</span>
        <span className="timecode__total">{transport.infinite ? "∞" : transport.duration.toFixed(2)}</span>
        <span className="timecode__unit">s</span>
      </div>

      <Scrubber />

      <div className="transport__right">
        <Segmented
          ariaLabel="Playback speed"
          value={String(transport.timeScale)}
          onChange={(v) => anim.setTimeScale(Number(v))}
          options={[
            { value: "0.25", label: "¼×" },
            { value: "0.5", label: "½×" },
            { value: "1", label: "1×" },
            { value: "2", label: "2×" },
          ]}
        />
        <IconButton label={repeat === -1 ? "Looping — click to stop (L)" : "Loop timeline (L)"} active={repeat === -1} onClick={() => setTimeline({ repeat: repeat === -1 ? 0 : -1 })}>
          <Repeat />
        </IconButton>
      </div>
    </div>
  );
}

function Scrubber() {
  const anim = useAnimation();
  const disabled = anim.transport.infinite || anim.transport.duration === 0;
  const fillRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ wasPlaying: boolean } | null>(null);

  useFrame((p) => {
    const pct = `${(p * 100).toFixed(3)}%`;
    if (fillRef.current) fillRef.current.style.width = pct;
    if (headRef.current) headRef.current.style.left = pct;
  });

  const seekFromEvent = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    anim.seek((e.clientX - rect.left) / rect.width);
  };

  return (
    <div
      className={`scrub${disabled ? " is-disabled" : ""}`}
      role="slider"
      aria-label="Timeline position"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(anim.read().progress * 100)}
      tabIndex={disabled ? -1 : 0}
      onPointerDown={(e) => {
        if (disabled) return;
        drag.current = { wasPlaying: anim.transport.playing };
        e.currentTarget.setPointerCapture(e.pointerId);
        seekFromEvent(e);
      }}
      onPointerMove={(e) => drag.current && seekFromEvent(e)}
      onPointerUp={() => {
        if (drag.current?.wasPlaying) anim.play();
        drag.current = null;
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") anim.step(-0.1);
        if (e.key === "ArrowRight") anim.step(0.1);
      }}
    >
      <div className="scrub__track">
        <div className="scrub__fill" ref={fillRef} />
      </div>
      <div className="scrub__head" ref={headRef} />
    </div>
  );
}
