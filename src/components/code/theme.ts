import { EditorView } from "@codemirror/view";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";

export const labTheme = EditorView.theme(
  {
    "&": { backgroundColor: "transparent", color: "#f3f1ec", fontSize: "12.5px", height: "100%" },
    ".cm-content": { fontFamily: "var(--font-mono)", padding: "14px 0 24px", caretColor: "#ffb020" },
    ".cm-line": { padding: "0 16px" },
    ".cm-scroller": { fontFamily: "var(--font-mono)", lineHeight: "1.6" },
    ".cm-gutters": { backgroundColor: "transparent", color: "#55534d", border: "none", paddingLeft: "6px" },
    ".cm-lineNumbers .cm-gutterElement": { minWidth: "34px", paddingRight: "10px" },
    ".cm-activeLine": { backgroundColor: "rgba(255,255,255,0.025)" },
    ".cm-activeLineGutter": { backgroundColor: "transparent", color: "#b9b6ae" },
    "&.cm-focused": { outline: "none" },
    ".cm-cursor, .cm-dropCursor": { borderLeftColor: "#ffb020", borderLeftWidth: "2px" },
    "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection": { backgroundColor: "rgba(255,176,32,0.22) !important" },
    ".cm-matchingBracket": { backgroundColor: "rgba(98,210,255,0.18)", outline: "none" },
    ".cm-selectionMatch": { backgroundColor: "rgba(255,255,255,0.06)" },
    ".cm-tooltip": { backgroundColor: "#1d1d21", border: "1px solid #303036", color: "#f3f1ec" },
    ".cm-foldPlaceholder": { backgroundColor: "#242429", border: "none", color: "#b9b6ae" },
  },
  { dark: true },
);

const highlight = HighlightStyle.define([
  { tag: [t.keyword, t.modifier, t.controlKeyword, t.operatorKeyword, t.definitionKeyword, t.moduleKeyword], color: "#62d2ff" },
  { tag: [t.string, t.special(t.string)], color: "#ffb020" },
  { tag: [t.number, t.bool, t.null, t.atom], color: "#7cf2a6" },
  { tag: [t.comment, t.lineComment, t.blockComment], color: "#6a675f", fontStyle: "italic" },
  { tag: [t.propertyName, t.definition(t.propertyName)], color: "#e8e6df" },
  { tag: [t.function(t.variableName), t.function(t.propertyName)], color: "#f3f1ec" },
  { tag: [t.variableName, t.definition(t.variableName)], color: "#f3f1ec" },
  { tag: [t.operator, t.punctuation, t.separator, t.bracket, t.paren, t.brace, t.squareBracket], color: "#8a877f" },
  { tag: [t.tagName, t.angleBracket], color: "#62d2ff" },
  { tag: [t.attributeName], color: "#c9b8ff" },
  { tag: [t.attributeValue], color: "#ffb020" },
  { tag: [t.typeName, t.className], color: "#c9b8ff" },
  { tag: [t.self, t.regexp], color: "#ff7ab6" },
]);

export const labHighlighting = syntaxHighlighting(highlight);
