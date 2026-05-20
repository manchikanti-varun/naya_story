import { redirect } from "next/navigation";

export default function CatalogCollectionsRedirectPage() {
  redirect("/admin/website/pages?tab=collections-browse");
}
