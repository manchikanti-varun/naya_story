import { redirect } from "next/navigation";
import { websitePagesUrl } from "@/lib/admin/website-pages";

export default function LegacyNewsletterRedirect() {
  redirect(websitePagesUrl("homepage", { edit: "newsletter" }));
}
