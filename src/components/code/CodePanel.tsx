import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, Check, ChevronDown, ChevronUp, Copy, Download, Pencil, Play, Undo2 } from "lucide-react";
import { useProject } from "../../store/project";
import { useEditor } from "../../store/editor";
import { FRAMEWORKS, generate, generateVanilla, type Framework } from "../../lib/codegen";
import { Button, IconButton } from "../ui";
import { HowTo } from "./HowTo";
import "./code.css";

const CodeEditor = lazy(() => import("./CodeEditor"));

export function CodePanel() {
  const project = useProject((s) => s.project);
  const mode = useEditor((s) => s.mode);
  const draft = useEditor((s) => s.draft);
  const code = useEditor((s) => s.code);
  const codeTab = useEditor((s) => s.codeTab);
  const panelOpen = useEditor((s) => s.panelOpen);
  const panelHeight = useEditor((s) => s.panelHeight);
  const runError = useEditor((s) => s.runError);
  const setCodeTab = useEditor((s) => s.setCodeTab);
  const setPanelOpen = useEditor((s) => s.setPanelOpen);
  const setPanelHeight = useEditor((s) => s.setPanelHeight);
  const enterCodeMode = useEditor((s) => s.enterCodeMode);
  const exitCodeMode = useEditor((s) => s.exitCodeMode);
  const setDraft = useEditor((s) => s.setDraft);
  const runDraft = useEditor((s) => s.runDraft);
  const notify = useEditor((s) => s.notify);

  const [copied, setCopied] = useState(false);
  const generated = useMemo(() => (codeTab === "howto" ? "" : generate(project, codeTab)), [project, codeTab]);
  const editing = mode === "code";
  const displayed = editing ? draft : generated;
  const dirty = editing && draft !== code;

  const copy = useCallback(async () => {
    const text = codeTab === "howto" ? generateVanilla(project) : displayed;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      notify("Code copied — paste it into your project", "success");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      notify("Couldn't access the clipboard", "error");
    }
  }, [codeTab, displayed, notify, project]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "c") {
        e.preventDefault();
        copy();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [copy]);

  const download = () => {
    const fw = FRAMEWORKS.find((f) => f.id === codeTab);
    const file = fw?.file ?? "animation.js";
    const blob = new Blob([displayed], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* Resize by dragging the top edge */
  const resizing = useRef<{ y: number; h: number } | null>(null);
  const [resizeActive, setResizeActive] = useState(false);

  return (
    <div className={`codepanel${panelOpen ? "" : " is-collapsed"}`} style={{ ["--panel-h" as string]: `${panelHeight}px` }} data-intro="code">
      {panelOpen && (
        <div
          className={`codepanel__resize${resizeActive ? " is-active" : ""}`}
          onPointerDown={(e) => {
            resizing.current = { y: e.clientY, h: panelHeight };
            setResizeActive(true);
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => resizing.current && setPanelHeight(resizing.current.h + (resizing.current.y - e.clientY))}
          onPointerUp={() => {
            resizing.current = null;
            setResizeActive(false);
          }}
        />
      )}

      <div className="codepanel__bar">
        <div className="codetabs" role="tablist">
          {FRAMEWORKS.map((f) => (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={codeTab === f.id}
              className={`codetab${codeTab === f.id ? " is-active" : ""}`}
              onClick={() => {
                if (editing && f.id !== "vanilla") {
                  notify("Exit code mode to view other frameworks");
                  return;
                }
                setCodeTab(f.id);
              }}
            >
              {f.label}
            </button>
          ))}
          <span className="codetabs__sep" />
          <button type="button" role="tab" aria-selected={codeTab === "howto"} className={`codetab codetab--howto${codeTab === "howto" ? " is-active" : ""}`} onClick={() => setCodeTab("howto")}>
            <BookOpen /> How to use this
          </button>
        </div>

        <div className="codepanel__actions">
          {codeTab !== "howto" && <span className="codepanel__file">{FRAMEWORKS.find((f) => f.id === codeTab)?.file}</span>}
          {codeTab === "vanilla" && !editing && (
            <Button size="sm" variant="ghost" onClick={() => enterCodeMode(generateVanilla(project))} title="Edit the code by hand and run it on the stage">
              <Pencil /> Edit &amp; run
            </Button>
          )}
          {editing && (
            <>
              <Button size="sm" variant="ghost" onClick={exitCodeMode} title="Return to the visual builder">
                <Undo2 /> Back to builder
              </Button>
              <Button size="sm" variant={dirty ? "primary" : "default"} onClick={runDraft} title="Run the code (⌘↵)">
                <Play /> Run
              </Button>
            </>
          )}
          {codeTab !== "howto" && (
            <IconButton label="Download file" onClick={download}>
              <Download />
            </IconButton>
          )}
          <Button size="sm" onClick={copy} title="Copy code (⌘⇧C)">
            {copied ? <Check /> : <Copy />}
            {copied ? "Copied" : "Copy"}
          </Button>
          <IconButton label={panelOpen ? "Collapse (⌘E)" : "Expand (⌘E)"} onClick={() => setPanelOpen(!panelOpen)}>
            {panelOpen ? <ChevronDown /> : <ChevronUp />}
          </IconButton>
        </div>
      </div>

      {panelOpen && editing && (
        <div className="codemode">
          <span className="codemode__dot" />
          <span className="codemode__msg">
            <b>Code mode.</b> Write any GSAP you like against the stage elements. {dirty ? "Press Run or ⌘↵ to apply." : "Changes run in a scoped gsap.context; the transport still drives your timeline."}
          </span>
          {runError && <span className="codemode__err">{runError}</span>}
        </div>
      )}

      {panelOpen && (
        <div className="codepanel__body">
          {codeTab === "howto" ? (
            <HowTo compact />
          ) : (
            <Suspense fallback={<pre className="code-fallback">{displayed}</pre>}>
              <CodeEditor value={displayed} language={codeTab} editable={editing} onChange={setDraft} onRun={runDraft} />
            </Suspense>
          )}
        </div>
      )}
    </div>
  );
}

export type { Framework };
