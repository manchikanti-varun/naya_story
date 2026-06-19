"use client";

import { useCallback, useEffect, useState } from "react";
import { IndianRupee, Truck } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { AdminPageLayout } from "@/components/admin/ui/AdminPageLayout";
import { AdminCard } from "@/components/admin/ui/AdminCard";
import { useToast } from "@/components/admin/ui/AdminToast";

type PaymentMethodConfig = {
  codEnabled: boolean;
  razorpayEnabled: boolean;
};

export default function AdminPaymentsPage() {
  const { token } = useAuth();
  const toast = useToast();
  const [config, setConfig] = useState<PaymentMethodConfig>({
    codEnabled: false,
    razorpayEnabled: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = useCallback(async () => {
    if (!token) return;
    try {
      const data = await apiFetch<{ settings: { storefront?: { paymentMethods?: PaymentMethodConfig } } }>(
        "/content/site",
        { token },
      );
      const pm = data.settings?.storefront?.paymentMethods;
      if (pm) {
        setConfig({
          codEnabled: pm.codEnabled ?? false,
          razorpayEnabled: pm.razorpayEnabled ?? true,
        });
      }
    } catch { /* use defaults */ }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { void fetchSettings(); }, [fetchSettings]);

  async function saveConfig(updated: PaymentMethodConfig) {
    if (!token) return;
    setSaving(true);
    try {
      await apiFetch("/content/site", {
        method: "PUT",
        token,
        body: JSON.stringify({
          storefront: { paymentMethods: updated },
        }),
      });
      setConfig(updated);
      toast.success("Payment settings saved");
    } catch (e) {
      toast.error((e as Error).message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  function toggle(key: keyof PaymentMethodConfig) {
    const updated = { ...config, [key]: !config[key] };
    setConfig(updated);
    void saveConfig(updated);
  }

  if (loading) {
    return (
      <AdminPageLayout title="Payment Methods" description="Configure which payment options are available at checkout">
        <div className="animate-pulse space-y-4">
          <div className="h-20 rounded-xl bg-[var(--admin-surface-sunken)]" />
          <div className="h-20 rounded-xl bg-[var(--admin-surface-sunken)]" />
        </div>
      </AdminPageLayout>
    );
  }

  return (
    <AdminPageLayout
      title="Payment Methods"
      description="Enable or disable payment options for your storefront checkout"
    >
      <div className="space-y-4">
        <PaymentToggle
          icon={<IndianRupee className="h-5 w-5" />}
          title="Razorpay"
          description="UPI (GPay, PhonePe, Paytm), Cards (Visa, Mastercard, RuPay, Amex), Netbanking, Wallets, No-cost EMI"
          enabled={config.razorpayEnabled}
          onToggle={() => toggle("razorpayEnabled")}
          saving={saving}
        />

        <PaymentToggle
          icon={<Truck className="h-5 w-5" />}
          title="Cash on Delivery (COD)"
          description="Customer pays when the order is delivered. Order stays pending until admin marks it paid."
          enabled={config.codEnabled}
          onToggle={() => toggle("codEnabled")}
          saving={saving}
        />
      </div>

      <div className="mt-8 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface-sunken)] p-4">
        <p className="text-xs font-medium text-[var(--admin-ink)]">How it works</p>
        <ul className="mt-2 space-y-1 text-xs text-[var(--admin-muted)]">
          <li>• Enabled methods appear as options during checkout.</li>
          <li>• Razorpay requires RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET configured in environment variables.</li>
          <li>• COD orders are created with payment status &ldquo;Pending&rdquo; — mark as &ldquo;Paid&rdquo; after delivery confirmation.</li>
          <li>• Disabling a method hides it from new checkouts but doesn&apos;t affect existing orders.</li>
        </ul>
      </div>
    </AdminPageLayout>
  );
}

function PaymentToggle({
  icon,
  title,
  description,
  enabled,
  onToggle,
  saving,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
  saving: boolean;
}) {
  return (
    <AdminCard elevated padding="md">
      <div className="flex items-center gap-4">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${enabled ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-400"}`}>
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-sans text-sm font-semibold text-[var(--admin-ink)]">{title}</p>
          <p className="mt-0.5 text-xs text-[var(--admin-muted)]">{description}</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          disabled={saving}
          onClick={onToggle}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${enabled ? "bg-emerald-600" : "bg-gray-200"} ${saving ? "opacity-50" : ""}`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${enabled ? "translate-x-5" : "translate-x-0"}`}
          />
        </button>
      </div>
    </AdminCard>
  );
}
