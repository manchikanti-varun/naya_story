export default function ShippingPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-section md:px-10">
      <p className="font-sans text-[10px] uppercase tracking-[0.34em] text-gold">Policies</p>
      <h1 className="mt-6 font-display text-4xl text-ink">Shipping & returns</h1>
      <div className="mt-10 space-y-6 font-sans text-sm leading-relaxed text-ink-muted">
        <p>
          Complimentary express shipping on domestic orders above ₹15,000. Orders below this
          threshold incur a flat ₹299 studio handling fee.
        </p>
        <p>
          International shipments are quoted case-by-case once Shiprocket global lanes are
          connected to your merchant account.
        </p>
        <p>
          Returns are accepted within 10 days of delivery on unworn garments with hang tags intact.
          Initiate a return from your account timeline once order tracking shows delivered.
        </p>
      </div>
    </div>
  );
}
