import type { Editor } from "@tiptap/core";

/**
 * Creates the stats bar at the bottom of the editor.
 * Shows word count, character count, and reading time.
 */
export function createStatsBar(container: HTMLElement, editor: Editor) {
  container.className = "rte-stats-bar";
  update();

  editor.on("update", update);
  editor.on("selectionUpdate", update);

  function update() {
    const words = editor.storage.characterCount.words();
    const chars = editor.storage.characterCount.characters();
    const readTime = Math.max(1, Math.ceil(words / 200));

    // Selected text stats
    const { from, to } = editor.state.selection;
    let selectedInfo = "";
    if (from !== to) {
      const selectedText = editor.state.doc.textBetween(from, to, " ");
      const selectedWords = selectedText.trim().split(/\s+/).filter(Boolean).length;
      if (selectedWords > 0) selectedInfo = ` · ${selectedWords} selected`;
    }

    container.innerHTML = `
      <span>${words} words</span>
      <span>${chars} chars</span>
      <span>~${readTime} min read${selectedInfo}</span>
    `;
  }
}
