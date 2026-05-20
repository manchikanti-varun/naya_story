import mongoose from "mongoose";

const VariantSchema = new mongoose.Schema(
  {
    sku: { type: String, required: true },
    size: { type: String, required: true },
    color: { type: String, required: true },
    stock: { type: Number, required: true, default: 0 },
  },
  { _id: false },
);

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    shortDescription: String,
    description: { type: String, required: true },
    price: { type: Number, required: true },
    compareAtPrice: Number,
    taxRate: { type: Number, default: 0 },
    discountPercent: { type: Number, default: 0 },
    category: { type: String, required: true },
    subcategory: String,
    collection: String,
    tags: [{ type: String }],
    images: [{ type: String, required: true }],
    hoverImage: String,
    variants: [VariantSchema],
    material: String,
    fitType: String,
    fabricDetails: String,
    stylingSuggestions: String,
    /** Center PDP line under story (replaces default print disclaimer when set). */
    pdpPrintDisclaimer: String,
    /** Second line under “Estimated delivery” (default: computed range). */
    pdpDeliveryRange: String,
    /** Second line under “Free shipping” (default: threshold from store rules). */
    pdpFreeShippingNote: String,
    /** “Delivery & care” accordion body (default: generic shipping + care copy). */
    pdpDeliveryAndCare: String,
    featured: { type: Boolean, default: false },
    bestseller: { type: Boolean, default: false },
    trending: { type: Boolean, default: false },
    newIn: { type: Boolean, default: false },
    newInOrder: { type: Number, default: 0 },
    newInHoverImage: String,
    newInVisible: { type: Boolean, default: true },
    /** When false, product is hidden from storefront lists and slug page (admins can still preview). */
    storefrontVisible: { type: Boolean, default: true },
  },
  { timestamps: true },
);

ProductSchema.index({ name: "text", description: "text", shortDescription: "text", tags: "text", collection: "text" });
ProductSchema.index({ storefrontVisible: 1, category: 1, createdAt: -1 });
ProductSchema.index({ storefrontVisible: 1, bestseller: -1, featured: -1 });
ProductSchema.index({ storefrontVisible: 1, newIn: -1, newInOrder: 1 });

export const Product =
  mongoose.models.Product || mongoose.model("Product", ProductSchema);
