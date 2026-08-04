import type { JSONContent } from "@tiptap/core";

export type { JSONContent } from "@tiptap/core";

export interface RichTextEditorOptions {
  /** Initial content (HTML string or ProseMirror JSON) */
  content?: string | JSONContent;
  /** Placeholder text. Default: "Write something..." */
  placeholder?: string;
  /** Toolbar mode. Default: "top" */
  toolbarMode?: "top" | "floating";
  /** Enable slash commands. Default: false */
  enableSlashCommands?: boolean;
  /** Sanitize HTML output via DOMPurify. Default: true */
  sanitizeOnGet?: boolean;
  /** Max editor height in px. Default: 720 */
  maxHeight?: number;
  /** Content area min height in px. Default: 220 */
  contentMinHeight?: number;
  /** Upload image handler */
  uploadImage?: (file: File) => Promise<{ url: string; alt?: string }>;
  /** Upload video handler with progress callback */
  uploadVideo?: (
    file: File,
    onProgress: (pct: number) => void,
  ) => Promise<{ url: string; storageUrl?: string }>;
}

export interface EditorStats {
  words: number;
  characters: number;
  readingTimeMinutes: number;
  selectedWords: number;
}

export interface EditorChangePayload {
  html: string;
  json: JSONContent;
}

export interface RichTextEditorApi {
  /** Mount editor to a DOM element */
  init(element: HTMLElement): void;
  /** Get sanitized HTML output */
  getHTML(): string;
  /** Get ProseMirror JSON (source of truth) */
  getJSON(): JSONContent;
  /** Set editor content */
  setContent(content: string | JSONContent): void;
  /** Subscribe to content changes. Returns unsubscribe function. */
  onChange(cb: (payload: EditorChangePayload) => void): () => void;
  /** Get word/character stats */
  getStats(): EditorStats;
  /** Destroy editor and cleanup */
  destroy(): void;
}

/* ─── Toolbar types ─── */

export type ToolbarAction =
  | "bold" | "italic" | "underline" | "strike" | "subscript" | "superscript"
  | "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "paragraph"
  | "bulletList" | "orderedList" | "taskList"
  | "blockquote" | "codeBlock" | "horizontalRule"
  | "alignLeft" | "alignCenter" | "alignRight" | "alignJustify"
  | "indent" | "outdent"
  | "link" | "image" | "video" | "table"
  | "textColor" | "highlightColor" | "clearFormatting"
  | "undo" | "redo"
  | "findReplace" | "insertDate"
  | "fontFamily" | "fontSize" | "lineSpacing";

export type SlashCommandItem = {
  title: string;
  description: string;
  icon?: string;
  action: (editor: unknown) => void;
};

/* ─── Font families ─── */
export const FONT_FAMILIES = [
  "Default",
  "Arial",
  "Courier New",
  "Georgia",
  "Helvetica",
  "Inter",
  "Lato",
  "Merriweather",
  "Montserrat",
  "Open Sans",
  "Oswald",
  "Playfair Display",
  "Poppins",
  "PT Serif",
  "Raleway",
  "Roboto",
  "Roboto Mono",
  "Source Code Pro",
  "Times New Roman",
  "Trebuchet MS",
  "Ubuntu",
  "Verdana",
] as const;

export const FONT_SIZES = [
  "8px", "9px", "10px", "11px", "12px", "14px", "16px", "18px",
  "20px", "24px", "30px", "36px", "48px", "60px", "72px",
] as const;

export const LINE_SPACINGS = [
  { label: "Single", value: "1" },
  { label: "1.15", value: "1.15" },
  { label: "1.5", value: "1.5" },
  { label: "Double", value: "2" },
  { label: "2.5", value: "2.5" },
] as const;

export const TEXT_COLORS = [
  "#000000", "#374151", "#6b7280", "#dc2626", "#ea580c",
  "#d97706", "#c9a15b", "#16a34a", "#0d9488", "#2563eb",
  "#4f46e5", "#9333ea", "#db2777", "#e11d48", "#ffffff",
] as const;

export const HIGHLIGHT_COLORS = [
  "#fef08a", "#d9f99d", "#bbf7d0", "#a5f3fc", "#bfdbfe",
  "#e9d5ff", "#fbcfe8", "#fecdd3", "#fed7aa", "",
] as const;
