import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { useEditor } from "../../store/editor";
import { IconButton } from "../ui";
import type { Framework } from "../../lib/codegen";

function Snippet({ children, text }: { children: React.ReactNode; text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="snippet">
      {children}
      <IconButton
        size="sm"
        label={copied ? "Copied" : "Copy"}
        onClick={async () => {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1400);
        }}
      >
        {copied ? <Check /> : <Copy />}
      </IconButton>
    </div>
  );
}

const INSTALL: Record<Exclude<Framework, "html">, string> = {
  vanilla: "npm install gsap",
  react: "npm install gsap @gsap/react",
  vue: "npm install gsap",
  svelte: "npm install gsap",
};

export function HowTo({ compact = false }: { compact?: boolean }) {
  const setCodeTab = useEditor((s) => s.setCodeTab);
  const setGuideOpen = useEditor((s) => s.setGuideOpen);
  const go = (f: Framework) => {
    setGuideOpen(false);
    setCodeTab(f);
  };

  return (
    <div className="howto">
      <div className="howto__grid">
        <div>
          <h3>
            From playground to <em>production</em> in three steps.
          </h3>
          <p>Everything you build here is plain GSAP. Nothing in the generated code depends on this tool, so it pastes straight into any project.</p>

          <ol className="steps" style={{ marginTop: 18 }}>
            <li>
              <strong>Install GSAP</strong>
              GSAP is free for everyone, including every plugin, since version 3.13. One package, no license key.
              <Snippet text="npm install gsap">
                <span className="c">$ </span>npm install gsap
              </Snippet>
              For React, also grab the official hook so animations clean up automatically:
              <Snippet text="npm install gsap @gsap/react">
                <span className="c">$ </span>npm install gsap @gsap/react
              </Snippet>
            </li>
            <li>
              <strong>Add the markup</strong>
              Your tweens target selectors like <code>.box</code> and <code>#circle-1</code>. Copy the elements from the{" "}
              <a href="#" onClick={(e) => (e.preventDefault(), go("html"))}>
                HTML + CSS
              </a>{" "}
              tab, or simply give your own elements the same classes and ids. The selectors are all that matter; the shapes are just placeholders.
            </li>
            <li>
              <strong>Paste the animation</strong>
              Pick your framework tab (
              {(["vanilla", "react", "vue", "svelte"] as const).map((f, i) => (
                <span key={f}>
                  {i > 0 && ", "}
                  <a href="#" onClick={(e) => (e.preventDefault(), go(f))}>
                    {f === "vanilla" ? "Vanilla JS" : f[0].toUpperCase() + f.slice(1)}
                  </a>
                </span>
              ))}
              ), hit <strong style={{ display: "inline" }}>Copy</strong>, and drop the file into your project. Run it after the elements exist in the DOM. That is exactly what the React, Vue and Svelte versions already do for you.
            </li>
          </ol>

          {!compact && (
            <>
              <h4>Why the generated code looks the way it does</h4>
              <ul className="notes">
                <li>
                  <code>gsap.timeline()</code> sequences tweens back to back. The optional third argument on each call is the <em>position parameter</em>: <code>"&lt;"</code> starts a tween with the previous one, <code>"-=0.3"</code> overlaps by 0.3 seconds, and a number is an absolute time.
                </li>
                <li>
                  <code>from()</code> tweens animate <em>to</em> the element's natural CSS state, which makes them ideal for entrances: your layout stays the source of truth.
                </li>
                <li>
                  <code>stagger</code> spreads one tween across every matched element. Pass an object (<code>{"{ each: 0.1, from: \"center\" }"}</code>) to control the origin.
                </li>
                <li>
                  In React, <code>useGSAP</code> scopes selector text to the ref you pass and reverts everything on unmount. The Vue and Svelte outputs do the same with <code>gsap.context()</code>.
                </li>
              </ul>
            </>
          )}
        </div>

        <div>
          <div className="howto__card">
            <h4>Install commands</h4>
            {(Object.keys(INSTALL) as (keyof typeof INSTALL)[]).map((f) => (
              <div key={f} style={{ marginBottom: 6 }}>
                <span className="eyebrow">{f === "vanilla" ? "Vanilla JS" : f}</span>
                <Snippet text={INSTALL[f]}>
                  <span className="c">$ </span>
                  {INSTALL[f]}
                </Snippet>
              </div>
            ))}
          </div>

          <div className="howto__card">
            <h4>Trigger it your way</h4>
            <p>The code creates and plays the timeline immediately. To control when it runs, pause it and call it later:</p>
            <Snippet text={`const tl = gsap.timeline({ paused: true });\n// ...tweens\nbutton.addEventListener("click", () => tl.restart());`}>
              <span className="k">const</span> tl = gsap.timeline({"{"} paused: <span className="k">true</span> {"}"});{"\n"}
              <span className="c">// ...tweens</span>
              {"\n"}button.addEventListener(<span className="s">"click"</span>, () =&gt; tl.restart());
            </Snippet>
            <p style={{ marginTop: 10 }}>To play on scroll, register ScrollTrigger and pass it in the timeline's vars:</p>
            <Snippet text={`import { ScrollTrigger } from "gsap/ScrollTrigger";\ngsap.registerPlugin(ScrollTrigger);\n\nconst tl = gsap.timeline({\n  scrollTrigger: { trigger: ".stage", start: "top 80%" },\n});`}>
              <span className="k">import</span> {"{ ScrollTrigger }"} <span className="k">from</span> <span className="s">"gsap/ScrollTrigger"</span>;{"\n"}gsap.registerPlugin(ScrollTrigger);{"\n\n"}
              <span className="k">const</span> tl = gsap.timeline({"{"}
              {"\n"}  scrollTrigger: {"{"} trigger: <span className="s">".stage"</span>, start: <span className="s">"top 80%"</span> {"}"},{"\n"}
              {"}"});
            </Snippet>
          </div>

          <div className="howto__card">
            <h4>Go further</h4>
            <ul className="notes">
              <li>
                <a href="https://gsap.com/docs/v3/" target="_blank" rel="noreferrer">
                  GSAP documentation
                </a>{" "}
                for every property, plugin and method.
              </li>
              <li>
                <a href="https://gsap.com/docs/v3/Eases/" target="_blank" rel="noreferrer">
                  Ease visualizer
                </a>{" "}
                to explore custom easing beyond the presets here.
              </li>
              <li>
                <a href="https://gsap.com/resources/React/" target="_blank" rel="noreferrer">
                  GSAP + React guide
                </a>{" "}
                covering <code>useGSAP</code>, context and cleanup in depth.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
