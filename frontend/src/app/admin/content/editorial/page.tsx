import { redirect } from "next/navigation";
import { websitePagesUrl } from "@/lib/admin/website-pages";

export default function LegacyEditorialRedirect() {
  redirect(websitePagesUrl("homepage", { edit: "brandStory" }));
}
