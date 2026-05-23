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
};

export type StorefrontSettings = {
  pdpSuggestedMode?: PdpSuggestedMode;
  sizeGuide?: SizeGuideConfig;
};

export const DEFAULT_SIZE_GUIDE: SizeGuideConfig = {
  title: "Size chart",
  subtitle: "Measurements in centimetres. Between sizes? We recommend sizing up.",
  columns: [
    { id: "size", label: "Size" },
    { id: "bust", label: "Bust" },
    { id: "waist", label: "Waist" },
    { id: "hip", label: "Hip" },
  ],
  rows: [
    { size: "XS", bust: "80", waist: "62", hip: "88" },
    { size: "S", bust: "84", waist: "66", hip: "92" },
    { size: "M", bust: "88", waist: "70", hip: "96" },
    { size: "L", bust: "92", waist: "74", hip: "100" },
    { size: "XL", bust: "96", waist: "78", hip: "104" },
  ],
};

export const DEFAULT_STOREFRONT_SETTINGS: StorefrontSettings = {
  pdpSuggestedMode: "auto",
  sizeGuide: DEFAULT_SIZE_GUIDE,
};
