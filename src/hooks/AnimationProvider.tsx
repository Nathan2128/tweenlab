import gsap from "gsap";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useProject } from "../store/project";
import { useEditor } from "../store/editor";
import { generateVanilla } from "../lib/codegen";
import { describeClips, runCode, type Master, type TrackClip } from "../lib/runner";
import { AnimationContext, type AnimationApi, type FrameListener, type TransportState } from "./animationContext";

/** "Playing" = not paused and not sitting at the end of its range. Unlike isActive() this is true before the first rendered frame. */
function isPlaying(m: Master): boolean {
  if (m.paused()) return false;
  const d = m.duration();
  if (!Number.isFinite(d) || d === 0) return true;
  const p = m.progress();
  return m.reversed() ? p > 0 : p < 1;
}

export function AnimationProvider({ children }: { children: ReactNode }) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const masterRef = useRef<Master | null>(null);
  const ctxRef = useRef<gsap.Context | null>(null);
  const timeScaleRef = useRef(1);
  const listeners = useRef(new Set<FrameListener>());
  const buildCount = useRef(0);

  const project = useProject((s) => s.project);
  const mode = useEditor((s) => s.mode);
  const code = useEditor((s) => s.code);
  const setRunError = useEditor((s) => s.setRunError);

  const [transport, setTransport] = useState<TransportState>({ playing: false, reversed: false, duration: 0, infinite: false, timeScale: 1, buildId: 0 });
  const [clips, setClips] = useState<TrackClip[]>([]);

  const source = useMemo(() => (mode === "code" ? code : generateVanilla(project)), [mode, code, project]);
  const elementsKey = project.elements.map((e) => `${e.id}/${e.group}/${e.kind}/${e.text ?? ""}`).join("|");

  const emit = useCallback(() => {
    const m = masterRef.current;
    if (!m) return;
    const d = m.duration();
    const p = Number.isFinite(d) && d > 0 ? m.progress() : 0;
    const t = Number.isFinite(d) ? m.time() : m.totalTime();
    listeners.current.forEach((cb) => cb(p, t, d));
  }, []);

  // Build (or rebuild) the animation whenever the source or the stage markup changes.
  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const prev = masterRef.current;
    const prevProgress = prev && Number.isFinite(prev.duration()) ? prev.progress() : 0;
    const wasPlaying = prev ? isPlaying(prev) : true;
    const wasReversed = prev ? prev.reversed() : false;

    ctxRef.current?.revert();
    const { master, ctx, error } = runCode(source, stage);
    masterRef.current = master;
    ctxRef.current = ctx;
    master.timeScale(timeScaleRef.current);

    const duration = master.duration();
    const infinite = !Number.isFinite(duration);
    if (!infinite && duration > 0 && prevProgress > 0 && prevProgress < 1) master.progress(prevProgress);
    if (wasReversed) master.reversed(true);
    if (wasPlaying && duration > 0) master.resume();

    buildCount.current += 1;
    setRunError(error);
    setClips(describeClips(master));
    setTransport({ playing: isPlaying(master), reversed: master.reversed(), duration, infinite, timeScale: timeScaleRef.current, buildId: buildCount.current });
    emit();
  }, [source, elementsKey, emit, setRunError]);

  useEffect(() => () => ctxRef.current?.revert(), []);

  // Per-frame: notify listeners and track the playing flag without re-rendering every frame.
  useEffect(() => {
    let lastPlaying: boolean | null = null;
    let lastReversed: boolean | null = null;
    const tick = () => {
      const m = masterRef.current;
      if (!m) return;
      emit();
      const playing = isPlaying(m);
      const reversed = m.reversed();
      if (playing !== lastPlaying || reversed !== lastReversed) {
        lastPlaying = playing;
        lastReversed = reversed;
        setTransport((s) => (s.playing === playing && s.reversed === reversed ? s : { ...s, playing, reversed }));
      }
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, [emit]);

  const api = useMemo<AnimationApi>(() => {
    const get = () => masterRef.current;
    return {
      stageRef,
      transport,
      clips,
      play: () => {
        const m = get();
        if (!m) return;
        if (m.progress() >= 1 && !m.reversed()) m.restart(true);
        else m.play();
      },
      pause: () => get()?.pause(),
      toggle: () => {
        const m = get();
        if (!m) return;
        if (isPlaying(m)) {
          m.pause();
          return;
        }
        if (!m.reversed() && m.progress() >= 1) m.restart(true);
        else if (m.reversed() && m.progress() <= 0) {
          m.progress(1);
          m.reverse();
        } else m.resume();
      },
      restart: () => {
        const m = get();
        if (!m) return;
        m.reversed(false);
        m.restart(true);
      },
      reverse: () => {
        const m = get();
        if (!m) return;
        if (m.reversed()) m.play();
        else {
          if (m.progress() <= 0) m.progress(1);
          m.reverse();
        }
      },
      seek: (p) => {
        const m = get();
        if (!m || !Number.isFinite(m.duration())) return;
        m.pause();
        m.progress(Math.max(0, Math.min(1, p)));
        emit();
      },
      step: (seconds) => {
        const m = get();
        if (!m || !Number.isFinite(m.duration())) return;
        m.pause();
        m.time(Math.max(0, Math.min(m.duration(), m.time() + seconds)));
        emit();
      },
      setTimeScale: (n) => {
        timeScaleRef.current = n;
        get()?.timeScale(n);
        setTransport((s) => ({ ...s, timeScale: n }));
      },
      onFrame: (cb) => {
        listeners.current.add(cb);
        const m = masterRef.current;
        if (m) {
          const d = m.duration();
          cb(Number.isFinite(d) && d > 0 ? m.progress() : 0, m.time(), d);
        }
        return () => {
          listeners.current.delete(cb);
        };
      },
      read: () => {
        const m = get();
        if (!m) return { progress: 0, time: 0, duration: 0 };
        const d = m.duration();
        return { progress: Number.isFinite(d) && d > 0 ? m.progress() : 0, time: m.time(), duration: d };
      },
    };
  }, [transport, clips, emit]);

  return <AnimationContext.Provider value={api}>{children}</AnimationContext.Provider>;
}
