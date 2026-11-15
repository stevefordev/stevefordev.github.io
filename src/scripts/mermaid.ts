type MermaidDiagramBlock = HTMLElement & {
  dataset: DOMStringMap;
};

async function renderMermaidDiagrams() {
  const codeBlocks = Array.from(
    document.querySelectorAll<HTMLPreElement>('pre[data-language="mermaid"]')
  );
  const existingContainers = Array.from(
    document.querySelectorAll<MermaidDiagramBlock>(".mermaid-diagram")
  );

  if (codeBlocks.length === 0 && existingContainers.length === 0) {
    return;
  }

  for (const pre of codeBlocks) {
    const code =
      pre.querySelector("code")?.textContent ?? pre.textContent ?? "";
    const container = document.createElement("div");
    container.className = "mermaid-diagram";
    container.dataset.mermaidSource = code;
    container.textContent = code;
    pre.replaceWith(container);
  }

  const diagrams = Array.from(
    document.querySelectorAll<MermaidDiagramBlock>(".mermaid-diagram")
  );
  if (diagrams.length === 0) return;

  const { default: mermaid } = await import("mermaid");
  const isDark = document.documentElement.dataset.theme === "dark";

  mermaid.initialize({
    startOnLoad: false,
    theme: isDark ? "dark" : "default",
    securityLevel: "loose",
  });

  for (let i = 0; i < diagrams.length; i++) {
    const el = diagrams[i];
    const source = el.dataset.mermaidSource;
    if (!source) continue;
    try {
      const { svg } = await mermaid.render(
        `mermaid-svg-${i}-${Date.now()}`,
        source
      );
      el.innerHTML = svg;
    } catch {
      el.textContent = source;
    }
  }
}

let mermaidObserverBound = false;

function initMermaid() {
  void renderMermaidDiagrams();

  if (!mermaidObserverBound) {
    mermaidObserverBound = true;
    const observer = new MutationObserver(() => {
      void renderMermaidDiagrams();
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
  }
}

initMermaid();
document.addEventListener("astro:page-load", initMermaid);
