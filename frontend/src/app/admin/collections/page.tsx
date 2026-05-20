import { redirect } from "next/navigation";

export default function AdminCollectionsRedirectPage() {
  redirect("/admin/website/pages?tab=collections-browse");
}
