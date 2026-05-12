import { Suspense } from "react";
import { NewInEditorial } from "@/components/shop/NewInEditorial";

export default function NewInPage() {
  return (
    <Suspense fallback={<NewInFallback />}>
      <NewInEditorial />
    </Suspense>
  );
}

function NewInFallback() {
  return (
    <div className="px-6 py-24 md:px-10">
      <p className="font-sans text-sm text-ink-muted">Opening the latest editorial...</p>
    </div>
  );
}
