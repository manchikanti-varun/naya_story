import { Extension } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    lineSpacing: {
      setLineSpacing: (spacing: string) => ReturnType;
      unsetLineSpacing: () => ReturnType;
    };
  }
}

/**
 * Line spacing extension.
 * Applies line-height to paragraphs and headings.
 */
export const LineSpacing = Extension.create({
  name: "lineSpacing",

  addOptions() {
    return {
      types: ["paragraph", "heading"],
      defaultSpacing: "1.7",
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          lineSpacing: {
            default: null,
            parseHTML: (element) => {
              return element.style.lineHeight || null;
            },
            renderHTML: (attributes) => {
              if (!attributes.lineSpacing) return {};
              return {
                style: `line-height: ${attributes.lineSpacing}`,
                "data-line-spacing": attributes.lineSpacing,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setLineSpacing:
        (spacing: string) =>
        ({ tr, state, dispatch }) => {
          const { from, to } = state.selection;
          let changed = false;
          state.doc.nodesBetween(from, to, (node, pos) => {
            if (this.options.types.includes(node.type.name)) {
              if (dispatch) {
                tr.setNodeMarkup(pos, undefined, {
                  ...node.attrs,
                  lineSpacing: spacing,
                });
              }
              changed = true;
            }
          });
          return changed;
        },
      unsetLineSpacing:
        () =>
        ({ tr, state, dispatch }) => {
          const { from, to } = state.selection;
          let changed = false;
          state.doc.nodesBetween(from, to, (node, pos) => {
            if (this.options.types.includes(node.type.name)) {
              if (dispatch) {
                tr.setNodeMarkup(pos, undefined, {
                  ...node.attrs,
                  lineSpacing: null,
                });
              }
              changed = true;
            }
          });
          return changed;
        },
    };
  },
});
