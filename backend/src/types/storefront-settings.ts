export type PdpSuggestedMode =
  | "auto"
  | "collection"
  | "category"
  | "bestsellers"
  | "newIn"
  | "all";

export type SizeGuideColumn = {
  id: string;
  label: string;
};

export type SizeGuideRow = {
  size: string;
  [key: string]: string;
};

export type SizeGuideConfig = {
  title?: string;
  subtitle?: string;
  columns: SizeGuideColumn[];
  rows: SizeGuideRow[];
  inchColumns?: SizeGuideColumn[];
  inchRows?: SizeGuideRow[];
  defaultUnit?: "cm" | "inch";
};

export type StorefrontSettings = {
  pdpSuggestedMode?: PdpSuggestedMode;
  sizeGuide?: SizeGuideConfig;
};
