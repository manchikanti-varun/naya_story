/**
 * Email service — provider abstraction for sending transactional emails.
 *
 * Supported providers: console (dev), resend (production).
 * Configure via EMAIL_PROVIDER and RESEND_API_KEY env vars.
 */
import { logger } from "../lib/logger.js";

export type EmailPayload = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
};

export type EmailProvider = {
  send(payload: EmailPayload): Promise<{ success: boolean; messageId?: string }>;
};

/** Console provider — logs emails to stdout (development). */
const consoleProvider: EmailProvider = {
  async send(payload) {
    logger.info("email_sent_console", {
      to: payload.to,
      subject: payload.subject,
      preview: (payload.text?.slice(0, 100) ?? payload.html.slice(0, 100)),
    });
    return { success: true, messageId: `console-${Date.now()}` };
  },
};

/** Resend provider — production transactional emails (https://resend.com). */
function createResendProvider(): EmailProvider {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    logger.warn("email_resend_missing_key", { message: "RESEND_API_KEY not set, falling back to console." });
    return consoleProvider;
  }

  const fromAddress = process.env.EMAIL_FROM ?? "Naya Story <orders@nayastory.com>";

  return {
    async send(payload) {
      const body = {
        from: payload.from ?? fromAddress,
        to: [payload.to],
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
        reply_to: payload.replyTo,
      };

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorText = await res.text();
        logger.error("email_resend_failed", {
          status: res.status,
          body: errorText.slice(0, 500),
          to: payload.to,
          subject: payload.subject,
        });
        return { success: false };
      }

      const data = (await res.json()) as { id?: string };
      logger.info("email_sent", {
        provider: "resend",
        to: payload.to,
        subject: payload.subject,
        messageId: data.id,
      });
      return { success: true, messageId: data.id };
    },
  };
}

let _provider: EmailProvider | null = null;

function getProvider(): EmailProvider {
  if (_provider) return _provider;

  const provider = process.env.EMAIL_PROVIDER ?? "console";

  switch (provider) {
    case "resend":
      _provider = createResendProvider();
      break;
    case "console":
    default:
      _provider = consoleProvider;
      break;
  }

  return _provider;
}

export const emailService = {
  async send(payload: EmailPayload) {
    const provider = getProvider();
    try {
      return await provider.send(payload);
    } catch (err) {
      logger.error("email_send_error", {
        to: payload.to,
        subject: payload.subject,
        error: (err as Error).message,
      });
      return { success: false };
    }
  },

  /** Send order confirmation email. */
  async sendOrderConfirmation(
    to: string,
    customerName: string,
    orderNumber: string,
    total: number,
    items: Array<{ name: string; quantity: number; unitPrice: number }>,
  ) {
    const itemRows = items
      .map(
        (i) =>
          `<tr><td style="padding:8px 0;border-bottom:1px solid #f5f5f5">${i.name}</td><td style="padding:8px 0;border-bottom:1px solid #f5f5f5;text-align:center">${i.quantity}</td><td style="padding:8px 0;border-bottom:1px solid #f5f5f5;text-align:right">\u20B9${(i.unitPrice * i.quantity).toLocaleString("en-IN")}</td></tr>`,
      )
      .join("");

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;padding:40px 20px;color:#1a1a1a">
  <div style="text-align:center;margin-bottom:32px">
    <h1 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;font-weight:400;margin:0;color:#1a1a1a">Order Confirmed</h1>
    <p style="color:#666;font-size:14px;margin-top:8px">Thank you for shopping with Naya Story</p>
  </div>

  <div style="background:#fafaf8;border-radius:12px;padding:24px;margin-bottom:24px">
    <p style="margin:0 0 4px;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;color:#999">Order number</p>
    <p style="margin:0;font-size:18px;font-weight:500;color:#C9A84C">#${orderNumber}</p>
  </div>

  <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:24px">
    <thead>
      <tr style="border-bottom:2px solid #eee">
        <th style="padding:8px 0;text-align:left;font-weight:500">Item</th>
        <th style="padding:8px 0;text-align:center;font-weight:500">Qty</th>
        <th style="padding:8px 0;text-align:right;font-weight:500">Amount</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
    <tfoot>
      <tr>
        <td colspan="2" style="padding:12px 0;font-weight:600">Total</td>
        <td style="padding:12px 0;text-align:right;font-weight:600">\u20B9${total.toLocaleString("en-IN")}</td>
      </tr>
    </tfoot>
  </table>

  <div style="background:#fafaf8;border-radius:12px;padding:20px;margin-bottom:24px;font-size:13px;color:#666">
    <p style="margin:0 0 8px"><strong>Estimated delivery:</strong> 5\u20137 business days</p>
    <p style="margin:0">Track your order anytime from your account.</p>
  </div>

  <p style="font-size:12px;color:#999;text-align:center;margin-top:40px">
    Naya Story \u2014 Luxury Women\u2019s Fashion<br>
    Questions? Reply to this email or reach us at support@nayastory.com
  </p>
</body>
</html>`.trim();

    return this.send({
      to,
      subject: `Order confirmed \u2014 #${orderNumber}`,
      html,
      text: `Hi ${customerName},\n\nYour order #${orderNumber} has been confirmed.\nTotal: \u20B9${total.toLocaleString("en-IN")}\nEstimated delivery: 5\u20137 business days.\n\nThank you for shopping with Naya Story.`,
    });
  },

  /** Send shipping notification email. */
  async sendShippingNotification(
    to: string,
    customerName: string,
    orderNumber: string,
    trackingNumber?: string,
    carrier?: string,
  ) {
    const trackingLine = trackingNumber
      ? `<p style="margin:8px 0"><strong>Tracking:</strong> ${trackingNumber}${carrier ? ` (${carrier})` : ""}</p>`
      : "";

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;padding:40px 20px;color:#1a1a1a">
  <div style="text-align:center;margin-bottom:32px">
    <h1 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;font-weight:400;margin:0">Your order is on its way</h1>
  </div>

  <div style="background:#fafaf8;border-radius:12px;padding:24px;margin-bottom:24px">
    <p style="margin:0 0 4px;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;color:#999">Order number</p>
    <p style="margin:0;font-size:18px;font-weight:500;color:#C9A84C">#${orderNumber}</p>
    ${trackingLine}
  </div>

  <p style="font-size:14px;color:#444;line-height:1.6">
    Hi ${customerName},<br><br>
    Great news \u2014 your order has been shipped and is making its way to you.
    You can expect delivery within 3\u20135 business days.
  </p>

  <p style="font-size:12px;color:#999;text-align:center;margin-top:40px">
    Naya Story \u2014 Luxury Women\u2019s Fashion
  </p>
</body>
</html>`.trim();

    return this.send({
      to,
      subject: `Your order #${orderNumber} has shipped`,
      html,
      text: `Hi ${customerName},\n\nYour order #${orderNumber} has been shipped.${trackingNumber ? `\nTracking: ${trackingNumber}${carrier ? ` (${carrier})` : ""}` : ""}\nExpected delivery: 3\u20135 business days.\n\nNaya Story`,
    });
  },

  /** Send invoice email to customer. */
  async sendInvoiceEmail(
    to: string,
    customerName: string,
    orderNumber: string,
    invoiceHtml: string,
  ) {
    return this.send({
      to,
      subject: `Your Invoice for Order ${orderNumber} \u2014 Naya Story`,
      html: invoiceHtml,
      text: `Hi ${customerName},\n\nThank you for your order ${orderNumber}. Your GST invoice is attached below.\n\nNaya Story`,
    });
  },
};
