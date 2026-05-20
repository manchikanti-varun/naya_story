"use client";

import { useHomepageEditor } from "@/components/admin/homepage-editor/context";
import { SectionDesignFields } from "@/components/admin/cms/SectionDesignFields";
import { SectionTypographyFields } from "@/components/admin/cms/SectionTypographyFields";
import { AdminField, AdminInput, AdminTextarea } from "@/components/admin/ui/AdminField";
import { defaultHomepageEditorial } from "@/lib/cms/editorial-defaults";
import type {
  HomepageEditorialConfig,
  HomepageSectionTextKey,
  HomepageStorefrontBlockType,
  SectionDesign,
} from "@/types/homepage";

function Field({
  label,
  value,
  onChange,
  multiline,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  hint?: string;
}) {
  return (
    <AdminField label={label} hint={hint}>
      {multiline ? (
        <AdminTextarea value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <AdminInput value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </AdminField>
  );
}

type Props = {
  focusType?: HomepageStorefrontBlockType;
};

export function ContentEditorEditorialPanel({ focusType }: Props) {
  const { hp, setHp } = useHomepageEditor();
  if (!hp) return null;

  const ed = hp.editorial ?? defaultHomepageEditorial();

  const patch = (key: keyof HomepageEditorialConfig, partial: Record<string, unknown>) => {
    setHp((prev) => {
      if (!prev) return prev;
      const base = prev.editorial ?? defaultHomepageEditorial();
      return {
        ...prev,
        editorial: {
          ...base,
          [key]: { ...base[key], ...partial },
        },
      };
    });
  };

  const show = (type: HomepageStorefrontBlockType) => !focusType || focusType === type;

  const designBlock = (
    key: keyof HomepageEditorialConfig,
    typographySection: HomepageSectionTextKey,
    styles: SectionDesign | undefined,
  ) => (
    <div className="mt-6 space-y-6 border-t border-[var(--admin-border)] pt-6">
      <SectionDesignFields
        value={styles}
        onChange={(next) => patch(key, { styles: next })}
        showTypography
      />
      <SectionTypographyFields section={typographySection} />
    </div>
  );

  return (
    <div className="space-y-8">
      {show("brandStory") ? (
        <section className="admin-cms-panel space-y-4 p-5 sm:p-6">
          <h3 className="admin-cms-kicker">Brand story</h3>
          <Field label="Kicker" value={ed.brandStory.kicker} onChange={(v) => patch("brandStory", { kicker: v })} />
          <Field label="Title" value={ed.brandStory.title} onChange={(v) => patch("brandStory", { title: v })} />
          <Field
            label="Body paragraph 1"
            value={ed.brandStory.body[0] ?? ""}
            onChange={(v) => patch("brandStory", { body: [v, ed.brandStory.body[1] ?? ""] })}
            multiline
          />
          <Field
            label="Body paragraph 2"
            value={ed.brandStory.body[1] ?? ""}
            onChange={(v) => patch("brandStory", { body: [ed.brandStory.body[0] ?? "", v] })}
            multiline
          />
          <Field label="Image URL" value={ed.brandStory.image} onChange={(v) => patch("brandStory", { image: v })} />
          {designBlock("brandStory", "brandStory", ed.brandStory.styles)}
        </section>
      ) : null}

      {show("lookbook") ? (
        <section className="admin-cms-panel space-y-4 p-5 sm:p-6">
          <h3 className="admin-cms-kicker">Lookbook</h3>
          <Field label="Kicker" value={ed.lookbook.kicker} onChange={(v) => patch("lookbook", { kicker: v })} />
          <Field label="Title" value={ed.lookbook.title} onChange={(v) => patch("lookbook", { title: v })} />
          <Field
            label="Subtitle"
            value={ed.lookbook.subtitle}
            onChange={(v) => patch("lookbook", { subtitle: v })}
            multiline
          />
          {designBlock("lookbook", "lookbook", ed.lookbook.styles)}
        </section>
      ) : null}

      {show("craftsmanship") ? (
        <section className="admin-cms-panel space-y-4 p-5 sm:p-6">
          <h3 className="admin-cms-kicker">Fabric & craft</h3>
          <Field
            label="Kicker"
            value={ed.craftsmanship.kicker}
            onChange={(v) => patch("craftsmanship", { kicker: v })}
          />
          <Field
            label="Title"
            value={ed.craftsmanship.title}
            onChange={(v) => patch("craftsmanship", { title: v })}
          />
          <Field
            label="Body"
            value={ed.craftsmanship.body}
            onChange={(v) => patch("craftsmanship", { body: v })}
            multiline
          />
          <Field
            label="CTA label"
            value={ed.craftsmanship.ctaLabel}
            onChange={(v) => patch("craftsmanship", { ctaLabel: v })}
          />
          <Field
            label="CTA link"
            value={ed.craftsmanship.ctaHref}
            onChange={(v) => patch("craftsmanship", { ctaHref: v })}
          />
          <Field
            label="Image URL"
            value={ed.craftsmanship.image}
            onChange={(v) => patch("craftsmanship", { image: v })}
          />
          {designBlock("craftsmanship", "craftsmanship", ed.craftsmanship.styles)}
        </section>
      ) : null}

      {show("asSeenIn") ? (
        <section className="admin-cms-panel space-y-4 p-5 sm:p-6">
          <h3 className="admin-cms-kicker">As seen in</h3>
          <Field
            label="Publication names (comma-separated)"
            value={ed.asSeenIn.names.join(", ")}
            onChange={(v) =>
              patch("asSeenIn", {
                names: v
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
              })
            }
          />
          {designBlock("asSeenIn", "asSeenIn", ed.asSeenIn.styles)}
        </section>
      ) : null}

      {show("editorialJournal") ? (
        <section className="admin-cms-panel space-y-4 p-5 sm:p-6">
          <h3 className="admin-cms-kicker">Editorial journal</h3>
          <Field
            label="Kicker"
            value={ed.editorialJournal.kicker}
            onChange={(v) => patch("editorialJournal", { kicker: v })}
          />
          <Field
            label="Title"
            value={ed.editorialJournal.title}
            onChange={(v) => patch("editorialJournal", { title: v })}
          />
          <Field
            label="Link label"
            value={ed.editorialJournal.linkLabel}
            onChange={(v) => patch("editorialJournal", { linkLabel: v })}
          />
          <Field
            label="Link href"
            value={ed.editorialJournal.linkHref}
            onChange={(v) => patch("editorialJournal", { linkHref: v })}
          />
          {designBlock("editorialJournal", "editorialJournal", ed.editorialJournal.styles)}
        </section>
      ) : null}

      {show("luxuryPromise") ? (
        <section className="admin-cms-panel space-y-4 p-5 sm:p-6">
          <h3 className="admin-cms-kicker">Luxury promise</h3>
          <Field
            label="Kicker"
            value={ed.luxuryPromise.kicker}
            onChange={(v) => patch("luxuryPromise", { kicker: v })}
          />
          <Field
            label="Title"
            value={ed.luxuryPromise.title}
            onChange={(v) => patch("luxuryPromise", { title: v })}
          />
          {designBlock("luxuryPromise", "luxuryPromise", ed.luxuryPromise.styles)}
        </section>
      ) : null}

      {show("instagramGallery") ? (
        <section className="admin-cms-panel space-y-4 p-5 sm:p-6">
          <h3 className="admin-cms-kicker">Instagram gallery</h3>
          <Field
            label="Kicker"
            value={ed.instagramGallery.kicker}
            onChange={(v) => patch("instagramGallery", { kicker: v })}
          />
          <Field
            label="Title"
            value={ed.instagramGallery.title}
            onChange={(v) => patch("instagramGallery", { title: v })}
          />
          <Field
            label="Profile link"
            value={ed.instagramGallery.linkHref}
            onChange={(v) => patch("instagramGallery", { linkHref: v })}
          />
          {designBlock("instagramGallery", "instagramGallery", ed.instagramGallery.styles)}
        </section>
      ) : null}
    </div>
  );
}
