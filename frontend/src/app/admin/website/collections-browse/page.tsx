import { redirect } from "next/navigation";

/** Alias — collections browse editor lives under Website → Pages */
export default function WebsiteCollectionsBrowseRedirect() {
  redirect("/admin/website/pages?tab=collections-browse");
}
