import mongoose from "mongoose";

const OrderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    sku: { type: String, required: true },
    size: String,
    color: String,
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    image: String,
    /** GST rate at time of purchase (copied from product). */
    gstRate: { type: Number, default: 0.05 },
    /** HSN code at time of purchase (copied from product). */
    hsnCode: { type: String, default: "" },
  },
  { _id: false },
);

const TimelineSchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    at: { type: Date, default: Date.now },
  },
  { _id: false },
);

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

const OrderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    /** Client-generated idempotency key to prevent duplicate order submission. */
    idempotencyKey: { type: String, sparse: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    guestEmail: String,
    status: {
      type: String,
      enum: ["pending", "confirmed", "packed", "shipped", "delivered", "cancelled", "return_requested", "return_approved", "refunded"],
      default: "pending",
    },
    items: { type: [OrderItemSchema], required: true },
    subtotal: { type: Number, required: true, min: 0 },
    shipping: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    couponCode: String,
    shippingAddress: { type: AddressSchema, required: true },
    trackingNumber: String,
    /** Shipping carrier name (e.g. BlueDart, DTDC, Delhivery). */
    shippingCarrier: String,
    timeline: [TimelineSchema],
    paymentProvider: { type: String, enum: ["stripe", "razorpay", "cod"], default: "stripe" },
    paymentReference: String,
    /** Payment status: paid, pending, failed. */
    paymentStatus: { type: String, enum: ["paid", "pending", "failed"], default: "pending" },
    /** Stripe PaymentIntent ID for webhook correlation. */
    stripePaymentIntentId: { type: String, sparse: true },
    /** Razorpay Payment ID for webhook correlation. */
    razorpayPaymentId: { type: String, sparse: true },
    /** Customer phone number for the order. */
    customerPhone: String,
    /** Customer name (for guest orders or snapshot). */
    customerName: String,
    /** Invoice metadata */
    invoice: {
      invoiceNumber: String,
      generatedAt: Date,
      url: String,
    },
    /** Return/refund details */
    returnReason: String,
    returnRequestedAt: Date,
    refundAmount: { type: Number, default: 0 },
    refundId: String,
    refundedAt: Date,
  },
  { timestamps: true },
);

// Query indexes for performance
OrderSchema.index({ user: 1, createdAt: -1 });
OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ guestEmail: 1 }, { sparse: true });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ stripePaymentIntentId: 1 }, { sparse: true });
OrderSchema.index({ razorpayPaymentId: 1 }, { sparse: true });

export const Order =
  mongoose.models.Order || mongoose.model("Order", OrderSchema);
