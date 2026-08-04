import type { Editor } from "@tiptap/core";
import { icons } from "./icons";
import {
  FONT_FAMILIES,
  FONT_SIZES,
  LINE_SPACINGS,
  TEXT_COLORS,
  HIGHLIGHT_COLORS,
} from "../types";

/**
 * Renders the complete top toolbar into a container element.
 * Returns an object with an `update()` method to sync active states.
 */
export function createToolbar(container: HTMLElement, editor: Editor) {
  container.className = "rte-toolbar";
  container.innerHTML = "";

  const row1 = el("div", "rte-toolbar-row");
  const row2 = el("div", "rte-toolbar-row");
  container.appendChild(row1);
  container.appendChild(row2);

  // --- Row 1: Headings, Text Format, Colors, Lists ---
  // Paragraph + Headings
  row1.appendChild(btn(icons.bold, "Normal Text", () => editor.chain().focus().setParagraph().run(), () => editor.isActive("paragraph"), "P"));
  for (let i = 1; i <= 6; i++) {
    const level = i as 1 | 2 | 3 | 4 | 5 | 6;
    row1.appendChild(
      btn(`<span class="rte-btn-label">H${i}</span>`, `Heading ${i}`,
        () => editor.chain().focus().toggleHeading({ level }).run(),
        () => editor.isActive("heading", { level }),
      ),
    );
  }

  row1.appendChild(sep());

  // Text formatting
  row1.appendChild(btn(icons.bold, "Bold (Ctrl+B)", () => editor.chain().focus().toggleBold().run(), () => editor.isActive("bold")));
  row1.appendChild(btn(icons.italic, "Italic (Ctrl+I)", () => editor.chain().focus().toggleItalic().run(), () => editor.isActive("italic")));
  row1.appendChild(btn(icons.underline, "Underline (Ctrl+U)", () => editor.chain().focus().toggleUnderline().run(), () => editor.isActive("underline")));
  row1.appendChild(btn(icons.strikethrough, "Strikethrough", () => editor.chain().focus().toggleStrike().run(), () => editor.isActive("strike")));
  row1.appendChild(btn(icons.subscript, "Subscript", () => editor.chain().focus().toggleSubscript().run(), () => editor.isActive("subscript")));
  row1.appendChild(btn(icons.superscript, "Superscript", () => editor.chain().focus().toggleSuperscript().run(), () => editor.isActive("superscript")));

  row1.appendChild(sep());

  // Colors
  row1.appendChild(colorDrop(editor, TEXT_COLORS as unknown as string[], "text", "Text Color", icons.textColor));
  row1.appendChild(colorDrop(editor, HIGHLIGHT_COLORS as unknown as string[], "highlight", "Highlight", icons.highlight));

  row1.appendChild(sep());

  // Lists
  row1.appendChild(btn(icons.bulletList, "Bullet List", () => editor.chain().focus().toggleBulletList().run(), () => editor.isActive("bulletList")));
  row1.appendChild(btn(icons.orderedList, "Numbered List", () => editor.chain().focus().toggleOrderedList().run(), () => editor.isActive("orderedList")));
  row1.appendChild(btn(icons.taskList, "Task List", () => editor.chain().focus().toggleTaskList().run(), () => editor.isActive("taskList")));
  row1.appendChild(btn(icons.blockquote, "Blockquote", () => editor.chain().focus().toggleBlockquote().run(), () => editor.isActive("blockquote")));
  row1.appendChild(btn(icons.codeBlock, "Code Block", () => editor.chain().focus().toggleCodeBlock().run(), () => editor.isActive("codeBlock")));

  // --- Row 2: Alignment, Indent, Link, Media, Font, Spacing, Tools ---
  row2.appendChild(btn(icons.alignLeft, "Align Left", () => editor.chain().focus().setTextAlign("left").run(), () => editor.isActive({ textAlign: "left" })));
  row2.appendChild(btn(icons.alignCenter, "Align Center", () => editor.chain().focus().setTextAlign("center").run(), () => editor.isActive({ textAlign: "center" })));
  row2.appendChild(btn(icons.alignRight, "Align Right", () => editor.chain().focus().setTextAlign("right").run(), () => editor.isActive({ textAlign: "right" })));
  row2.appendChild(btn(icons.alignJustify, "Justify", () => editor.chain().focus().setTextAlign("justify").run(), () => editor.isActive({ textAlign: "justify" })));

  row2.appendChild(sep());

  row2.appendChild(btn(icons.indent, "Indent (Ctrl+])", () => editor.commands.indent(), () => false));
  row2.appendChild(btn(icons.outdent, "Outdent (Ctrl+[)", () => editor.commands.outdent(), () => false));

  row2.appendChild(sep());

  // Font family dropdown
  row2.appendChild(dropdown("Font", FONT_FAMILIES as unknown as string[], (val) => {
    if (val === "Default") editor.chain().focus().unsetFontFamily().run();
    else editor.chain().focus().setFontFamily(val).run();
  }, "rte-font-dropdown"));

  // Font size dropdown
  row2.appendChild(dropdown("Size", FONT_SIZES as unknown as string[], (val) => {
    editor.chain().focus().setFontSize(val).run();
  }, "rte-size-dropdown"));

  // Line spacing dropdown
  row2.appendChild(dropdown("Spacing", LINE_SPACINGS.map((s) => s.label) as unknown as string[], (val) => {
    const spacing = LINE_SPACINGS.find((s) => s.label === val);
    if (spacing) editor.chain().focus().setLineSpacing(spacing.value).run();
  }, "rte-spacing-dropdown"));

  row2.appendChild(sep());

  // Link
  row2.appendChild(btn(icons.link, "Insert Link", () => {
    if (editor.isActive("link")) {
      editor.chain().focus().unsetLink().run();
    } else {
      const url = prompt("URL:");
      if (url) editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }
  }, () => editor.isActive("link")));

  // Image
  row2.appendChild(btn(icons.image, "Insert Image", () => {
    const url = prompt("Image URL:");
    if (url) editor.chain().focus().setImage({ src: url }).run();
  }, () => false));

  // Video
  row2.appendChild(btn(icons.video, "Insert Video", () => {
    const url = prompt("Video URL (YouTube, Vimeo, Drive, or direct MP4):");
    if (url) editor.commands.setVideo({ src: url });
  }, () => false));

  // Table
  row2.appendChild(btn(icons.table, "Insert Table", () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }, () => false));

  // Horizontal rule
  row2.appendChild(btn(icons.horizontalRule, "Divider", () => editor.chain().focus().setHorizontalRule().run(), () => false));

  row2.appendChild(sep());

  // Find & Replace
  row2.appendChild(btn(icons.search, "Find & Replace (Ctrl+F)", () => {
    editor.storage.findReplace.visible = true;
    editor.view.dom.dispatchEvent(new CustomEvent("find-replace-open", { bubbles: true }));
  }, () => editor.storage.findReplace?.visible));

  // Insert Date
  row2.appendChild(btn(icons.calendar, "Insert Date/Time", () => {
    const now = new Date();
    const date = now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    const time = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    editor.chain().focus().insertContent(`${date} ${time}`).run();
  }, () => false));

  row2.appendChild(sep());

  // Undo/Redo
  row2.appendChild(btn(icons.undo, "Undo (Ctrl+Z)", () => editor.chain().focus().undo().run(), () => false, undefined, () => !editor.can().undo()));
  row2.appendChild(btn(icons.redo, "Redo (Ctrl+Y)", () => editor.chain().focus().redo().run(), () => false, undefined, () => !editor.can().redo()));

  row2.appendChild(sep());

  // Clear formatting
  row2.appendChild(btn(icons.clearFormat, "Clear Formatting", () => editor.chain().focus().clearNodes().unsetAllMarks().run(), () => false));

  // Update function for active states
  function update() {
    container.querySelectorAll("[data-action]").forEach((el) => {
      const isActive = (el as any).__isActive?.();
      const isDisabled = (el as any).__isDisabled?.();
      el.classList.toggle("rte-btn-active", !!isActive);
      (el as HTMLButtonElement).disabled = !!isDisabled;
    });
  }

  return { update, element: container };
}

// --- Helpers ---

function el(tag: string, className?: string): HTMLElement {
  const e = document.createElement(tag);
  if (className) e.className = className;
  return e;
}

function btn(
  icon: string,
  title: string,
  action: () => void,
  isActive: () => boolean,
  label?: string,
  isDisabled?: () => boolean,
): HTMLButtonElement {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "rte-btn";
  b.title = title;
  b.setAttribute("data-action", "true");
  b.innerHTML = label ? `<span class="rte-btn-label">${label}</span>` : icon;
  b.addEventListener("mousedown", (e) => {
    e.preventDefault();
    action();
  });
  (b as any).__isActive = isActive;
  (b as any).__isDisabled = isDisabled || (() => false);
  return b;
}

function sep(): HTMLElement {
  return el("div", "rte-sep");
}

function dropdown(label: string, items: string[], onSelect: (val: string) => void, className?: string): HTMLElement {
  const wrap = el("div", `rte-dropdown ${className || ""}`);
  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.className = "rte-dropdown-trigger";
  trigger.textContent = label;
  trigger.title = label;

  const menu = el("div", "rte-dropdown-menu");
  menu.style.display = "none";

  for (const item of items) {
    const opt = document.createElement("button");
    opt.type = "button";
    opt.className = "rte-dropdown-item";
    opt.textContent = item;
    if (label === "Font") opt.style.fontFamily = item === "Default" ? "inherit" : item;
    opt.addEventListener("mousedown", (e) => {
      e.preventDefault();
      onSelect(item);
      menu.style.display = "none";
    });
    menu.appendChild(opt);
  }

  trigger.addEventListener("mousedown", (e) => {
    e.preventDefault();
    menu.style.display = menu.style.display === "none" ? "block" : "none";
  });

  // Close on outside click
  document.addEventListener("mousedown", (e) => {
    if (!wrap.contains(e.target as Node)) {
      menu.style.display = "none";
    }
  });

  wrap.appendChild(trigger);
  wrap.appendChild(menu);
  return wrap;
}

function colorDrop(
  editor: Editor,
  colors: string[],
  type: "text" | "highlight",
  label: string,
  icon: string,
): HTMLElement {
  const wrap = el("div", "rte-color-drop");
  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.className = "rte-btn";
  trigger.title = label;
  trigger.innerHTML = icon;
  trigger.setAttribute("data-action", "true");
  (trigger as any).__isActive = () => false;
  (trigger as any).__isDisabled = () => false;

  const panel = el("div", "rte-color-panel");
  panel.style.display = "none";

  const heading = document.createElement("p");
  heading.className = "rte-color-label";
  heading.textContent = label;
  panel.appendChild(heading);

  const grid = el("div", "rte-color-grid");
  for (const c of colors) {
    const swatch = document.createElement("button");
    swatch.type = "button";
    swatch.className = "rte-color-swatch";
    if (c) {
      swatch.style.backgroundColor = c;
    } else {
      swatch.classList.add("rte-color-none");
      swatch.textContent = "✕";
    }
    swatch.title = c || "Remove";
    swatch.addEventListener("mousedown", (e) => {
      e.preventDefault();
      applyColor(editor, type, c);
      panel.style.display = "none";
    });
    grid.appendChild(swatch);
  }
  panel.appendChild(grid);

  // Custom color picker
  const custom = el("div", "rte-color-custom");
  const picker = document.createElement("input");
  picker.type = "color";
  picker.className = "rte-color-picker";
  picker.value = type === "text" ? "#000000" : "#fef08a";
  picker.addEventListener("input", () => applyColor(editor, type, picker.value));
  custom.appendChild(picker);
  const applyBtn = document.createElement("button");
  applyBtn.type = "button";
  applyBtn.className = "rte-color-apply";
  applyBtn.textContent = "Apply";
  applyBtn.addEventListener("mousedown", (e) => {
    e.preventDefault();
    applyColor(editor, type, picker.value);
    panel.style.display = "none";
  });
  custom.appendChild(applyBtn);
  panel.appendChild(custom);

  trigger.addEventListener("mousedown", (e) => {
    e.preventDefault();
    panel.style.display = panel.style.display === "none" ? "block" : "none";
  });

  document.addEventListener("mousedown", (e) => {
    if (!wrap.contains(e.target as Node)) panel.style.display = "none";
  });

  wrap.appendChild(trigger);
  wrap.appendChild(panel);
  return wrap;
}

function applyColor(editor: Editor, type: "text" | "highlight", color: string) {
  if (type === "text") {
    if (!color) editor.chain().focus().unsetColor().run();
    else editor.chain().focus().setColor(color).run();
  } else {
    if (!color) editor.chain().focus().unsetHighlight().run();
    else editor.chain().focus().setHighlight({ color }).run();
  }
}
