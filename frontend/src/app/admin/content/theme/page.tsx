import { redirect } from "next/navigation";

export default function LegacyThemeRedirect() {
  redirect("/admin/website/theme");
}
