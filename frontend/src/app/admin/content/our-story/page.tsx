import { redirect } from "next/navigation";

export default function LegacyOurStoryRedirect() {
  redirect("/admin/website/pages?tab=our-story");
}
