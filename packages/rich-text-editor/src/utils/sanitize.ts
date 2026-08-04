import DOMPurify from "dompurify";

const ALLOWED_URI_REGEXP = /^(?:https?|data:image\/|data:video\/|blob:|r2:\/\/|mailto:)/i;

const ALLOWED_IFRAME_HOSTS = [
  "www.youtube.com",
  "youtube.com",
  "player.vimeo.com",
  "vimeo.com",
  "drive.google.com",
];

/**
 * Sanitize HTML output using DOMPurify.
 * Strips <script>, event handlers, and only allows safe iframe sources.
 */
export function sanitizeHTML(html: string): string {
  if (!html) return "";

  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "h1", "h2", "h3", "h4", "h5", "h6",
      "p", "br", "hr", "div", "span",
      "strong", "em", "b", "i", "u", "s", "del", "sub", "sup", "mark",
      "ul", "ol", "li",
      "blockquote", "pre", "code",
      "a", "img", "video", "source", "iframe",
      "table", "thead", "tbody", "tr", "th", "td",
      "figure", "figcaption",
      "input", // for task lists
    ],
    ALLOWED_ATTR: [
      "href", "target", "rel", "src", "alt", "width", "height",
      "style", "class", "data-*", "type", "checked", "disabled",
      "colspan", "rowspan", "controls", "autoplay", "muted", "loop",
      "frameborder", "allowfullscreen", "allow", "loading",
      "data-type", "data-color", "data-indent", "data-line-spacing",
      "data-font-family", "data-font-size", "data-storage-url",
    ],
    ALLOWED_URI_REGEXP,
    ADD_TAGS: ["iframe"],
    CUSTOM_ELEMENT_HANDLING: {
      tagNameCheck: /^$/,
      attributeNameCheck: /^$/,
      allowCustomizedBuiltInElements: false,
    },
  });

  // Post-process: remove iframes that aren't from allowed hosts
  const div = document.createElement("div");
  div.innerHTML = clean;
  const iframes = div.querySelectorAll("iframe");
  iframes.forEach((iframe) => {
    try {
      const src = iframe.getAttribute("src") || "";
      const url = new URL(src);
      if (!ALLOWED_IFRAME_HOSTS.includes(url.hostname)) {
        iframe.remove();
      }
    } catch {
      iframe.remove();
    }
  });

  return div.innerHTML;
}
