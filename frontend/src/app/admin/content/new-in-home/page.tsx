import { redirect } from "next/navigation";
import { websitePagesUrl } from "@/lib/admin/website-pages";

export default function LegacyNewInHomeRedirect() {
  redirect(websitePagesUrl("homepage", { edit: "newIn" }));
}
