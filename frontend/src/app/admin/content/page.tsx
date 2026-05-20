import { redirect } from "next/navigation";
import { websitePagesUrl } from "@/lib/admin/website-pages";

export default function LegacyContentRedirect() {
  redirect(websitePagesUrl("homepage"));
}
