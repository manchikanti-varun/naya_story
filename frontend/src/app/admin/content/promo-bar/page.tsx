import { redirect } from "next/navigation";

export default function LegacyPromoBarRedirect() {
  redirect("/admin/website/announcement-bar");
}
