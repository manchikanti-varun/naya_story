import mongoose from "mongoose";

const OrderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    name: String,
    sku: String,
    size: String,
    color: String,
    quantity: Number,
    unitPrice: Number,
    image: String,
  },
  { _id: false },
);

const TimelineSchema = new mongoose.Schema(
  {
    status: String,
    at: { type: Date, default: Date.now },
  },
  { _id: false },
);

const AddressSchema = new mongoose.Schema(
  {
    line1: String,
    line2: String,
    city: String,
    state: String,
    postalCode: String,
    country: String,
  },
  { _id: false },
);

const OrderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    guestEmail: String,
    status: {
      type: String,
      enum: ["pending", "confirmed", "packed", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
    items: [OrderItemSchema],
    subtotal: Number,
    shipping: Number,
    discount: Number,
    total: Number,
    couponCode: String,
    shippingAddress: AddressSchema,
    trackingNumber: String,
    timeline: [TimelineSchema],
    paymentProvider: String,
    paymentReference: String,
  },
  { timestamps: true },
);

export const Order =
  mongoose.models.Order || mongoose.model("Order", OrderSchema);
