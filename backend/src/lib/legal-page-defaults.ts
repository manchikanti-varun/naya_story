export type LegalPageSeed = {
  title: string;
  slug: string;
  body: string;
  order: number;
};

export const defaultLegalPages: LegalPageSeed[] = [
  {
    title: "Terms & Conditions",
    slug: "terms",
    order: 0,
    body: `By placing an order you agree to studio production timelines, dye-lot variance within industry tolerance, and the occasional made-to-order cadence for capsule releases.

Editorial imagery is indicative of styling; slight silhouette adjustments may occur as fits evolve between seasons.

Disputes are governed by the laws of India unless alternate jurisdiction is mutually executed in writing.`,
  },
  {
    title: "Privacy Policy",
    slug: "privacy",
    order: 1,
    body: `We collect only what is required to fulfill orders — contact details, shipping addresses, and stylistic preferences you volunteer.

Payment instruments never touch our servers when Stripe or Razorpay is configured; tokens are exchanged directly with providers over TLS.

You may request deletion of personal data by emailing privacy@nayastory.com unless accounting statutes require retention.`,
  },
  {
    title: "Refund & Cancellation",
    slug: "refund-cancellation",
    order: 2,
    body: `Returns are accepted within 10 days of delivery on unworn garments with hang tags intact. Initiate a return from your account timeline once order tracking shows delivered.

Refunds are processed to the original payment method within 5–7 business days after we receive and inspect the return.

Made-to-order or altered pieces may not be eligible for return unless there is a manufacturing defect.`,
  },
  {
    title: "Shipping & Delivery",
    slug: "shipping",
    order: 3,
    body: `Complimentary express shipping on domestic orders above ₹15,000. Orders below this threshold incur a flat ₹299 studio handling fee.

International shipments are quoted case-by-case once global lanes are connected to your merchant account.

Delivery timelines are estimates; customs or carrier delays may extend transit for international orders.`,
  },
];
