import { redirect } from "next/navigation";
import { homepageSectionEditUrl } from "@/lib/admin/homepage-edit";

export default function CatalogCategoriesRedirectPage() {
  redirect(homepageSectionEditUrl("categories"));
}
