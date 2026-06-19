import mongoose from "mongoose";

const AddressSchema = new mongoose.Schema(
  {
    line1: { type: String, required: true },
    line2: String,
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
  },
  { _id: false },
);

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String },
    name: { type: String, required: true },
    phone: { type: String },
    googleId: { type: String, sparse: true },
    /** Firebase UID for phone-authenticated users. */
    firebaseUid: { type: String, sparse: true },
    role: { type: String, enum: ["customer", "admin"], default: "customer" },
    /**
     * Wishlist is capped at 50 items to prevent unbounded document growth.
     * The validate function rejects pushes beyond the limit.
     */
    wishlist: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
      validate: {
        validator: function (val: unknown[]) {
          return val.length <= 50;
        },
        message: "Wishlist cannot exceed 50 items.",
      },
    },
    addresses: {
      type: [AddressSchema],
      validate: {
        validator: function (val: unknown[]) {
          return val.length <= 10;
        },
        message: "Maximum 10 saved addresses allowed.",
      },
    },
    /** Server-side cart for cross-device sync. Overwritten entirely on each save. */
    cart: {
      lines: { type: [mongoose.Schema.Types.Mixed], default: () => [] },
      coupon: { type: String, default: "" },
      updatedAt: { type: Date },
    },
  },
  { timestamps: true },
);

export type UserDoc = mongoose.InferSchemaType<typeof UserSchema> & {
  _id: mongoose.Types.ObjectId;
};

/** Maximum allowed wishlist items. Enforced at application + schema level. */
export const MAX_WISHLIST_ITEMS = 50;

export const User =
  mongoose.models.User || mongoose.model("User", UserSchema);
