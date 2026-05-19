import { redirect } from "next/navigation";

export default function CatalogCollectionsRedirectPage() {
  redirect("/admin/content/collections");
}
