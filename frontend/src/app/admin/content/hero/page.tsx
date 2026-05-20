import { redirect } from "next/navigation";
import { websitePagesUrl } from "@/lib/admin/website-pages";

export default function LegacyHeroRedirect() {
  redirect(websitePagesUrl("homepage", { edit: "hero" }));
}
