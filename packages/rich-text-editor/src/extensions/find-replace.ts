import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    findReplace: {
      setSearchTerm: (term: string) => ReturnType;
      setReplaceTerm: (term: string) => ReturnType;
      findNext: () => ReturnType;
      findPrevious: () => ReturnType;
      replaceOne: () => ReturnType;
      replaceAll: () => ReturnType;
      closeFindReplace: () => ReturnType;
    };
  }
}

interface FindReplaceState {
  searchTerm: string;
  replaceTerm: string;
  results: { from: number; to: number }[];
  currentIndex: number;
}

const findReplaceKey = new PluginKey("findReplace");

function findInDoc(doc: any, term: string): { from: number; to: number }[] {
  if (!term) return [];
  const results: { from: number; to: number }[] = [];
  const lowerTerm = term.toLowerCase();

  doc.descendants((node: any, pos: number) => {
    if (!node.isText) return;
    const text = node.text!.toLowerCase();
    let index = 0;
    while (true) {
      const found = text.indexOf(lowerTerm, index);
      if (found === -1) break;
      results.push({ from: pos + found, to: pos + found + term.length });
      index = found + 1;
    }
  });

  return results;
}

/**
 * Find & Replace extension.
 * Provides search highlighting and replace functionality.
 * Triggered via Ctrl+F keyboard shortcut.
 */
export const FindReplace = Extension.create({
  name: "findReplace",

  addStorage() {
    return {
      searchTerm: "",
      replaceTerm: "",
      results: [] as { from: number; to: number }[],
      currentIndex: 0,
      visible: false,
    };
  },

  addCommands() {
    return {
      setSearchTerm:
        (term: string) =>
        ({ editor }) => {
          const storage = editor.storage.findReplace;
          storage.searchTerm = term;
          storage.results = findInDoc(editor.state.doc, term);
          storage.currentIndex = 0;
          storage.visible = true;
          // Trigger decoration update
          editor.view.dispatch(editor.state.tr);
          return true;
        },
      setReplaceTerm:
        (term: string) =>
        ({ editor }) => {
          editor.storage.findReplace.replaceTerm = term;
          return true;
        },
      findNext:
        () =>
        ({ editor }) => {
          const storage = editor.storage.findReplace;
          if (storage.results.length === 0) return false;
          storage.currentIndex = (storage.currentIndex + 1) % storage.results.length;
          const result = storage.results[storage.currentIndex];
          editor.commands.setTextSelection(result);
          scrollIntoView(editor);
          return true;
        },
      findPrevious:
        () =>
        ({ editor }) => {
          const storage = editor.storage.findReplace;
          if (storage.results.length === 0) return false;
          storage.currentIndex =
            (storage.currentIndex - 1 + storage.results.length) % storage.results.length;
          const result = storage.results[storage.currentIndex];
          editor.commands.setTextSelection(result);
          scrollIntoView(editor);
          return true;
        },
      replaceOne:
        () =>
        ({ editor }) => {
          const storage = editor.storage.findReplace;
          if (storage.results.length === 0) return false;
          const result = storage.results[storage.currentIndex];
          editor
            .chain()
            .setTextSelection(result)
            .insertContent(storage.replaceTerm)
            .run();
          // Re-search
          storage.results = findInDoc(editor.state.doc, storage.searchTerm);
          if (storage.currentIndex >= storage.results.length) {
            storage.currentIndex = 0;
          }
          return true;
        },
      replaceAll:
        () =>
        ({ editor }) => {
          const storage = editor.storage.findReplace;
          if (storage.results.length === 0) return false;
          // Replace from end to start to preserve positions
          const sorted = [...storage.results].sort((a, b) => b.from - a.from);
          const { tr } = editor.state;
          for (const result of sorted) {
            tr.replaceWith(
              result.from,
              result.to,
              editor.state.schema.text(storage.replaceTerm),
            );
          }
          editor.view.dispatch(tr);
          storage.results = [];
          storage.currentIndex = 0;
          return true;
        },
      closeFindReplace:
        () =>
        ({ editor }) => {
          const storage = editor.storage.findReplace;
          storage.searchTerm = "";
          storage.replaceTerm = "";
          storage.results = [];
          storage.currentIndex = 0;
          storage.visible = false;
          editor.view.dispatch(editor.state.tr);
          return true;
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      "Mod-f": () => {
        this.editor.storage.findReplace.visible = true;
        // Dispatch custom event for the UI to show the panel
        this.editor.view.dom.dispatchEvent(
          new CustomEvent("find-replace-open", { bubbles: true }),
        );
        return true;
      },
      Escape: () => {
        if (this.editor.storage.findReplace.visible) {
          this.editor.commands.closeFindReplace();
          return true;
        }
        return false;
      },
    };
  },

  addProseMirrorPlugins() {
    const editor = this.editor;
    return [
      new Plugin({
        key: findReplaceKey,
        props: {
          decorations(state) {
            const storage = editor.storage.findReplace;
            if (!storage.searchTerm || storage.results.length === 0) {
              return DecorationSet.empty;
            }
            const decorations = storage.results.map(
              (result: { from: number; to: number }, i: number) => {
                const className =
                  i === storage.currentIndex
                    ? "rte-find-current"
                    : "rte-find-highlight";
                return Decoration.inline(result.from, result.to, {
                  class: className,
                });
              },
            );
            return DecorationSet.create(state.doc, decorations);
          },
        },
      }),
    ];
  },
});

function scrollIntoView(editor: any) {
  const { node } = editor.view.domAtPos(
    editor.state.selection.from,
  );
  if (node && (node as HTMLElement).scrollIntoView) {
    (node as HTMLElement).scrollIntoView({ block: "center", behavior: "smooth" });
  }
}
