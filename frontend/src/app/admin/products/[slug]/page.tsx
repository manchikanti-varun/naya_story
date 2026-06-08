"use client";

import { use } from "react";
import { ProductEditor } from "@/components/admin/ProductEditor";
import { useAuth } from "@/context/auth-context";

type Props = { params: Promise<{ slug: string }> };

export default function AdminEditProductPage({ params }: Props) {
  const { slug } = use(params);
  const { token } = useAuth();
  if (!token) return null;
  return <ProductEditor productSlug={slug} token={token} />;
}
