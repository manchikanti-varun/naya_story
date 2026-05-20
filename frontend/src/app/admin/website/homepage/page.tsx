import { redirect } from "next/navigation";
import { websitePagesUrl } from "@/lib/admin/website-pages";

export default function WebsiteHomepageRedirect() {
  redirect(websitePagesUrl("homepage"));
}
