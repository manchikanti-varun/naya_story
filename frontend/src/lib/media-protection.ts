import type { SyntheticEvent } from "react";

/** Discourages casual save-image / drag; does not hide URLs from DevTools (not technically possible in-browser). */
export function suppressImageContextMenu(e: SyntheticEvent) {
  e.preventDefault();
}

export const storefrontImageProps = {
  draggable: false as const,
  referrerPolicy: "no-referrer" as const,
  onContextMenu: suppressImageContextMenu,
};

export const storefrontImageShellClass =
  "select-none [-webkit-user-drag:none] [&_img]:pointer-events-auto";
