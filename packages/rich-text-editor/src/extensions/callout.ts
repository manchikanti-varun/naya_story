import { Node, mergeAttributes } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    callout: {
      setCallout: (attrs?: { type?: string }) => ReturnType;
      toggleCallout: (attrs?: { type?: string }) => ReturnType;
    };
  }
}

/**
 * Callout block extension.
 * Renders as a styled container with optional type (info, warning, success, error).
 */
export const Callout = Node.create({
  name: "callout",
  group: "block",
  content: "block+",

  addOptions() {
    return {
      types: ["info", "warning", "success", "error"],
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      type: {
        default: "info",
        parseHTML: (element) => element.getAttribute("data-type") || "info",
        renderHTML: (attributes) => ({ "data-type": attributes.type }),
      },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-type='callout']" }, { tag: ".callout" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        class: `callout callout-${HTMLAttributes["data-type"] || "info"}`,
        "data-type": "callout",
      }),
      0,
    ];
  },

  addCommands() {
    return {
      setCallout:
        (attrs = {}) =>
        ({ commands }) => {
          return commands.wrapIn(this.name, attrs);
        },
      toggleCallout:
        (attrs = {}) =>
        ({ commands, state }) => {
          const { $from } = state.selection;
          // Check if we're inside a callout already
          for (let depth = $from.depth; depth > 0; depth--) {
            if ($from.node(depth).type.name === this.name) {
              return commands.lift(this.name);
            }
          }
          return commands.wrapIn(this.name, attrs);
        },
    };
  },
});
