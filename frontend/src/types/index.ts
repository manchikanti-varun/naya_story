export type ProductVariant = {
  sku: string;
  size: string;
  color: string;
  stock: number;
};

export type Product = {
  _id: string;
  name: string;
  slug: string;
  shortDescription?: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  taxRate?: number;
  discountPercent?: number;
  category: string;
  subcategory?: string;
  collection?: string;
  tags?: string[];
  images: string[];
  /** Optional label per gallery image (same order as `images`). */
  imageCaptions?: string[];
  hoverImage?: string;
  variants: ProductVariant[];
  material?: string;
  fitType?: string;
  fabricDetails?: string;
  stylingSuggestions?: string;
  /** Overrides default “print placement” line on PDP when non-empty. */
  pdpPrintDisclaimer?: string;
  /** Overrides computed estimated delivery date range line. */
  pdpDeliveryRange?: string;
  /** Overrides “Orders over ₹…” free shipping line. */
  pdpFreeShippingNote?: string;
  /** “Delivery & care” accordion; falls back to site default copy. */
  pdpDeliveryAndCare?: string;
  featured?: boolean;
  bestseller?: boolean;
  trending?: boolean;
  newIn?: boolean;
  newInOrder?: number;
  newInHoverImage?: string;
  newInVisible?: boolean;
  /** false = hidden from storefront */
  storefrontVisible?: boolean;
  /** Admin override for limited-stock banner: "show" | "hide" */
  lowStockDisplay?: "show" | "hide";
  /** Global display order for manual sorting (lower = first). */
  displayOrder?: number;
  /** GST rate as decimal (e.g. 0.05 for 5%). MRP is GST-inclusive. */
  gstRate?: number;
  /** HSN code for GST classification. */
  hsnCode?: string;
};

export type MediaAsset = {
  _id: string;
  url: string;
  name: string;
  tags?: string[];
  category?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type CartLine = {
  productId: string;
  name: string;
  slug: string;
  image: string;
  price: number;
  sku: string;
  size: string;
  color: string;
  quantity: number;
};

export type User = {
  id: string;
  email: string;
  name: string;
  role: "customer" | "admin";
  wishlist?: string[];
};

export type Address = {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

export type OrderItem = {
  productId: string;
  name: string;
  sku: string;
  size: string;
  color: string;
  quantity: number;
  unitPrice: number;
  image?: string;
};

export type Order = {
  _id: string;
  orderNumber: string;
  guestEmail?: string;
  customerName?: string;
  customerPhone?: string;
  status: string;
  paymentStatus?: "paid" | "pending" | "failed";
  paymentProvider?: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  couponCode?: string;
  shippingAddress: Address;
  shippingCarrier?: string;
  trackingNumber?: string;
  timeline?: { status: string; at: string }[];
  invoice?: { invoiceNumber?: string; generatedAt?: string; url?: string };
  createdAt: string;
  /** Populated user reference (from admin queries) */
  user?: { _id: string; name: string; email: string; phone?: string } | string;
};
