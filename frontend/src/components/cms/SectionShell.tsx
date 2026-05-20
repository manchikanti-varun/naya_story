import type { ReactNode } from "react";
import type { SectionDesign } from "@/types/homepage";
import { sectionDesignClass, sectionDesignStyle } from "@/lib/cms/section-design";
import { cn } from "@/lib/cn";

type Props = {
  id?: string;
  design?: SectionDesign | null;
  className?: string;
  children: ReactNode;
};

/** Wraps existing section markup with optional CMS color/spacing tokens. */
export function SectionShell({ id, design, className, children }: Props) {
  const style = sectionDesignStyle(design);
  if (!id && !design && !className) return <>{children}</>;
  return (
    <div id={id} className={cn(sectionDesignClass(design), className)} style={style}>
      {children}
    </div>
  );
}
