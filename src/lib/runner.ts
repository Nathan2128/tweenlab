import gsap from "gsap";

export type Animation = gsap.core.Timeline | gsap.core.Tween;
/** Whatever the transport drives: the user's own root animation, or a container when there are several. */
export type Master = Animation;

export interface RunResult {
  master: Master;
  ctx: gsap.Context;
  error: string | null;
}

/** Strip ESM import lines so the snippet can be evaluated with `gsap` injected. */
export function stripImports(code: string): string {
  return code
    .split("\n")
    .filter((l) => !/^\s*import\s.+from\s+["'][^"']+["'];?\s*$/.test(l) && !/^\s*import\s+["'][^"']+["'];?\s*$/.test(l))
    .join("\n");
}

/**
 * Evaluate user/generated GSAP code inside a gsap.context scoped to `scope`.
 * Every top-level animation the code creates is collected into a paused master
 * timeline so the transport can drive it, regardless of how the code was written.
 */
export function runCode(code: string, scope: HTMLElement): RunResult {
  const created: Animation[] = [];
  const track = <T extends Animation>(a: T): T => {
    created.push(a);
    return a;
  };

  const proxy = new Proxy(gsap, {
    get(target, prop, receiver) {
      switch (prop) {
        case "timeline":
          return (vars?: gsap.TimelineVars) => track(gsap.timeline(vars));
        case "to":
          return (t: gsap.TweenTarget, vars: gsap.TweenVars) => track(gsap.to(t, vars));
        case "from":
          return (t: gsap.TweenTarget, vars: gsap.TweenVars) => track(gsap.from(t, vars));
        case "fromTo":
          return (t: gsap.TweenTarget, from: gsap.TweenVars, to: gsap.TweenVars) => track(gsap.fromTo(t, from, to));
        default: {
          const v = Reflect.get(target, prop, receiver);
          return typeof v === "function" ? v.bind(target) : v;
        }
      }
    },
  });

  let error: string | null = null;
  let master!: Master;

  const ctx = gsap.context(() => {
    try {
      const fn = new Function("gsap", stripImports(code));
      fn(proxy);
    } catch (e) {
      error = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
    }
    // Only keep animations that are still top-level (not nested into another timeline by the user).
    const roots = created.filter((a) => a.parent === gsap.globalTimeline);
    if (roots.length === 1) {
      // Drive the user's own animation directly so repeat/yoyo/progress behave exactly as in their app.
      master = roots[0];
    } else {
      const container = gsap.timeline({ paused: true });
      roots.forEach((a) => {
        container.add(a, 0);
        // A paused child is excluded from the parent's duration; the container's transport owns playback now.
        a.paused(false);
      });
      master = container;
    }
  }, scope);

  master.pause(0);
  return { master, ctx, error };
}

/** Describe the direct children of the master for the track view. */
export interface TrackClip {
  index: number;
  start: number;
  duration: number;
  totalDuration: number;
  label: string;
  isInfinite: boolean;
}

/** Best-effort selector text for a tween's targets: "#id", ".class ×3", or "3 targets". */
function describeTargets(c: Animation): string | null {
  let targets: unknown[] = (c as gsap.core.Tween).targets?.() ?? [];
  if (!targets.length && c instanceof gsap.core.Timeline) {
    // A staggered tween is a timeline of per-element tweens; gather their targets.
    targets = c.getChildren(true, true, false).flatMap((t) => (t as gsap.core.Tween).targets?.() ?? []);
  }
  const els = targets.filter((t): t is Element => t instanceof Element);
  if (!els.length) return null;
  if (els.length === 1) return els[0].id ? `#${els[0].id}` : els[0].classList[0] ? `.${els[0].classList[0]}` : els[0].tagName.toLowerCase();
  const shared = [...els[0].classList].find((cls) => els.every((e) => e.classList.contains(cls)));
  return shared ? `.${shared} ×${els.length}` : `${els.length} targets`;
}

export function describeClips(master: Master): TrackClip[] {
  const describe = (c: Animation, index: number): TrackClip => {
    const label = describeTargets(c) ?? (c.vars.id ? String(c.vars.id) : `clip ${index + 1}`);
    const total = c.totalDuration();
    return {
      index,
      start: c.startTime(),
      duration: c.duration(),
      totalDuration: Number.isFinite(total) ? total : c.duration(),
      label,
      isInfinite: !Number.isFinite(total),
    };
  };
  if (!(master instanceof gsap.core.Timeline)) return [describe(master, 0)];
  return master.getChildren(false, true, true).map(describe);
}
