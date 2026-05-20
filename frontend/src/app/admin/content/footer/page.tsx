import { redirect } from "next/navigation";

export default function LegacyFooterRedirect() {
  redirect("/admin/website/footer");
}
