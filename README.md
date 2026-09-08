# tweenlab

**A GSAP playground.** Build and tune animations visually, scrub them on a DAW-style timeline, then copy production-ready code for vanilla JS, React, Vue or Svelte.

> Built as a portfolio project. Everything the playground generates is plain [GSAP](https://gsap.com) with no runtime dependency on this tool.

## What it does

- **Visual sequence builder.** Add `to` / `from` / `fromTo` tweens, pick targets by class or id, edit properties with sliders, drag-to-scrub labels or typed values.
- **Real timeline semantics.** Position parameters (`<`, `>`, `-=0.3`, absolute times), stagger with origin, per-tween repeat/yoyo, and timeline-level repeat/yoyo/repeatDelay all round-trip into the generated code.
- **Transport + track view.** Play, pause, reverse, restart, scrub, and change speed. A track view shows every clip's start and duration with a live playhead. Clips are clickable.
- **Ease explorer.** Every GSAP ease family with a live curve and a dot that follows the selected tween's progress. Custom ease strings (`back.out(2)`, `elastic.out(1, 0.3)`, `steps(6)`) are validated as you type.
- **Code output for five targets.** Vanilla JS, React (`@gsap/react` `useGSAP`), Vue (`gsap.context`), Svelte, and a standalone HTML + CSS file. Copy or download.
- **Code mode.** Edit the vanilla output by hand and run it against the stage. Arbitrary GSAP is executed inside a scoped `gsap.context`, and whatever top-level animations it creates are wired into the transport automatically.
- **Presets, undo/redo, share links.** Twelve presets to pull apart. Undo history with throttled slider drags. Projects are compressed into the URL hash for sharing and autosaved to localStorage.
- **Built-in guide.** A "How to use this" tab and a Guide modal walk through installing GSAP and pasting the code into a real app, including cleanup and ScrollTrigger notes.

## Stack

| Concern | Choice |
| --- | --- |
| UI | React 19 + TypeScript, Vite 8 |
| Animation | GSAP 3 (also powers the app's own UI choreography via `@gsap/react`) |
| State | Zustand, with `zundo` for undo/redo |
| Editor | CodeMirror 6 with a custom theme |
| Drag & drop | dnd-kit (sortable tween list) |
| Sharing | lz-string compressed project in the URL hash |
| Styling | Hand-written CSS with design tokens, no framework |

## Architecture

```
src/
  lib/
    types.ts        Project / Tween / StageElement model
    properties.ts   Catalogue of animatable properties (ranges, units, defaults)
    eases.ts        Ease families, parsing, sampling for the curve view
    codegen.ts      Project -> code for each framework (Prettier-style formatting)
    runner.ts       Executes generated or hand-written code in a scoped gsap.context
    presets.ts      Preset projects
    share.ts        URL hash + localStorage persistence
  store/
    project.ts      Undoable project store
    editor.ts       UI state (panels, code mode, toasts)
  hooks/
    animation.tsx   Transport controller: builds the master animation, drives play/pause/scrub, per-frame subscriptions
  components/       Stage, Transport, TrackView, Sequence, Inspector, CodePanel, modals, UI primitives
```

The important design decision is that the **builder never drives GSAP directly**. The visual model is compiled to code, and that exact code is what runs on the stage. What you see is literally what you copy.

## Run it

Requires Node 22 (see `.nvmrc`).

```bash
npm install
npm run dev
```

```bash
npm run build
npm run preview
```

## Keyboard shortcuts

Press `?` in the app. Highlights: `Space` play/pause, `R` restart, `⇧R` reverse, `←`/`→` step, `⌘Z`/`⌘⇧Z` undo/redo, `⌘K` presets, `⌘E` toggle code panel, `⌘⇧C` copy code, `⌘↵` run in code mode.
