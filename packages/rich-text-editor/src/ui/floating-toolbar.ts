import type { Editor } from "@tiptap/core";
import { icons } from "../toolbar/icons";

/**
 * Creates a floating inline toolbar that appears on text selection.
 * Only used when toolbarMode is "floating".
 */
export function createFloatingToolbar(editor: Editor) {
  const el = document.createElement("div");
  el.className = "rte-floating-toolbar";
  el.style.display = "none";
  el.style.position = "absolute";
  el.style.zIndex = "9999";
  document.body.appendChild(el);

  // Build compact toolbar
  el.innerHTML = `
    <button type="button" class="rte-fbtn" data-cmd="bold" title="Bold">${icons.bold}</button>
    <button type="button" class="rte-fbtn" data-cmd="italic" title="Italic">${icons.italic}</button>
    <button type="button" class="rte-fbtn" data-cmd="underline" title="Underline">${icons.underline}</button>
    <button type="button" class="rte-fbtn" data-cmd="strike" title="Strikethrough">${icons.strikethrough}</button>
    <div class="rte-fsep"></div>
    <button type="button" class="rte-fbtn" data-cmd="link" title="Link">${icons.link}</button>
    <button type="button" class="rte-fbtn" data-cmd="highlight" title="Highlight">${icons.highlight}</button>
    <div class="rte-fsep"></div>
    <button type="button" class="rte-fbtn" data-cmd="h1" title="H1"><span class="rte-fbtn-label">H1</span></button>
    <button type="button" class="rte-fbtn" data-cmd="h2" title="H2"><span class="rte-fbtn-label">H2</span></button>
    <button type="button" class="rte-fbtn" data-cmd="h3" title="H3"><span class="rte-fbtn-label">H3</span></button>
  `;

  // Attach handlers
  el.querySelectorAll("[data-cmd]").forEach((btn) => {
    btn.addEventListener("mousedown", (e) => {
      e.preventDefault();
      const cmd = (btn as HTMLElement).dataset.cmd!;
      executeCommand(editor, cmd);
      update();
    });
  });

  function executeCommand(editor: Editor, cmd: string) {
    switch (cmd) {
      case "bold": editor.chain().focus().toggleBold().run(); break;
      case "italic": editor.chain().focus().toggleItalic().run(); break;
      case "underline": editor.chain().focus().toggleUnderline().run(); break;
      case "strike": editor.chain().focus().toggleStrike().run(); break;
      case "link":
        if (editor.isActive("link")) {
          editor.chain().focus().unsetLink().run();
        } else {
          const url = prompt("URL:");
          if (url) editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
        }
        break;
      case "highlight":
        if (editor.isActive("highlight")) editor.chain().focus().unsetHighlight().run();
        else editor.chain().focus().setHighlight({ color: "#fef08a" }).run();
        break;
      case "h1": editor.chain().focus().toggleHeading({ level: 1 }).run(); break;
      case "h2": editor.chain().focus().toggleHeading({ level: 2 }).run(); break;
      case "h3": editor.chain().focus().toggleHeading({ level: 3 }).run(); break;
    }
  }

  function update() {
    const { from, to } = editor.state.selection;
    if (from === to || !editor.isFocused) {
      el.style.display = "none";
      return;
    }

    // Position the toolbar above selection
    const { view } = editor;
    const start = view.coordsAtPos(from);
    const end = view.coordsAtPos(to);
    const midX = (start.left + end.left) / 2;
    const top = Math.min(start.top, end.top) - 48;

    el.style.display = "flex";
    el.style.left = `${midX - el.offsetWidth / 2}px`;
    el.style.top = `${top + window.scrollY}px`;

    // Update active states
    el.querySelectorAll("[data-cmd]").forEach((btn) => {
      const cmd = (btn as HTMLElement).dataset.cmd!;
      const active = isCommandActive(editor, cmd);
      btn.classList.toggle("rte-fbtn-active", active);
    });
  }

  function isCommandActive(editor: Editor, cmd: string): boolean {
    switch (cmd) {
      case "bold": return editor.isActive("bold");
      case "italic": return editor.isActive("italic");
      case "underline": return editor.isActive("underline");
      case "strike": return editor.isActive("strike");
      case "link": return editor.isActive("link");
      case "highlight": return editor.isActive("highlight");
      case "h1": return editor.isActive("heading", { level: 1 });
      case "h2": return editor.isActive("heading", { level: 2 });
      case "h3": return editor.isActive("heading", { level: 3 });
      default: return false;
    }
  }

  editor.on("selectionUpdate", update);
  editor.on("blur", () => { el.style.display = "none"; });

  return {
    update,
    destroy() {
      el.remove();
    },
  };
}
