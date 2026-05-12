"use client";

import { ProductEditor } from "@/components/admin/ProductEditor";
import { useAuth } from "@/context/auth-context";

export default function AdminNewProductPage() {
  const { token } = useAuth();
  if (!token) return null;
  return <ProductEditor productId={null} token={token} />;
}
