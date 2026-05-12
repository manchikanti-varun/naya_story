"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/auth-context";

type Customer = { _id: string; name: string; email: string; createdAt: string };

export default function AdminCustomersPage() {
  const { token } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    if (!token) return;
    void (async () => {
      try {
        const data = await apiFetch<{ customers: Customer[] }>("/admin/customers", {
          token,
        });
        setCustomers(data.customers);
      } catch {
        setCustomers([]);
      }
    })();
  }, [token]);

  return (
    <div className="space-y-10">
      <header>
        <p className="font-sans text-xs uppercase tracking-[0.3em] text-slate-400">Community</p>
        <h1 className="mt-3 font-display text-4xl text-slate-900">Customers</h1>
      </header>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.16em] text-slate-400">
            <tr>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4 text-right">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-600">
            {customers.map((c) => (
              <tr key={c._id}>
                <td className="px-6 py-4 font-medium text-slate-900">{c.name}</td>
                <td className="px-6 py-4">{c.email}</td>
                <td className="px-6 py-4 text-right text-xs text-slate-400">
                  {new Date(c.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
