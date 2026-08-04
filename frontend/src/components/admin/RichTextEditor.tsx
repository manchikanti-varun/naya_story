"use client";

import { Node as TiptapNode, Extension, mergeAttributes } from "@tiptap/core";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
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
import { useCallback, useEffect, useRef, useState } from "react";

/* ═══════════════════════════════════════════════════════════════════
 * CUSTOM EXTENSIONSfix them
 * ═══════════════════════════════════════════════════════════════════ */

/**
 * ISSUE 1 FIX: FontSize extension
 * Registers fontSize as a renderable attribute on TextStyle marks.
 * Produces: <span style="font-size: 24px">text</span>
 */
const FontSize = Extension.create({
  name: "fontSize",
  addGlobalAttributes() {
    return [{
      types: ["textStyle"],
      attributes: {
        fontSize: {
          default: null,
          parseHTML: (element) => element.style.fontSize || null,
          renderHTML: (attributes) => {
            if (!attributes.fontSize) return {};
            return { style: `font-size: ${attributes.fontSize}` };
          },
        },
      },
    }];
  },
});

/**
 * Iframe Node extension
 * Registers <iframe> as a valid block node in ProseMirror's schema.
 * FIX: Boolean allowfullscreen is conditionally rendered (omitted when false).
 */
const IframeNode = TiptapNode.create({
  name: "iframe",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      src: { default: null },
      frameborder: { default: "0" },
      allowfullscreen: { default: true },
      allow: { default: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" },
      style: { default: "width:100%;aspect-ratio:16/9;max-width:100%;border-radius:8px;" },
    };
  },

  parseHTML() {
    return [{
      tag: "iframe",
      getAttrs: (dom) => {
        const src = (dom as HTMLElement).getAttribute("src") || "";
        // Only accept iframes from whitelisted embed hosts
        if (
          src.includes("youtube.com/embed/") ||
          src.includes("player.vimeo.com/video/") ||
          src.includes("drive.google.com/")
        ) {
          return null; // accept
        }
        return false; // reject — don't parse this iframe into the schema
      },
    }];
  },

  renderHTML({ HTMLAttributes }) {
    // FIX 1: Handle boolean allowfullscreen — omit entirely when false
    const { allowfullscreen, ...rest } = HTMLAttributes;
    const attrs = mergeAttributes(rest, allowfullscreen ? { allowfullscreen: "" } : {});
    return ["div", { class: "iframe-wrapper" }, ["iframe", attrs]];
  },
});

/**
 * Video Node extension
 * Registers <video> as a valid block node in ProseMirror's schema.
 * FIX: Boolean controls is conditionally rendered (omitted when false).
 */
const VideoNode = TiptapNode.create({
  name: "video",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      src: { default: null },
      controls: { default: true },
      style: { default: "width:100%;max-width:100%;border-radius:8px;" },
    };
  },

  parseHTML() {
    return [{ tag: "video" }];
  },

  renderHTML({ HTMLAttributes }) {
    // FIX 1: Handle boolean controls — omit entirely when false
    const { controls, ...rest } = HTMLAttributes;
    return ["video", mergeAttributes(rest, controls ? { controls: "" } : {})];
  },
});

/* ═══════════════════════════════════════════════════════════════════
 * TYPES & CONSTANTS
 * ═══════════════════════════════════════════════════════════════════ */

type Props = {
  initialContent: string;
  onChange: (html: string) => void;
  contentKey?: string;
  placeholder?: string;
  className?: string;
  /** ISSUE 3: Upload handler for images. Called with the File, returns the hosted URL. */
  uploadImage?: (file: File) => Promise<{ url: string; alt?: string }>;
  /** ISSUE 3: Upload handler for videos. Called with File + progress callback. */
  uploadVideo?: (file: File, onProgress: (pct: number) => void) => Promise<{ url: string; storageUrl?: string }>;
};

const TEXT_COLORS = [
  "#000000", "#374151", "#6b7280", "#dc2626", "#ea580c",
  "#d97706", "#c9a15b", "#16a34a", "#0d9488", "#2563eb",
  "#4f46e5", "#9333ea", "#db2777", "#e11d48", "#ffffff",
];

const HIGHLIGHT_COLORS = [
  "#fef08a", "#d9f99d", "#bbf7d0", "#a5f3fc", "#bfdbfe",
  "#e9d5ff", "#fbcfe8", "#fecdd3", "#fed7aa", "",
];

const FONT_FAMILIES = [
  "Default", "Arial", "Courier New", "Georgia", "Helvetica", "Inter",
  "Lato", "Merriweather", "Montserrat", "Open Sans", "Poppins",
  "Roboto", "Times New Roman", "Verdana",
];

// ISSUE 1 FIX: Added "Default" to allow removing font size
const FONT_SIZES = [
  "Default", "8px", "10px", "12px", "14px", "16px", "18px", "20px", "24px", "30px", "36px", "48px", "72px",
];

/* ═══════════════════════════════════════════════════════════════════
 * UI PRIMITIVES
 * ═══════════════════════════════════════════════════════════════════ */

function Btn({ onMouseDown, active, disabled, title, children }: {
  onMouseDown: () => void; active?: boolean; disabled?: boolean; title: string; children: React.ReactNode;
}) {
  return (
    <button type="button" title={title} disabled={disabled}
      onMouseDown={(e) => { e.preventDefault(); onMouseDown(); }}
      className={`inline-flex items-center justify-center h-8 w-8 rounded text-sm transition-colors select-none
        ${active ? "bg-indigo-600 text-white shadow-sm" : "text-gray-600 hover:bg-gray-200/80 hover:text-gray-900"}
        disabled:opacity-25 disabled:pointer-events-none`}
    >{children}</button>
  );
}

function Sep() { return <div className="mx-1 h-5 w-px bg-gray-300/60" />; }

function DropMenu({ label, items, onSelect, fontPreview, currentValue }: {
  label: string; items: string[]; onSelect: (val: string) => void; fontPreview?: boolean; currentValue?: string;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  // FIX 3: Show the current value in the trigger button, fallback to label
  const displayLabel = currentValue && currentValue !== "Default" ? currentValue : label;

  return (
    <div ref={wrapRef} className="relative inline-flex">
      <button type="button" title={label}
        onMouseDown={(e) => { e.preventDefault(); setOpen((v) => !v); }}
        className={`inline-flex items-center h-8 px-2 rounded border text-[11px] select-none whitespace-nowrap ${
          currentValue && currentValue !== "Default"
            ? "border-indigo-300 text-indigo-700 bg-indigo-50"
            : "border-gray-200 text-gray-600 hover:bg-gray-100"
        }`}
      >{displayLabel}</button>
      {open && (
        <div className="absolute top-full left-0 z-[200] mt-1 min-w-[130px] max-h-[240px] overflow-y-auto rounded-lg border bg-white shadow-xl p-1"
          onMouseDown={(e) => e.preventDefault()}>
          {items.map((item) => (
            <button key={item} type="button"
              onMouseDown={(e) => { e.preventDefault(); onSelect(item); setOpen(false); }}
              className={`block w-full px-3 py-1.5 text-left text-xs rounded ${
                item === currentValue
                  ? "bg-indigo-50 text-indigo-700 font-medium"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
              style={fontPreview && item !== "Default" ? { fontFamily: item } : undefined}
            >{item}</button>
          ))}
        </div>
      )}
    </div>
  );
}

function ColorDrop({ editor, colors, type, label }: {
  editor: Editor; colors: string[]; type: "text" | "highlight"; label: string;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const pickerRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const applyColor = (c: string) => {
    if (type === "text") {
      if (!c) editor.chain().focus().unsetColor().run();
      else editor.chain().focus().setColor(c).run();
    } else {
      if (!c) editor.chain().focus().unsetHighlight().run();
      else editor.chain().focus().setHighlight({ color: c }).run();
    }
  };

  return (
    <div ref={wrapRef} className="relative inline-flex">
      <button type="button" title={label}
        onMouseDown={(e) => { e.preventDefault(); setOpen((v) => !v); }}
        className="inline-flex items-center justify-center h-8 w-8 rounded text-gray-600 hover:bg-gray-200/80 hover:text-gray-900 select-none"
      >
        {type === "text"
          ? <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 20h16M6 4l6 12M18 4l-6 12" /></svg>
          : <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9M3 20h3m1-4l4-12h2l4 12" /><rect x="1" y="17" width="22" height="4" rx="1" fill="#fef08a" stroke="none" opacity="0.6" /></svg>}
      </button>
      {open && (
        <div className="absolute top-full left-0 z-[200] mt-1 p-2.5 rounded-lg border bg-white shadow-xl min-w-[160px]"
          onMouseDown={(e) => e.preventDefault()}>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">{label}</p>
          <div className="grid grid-cols-5 gap-1.5">
            {colors.map((c, i) => (
              <button key={c || `none-${i}`} type="button"
                onMouseDown={(e) => { e.preventDefault(); applyColor(c); setOpen(false); }}
                className={`h-6 w-6 rounded border transition hover:scale-125 hover:shadow ${!c ? "bg-white border-dashed border-gray-300 relative after:content-['✕'] after:text-[8px] after:text-gray-400 after:absolute after:inset-0 after:flex after:items-center after:justify-center" : "border-gray-200"}`}
                style={c ? { backgroundColor: c } : undefined}
                title={c || "Remove color"}
              />
            ))}
          </div>
          <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center gap-2">
            <input ref={pickerRef} type="color" defaultValue={type === "text" ? "#000000" : "#fef08a"}
              className="h-7 w-7 rounded border border-gray-200 cursor-pointer p-0"
              onMouseDown={(e) => e.stopPropagation()}
              onChange={(e) => applyColor(e.target.value)} />
            <span className="text-[10px] text-gray-500">Custom</span>
            <button type="button"
              onMouseDown={(e) => { e.preventDefault(); if (pickerRef.current) { applyColor(pickerRef.current.value); setOpen(false); } }}
              className="ml-auto text-[10px] font-medium text-indigo-600 hover:text-indigo-800"
            >Apply</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
 * TOOLBAR
 * ═══════════════════════════════════════════════════════════════════ */

function Toolbar({ editor, onPickImage, onPickVideo }: {
  editor: Editor;
  onPickImage: () => void;
  onPickVideo: () => void;
}) {
  const link = useCallback(() => {
    if (editor.isActive("link")) { editor.chain().focus().unsetLink().run(); return; }
    const url = window.prompt("URL:");
    if (url) editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  const image = useCallback(() => {
    const url = window.prompt("Image URL (or cancel to upload a file):");
    // FIX 4: Distinguish null (user cancelled) from "" (user pressed OK with empty input)
    if (url === null) {
      // User pressed Cancel — open file picker for upload
      onPickImage();
      return;
    }
    if (url.trim()) {
      // User entered a URL — insert it
      editor.chain().focus().setImage({ src: url.trim() }).run();
    }
    // else: user pressed OK with empty input — do nothing (re-focus editor)
  }, [editor, onPickImage]);

  const table = useCallback(() => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }, [editor]);

  // ISSUE 2 FIX: Use schema-aware insertContent with the registered node type
  const insertVideo = useCallback(() => {
    const url = window.prompt("Video URL (YouTube, Vimeo, MP4) — or cancel to upload:");
    // FIX 4: null = cancel (open file picker), "" = empty OK (do nothing)
    if (url === null) { onPickVideo(); return; }
    if (!url.trim()) return; // empty input — do nothing
    const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (ytMatch) {
      editor.chain().focus().insertContent({
        type: "iframe",
        attrs: { src: `https://www.youtube.com/embed/${ytMatch[1]}` },
      }).run();
      return;
    }
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
      editor.chain().focus().insertContent({
        type: "iframe",
        attrs: { src: `https://player.vimeo.com/video/${vimeoMatch[1]}` },
      }).run();
      return;
    }
    // Direct video file URL
    editor.chain().focus().insertContent({
      type: "video",
      attrs: { src: url },
    }).run();
  }, [editor, onPickVideo]);

  const insertDate = useCallback(() => {
    const now = new Date();
    const formatted = now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
      + " " + now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    editor.chain().focus().insertContent(formatted).run();
  }, [editor]);

  /**
   * applyFontSize — word-boundary aware font size application.
   *
   * BUG 1 FIX: When selection is collapsed, manually selects the word under cursor.
   * BUG 2 FIX: When clearing fontSize, checks if textStyle mark would be empty
   * (no color, no fontFamily remaining) and uses unsetMark to avoid dangling <span>.
   */
  const applyFontSize = useCallback((val: string) => {
    const { state } = editor;
    const { from, empty } = state.selection;

    // Helper: apply font size or clear it, cleaning up empty marks
    const applyOrClear = (chain: ReturnType<typeof editor.chain>) => {
      if (val === "Default") {
        // Check if the textStyle mark at cursor has other attrs (color, fontFamily)
        const attrs = editor.getAttributes("textStyle");
        const hasOtherAttrs = Object.entries(attrs).some(
          ([key, v]) => key !== "fontSize" && v != null
        );
        if (hasOtherAttrs) {
          // Preserve other attrs, just null out fontSize
          return chain.setMark("textStyle", { fontSize: null } as any);
        } else {
          // No other attrs — remove the entire mark to avoid empty <span>
          return chain.unsetMark("textStyle");
        }
      } else {
        return chain.setMark("textStyle", { fontSize: val } as any);
      }
    };

    if (empty) {
      // Selection is collapsed — find the word boundaries around the cursor
      const $pos = state.doc.resolve(from);
      const parent = $pos.parent;
      const parentOffset = $pos.parentOffset;
      const text = parent.textContent;

      // Walk backwards and forwards to find \S+ word boundary
      let wordStart = parentOffset;
      let wordEnd = parentOffset;
      while (wordStart > 0 && /\S/.test(text[wordStart - 1])) wordStart--;
      while (wordEnd < text.length && /\S/.test(text[wordEnd])) wordEnd++;

      if (wordStart === wordEnd) {
        // Cursor is on whitespace or empty line — set stored mark for future typing.
        // This is the only case where font size won't visually apply to existing text.
        applyOrClear(editor.chain().focus()).run();
        return;
      }

      // Convert parent-relative offsets to absolute document positions
      const startOfParent = $pos.start();
      const absFrom = startOfParent + wordStart;
      const absTo = startOfParent + wordEnd;

      // Select the word, apply mark, then restore cursor to original position
      const chain = editor.chain().focus().setTextSelection({ from: absFrom, to: absTo });
      applyOrClear(chain).setTextSelection(from).run();
    } else {
      // User has an actual selection — apply directly to it
      applyOrClear(editor.chain().focus()).run();
    }
  }, [editor]);

  return (
    <div className="border-b bg-white px-3 py-2 space-y-1 rounded-t-lg">
      {/* Row 1 */}
      <div className="flex flex-wrap items-center gap-0.5">
        <Btn onMouseDown={() => editor.chain().focus().setParagraph().run()} active={editor.isActive("paragraph")} title="Normal Text"><span className="text-[10px] font-medium">P</span></Btn>
        <Btn onMouseDown={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive("heading", { level: 1 })} title="Heading 1"><span className="font-bold text-xs">H1</span></Btn>
        <Btn onMouseDown={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="Heading 2"><span className="font-bold text-xs">H2</span></Btn>
        <Btn onMouseDown={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} title="Heading 3"><span className="font-bold text-xs">H3</span></Btn>
        <Btn onMouseDown={() => editor.chain().focus().toggleHeading({ level: 4 }).run()} active={editor.isActive("heading", { level: 4 })} title="Heading 4"><span className="font-bold text-[10px]">H4</span></Btn>
        <Btn onMouseDown={() => editor.chain().focus().toggleHeading({ level: 5 }).run()} active={editor.isActive("heading", { level: 5 })} title="Heading 5"><span className="font-bold text-[10px]">H5</span></Btn>
        <Btn onMouseDown={() => editor.chain().focus().toggleHeading({ level: 6 }).run()} active={editor.isActive("heading", { level: 6 })} title="Heading 6"><span className="font-bold text-[10px]">H6</span></Btn>
        <Sep />
        <Btn onMouseDown={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold (Ctrl+B)"><span className="font-bold">B</span></Btn>
        <Btn onMouseDown={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic (Ctrl+I)"><span className="italic">I</span></Btn>
        <Btn onMouseDown={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Underline (Ctrl+U)"><span className="underline">U</span></Btn>
        <Btn onMouseDown={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="Strikethrough"><span className="line-through">S</span></Btn>
        <Btn onMouseDown={() => editor.chain().focus().toggleSubscript().run()} active={editor.isActive("subscript")} title="Subscript"><span className="text-[10px]">X<sub>2</sub></span></Btn>
        <Btn onMouseDown={() => editor.chain().focus().toggleSuperscript().run()} active={editor.isActive("superscript")} title="Superscript"><span className="text-[10px]">X<sup>2</sup></span></Btn>
        <Sep />
        <ColorDrop editor={editor} colors={TEXT_COLORS} type="text" label="Text Color" />
        <ColorDrop editor={editor} colors={HIGHLIGHT_COLORS} type="highlight" label="Highlight" />
        <Sep />
        <Btn onMouseDown={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Bullet List">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>
        </Btn>
        <Btn onMouseDown={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Numbered List">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M10 6h11M10 12h11M10 18h11M3 5v2M3 17v2M3 11v2M5 5H3M5 17H3M5 11H3" /></svg>
        </Btn>
        <Btn onMouseDown={() => editor.chain().focus().toggleTaskList().run()} active={editor.isActive("taskList")} title="Task List">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="5" width="6" height="6" rx="1"/><path d="M5 8l1 1 2-2"/><line x1="13" y1="8" x2="21" y2="8"/><rect x="3" y="14" width="6" height="6" rx="1"/><line x1="13" y1="17" x2="21" y2="17"/></svg>
        </Btn>
        <Btn onMouseDown={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Blockquote">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 17h3l2-4V7H5v6h3M15 17h3l2-4V7h-6v6h3" /></svg>
        </Btn>
        <Btn onMouseDown={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive("codeBlock")} title="Code Block"><span className="font-mono text-[10px]">&lt;/&gt;</span></Btn>
      </div>

      {/* Row 2 */}
      <div className="flex flex-wrap items-center gap-0.5">
        <Btn onMouseDown={() => editor.chain().focus().setTextAlign("left").run()} active={editor.isActive({ textAlign: "left" })} title="Align Left">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 6h18M3 12h12M3 18h18" /></svg>
        </Btn>
        <Btn onMouseDown={() => editor.chain().focus().setTextAlign("center").run()} active={editor.isActive({ textAlign: "center" })} title="Align Center">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 6h18M6 12h12M3 18h18" /></svg>
        </Btn>
        <Btn onMouseDown={() => editor.chain().focus().setTextAlign("right").run()} active={editor.isActive({ textAlign: "right" })} title="Align Right">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 6h18M9 12h12M3 18h18" /></svg>
        </Btn>
        <Btn onMouseDown={() => editor.chain().focus().setTextAlign("justify").run()} active={editor.isActive({ textAlign: "justify" })} title="Justify">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
        </Btn>
        <Sep />
        <DropMenu label="Font" items={FONT_FAMILIES} fontPreview
          currentValue={editor.getAttributes("textStyle").fontFamily || "Default"}
          onSelect={(val) => {
            if (val === "Default") editor.chain().focus().unsetFontFamily().run();
            else editor.chain().focus().setFontFamily(val).run();
          }} />
        {/* Font size — uses applyFontSize helper (BUG 1 + BUG 2 fix) */}
        <DropMenu label="Size" items={FONT_SIZES}
          currentValue={editor.getAttributes("textStyle").fontSize || "Default"}
          onSelect={applyFontSize} />
        <Sep />
        <Btn onMouseDown={link} active={editor.isActive("link")} title={editor.isActive("link") ? "Remove Link" : "Add Link"}>
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" /></svg>
        </Btn>
        <Btn onMouseDown={image} title="Insert Image">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>
        </Btn>
        <Btn onMouseDown={insertVideo} title="Insert Video">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M10 9l5 3-5 3V9z" /></svg>
        </Btn>
        <Btn onMouseDown={table} title="Insert Table">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M3 15h18M9 3v18M15 3v18" /></svg>
        </Btn>
        <Btn onMouseDown={() => editor.chain().focus().setHorizontalRule().run()} title="Divider">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 12h18" /></svg>
        </Btn>
        <Sep />
        <Btn onMouseDown={insertDate} title="Insert Date/Time">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
        </Btn>
        <Sep />
        <Btn onMouseDown={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo (Ctrl+Z)">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 10h13a4 4 0 010 8H9M3 10l4-4M3 10l4 4" /></svg>
        </Btn>
        <Btn onMouseDown={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo (Ctrl+Y)">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 10H8a4 4 0 000 8h6M21 10l-4-4M21 10l-4 4" /></svg>
        </Btn>
        <Sep />
        <Btn onMouseDown={() => editor.chain().focus().clearNodes().unsetAllMarks().run()} title="Clear Formatting">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 7V4h16v3M9 20h6M12 4v16" /><path d="M3 21l18-18" strokeWidth="1.5" stroke="#dc2626" /></svg>
        </Btn>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
 * MAIN EDITOR COMPONENT
 * ═══════════════════════════════════════════════════════════════════ */

export function RichTextEditor({ initialContent, onChange, contentKey, placeholder, className, uploadImage, uploadVideo }: Props) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const uploadImageRef = useRef(uploadImage);
  uploadImageRef.current = uploadImage;
  const uploadVideoRef = useRef(uploadVideo);
  uploadVideoRef.current = uploadVideo;

  // ISSUE 3 FIX: Hidden file inputs for image/video upload
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [videoProgress, setVideoProgress] = useState<number | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3, 4, 5, 6] } }),
      Underline,
      TextStyle,
      Color,
      FontFamily,
      FontSize,
      Highlight.configure({ multicolor: true }),
      Subscript,
      Superscript,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Link.configure({ openOnClick: false, HTMLAttributes: { rel: "noopener noreferrer nofollow", target: "_blank" } }),
      Image.configure({ inline: false, allowBase64: true }),
      IframeNode,   // ISSUE 2 FIX: registered iframe in schema
      VideoNode,    // ISSUE 2 FIX: registered video in schema
      Table.configure({ resizable: false }),
      TableRow,
      TableCell,
      TableHeader,
      TaskList,
      TaskItem.configure({ nested: true }),
      CharacterCount,
      Placeholder.configure({ placeholder: placeholder ?? "Start writing your content…" }),
    ],
    content: initialContent,
    editable: true,
    onUpdate: ({ editor: e }) => {
      onChangeRef.current(e.getHTML());
    },
    editorProps: {
      attributes: { class: "tiptap px-5 py-4 focus:outline-none" },
    },
    immediatelyRender: false,
  }, [contentKey]);

  // ISSUE 3 FIX: Image file upload handler
  const handleImageFile = useCallback(async (file: File) => {
    if (!editor || !uploadImageRef.current) return;
    try {
      const { url, alt } = await uploadImageRef.current(file);
      editor.chain().focus().setImage({ src: url, alt: alt || file.name }).run();
    } catch (err) {
      console.error("Image upload failed:", err);
    }
  }, [editor]);

  // ISSUE 3 FIX: Video file upload handler with progress
  const handleVideoFile = useCallback(async (file: File) => {
    if (!editor || !uploadVideoRef.current) return;
    setVideoProgress(0);
    try {
      const { url } = await uploadVideoRef.current(file, (pct) => setVideoProgress(pct));
      editor.chain().focus().insertContent({
        type: "video",
        attrs: { src: url },
      }).run();
    } catch (err) {
      console.error("Video upload failed:", err);
    } finally {
      setVideoProgress(null);
    }
  }, [editor]);

  const onPickImage = useCallback(() => {
    if (uploadImageRef.current) {
      imageInputRef.current?.click();
    } else {
      console.warn("[RichTextEditor] No uploadImage prop provided — file upload unavailable.");
    }
  }, []);

  const onPickVideo = useCallback(() => {
    if (uploadVideoRef.current) {
      videoInputRef.current?.click();
    } else {
      console.warn("[RichTextEditor] No uploadVideo prop provided — file upload unavailable.");
    }
  }, []);

  if (!editor) return null;

  const words = editor.storage.characterCount.words();
  const chars = editor.storage.characterCount.characters();
  const readTime = Math.max(1, Math.ceil(words / 200));

  return (
    <div className={`rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden ${className ?? ""}`}>
      <Toolbar editor={editor} onPickImage={onPickImage} onPickVideo={onPickVideo} />

      {/* ISSUE 3 FIX: Video upload progress bar */}
      {videoProgress !== null && (
        <div className="px-3 py-1.5 bg-indigo-50 border-b border-indigo-100">
          <div className="flex items-center gap-2">
            <span className="text-xs text-indigo-700">Uploading video… {Math.round(videoProgress)}%</span>
            <div className="flex-1 h-1.5 bg-indigo-100 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-600 rounded-full transition-all" style={{ width: `${videoProgress}%` }} />
            </div>
          </div>
        </div>
      )}

      <div className="min-h-[300px] max-h-[720px] overflow-y-auto">
        <EditorContent editor={editor} />
      </div>

      <div className="border-t border-gray-100 px-4 py-1.5 flex justify-end gap-4 text-[11px] text-gray-400 select-none">
        <span>{words} words</span>
        <span>{chars} chars</span>
        <span>~{readTime} min read</span>
      </div>

      {/* ISSUE 3 FIX: Hidden file inputs */}
      <input ref={imageInputRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleImageFile(f); e.target.value = ""; }} />
      <input ref={videoInputRef} type="file" accept="video/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleVideoFile(f); e.target.value = ""; }} />
    </div>
  );
}
