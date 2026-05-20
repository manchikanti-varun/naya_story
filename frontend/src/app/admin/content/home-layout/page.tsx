import { redirect } from "next/navigation";
import { websitePagesUrl } from "@/lib/admin/website-pages";

export default function LegacyHomeLayoutRedirect() {
  redirect(websitePagesUrl("homepage"));
}
