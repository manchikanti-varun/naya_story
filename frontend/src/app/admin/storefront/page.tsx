import { redirect } from "next/navigation";

export default function LegacyStorefrontRedirect() {
  redirect("/admin/website");
}
