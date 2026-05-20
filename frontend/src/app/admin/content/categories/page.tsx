import { redirect } from "next/navigation";
import { websitePagesUrl } from "@/lib/admin/website-pages";

export default function LegacyCategoriesRedirect() {
  redirect(websitePagesUrl("homepage", { edit: "categories" }));
}
