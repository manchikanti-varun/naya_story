export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-section md:px-10">
      <p className="font-sans text-[10px] uppercase tracking-[0.34em] text-gold">Policies</p>
      <h1 className="mt-6 font-display text-4xl text-ink">Privacy</h1>
      <div className="mt-10 space-y-6 font-sans text-sm leading-relaxed text-ink-muted">
        <p>
          We collect only what is required to fulfill orders — contact details, shipping
          addresses, and stylistic preferences you volunteer.
        </p>
        <p>
          Payment instruments never touch our servers when Stripe or Razorpay is configured;
          tokens are exchanged directly with providers over TLS.
        </p>
        <p>
          You may request deletion of personal data by emailing privacy@nayastory.com unless
          accounting statutes require retention.
        </p>
      </div>
    </div>
  );
}
