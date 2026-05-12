"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import type { Address } from "@/types";

const empty: Address = {
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "India",
};

export default function AddressesPage() {
  const { token, addresses, setAddresses } = useAuth();
  const [draft, setDraft] = useState<Address>(empty);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (addresses[0]) setDraft(addresses[0]);
    else setDraft(empty);
  }, [addresses]);

  return (
    <div className="space-y-10 rounded-[32px] border border-ivory-deep bg-white/70 p-10 backdrop-blur">
      <div>
        <p className="font-sans text-[10px] uppercase tracking-[0.34em] text-gold">Addresses</p>
        <h1 className="mt-4 font-display text-4xl text-ink">Where we arrive</h1>
      </div>
      <form
        className="grid gap-5 md:grid-cols-2"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!token) return;
          const next = await apiFetch<{ addresses: Address[] }>("/users/addresses", {
            method: "PUT",
            token,
            body: JSON.stringify({ addresses: [draft] }),
          });
          setAddresses(next.addresses);
          setSaved(true);
          setTimeout(() => setSaved(false), 2500);
        }}
      >
        {(["line1", "line2", "city", "state", "postalCode", "country"] as const).map((field) => (
          <label key={field} className="font-sans text-[11px] uppercase tracking-[0.18em] text-ink-soft md:col-span-1">
            {field}
            <input
              value={(draft[field] as string) ?? ""}
              onChange={(e) => setDraft((d) => ({ ...d, [field]: e.target.value }))}
              className="mt-2 w-full rounded-2xl border border-ivory-deep px-4 py-3 font-sans text-sm outline-none focus:ring-2 focus:ring-gold/40"
            />
          </label>
        ))}
        <div className="md:col-span-2">
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="submit"
            className="rounded-full bg-ink px-10 py-3 font-sans text-[11px] uppercase tracking-[0.26em] text-ivory hover:bg-gold"
          >
            Save address
          </motion.button>
          {saved ? (
            <p className="mt-4 font-sans text-xs text-gold">Saved to your profile.</p>
          ) : null}
        </div>
      </form>
    </div>
  );
}
