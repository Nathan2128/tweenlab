import { useMemo } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { html } from "@codemirror/lang-html";
import { keymap } from "@codemirror/view";
import { Prec } from "@codemirror/state";
import type { Framework } from "../../lib/codegen";
import { labHighlighting, labTheme } from "./theme";

interface Props {
  value: string;
  language: Framework;
  editable: boolean;
  onChange?: (value: string) => void;
  onRun?: () => void;
}

/** CodeMirror is the heaviest dependency, so this component is loaded lazily by the code panel. */
export default function CodeEditor({ value, language, editable, onChange, onRun }: Props) {
  const extensions = useMemo(() => {
    const lang = language === "vanilla" || language === "react" ? javascript({ jsx: language === "react" }) : html();
    return [labHighlighting, lang, Prec.highest(keymap.of([{ key: "Mod-Enter", run: () => (onRun?.(), true) }]))];
  }, [language, onRun]);

  return (
    <CodeMirror
      value={value}
      height="100%"
      theme={labTheme}
      extensions={extensions}
      editable={editable}
      readOnly={!editable}
      onChange={(v) => editable && onChange?.(v)}
      basicSetup={{ lineNumbers: true, foldGutter: false, highlightActiveLine: editable, highlightActiveLineGutter: editable, autocompletion: editable, bracketMatching: true, closeBrackets: editable, indentOnInput: editable, searchKeymap: true }}
    />
  );
}
