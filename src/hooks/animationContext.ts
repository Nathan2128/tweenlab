import { createContext, useContext, useEffect, useLayoutEffect, useRef, type RefObject } from "react";
import type { TrackClip } from "../lib/runner";

export interface TransportState {
  playing: boolean;
  reversed: boolean;
  duration: number;
  infinite: boolean;
  timeScale: number;
  buildId: number;
}

export type FrameListener = (progress: number, time: number, duration: number) => void;

export interface AnimationApi {
  stageRef: RefObject<HTMLDivElement | null>;
  transport: TransportState;
  clips: TrackClip[];
  play: () => void;
  pause: () => void;
  toggle: () => void;
  restart: () => void;
  reverse: () => void;
  seek: (progress: number) => void;
  step: (seconds: number) => void;
  setTimeScale: (n: number) => void;
  onFrame: (cb: FrameListener) => () => void;
  /** Current progress snapshot (not reactive) */
  read: () => { progress: number; time: number; duration: number };
}

export const AnimationContext = createContext<AnimationApi | null>(null);

export function useAnimation(): AnimationApi {
  const ctx = useContext(AnimationContext);
  if (!ctx) throw new Error("useAnimation must be used inside <AnimationProvider>");
  return ctx;
}

/** Subscribe to per-frame updates. The callback should write to the DOM directly. */
export function useFrame(cb: FrameListener): void {
  const { onFrame } = useAnimation();
  const ref = useRef(cb);
  useLayoutEffect(() => {
    ref.current = cb;
  });
  useEffect(() => onFrame((p, t, d) => ref.current(p, t, d)), [onFrame]);
}
