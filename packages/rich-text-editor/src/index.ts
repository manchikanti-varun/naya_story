// Main editor class
export { RichTextEditor } from "./editor";

// Types
export type {
  RichTextEditorOptions,
  RichTextEditorApi,
  EditorStats,
  EditorChangePayload,
  JSONContent,
  ToolbarAction,
  SlashCommandItem,
} from "./types";

export {
  FONT_FAMILIES,
  FONT_SIZES,
  LINE_SPACINGS,
  TEXT_COLORS,
  HIGHLIGHT_COLORS,
} from "./types";

// Exported utilities for read-only views
export {
  rewriteEmbeddedMediaInHtml,
  rewriteGoogleDriveImagesInHtml,
  dedupeConsecutiveRichTextBlocks,
  normalizeRichTextPlainText,
  resolveImageEmbedUrl,
  toEmbeddableIframeSrc,
  extractGoogleDriveFileId,
} from "./utils/embed";

export { sanitizeHTML } from "./utils/sanitize";

// Extensions (for advanced usage / customization)
export { FontSize } from "./extensions/font-size";
export { LineSpacing } from "./extensions/line-spacing";
export { Indent } from "./extensions/indent";
export { Callout } from "./extensions/callout";
export { FindReplace } from "./extensions/find-replace";
export { SlashCommands } from "./extensions/slash-commands";
export { Video } from "./extensions/video";
