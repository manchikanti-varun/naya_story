import { redirect } from "next/navigation";

export default function LegacyCollectionsRedirect() {
  redirect("/admin/website/pages?tab=collections-browse");
}
