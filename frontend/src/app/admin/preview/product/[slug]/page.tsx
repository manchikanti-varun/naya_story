"use client";

import { use } from "react";
import { ProductDetail } from "@/components/shop/ProductDetail";
import { useAuth } from "@/context/auth-context";

type Props = { params: Promise<{ slug: string }> };

export default function AdminProductPreviewPage({ params }: Props) {
  const { slug } = use(params);
  const { token } = useAuth();
  return <ProductDetail slug={slug} adminPreviewToken={token} />;
}
