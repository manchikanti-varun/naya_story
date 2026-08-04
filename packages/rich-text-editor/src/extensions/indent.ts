import { Extension } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    indent: {
      indent: () => ReturnType;
      outdent: () => ReturnType;
    };
  }
}

const MAX_INDENT = 8;
const INDENT_PX = 36;

/**
 * Block indent extension.
 * Applies margin-left in increments of 36px, up to 8 levels.
 */
export const Indent = Extension.create({
  name: "indent",

  addOptions() {
    return {
      types: ["paragraph", "heading"],
      maxIndent: MAX_INDENT,
      indentSize: INDENT_PX,
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          indent: {
            default: 0,
            parseHTML: (element) => {
              const ml = element.style.marginLeft;
              if (!ml) return 0;
              const px = parseInt(ml, 10);
              return Math.min(Math.round(px / INDENT_PX), MAX_INDENT);
            },
            renderHTML: (attributes) => {
              if (!attributes.indent || attributes.indent <= 0) return {};
              return {
                style: `margin-left: ${attributes.indent * INDENT_PX}px`,
                "data-indent": attributes.indent,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      indent:
        () =>
        ({ tr, state, dispatch }) => {
          const { from, to } = state.selection;
          let changed = false;
          state.doc.nodesBetween(from, to, (node, pos) => {
            if (this.options.types.includes(node.type.name)) {
              const current = node.attrs.indent || 0;
              if (current < MAX_INDENT) {
                if (dispatch) {
                  tr.setNodeMarkup(pos, undefined, {
                    ...node.attrs,
                    indent: current + 1,
                  });
                }
                changed = true;
              }
            }
          });
          return changed;
        },
      outdent:
        () =>
        ({ tr, state, dispatch }) => {
          const { from, to } = state.selection;
          let changed = false;
          state.doc.nodesBetween(from, to, (node, pos) => {
            if (this.options.types.includes(node.type.name)) {
              const current = node.attrs.indent || 0;
              if (current > 0) {
                if (dispatch) {
                  tr.setNodeMarkup(pos, undefined, {
                    ...node.attrs,
                    indent: current - 1,
                  });
                }
                changed = true;
              }
            }
          });
          return changed;
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      "Mod-]": () => this.editor.commands.indent(),
      "Mod-[": () => this.editor.commands.outdent(),
      Tab: () => {
        // Only indent if we're in a paragraph/heading (not in lists/code)
        const { state } = this.editor;
        const { $from } = state.selection;
        const node = $from.parent;
        if (this.options.types.includes(node.type.name)) {
          return this.editor.commands.indent();
        }
        return false;
      },
      "Shift-Tab": () => {
        const { state } = this.editor;
        const { $from } = state.selection;
        const node = $from.parent;
        if (this.options.types.includes(node.type.name)) {
          return this.editor.commands.outdent();
        }
        return false;
      },
    };
  },
});
