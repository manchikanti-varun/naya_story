import { redirect } from "next/navigation";

export default function CatalogCategoriesRedirectPage() {
  redirect("/admin/content/categories");
}
