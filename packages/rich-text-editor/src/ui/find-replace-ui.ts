import type { Editor } from "@tiptap/core";

/**
 * Creates the Find & Replace UI panel.
 * Hidden by default, shown when Ctrl+F is pressed.
 */
export function createFindReplaceUI(container: HTMLElement, editor: Editor) {
  container.className = "rte-find-replace";
  container.style.display = "none";

  container.innerHTML = `
    <div class="rte-find-replace-inner">
      <div class="rte-find-row">
        <input type="text" class="rte-find-input" placeholder="Find..." data-find-input />
        <span class="rte-find-count" data-find-count>0/0</span>
        <button type="button" class="rte-find-btn" data-find-prev title="Previous">▲</button>
        <button type="button" class="rte-find-btn" data-find-next title="Next">▼</button>
      </div>
      <div class="rte-find-row">
        <input type="text" class="rte-find-input" placeholder="Replace..." data-replace-input />
        <button type="button" class="rte-find-btn rte-find-btn-text" data-replace-one>Replace</button>
        <button type="button" class="rte-find-btn rte-find-btn-text" data-replace-all>All</button>
      </div>
      <button type="button" class="rte-find-close" data-find-close title="Close">✕</button>
    </div>
  `;

  const findInput = container.querySelector("[data-find-input]") as HTMLInputElement;
  const replaceInput = container.querySelector("[data-replace-input]") as HTMLInputElement;
  const countEl = container.querySelector("[data-find-count]") as HTMLSpanElement;

  // Show panel on event
  editor.view.dom.addEventListener("find-replace-open", () => {
    container.style.display = "block";
    findInput.focus();
    findInput.select();
  });

  // Find
  findInput.addEventListener("input", () => {
    editor.commands.setSearchTerm(findInput.value);
    updateCount();
  });

  findInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (e.shiftKey) editor.commands.findPrevious();
      else editor.commands.findNext();
      updateCount();
    }
    if (e.key === "Escape") close();
  });

  replaceInput.addEventListener("input", () => {
    editor.commands.setReplaceTerm(replaceInput.value);
  });

  replaceInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      editor.commands.replaceOne();
      updateCount();
    }
    if (e.key === "Escape") close();
  });

  container.querySelector("[data-find-prev]")!.addEventListener("mousedown", (e) => {
    e.preventDefault();
    editor.commands.findPrevious();
    updateCount();
  });

  container.querySelector("[data-find-next]")!.addEventListener("mousedown", (e) => {
    e.preventDefault();
    editor.commands.findNext();
    updateCount();
  });

  container.querySelector("[data-replace-one]")!.addEventListener("mousedown", (e) => {
    e.preventDefault();
    editor.commands.replaceOne();
    updateCount();
  });

  container.querySelector("[data-replace-all]")!.addEventListener("mousedown", (e) => {
    e.preventDefault();
    editor.commands.replaceAll();
    updateCount();
  });

  container.querySelector("[data-find-close]")!.addEventListener("mousedown", (e) => {
    e.preventDefault();
    close();
  });

  function updateCount() {
    const storage = editor.storage.findReplace;
    const total = storage.results.length;
    const current = total > 0 ? storage.currentIndex + 1 : 0;
    countEl.textContent = `${current}/${total}`;
  }

  function close() {
    container.style.display = "none";
    editor.commands.closeFindReplace();
    editor.commands.focus();
  }
}
