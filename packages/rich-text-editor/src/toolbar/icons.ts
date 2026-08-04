/**
 * SVG icon strings for toolbar buttons.
 * Using inline SVG to avoid external icon library dependencies in the vanilla build.
 */

function svg(paths: string, attrs = ""): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${attrs}>${paths}</svg>`;
}

export const icons = {
  bold: svg(`<path d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z"/><path d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z"/>`),
  italic: svg(`<line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/>`),
  underline: svg(`<path d="M6 3v7a6 6 0 006 6 6 6 0 006-6V3"/><line x1="4" y1="21" x2="20" y2="21"/>`),
  strikethrough: svg(`<path d="M16 4H9a3 3 0 00-2.83 4"/><path d="M14 12a4 4 0 010 8H6"/><line x1="4" y1="12" x2="20" y2="12"/>`),
  subscript: svg(`<path d="M4 5l8 8"/><path d="M12 5l-8 8"/><path d="M20 19h-4c0-1.5.44-2 1.5-2.5S20 15.33 20 14c0-.47-.17-.93-.48-1.29a2.11 2.11 0 00-2.62-.44c-.42.24-.74.62-.9 1.07"/>`),
  superscript: svg(`<path d="M4 19l8-8"/><path d="M12 19l-8-8"/><path d="M20 12h-4c0-1.5.44-2 1.5-2.5S20 8.33 20 7c0-.47-.17-.93-.48-1.29a2.11 2.11 0 00-2.62-.44c-.42.24-.74.62-.9 1.07"/>`),
  bulletList: svg(`<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>`),
  orderedList: svg(`<line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/>`),
  taskList: svg(`<rect x="3" y="5" width="6" height="6" rx="1"/><path d="M5 8l1 1 2-2"/><line x1="13" y1="8" x2="21" y2="8"/><rect x="3" y="14" width="6" height="6" rx="1"/><line x1="13" y1="17" x2="21" y2="17"/>`),
  blockquote: svg(`<path d="M6 17h3l2-4V7H5v6h3"/><path d="M15 17h3l2-4V7h-6v6h3"/>`),
  codeBlock: svg(`<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>`),
  horizontalRule: svg(`<line x1="3" y1="12" x2="21" y2="12"/>`),
  alignLeft: svg(`<line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>`),
  alignCenter: svg(`<line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>`),
  alignRight: svg(`<line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>`),
  alignJustify: svg(`<line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>`),
  indent: svg(`<polyline points="13 4 21 4"/><polyline points="13 9 21 9"/><polyline points="3 14 21 14"/><polyline points="3 19 21 19"/><polyline points="3 4 8 8.5 3 13"/>`),
  outdent: svg(`<polyline points="13 4 21 4"/><polyline points="13 9 21 9"/><polyline points="3 14 21 14"/><polyline points="3 19 21 19"/><polyline points="8 4 3 8.5 8 13"/>`),
  link: svg(`<path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>`),
  image: svg(`<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>`),
  video: svg(`<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M10 9l5 3-5 3V9z"/>`),
  table: svg(`<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/>`),
  textColor: svg(`<path d="M4 20h16"/><path d="M7 4l5 12"/><path d="M17 4l-5 12"/>`),
  highlight: svg(`<path d="M12 20h9"/><path d="M3 20h3"/><path d="M7 16l4-12h2l4 12"/><rect x="1" y="17" width="22" height="4" rx="1" fill="#fef08a" stroke="none" opacity="0.6"/>`),
  clearFormat: svg(`<path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/><path d="M3 21l18-18" stroke-width="1.5"/>`),
  undo: svg(`<path d="M3 10h13a4 4 0 010 8H9"/><path d="M3 10l4-4"/><path d="M3 10l4 4"/>`),
  redo: svg(`<path d="M21 10H8a4 4 0 000 8h6"/><path d="M21 10l-4-4"/><path d="M21 10l-4 4"/>`),
  search: svg(`<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>`),
  calendar: svg(`<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>`),
  callout: svg(`<path d="M21.73 18l-8-14a2 2 0 00-3.48 0l-8 14A2 2 0 004 21h16a2 2 0 001.73-3z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>`),
} as const;
