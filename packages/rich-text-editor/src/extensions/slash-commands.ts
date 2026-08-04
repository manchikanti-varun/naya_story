import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";
import type { SlashCommandItem } from "../types";

const slashCommandsKey = new PluginKey("slashCommands");

/**
 * Slash commands extension.
 * Shows a menu when user types "/" at the beginning of a line or after a space.
 */
export const SlashCommands = Extension.create({
  name: "slashCommands",

  addStorage() {
    return {
      active: false,
      query: "",
      menuElement: null as HTMLElement | null,
      selectedIndex: 0,
      items: [] as SlashCommandItem[],
      filterRange: { from: 0, to: 0 },
    };
  },

  addOptions() {
    return {
      commands: getDefaultSlashCommands(),
    };
  },

  addProseMirrorPlugins() {
    const editor = this.editor;
    const options = this.options;

    return [
      new Plugin({
        key: slashCommandsKey,
        props: {
          handleKeyDown(view: EditorView, event: KeyboardEvent) {
            const storage = editor.storage.slashCommands;

            if (storage.active) {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                storage.selectedIndex = Math.min(
                  storage.selectedIndex + 1,
                  storage.items.length - 1,
                );
                updateMenu(storage);
                return true;
              }
              if (event.key === "ArrowUp") {
                event.preventDefault();
                storage.selectedIndex = Math.max(storage.selectedIndex - 1, 0);
                updateMenu(storage);
                return true;
              }
              if (event.key === "Enter") {
                event.preventDefault();
                const item = storage.items[storage.selectedIndex];
                if (item) {
                  // Delete the slash command text
                  const { tr } = view.state;
                  tr.delete(storage.filterRange.from, storage.filterRange.to);
                  view.dispatch(tr);
                  item.action(editor);
                }
                closeMenu(storage);
                return true;
              }
              if (event.key === "Escape") {
                event.preventDefault();
                closeMenu(storage);
                return true;
              }
            }

            return false;
          },
        },
        view() {
          return {
            update(view) {
              const storage = editor.storage.slashCommands;
              const { state } = view;
              const { $from } = state.selection;

              // Check for "/" at start of text or after whitespace
              const textBefore = $from.parent.textContent.slice(0, $from.parentOffset);
              const slashMatch = textBefore.match(/(?:^|\s)\/([\w]*)$/);

              if (slashMatch) {
                const query = slashMatch[1].toLowerCase();
                const from = $from.pos - slashMatch[0].length;
                const to = $from.pos;
                const filtered = options.commands.filter(
                  (cmd: SlashCommandItem) =>
                    cmd.title.toLowerCase().includes(query) ||
                    cmd.description.toLowerCase().includes(query),
                );

                if (filtered.length > 0) {
                  storage.active = true;
                  storage.query = query;
                  storage.items = filtered;
                  storage.filterRange = { from: from + (slashMatch[0].startsWith(" ") ? 1 : 0), to };
                  storage.selectedIndex = Math.min(
                    storage.selectedIndex,
                    filtered.length - 1,
                  );
                  showMenu(storage, view);
                  return;
                }
              }

              if (storage.active) {
                closeMenu(storage);
              }
            },
            destroy() {
              const storage = editor.storage.slashCommands;
              closeMenu(storage);
            },
          };
        },
      }),
    ];
  },
});

function showMenu(storage: any, view: EditorView) {
  if (!storage.menuElement) {
    storage.menuElement = document.createElement("div");
    storage.menuElement.className = "rte-slash-menu";
    document.body.appendChild(storage.menuElement);
  }

  // Position the menu
  const coords = view.coordsAtPos(view.state.selection.from);
  const menu = storage.menuElement as HTMLElement;
  menu.style.position = "fixed";
  menu.style.left = `${coords.left}px`;
  menu.style.top = `${coords.bottom + 4}px`;
  menu.style.zIndex = "9999";

  updateMenu(storage);
}

function updateMenu(storage: any) {
  if (!storage.menuElement) return;
  const menu = storage.menuElement as HTMLElement;

  menu.innerHTML = storage.items
    .map(
      (item: SlashCommandItem, i: number) => `
    <div class="rte-slash-item ${i === storage.selectedIndex ? "rte-slash-item-active" : ""}"
         data-index="${i}">
      <span class="rte-slash-title">${item.title}</span>
      <span class="rte-slash-desc">${item.description}</span>
    </div>
  `,
    )
    .join("");

  // Attach click handlers
  menu.querySelectorAll(".rte-slash-item").forEach((el) => {
    el.addEventListener("mousedown", (e) => {
      e.preventDefault();
      const idx = parseInt((el as HTMLElement).dataset.index || "0", 10);
      storage.selectedIndex = idx;
      const item = storage.items[idx];
      if (item) {
        item.action(storage._editor);
      }
      closeMenu(storage);
    });
  });
}

function closeMenu(storage: any) {
  storage.active = false;
  storage.query = "";
  storage.items = [];
  storage.selectedIndex = 0;
  if (storage.menuElement) {
    storage.menuElement.remove();
    storage.menuElement = null;
  }
}

function getDefaultSlashCommands(): SlashCommandItem[] {
  return [
    {
      title: "Heading 1",
      description: "Large section heading",
      action: (editor: any) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
    },
    {
      title: "Heading 2",
      description: "Medium section heading",
      action: (editor: any) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      title: "Heading 3",
      description: "Small section heading",
      action: (editor: any) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
    },
    {
      title: "Bullet List",
      description: "Create a simple bullet list",
      action: (editor: any) => editor.chain().focus().toggleBulletList().run(),
    },
    {
      title: "Numbered List",
      description: "Create a numbered list",
      action: (editor: any) => editor.chain().focus().toggleOrderedList().run(),
    },
    {
      title: "Task List",
      description: "Track tasks with checkboxes",
      action: (editor: any) => editor.chain().focus().toggleTaskList().run(),
    },
    {
      title: "Blockquote",
      description: "Capture a quote",
      action: (editor: any) => editor.chain().focus().toggleBlockquote().run(),
    },
    {
      title: "Code Block",
      description: "Insert a code snippet",
      action: (editor: any) => editor.chain().focus().toggleCodeBlock().run(),
    },
    {
      title: "Divider",
      description: "Insert a horizontal rule",
      action: (editor: any) => editor.chain().focus().setHorizontalRule().run(),
    },
    {
      title: "Table",
      description: "Insert a 3×3 table",
      action: (editor: any) =>
        editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
    },
    {
      title: "Callout",
      description: "Highlighted info block",
      action: (editor: any) => editor.chain().focus().setCallout({ type: "info" }).run(),
    },
    {
      title: "Image",
      description: "Insert an image from URL",
      action: (editor: any) => {
        const url = prompt("Image URL:");
        if (url) editor.chain().focus().setImage({ src: url }).run();
      },
    },
  ];
}
