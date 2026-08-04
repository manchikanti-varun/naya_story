import { Node, mergeAttributes } from "@tiptap/core";
import { toEmbeddableIframeSrc, isDirectVideoUrl } from "../utils/embed";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    video: {
      setVideo: (attrs: { src: string; storageUrl?: string }) => ReturnType;
    };
  }
}

/**
 * Video node extension.
 * Handles direct video files and embedded iframes (YouTube/Vimeo/Drive).
 */
export const Video = Node.create({
  name: "video",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      src: { default: null },
      storageUrl: { default: null },
      width: { default: "100%" },
      height: { default: "auto" },
      align: { default: "center" },
    };
  },

  parseHTML() {
    return [
      { tag: "video[src]" },
      {
        tag: "iframe",
        getAttrs: (dom) => {
          const src = (dom as HTMLElement).getAttribute("src") || "";
          const embedUrl = toEmbeddableIframeSrc(src);
          if (embedUrl || src.includes("youtube") || src.includes("vimeo") || src.includes("drive.google")) {
            return { src };
          }
          return false;
        },
      },
      {
        tag: "div[data-video-embed]",
        getAttrs: (dom) => ({ src: (dom as HTMLElement).getAttribute("data-src") }),
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const src = HTMLAttributes.src || "";
    const storageUrl = HTMLAttributes.storageUrl;

    // Direct video
    if (isDirectVideoUrl(src) || src.startsWith("blob:") || src.startsWith("r2://")) {
      const videoSrc = storageUrl || src;
      return [
        "div",
        { class: "rte-video-wrapper", style: `text-align: ${HTMLAttributes.align || "center"}` },
        [
          "video",
          mergeAttributes({
            src: videoSrc,
            controls: "true",
            style: `width: ${HTMLAttributes.width}; max-width: 100%;`,
            "data-storage-url": storageUrl || undefined,
          }),
        ],
      ];
    }

    // Embedded iframe (YouTube/Vimeo/Drive)
    const embedUrl = toEmbeddableIframeSrc(src) || src;
    return [
      "div",
      { class: "rte-video-wrapper", style: `text-align: ${HTMLAttributes.align || "center"}` },
      [
        "iframe",
        mergeAttributes({
          src: embedUrl,
          frameborder: "0",
          allowfullscreen: "true",
          allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
          style: `width: ${HTMLAttributes.width}; aspect-ratio: 16/9; max-width: 100%;`,
          loading: "lazy",
        }),
      ],
    ];
  },

  addCommands() {
    return {
      setVideo:
        (attrs) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs,
          });
        },
    };
  },
});
