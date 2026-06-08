import crypto from "node:crypto";
import type { Request, Response } from "express";
import { claimWebhookEvent } from "../lib/webhookIdempotency.js";

function razorpayExternalId(body: unknown, raw: Buffer): string {
  const b = body as {
    event?: string;
    payload?: {
      payment?: { entity?: { id?: string } };
      order?: { entity?: { id?: string } };
    };
  };
  const id =
    b.payload?.payment?.entity?.id ??
    b.payload?.order?.entity?.id ??
    (b.event ? `${b.event}` : null);
  if (id && !id.startsWith("evt_")) return String(id);
  return crypto.createHash("sha256").update(raw).digest("hex");
}

/**
 * Razorpay webhook — requires `express.json({ verify })` so `req.rawBody` is populated.
 * Idempotent using payment/order id when present, otherwise SHA-256 of raw body.
 */
export async function razorpayWebhookHandler(req: Request, res: Response): Promise<void> {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim();
  if (!secret) {
    res.status(503).json({ message: "Razorpay webhooks are not configured on this server." });
    return;
  }

  const sig = req.headers["x-razorpay-signature"];
  if (typeof sig !== "string" || !sig) {
    res.status(400).json({ message: "Missing X-Razorpay-Signature header" });
    return;
  }

  const raw = req.rawBody;
  if (!Buffer.isBuffer(raw)) {
    res.status(400).json({ message: "Could not verify webhook body" });
    return;
  }

  const expected = crypto.createHmac("sha256", secret).update(raw).digest("hex");
  // Use timing-safe comparison to prevent timing attacks on signature verification
  if (
    expected.length !== sig.length ||
    !crypto.timingSafeEqual(Buffer.from(expected, "utf8"), Buffer.from(sig, "utf8"))
  ) {
    res.status(400).json({ message: "Invalid Razorpay webhook signature" });
    return;
  }

  const externalId = razorpayExternalId(req.body, raw);
  const eventType = (req.body as { event?: string })?.event;

  try {
    const status = await claimWebhookEvent("razorpay", externalId, eventType);
    if (status === "duplicate") {
      res.status(200).json({ received: true, duplicate: true, id: externalId });
      return;
    }
  } catch (err) {
    console.error(
      JSON.stringify({
        level: "error",
        msg: "razorpay_webhook_idempotency",
        requestId: req.requestId,
        error: String(err),
      }),
    );
    res.status(500).json({ message: "Webhook persistence failed" });
    return;
  }

  console.log(
    JSON.stringify({
      level: "info",
      msg: "razorpay_webhook",
      event: eventType,
      id: externalId,
      requestId: req.requestId,
    }),
  );

  res.status(200).json({ received: true, id: externalId });
}
