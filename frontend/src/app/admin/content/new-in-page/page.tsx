import { redirect } from "next/navigation";

export default function LegacyNewInPageRedirect() {
  redirect("/admin/website/pages?tab=new-in");
}
