import { HomepageEditorProvider } from "@/components/admin/homepage-editor/context";

export default function StorefrontHomepageLayout({ children }: { children: React.ReactNode }) {
  return <HomepageEditorProvider>{children}</HomepageEditorProvider>;
}
