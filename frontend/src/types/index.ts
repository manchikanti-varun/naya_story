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
  status: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  shippingAddress: Address;
  trackingNumber?: string;
  timeline?: { status: string; at: string }[];
  createdAt: string;
};
