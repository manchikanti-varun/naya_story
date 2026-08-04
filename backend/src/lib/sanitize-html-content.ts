/**
 * HTML sanitization for rich text content (legal pages, CMS).
 * Allows safe formatting tags while stripping XSS vectors.
 */
import sanitizeHtml from "sanitize-html";

const ALLOWED_TAGS = [
  "h1", "h2", "h3", "h4", "h5", "h6",
  "p", "br", "hr",
  "strong", "em", "u", "s", "del", "sub", "sup",
  "ul", "ol", "li",
  "blockquote",
  "a",
  "img", "video", "source", "iframe",
  "table", "thead", "tbody", "tr", "th", "td",
  "span", "div", "mark",
  "code", "pre",
  "input", "label", // task list checkboxes
  "figure", "figcaption",
];

const ALLOWED_ATTRIBUTES: Record<string, string[]> = {
  a: ["href", "target", "rel"],
  img: ["src", "alt", "width", "height", "style"],
  video: ["src", "controls", "width", "height", "style", "data-storage-url"],
  source: ["src", "type"],
  iframe: ["src", "frameborder", "allowfullscreen", "allow", "loading", "style", "width", "height"],
  input: ["type", "checked", "disabled"],
  span: ["style", "data-color"],
  mark: ["style", "data-color"],
  div: ["class", "style", "data-type"],
  ul: ["data-type"],
  li: ["data-type", "data-checked"],
  "*": ["style", "class"],
  td: ["colspan", "rowspan"],
  th: ["colspan", "rowspan"],
};

const ALLOWED_STYLES = {
  "*": {
    "text-align": [/^(left|center|right|justify)$/],
    "max-width": [/^\d+(px|%|em|rem)$/],
    "color": [/^#[0-9a-fA-F]{3,6}$/, /^rgb/],
    "background-color": [/^#[0-9a-fA-F]{3,6}$/, /^rgb/],
    "font-family": [/.+/],
    "font-size": [/^\d+(\.\d+)?(px|em|rem|%)$/],
  },
};

/**
 * Sanitize rich text HTML content.
 * Strips scripts, event handlers, and dangerous attributes.
 * Allows common formatting, links (with noopener), and images.
 */
export function sanitizeRichContent(html: string): string {
  if (!html || typeof html !== "string") return "";

  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTRIBUTES,
    allowedStyles: ALLOWED_STYLES,
    // Force safe link attributes
    transformTags: {
      a: (tagName, attribs) => ({
        tagName,
        attribs: {
          ...attribs,
          rel: "noopener noreferrer nofollow",
          target: "_blank",
        },
      }),
    },
    // Don't allow data: or javascript: URLs
    allowedSchemes: ["http", "https", "data", "blob"],
    allowedSchemesByTag: {
      img: ["http", "https", "data"],
      a: ["http", "https", "mailto"],
      video: ["http", "https", "blob"],
      source: ["http", "https", "blob"],
      iframe: ["http", "https"],
    },
    allowedIframeHostnames: [
      "www.youtube.com",
      "youtube.com",
      "player.vimeo.com",
      "vimeo.com",
      "drive.google.com",
    ],
  });
}
