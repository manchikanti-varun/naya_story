import { redirect } from "next/navigation";

export default function LegacyNavigationRedirect() {
  redirect("/admin/website/navigation");
}
