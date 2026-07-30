/**
 * HTML sanitization for rich text content (legal pages, CMS).
 * Allows safe formatting tags while stripping XSS vectors.
 */
import sanitizeHtml from "sanitize-html";

const ALLOWED_TAGS = [
  "h1", "h2", "h3", "h4", "h5", "h6",
  "p", "br", "hr",
  "strong", "em", "u", "s", "del",
  "ul", "ol", "li",
  "blockquote",
  "a",
  "img",
  "table", "thead", "tbody", "tr", "th", "td",
  "span", "div",
  "code", "pre",
];

const ALLOWED_ATTRIBUTES: Record<string, string[]> = {
  a: ["href", "target", "rel"],
  img: ["src", "alt", "width", "height", "style"],
  "*": ["style", "class"],
  td: ["colspan", "rowspan"],
  th: ["colspan", "rowspan"],
};

const ALLOWED_STYLES = {
  "*": {
    "text-align": [/^(left|center|right|justify)$/],
    "max-width": [/^\d+(px|%|em|rem)$/],
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
    allowedSchemes: ["http", "https"],
    allowedSchemesByTag: {
      img: ["http", "https"],
      a: ["http", "https", "mailto"],
    },
  });
}
