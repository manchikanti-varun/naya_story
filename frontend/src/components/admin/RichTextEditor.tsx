"use client";

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
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import CharacterCount from "@tiptap/extension-character-count";
import { useCallback, useEffect, useRef, useState } from "react";

type Props = {
  initialContent: string;
  onChange: (html: string) => void;
  contentKey?: string;
  placeholder?: string;
  className?: string;
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

/* ─── Toolbar Icon Button ─── */
function Btn({ onMouseDown, active, disabled, title, children }: {
  onMouseDown: () => void; active?: boolean; disabled?: boolean; title: string; children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onMouseDown={(e) => { e.preventDefault(); onMouseDown(); }}
      className={`inline-flex items-center justify-center h-8 w-8 rounded text-sm transition-colors select-none
        ${active ? "bg-indigo-600 text-white shadow-sm" : "text-gray-600 hover:bg-gray-200/80 hover:text-gray-900"}
        disabled:opacity-25 disabled:pointer-events-none`}
    >
      {children}
    </button>
  );
}

function Sep() { return <div className="mx-1 h-5 w-px bg-gray-300/60" />; }

/* ─── Color Dropdown ─── */
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
        {type === "text" ? (
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 20h16M6 4l6 12M18 4l-6 12" /></svg>
        ) : (
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9M3 20h3m1-4l4-12h2l4 12" /><rect x="1" y="17" width="22" height="4" rx="1" fill="#fef08a" stroke="none" opacity="0.6" /></svg>
        )}
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
          {/* Custom color picker */}
          <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center gap-2">
            <input
              ref={pickerRef}
              type="color"
              defaultValue={type === "text" ? "#000000" : "#fef08a"}
              className="h-7 w-7 rounded border border-gray-200 cursor-pointer p-0"
              onMouseDown={(e) => e.stopPropagation()}
              onChange={(e) => { applyColor(e.target.value); }}
            />
            <span className="text-[10px] text-gray-500">Custom color</span>
            <button type="button"
              onMouseDown={(e) => { e.preventDefault(); if (pickerRef.current) { applyColor(pickerRef.current.value); setOpen(false); } }}
              className="ml-auto text-[10px] font-medium text-indigo-600 hover:text-indigo-800"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Toolbar ─── */
function Toolbar({ editor }: { editor: Editor }) {
  const link = useCallback(() => {
    if (editor.isActive("link")) { editor.chain().focus().unsetLink().run(); return; }
    const url = window.prompt("URL:");
    if (url) editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  const image = useCallback(() => {
    const url = window.prompt("Image URL:");
    if (url) editor.chain().focus().setImage({ src: url }).run();
  }, [editor]);

  const table = useCallback(() => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }, [editor]);

  return (
    <div className="sticky top-0 z-10 border-b bg-white/95 backdrop-blur-sm px-3 py-2 space-y-1 rounded-t-lg">
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

        <Btn onMouseDown={link} active={editor.isActive("link")} title={editor.isActive("link") ? "Remove Link" : "Add Link"}>
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" /></svg>
        </Btn>
        <Btn onMouseDown={image} title="Insert Image">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>
        </Btn>
        <Btn onMouseDown={table} title="Insert Table">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M3 15h18M9 3v18M15 3v18" /></svg>
        </Btn>
        <Btn onMouseDown={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal Line">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 12h18" /></svg>
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

/* ─── Main Editor ─── */
export function RichTextEditor({ initialContent, onChange, contentKey, placeholder, className }: Props) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3, 4, 5, 6] } }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Subscript,
      Superscript,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Link.configure({ openOnClick: false, HTMLAttributes: { rel: "noopener noreferrer nofollow", target: "_blank" } }),
      Image.configure({ inline: false, allowBase64: false }),
      Table.configure({ resizable: false }),
      TableRow,
      TableCell,
      TableHeader,
      CharacterCount,
      Placeholder.configure({ placeholder: placeholder ?? "Start writing your content…" }),
    ],
    content: initialContent,
    onUpdate: ({ editor: e }) => {
      onChangeRef.current(e.getHTML());
    },
    editorProps: {
      attributes: { class: "tiptap px-5 py-4 focus:outline-none" },
    },
    immediatelyRender: false,
  }, [contentKey]);

  if (!editor) return null;

  const words = editor.storage.characterCount.words();
  const chars = editor.storage.characterCount.characters();
  const readTime = Math.max(1, Math.ceil(words / 200));

  return (
    <div className={`rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden ${className ?? ""}`}>
      <Toolbar editor={editor} />
      <div className="min-h-[300px] cursor-text" onClick={() => { if (!editor.isFocused) editor.commands.focus("end"); }}>
        <EditorContent editor={editor} />
      </div>
      <div className="border-t border-gray-100 px-4 py-1.5 flex justify-end gap-4 text-[11px] text-gray-400 select-none">
        <span>{words} words</span>
        <span>{chars} chars</span>
        <span>~{readTime} min read</span>
      </div>
    </div>
  );
}
