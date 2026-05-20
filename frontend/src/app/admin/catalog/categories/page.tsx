import { redirect } from "next/navigation";
import { websitePagesUrl } from "@/lib/admin/website-pages";

export default function CatalogCategoriesRedirectPage() {
  redirect(websitePagesUrl("homepage", { edit: "categories" }));
}
