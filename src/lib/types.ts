export type ElementKind = "box" | "circle" | "pill" | "ring" | "text";

export interface StageElement {
  /** DOM id, e.g. "box-1" */
  id: string;
  kind: ElementKind;
  /** Shared class name, e.g. "box" */
  group: string;
  color: string;
  text?: string;
}

export type TweenMethod = "to" | "from" | "fromTo";
export type VarValue = number | string;
export type Vars = Record<string, VarValue>;
export type StaggerFrom = "start" | "center" | "end" | "edges" | "random";
export type StageLayout = "row" | "column" | "grid";

export interface Tween {
  id: string;
  target: string;
  method: TweenMethod;
  /** Destination for `to`/`fromTo`, origin for `from` */
  vars: Vars;
  /** Origin values, only used by `fromTo` */
  fromVars: Vars;
  duration: number;
  delay: number;
  ease: string;
  repeat: number;
  yoyo: boolean;
  stagger: number;
  staggerFrom: StaggerFrom;
  /** Timeline position parameter: "", "<", ">", "+=0.5", "-=0.5", "1.2" */
  position: string;
  enabled: boolean;
}

export interface TimelineSettings {
  repeat: number;
  yoyo: boolean;
  repeatDelay: number;
}

export interface Project {
  version: 1;
  name: string;
  layout: StageLayout;
  elements: StageElement[];
  tweens: Tween[];
  timeline: TimelineSettings;
}
