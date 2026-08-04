import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import Color from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import FontFamily from "@tiptap/extension-font-family";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import CharacterCount from "@tiptap/extension-character-count";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";

import { FontSize } from "./extensions/font-size";
import { LineSpacing } from "./extensions/line-spacing";
import { Indent } from "./extensions/indent";
import { Callout } from "./extensions/callout";
import { FindReplace } from "./extensions/find-replace";
import { SlashCommands } from "./extensions/slash-commands";
import { Video } from "./extensions/video";
import { createToolbar } from "./toolbar/toolbar";
import { createFindReplaceUI } from "./ui/find-replace-ui";
import { createStatsBar } from "./ui/stats-bar";
import { createFloatingToolbar } from "./ui/floating-toolbar";
import { sanitizeHTML } from "./utils/sanitize";
import { toEmbeddableIframeSrc, isVideoUrl } from "./utils/embed";

import type {
  RichTextEditorOptions,
  RichTextEditorApi,
  EditorStats,
  EditorChangePayload,
  JSONContent,
} from "./types";

/**
 * Framework-agnostic Rich Text Editor.
 *
 * Usage:
 *   const editor = new RichTextEditor({ content: "<p>Hello</p>" });
 *   editor.init(document.getElementById("editor")!);
 *   const html = editor.getHTML();
 *   editor.destroy();
 */
export class RichTextEditor implements RichTextEditorApi {
  private options: Required<RichTextEditorOptions>;
  private editor: Editor | null = null;
  private rootEl: HTMLElement | null = null;
  private toolbarEl: HTMLElement | null = null;
  private contentEl: HTMLElement | null = null;
  private statsEl: HTMLElement | null = null;
  private findReplaceEl: HTMLElement | null = null;
  private floatingToolbar: { update: () => void; destroy: () => void } | null = null;
  private toolbar: { update: () => void; element: HTMLElement } | null = null;
  private listeners: Set<(payload: EditorChangePayload) => void> = new Set();
  private destroyed = false;

  constructor(options: RichTextEditorOptions = {}) {
    this.options = {
      content: options.content ?? "",
      placeholder: options.placeholder ?? "Write something...",
      toolbarMode: options.toolbarMode ?? "top",
      enableSlashCommands: options.enableSlashCommands ?? false,
      sanitizeOnGet: options.sanitizeOnGet ?? true,
      maxHeight: options.maxHeight ?? 720,
      contentMinHeight: options.contentMinHeight ?? 220,
      uploadImage: options.uploadImage ?? (undefined as any),
      uploadVideo: options.uploadVideo ?? (undefined as any),
    };
  }

  /** Mount the editor into a DOM element */
  init(element: HTMLElement): void {
    if (this.destroyed) throw new Error("Editor has been destroyed");
    if (this.editor) throw new Error("Editor is already initialized");

    this.rootEl = element;
    element.classList.add("rte-root");

    // Create structure
    this.toolbarEl = document.createElement("div");
    this.findReplaceEl = document.createElement("div");
    this.contentEl = document.createElement("div");
    this.statsEl = document.createElement("div");

    this.contentEl.className = "rte-content";
    this.contentEl.style.minHeight = `${this.options.contentMinHeight}px`;
    this.contentEl.style.maxHeight = `${this.options.maxHeight}px`;
    this.contentEl.style.overflowY = "auto";

    element.appendChild(this.toolbarEl);
    element.appendChild(this.findReplaceEl);
    element.appendChild(this.contentEl);
    element.appendChild(this.statsEl);

    // Build extensions
    const extensions = this.buildExtensions();

    // Create TipTap editor
    this.editor = new Editor({
      element: this.contentEl,
      extensions,
      content: this.options.content,
      editorProps: {
        attributes: { class: "tiptap" },
        handlePaste: (view, event) => {
          return this.handlePaste(view, event);
        },
        handleDrop: (view, event) => {
          return this.handleDrop(view, event as DragEvent);
        },
      },
      onUpdate: ({ editor }) => {
        this.notifyListeners();
        this.toolbar?.update();
        this.updateStats();
      },
      onSelectionUpdate: () => {
        this.toolbar?.update();
        this.floatingToolbar?.update();
        this.updateStats();
      },
    });

    // Build toolbar
    if (this.options.toolbarMode === "top") {
      this.toolbar = createToolbar(this.toolbarEl, this.editor);
    } else {
      this.toolbarEl.style.display = "none";
      this.floatingToolbar = createFloatingToolbar(this.editor);
    }

    // Find & Replace UI
    createFindReplaceUI(this.findReplaceEl, this.editor);

    // Stats bar
    createStatsBar(this.statsEl, this.editor);
    this.updateStats();

    // Click to focus
    this.contentEl.addEventListener("click", (e) => {
      if (e.target === this.contentEl && !this.editor!.isFocused) {
        this.editor!.commands.focus("end");
      }
    });
  }

  /** Get sanitized HTML */
  getHTML(): string {
    if (!this.editor) return "";
    const html = this.editor.getHTML();
    return this.options.sanitizeOnGet ? sanitizeHTML(html) : html;
  }

  /** Get ProseMirror JSON */
  getJSON(): JSONContent {
    if (!this.editor) return { type: "doc", content: [] };
    return this.editor.getJSON();
  }

  /** Set content */
  setContent(content: string | JSONContent): void {
    if (!this.editor) return;
    this.editor.commands.setContent(content);
  }

  /** Subscribe to changes */
  onChange(cb: (payload: EditorChangePayload) => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  /** Get stats */
  getStats(): EditorStats {
    if (!this.editor) {
      return { words: 0, characters: 0, readingTimeMinutes: 0, selectedWords: 0 };
    }
    const words = this.editor.storage.characterCount.words();
    const characters = this.editor.storage.characterCount.characters();
    const readingTimeMinutes = Math.max(1, Math.ceil(words / 200));

    // Selected words
    const { from, to } = this.editor.state.selection;
    let selectedWords = 0;
    if (from !== to) {
      const selectedText = this.editor.state.doc.textBetween(from, to, " ");
      selectedWords = selectedText.trim().split(/\s+/).filter(Boolean).length;
    }

    return { words, characters, readingTimeMinutes, selectedWords };
  }

  /** Destroy */
  destroy(): void {
    this.destroyed = true;
    this.floatingToolbar?.destroy();
    this.editor?.destroy();
    this.editor = null;
    this.listeners.clear();
    if (this.rootEl) {
      this.rootEl.innerHTML = "";
      this.rootEl.classList.remove("rte-root");
    }
  }

  // --- Private ---

  private buildExtensions() {
    const exts: any[] = [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4, 5, 6] },
      }),
      Underline,
      TextStyle,
      Color,
      FontFamily,
      FontSize,
      LineSpacing,
      Indent,
      Highlight.configure({ multicolor: true }),
      Subscript,
      Superscript,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: "noopener noreferrer nofollow", target: "_blank" },
      }),
      Image.configure({ inline: false, allowBase64: true }),
      Video,
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      TaskList,
      TaskItem.configure({ nested: true }),
      CharacterCount,
      Callout,
      FindReplace,
      Placeholder.configure({ placeholder: this.options.placeholder }),
    ];

    if (this.options.enableSlashCommands) {
      exts.push(SlashCommands);
    }

    return exts;
  }

  private notifyListeners() {
    if (!this.editor) return;
    const html = this.editor.getHTML();
    const json = this.editor.getJSON();
    for (const cb of this.listeners) {
      try { cb({ html, json }); } catch { /* swallow */ }
    }
  }

  private updateStats() {
    if (!this.statsEl || !this.editor) return;
    const stats = this.getStats();
    const selectedInfo = stats.selectedWords > 0
      ? ` · ${stats.selectedWords} selected`
      : "";
    this.statsEl.innerHTML = `
      <span>${stats.words} words</span>
      <span>${stats.characters} chars</span>
      <span>~${stats.readingTimeMinutes} min read${selectedInfo}</span>
    `;
  }

  private handlePaste(_view: any, event: ClipboardEvent): boolean {
    const items = event.clipboardData?.items;
    if (!items) return false;

    // Handle image paste
    for (const item of Array.from(items)) {
      if (item.type.startsWith("image/")) {
        event.preventDefault();
        const file = item.getAsFile();
        if (file) this.handleImageUpload(file);
        return true;
      }
    }

    // Handle URL paste → auto-embed video
    const text = event.clipboardData?.getData("text/plain");
    if (text && isVideoUrl(text)) {
      event.preventDefault();
      const embedSrc = toEmbeddableIframeSrc(text) || text;
      this.editor!.commands.setVideo({ src: embedSrc });
      return true;
    }

    return false;
  }

  private handleDrop(_view: any, event: DragEvent): boolean {
    const files = event.dataTransfer?.files;
    if (!files || files.length === 0) return false;

    const file = files[0];
    if (file.type.startsWith("image/")) {
      event.preventDefault();
      this.handleImageUpload(file);
      return true;
    }
    if (file.type.startsWith("video/")) {
      event.preventDefault();
      this.handleVideoUpload(file);
      return true;
    }
    return false;
  }

  private async handleImageUpload(file: File) {
    if (!this.editor) return;

    if (this.options.uploadImage) {
      // Show placeholder
      const placeholderText = `[Uploading ${file.name}…]`;
      this.editor.commands.insertContent(placeholderText);

      try {
        // Compress image before upload
        const compressed = await compressImage(file);
        const result = await this.options.uploadImage(compressed);
        // Replace placeholder with actual image
        const { state } = this.editor;
        const { doc } = state;
        let found = false;
        doc.descendants((node, pos) => {
          if (found) return false;
          if (node.isText && node.text?.includes(placeholderText)) {
            const start = pos + node.text.indexOf(placeholderText);
            const end = start + placeholderText.length;
            this.editor!.chain()
              .setTextSelection({ from: start, to: end })
              .deleteSelection()
              .setImage({ src: result.url, alt: result.alt || file.name })
              .run();
            found = true;
          }
        });
      } catch (err) {
        console.error("Image upload failed:", err);
      }
    } else {
      // Fallback: base64 data URL
      const reader = new FileReader();
      reader.onload = () => {
        this.editor!.commands.setImage({ src: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  }

  private async handleVideoUpload(file: File) {
    if (!this.editor) return;

    if (this.options.uploadVideo) {
      // Show progress overlay
      const blobUrl = URL.createObjectURL(file);
      this.editor.commands.setVideo({ src: blobUrl });

      try {
        const result = await this.options.uploadVideo(file, (pct) => {
          // Could update a progress UI here
          this.rootEl?.dispatchEvent(
            new CustomEvent("rte-upload-progress", { detail: { pct, file: file.name } }),
          );
        });

        // Replace blob with storage URL
        const { state } = this.editor;
        state.doc.descendants((node, pos) => {
          if (node.type.name === "video" && node.attrs.src === blobUrl) {
            this.editor!.view.dispatch(
              state.tr.setNodeMarkup(pos, undefined, {
                ...node.attrs,
                src: result.url,
                storageUrl: result.storageUrl || result.url,
              }),
            );
          }
        });
      } catch (err) {
        console.error("Video upload failed:", err);
      }
    } else {
      // Just insert as blob
      const blobUrl = URL.createObjectURL(file);
      this.editor.commands.setVideo({ src: blobUrl });
    }
  }
}

/** Compress image to max 1600px, JPEG 82% quality */
async function compressImage(file: File, maxWidth = 1600, quality = 0.82): Promise<File> {
  return new Promise((resolve) => {
    // If not an image or too small, skip
    if (!file.type.startsWith("image/") || file.size < 50000) {
      resolve(file);
      return;
    }

    const img = new window.Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width <= maxWidth) {
        resolve(file);
        return;
      }

      const ratio = maxWidth / width;
      width = maxWidth;
      height = Math.round(height * ratio);

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(new File([blob], file.name, { type: "image/jpeg" }));
          } else {
            resolve(file);
          }
        },
        "image/jpeg",
        quality,
      );
    };
    img.onerror = () => resolve(file);
    img.src = url;
  });
}
