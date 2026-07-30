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
import FontFamily from "@tiptap/extension-font-family";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import CharacterCount from "@tiptap/extension-character-count";
import { useCallback, useState } from "react";
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Heading1, Heading2, Heading3, Heading4,
  List, ListOrdered, Quote,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Link as LinkIcon, Unlink, ImageIcon,
  Undo, Redo, Minus,
  Palette, Highlighter,
  Table as TableIcon, Subscript as SubIcon, Superscript as SupIcon,
  Code, RemoveFormatting, Type,
} from "lucide-react";

type Props = {
  initialContent: string;
  onChange: (html: string) => void;
  contentKey?: string;
  placeholder?: string;
  className?: string;
};

/* ─── Color Palettes ─── */
const TEXT_COLORS = [
  { label: "Default", value: "" },
  { label: "Black", value: "#000000" },
  { label: "Dark Gray", value: "#374151" },
  { label: "Gray", value: "#6b7280" },
  { label: "Red", value: "#dc2626" },
  { label: "Orange", value: "#ea580c" },
  { label: "Amber", value: "#d97706" },
  { label: "Gold", value: "#c9a15b" },
  { label: "Green", value: "#16a34a" },
  { label: "Teal", value: "#0d9488" },
  { label: "Blue", value: "#2563eb" },
  { label: "Indigo", value: "#4f46e5" },
  { label: "Purple", value: "#9333ea" },
  { label: "Pink", value: "#db2777" },
  { label: "Rose", value: "#e11d48" },
];

const HIGHLIGHT_COLORS = [
  { label: "None", value: "" },
  { label: "Yellow", value: "#fef08a" },
  { label: "Lime", value: "#d9f99d" },
  { label: "Green", value: "#bbf7d0" },
  { label: "Cyan", value: "#a5f3fc" },
  { label: "Blue", value: "#bfdbfe" },
  { label: "Purple", value: "#e9d5ff" },
  { label: "Pink", value: "#fbcfe8" },
  { label: "Rose", value: "#fecdd3" },
  { label: "Orange", value: "#fed7aa" },
];

const FONT_FAMILIES = [
  { label: "Sans Serif", value: "" },
  { label: "Serif", value: "Georgia, serif" },
  { label: "Mono", value: "monospace" },
  { label: "Inter", value: "Inter, sans-serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Playfair", value: "'Playfair Display', serif" },
];

const FONT_SIZES = [
  { label: "Small", value: "0.875em" },
  { label: "Normal", value: "" },
  { label: "Large", value: "1.25em" },
  { label: "XL", value: "1.5em" },
  { label: "2XL", value: "2em" },
];

/* ─── Toolbar Button ─── */
function TBtn({
  onMouseDown, active, disabled, title, children,
}: {
  onMouseDown: (e: React.MouseEvent) => void;
  active?: boolean; disabled?: boolean; title: string;
  children: React.ReactNode;
}) {
  return (
    <button type="button" onMouseDown={onMouseDown} disabled={disabled} title={title}
      className={`rounded p-1.5 transition-colors select-none ${
        active ? "bg-[var(--admin-accent,#6366f1)] text-white" : "text-[var(--admin-muted,#6b7280)] hover:bg-gray-100 hover:text-gray-900"
      } disabled:opacity-30 disabled:cursor-not-allowed`}>
      {children}
    </button>
  );
}

function Divider() { return <div className="mx-0.5 h-6 w-px bg-gray-200" />; }

/* ─── Dropdown Selector ─── */
function ToolbarSelect({ value, options, onChange, title, width = "w-24" }: {
  value: string; options: { label: string; value: string }[];
  onChange: (v: string) => void; title: string; width?: string;
}) {
  return (
    <select title={title} value={value}
      onChange={(e) => onChange(e.target.value)}
      onMouseDown={(e) => e.stopPropagation()}
      className={`${width} rounded border border-gray-200 bg-white px-1.5 py-1 text-xs text-gray-700 focus:border-indigo-400 focus:outline-none`}>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

/* ─── Color Picker Popover ─── */
function ColorPicker({ editor, colors, type, icon, title }: {
  editor: Editor; colors: { label: string; value: string }[];
  type: "text" | "highlight"; icon: React.ReactNode; title: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button type="button" onMouseDown={(e) => { e.preventDefault(); setOpen(!open); }} title={title}
        className="rounded p-1.5 text-[var(--admin-muted,#6b7280)] hover:bg-gray-100 hover:text-gray-900">
        {icon}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 z-50 mt-1 rounded-lg border border-gray-200 bg-white p-2 shadow-xl">
            <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-gray-400">{title}</p>
            <div className="grid grid-cols-5 gap-1.5">
              {colors.map((c) => (
                <button key={c.value || "none"} type="button" title={c.label}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    if (type === "text") {
                      if (!c.value) editor.chain().focus().unsetColor().run();
                      else editor.chain().focus().setColor(c.value).run();
                    } else {
                      if (!c.value) editor.chain().focus().unsetHighlight().run();
                      else editor.chain().focus().setHighlight({ color: c.value }).run();
                    }
                    setOpen(false);
                  }}
                  className="h-6 w-6 rounded-sm border border-gray-200 transition hover:scale-125 hover:shadow"
                  style={{ backgroundColor: c.value || "#ffffff" }}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Main Toolbar ─── */
function Toolbar({ editor }: { editor: Editor }) {
  const cmd = (fn: () => void) => (e: React.MouseEvent) => { e.preventDefault(); fn(); };

  const addLink = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (editor.isActive("link")) { editor.chain().focus().unsetLink().run(); return; }
    const url = window.prompt("Enter URL:");
    if (url) editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  const addImage = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const url = window.prompt("Image URL:");
    if (url) editor.chain().focus().setImage({ src: url }).run();
  }, [editor]);

  const insertTable = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }, [editor]);

  const currentFont = editor.getAttributes("textStyle").fontFamily || "";
  const currentSize = editor.getAttributes("textStyle").fontSize || "";

  return (
    <div className="border-b border-gray-200 bg-gray-50/80 px-2 py-1.5 rounded-t-lg">
      {/* Row 1: Font, Size, Colors, Inline formatting */}
      <div className="flex flex-wrap items-center gap-1">
        <ToolbarSelect title="Font Family" value={currentFont} width="w-28"
          options={FONT_FAMILIES}
          onChange={(v) => { if (!v) editor.chain().focus().unsetFontFamily().run(); else editor.chain().focus().setFontFamily(v).run(); }}
        />
        <ToolbarSelect title="Font Size" value={currentSize} width="w-20"
          options={FONT_SIZES}
          onChange={(v) => { if (!v) editor.chain().focus().unsetMark("textStyle").run(); else editor.chain().focus().setMark("textStyle", { fontSize: v }).run(); }}
        />

        <Divider />

        <ColorPicker editor={editor} colors={TEXT_COLORS} type="text" icon={<Palette className="h-4 w-4" />} title="Text Color" />
        <ColorPicker editor={editor} colors={HIGHLIGHT_COLORS} type="highlight" icon={<Highlighter className="h-4 w-4" />} title="Highlight" />

        <Divider />

        <TBtn onMouseDown={cmd(() => editor.chain().focus().toggleBold().run())} active={editor.isActive("bold")} title="Bold (Ctrl+B)"><Bold className="h-4 w-4" /></TBtn>
        <TBtn onMouseDown={cmd(() => editor.chain().focus().toggleItalic().run())} active={editor.isActive("italic")} title="Italic (Ctrl+I)"><Italic className="h-4 w-4" /></TBtn>
        <TBtn onMouseDown={cmd(() => editor.chain().focus().toggleUnderline().run())} active={editor.isActive("underline")} title="Underline (Ctrl+U)"><UnderlineIcon className="h-4 w-4" /></TBtn>
        <TBtn onMouseDown={cmd(() => editor.chain().focus().toggleStrike().run())} active={editor.isActive("strike")} title="Strikethrough"><Strikethrough className="h-4 w-4" /></TBtn>
        <TBtn onMouseDown={cmd(() => editor.chain().focus().toggleSubscript().run())} active={editor.isActive("subscript")} title="Subscript"><SubIcon className="h-4 w-4" /></TBtn>
        <TBtn onMouseDown={cmd(() => editor.chain().focus().toggleSuperscript().run())} active={editor.isActive("superscript")} title="Superscript"><SupIcon className="h-4 w-4" /></TBtn>
        <TBtn onMouseDown={cmd(() => editor.chain().focus().toggleCode().run())} active={editor.isActive("code")} title="Inline Code"><Code className="h-4 w-4" /></TBtn>

        <Divider />

        <TBtn onMouseDown={cmd(() => editor.chain().focus().clearNodes().unsetAllMarks().run())} title="Clear Formatting"><RemoveFormatting className="h-4 w-4" /></TBtn>
      </div>

      {/* Row 2: Headings, Lists, Alignment, Blocks, Insert */}
      <div className="mt-1 flex flex-wrap items-center gap-1">
        <TBtn onMouseDown={cmd(() => editor.chain().focus().setParagraph().run())} active={editor.isActive("paragraph")} title="Paragraph"><Type className="h-4 w-4" /></TBtn>
        <TBtn onMouseDown={cmd(() => editor.chain().focus().toggleHeading({ level: 1 }).run())} active={editor.isActive("heading", { level: 1 })} title="Heading 1"><Heading1 className="h-4 w-4" /></TBtn>
        <TBtn onMouseDown={cmd(() => editor.chain().focus().toggleHeading({ level: 2 }).run())} active={editor.isActive("heading", { level: 2 })} title="Heading 2"><Heading2 className="h-4 w-4" /></TBtn>
        <TBtn onMouseDown={cmd(() => editor.chain().focus().toggleHeading({ level: 3 }).run())} active={editor.isActive("heading", { level: 3 })} title="Heading 3"><Heading3 className="h-4 w-4" /></TBtn>
        <TBtn onMouseDown={cmd(() => editor.chain().focus().toggleHeading({ level: 4 }).run())} active={editor.isActive("heading", { level: 4 })} title="Heading 4"><Heading4 className="h-4 w-4" /></TBtn>

        <Divider />

        <TBtn onMouseDown={cmd(() => editor.chain().focus().toggleBulletList().run())} active={editor.isActive("bulletList")} title="Bullet List"><List className="h-4 w-4" /></TBtn>
        <TBtn onMouseDown={cmd(() => editor.chain().focus().toggleOrderedList().run())} active={editor.isActive("orderedList")} title="Numbered List"><ListOrdered className="h-4 w-4" /></TBtn>
        <TBtn onMouseDown={cmd(() => editor.chain().focus().toggleBlockquote().run())} active={editor.isActive("blockquote")} title="Blockquote"><Quote className="h-4 w-4" /></TBtn>
        <TBtn onMouseDown={cmd(() => editor.chain().focus().toggleCodeBlock().run())} active={editor.isActive("codeBlock")} title="Code Block"><Code className="h-4 w-4" /></TBtn>

        <Divider />

        <TBtn onMouseDown={cmd(() => editor.chain().focus().setTextAlign("left").run())} active={editor.isActive({ textAlign: "left" })} title="Align Left"><AlignLeft className="h-4 w-4" /></TBtn>
        <TBtn onMouseDown={cmd(() => editor.chain().focus().setTextAlign("center").run())} active={editor.isActive({ textAlign: "center" })} title="Align Center"><AlignCenter className="h-4 w-4" /></TBtn>
        <TBtn onMouseDown={cmd(() => editor.chain().focus().setTextAlign("right").run())} active={editor.isActive({ textAlign: "right" })} title="Align Right"><AlignRight className="h-4 w-4" /></TBtn>
        <TBtn onMouseDown={cmd(() => editor.chain().focus().setTextAlign("justify").run())} active={editor.isActive({ textAlign: "justify" })} title="Justify"><AlignJustify className="h-4 w-4" /></TBtn>

        <Divider />

        <TBtn onMouseDown={addLink} active={editor.isActive("link")} title={editor.isActive("link") ? "Remove Link" : "Add Link"}>
          {editor.isActive("link") ? <Unlink className="h-4 w-4" /> : <LinkIcon className="h-4 w-4" />}
        </TBtn>
        <TBtn onMouseDown={addImage} title="Insert Image"><ImageIcon className="h-4 w-4" /></TBtn>
        <TBtn onMouseDown={insertTable} title="Insert Table"><TableIcon className="h-4 w-4" /></TBtn>
        <TBtn onMouseDown={cmd(() => editor.chain().focus().setHorizontalRule().run())} title="Horizontal Line"><Minus className="h-4 w-4" /></TBtn>

        <Divider />

        <TBtn onMouseDown={cmd(() => editor.chain().focus().undo().run())} disabled={!editor.can().undo()} title="Undo (Ctrl+Z)"><Undo className="h-4 w-4" /></TBtn>
        <TBtn onMouseDown={cmd(() => editor.chain().focus().redo().run())} disabled={!editor.can().redo()} title="Redo (Ctrl+Y)"><Redo className="h-4 w-4" /></TBtn>
      </div>
    </div>
  );
}

/* ─── Editor Component ─── */
export function RichTextEditor({ initialContent, onChange, contentKey, placeholder, className }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3, 4] } }),
      Underline,
      TextStyle,
      Color,
      FontFamily,
      Highlight.configure({ multicolor: true }),
      Subscript,
      Superscript,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Link.configure({ openOnClick: false, HTMLAttributes: { rel: "noopener noreferrer nofollow", target: "_blank" } }),
      Image.configure({ inline: false, allowBase64: false }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      CharacterCount,
      Placeholder.configure({ placeholder: placeholder ?? "Start writing…" }),
    ],
    content: initialContent,
    onUpdate: ({ editor: e }) => { onChange(e.getHTML()); },
    editorProps: {
      attributes: { class: "tiptap min-h-[300px] px-5 py-4 focus:outline-none" },
    },
    immediatelyRender: false,
  }, [contentKey]);

  if (!editor) return null;

  const chars = editor.storage.characterCount.characters();
  const words = editor.storage.characterCount.words();
  const readTime = Math.max(1, Math.ceil(words / 200));

  return (
    <div className={`overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm ${className ?? ""}`}>
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
      <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-4 py-1.5 text-[11px] text-gray-400">
        <span>{words} words</span>
        <span>{chars} chars</span>
        <span>~{readTime} min read</span>
      </div>
    </div>
  );
}
