"use client";

import { use } from "react";
import { ProductEditor } from "@/components/admin/ProductEditor";
import { useAuth } from "@/context/auth-context";

type Props = { params: Promise<{ id: string }> };

export default function AdminEditProductPage({ params }: Props) {
  const { id } = use(params);
  const { token } = useAuth();
  if (!token) return null;
  return <ProductEditor productId={id} token={token} />;
}
