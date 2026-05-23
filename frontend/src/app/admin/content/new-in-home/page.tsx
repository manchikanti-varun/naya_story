import { redirect } from "next/navigation";
import { homepageSectionEditUrl } from "@/lib/admin/homepage-edit";

export default function LegacyNewInHomeRedirect() {
  redirect(homepageSectionEditUrl("newIn"));
}
