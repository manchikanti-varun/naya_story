/**
 * Email service — provider abstraction for sending transactional emails.
 *
 * Swap the provider implementation by changing the `sendEmail` function.
 * Supported providers: console (dev), SMTP, SendGrid, Resend, AWS SES.
 * Configure via EMAIL_PROVIDER env var.
 */

export type EmailPayload = {
  to: string;
  subject: string;
  html: string;
  text?: string;
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
    console.log(`[Email] To: ${payload.to} | Subject: ${payload.subject}`);
    console.log(`[Email] Body preview: ${payload.text?.slice(0, 200) ?? payload.html.slice(0, 200)}`);
    return { success: true, messageId: `console-${Date.now()}` };
  },
};

function getProvider(): EmailProvider {
  const provider = process.env.EMAIL_PROVIDER ?? "console";

  switch (provider) {
    case "console":
      return consoleProvider;
    // Future: add "sendgrid", "resend", "ses" implementations here.
    default:
      console.warn(`[Email] Unknown provider "${provider}", falling back to console.`);
      return consoleProvider;
  }
}

export const emailService = {
  async send(payload: EmailPayload) {
    const provider = getProvider();
    try {
      return await provider.send(payload);
    } catch (err) {
      console.error("[Email] Send failed:", (err as Error).message);
      return { success: false };
    }
  },

  /**
   * Send invoice email to customer after successful payment.
   */
  async sendInvoiceEmail(
    to: string,
    customerName: string,
    orderNumber: string,
    invoiceHtml: string,
  ) {
    return this.send({
      to,
      subject: `Your Invoice for Order ${orderNumber} — Naya Studio`,
      html: invoiceHtml,
      text: `Hi ${customerName},\n\nThank you for your order ${orderNumber}. Your GST invoice is attached below.\n\nNaya Studio`,
    });
  },
};
