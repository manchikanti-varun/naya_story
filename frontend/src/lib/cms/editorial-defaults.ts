import type { HomepageEditorialConfig } from "@/types/homepage";

const IMG = (_id?: string, _w?: number) => "";

/** Default copy/media matching the original hardcoded storefront sections. */
export function defaultHomepageEditorial(): HomepageEditorialConfig {
  return {
    brandStory: {
      enabled: true,
      kicker: "Brand story",
      title: "Studio-born,\nsilhouette-led.",
      body: [
        "Naya Story is a women's atelier devoted to calm luxury — garments that feel cinematic in stillness, engineered with tactile honesty and tailored grace.",
        "We privilege cloth that breathes, seams that disappear, and palettes that echo ivory, warmth, and gold — an invitation to dress with intention.",
      ],
      image: IMG("photo-1483985988355-763728e1935b"),
      imageAlt: "Atelier mood",
    },
    lookbook: {
      enabled: true,
      kicker: "Lookbook",
      title: "Campaign stills",
      subtitle: "A sequence of frames — light, negative space, and the arc of a sleeve.",
      shots: [
        {
          src: IMG("photo-1515377905703-c4788e51af15", 900),
          span: "md:col-span-7 md:row-span-2",
          aspect: "aspect-[4/5]",
        },
        {
          src: IMG("photo-1524504388940-b1c1722653e1", 800),
          span: "md:col-span-5",
          aspect: "aspect-[16/11]",
        },
        {
          src: IMG("photo-1469334031218-e382a71b716b", 800),
          span: "md:col-span-5",
          aspect: "aspect-[16/11]",
        },
        {
          src: IMG("photo-1525507119028-ed4c629a60a7", 900),
          span: "md:col-span-12",
          aspect: "aspect-[21/9]",
        },
      ],
    },
    craftsmanship: {
      enabled: true,
      kicker: "Fabric & craft",
      title: "Woven with intention.",
      body: "Each silhouette begins in the studio — natural fibres, hand-finished seams, and a palette drawn from ivory, sand, and warm black.",
      ctaLabel: "Discover the atelier",
      ctaHref: "/our-story",
      image: IMG("photo-1558176283-7aef43b7cb7d", 1400),
      imageAlt: "Fabric texture",
    },
    asSeenIn: {
      enabled: true,
      kicker: "As seen in",
      names: ["Vogue", "Harper's Bazaar", "Elle", "Kinfolk", "The Gentlewoman"],
    },
    editorialJournal: {
      enabled: true,
      kicker: "Editorial journal",
      title: "Stories from the studio",
      linkLabel: "Read all →",
      linkHref: "/our-story",
      stories: [
        {
          title: "Light on linen",
          excerpt: "Summer silhouettes in negative space.",
          image: IMG("photo-1490481651871-ab68de25d43d", 900),
          href: "/our-story",
        },
        {
          title: "The ivory edit",
          excerpt: "A study in calm dressing.",
          image: IMG("photo-1469334031218-e382a71b716b", 900),
          href: "/collections",
        },
        {
          title: "Atelier notes",
          excerpt: "From sketch to final stitch.",
          image: IMG("photo-1509631179647-0177331693ae", 900),
          href: "/our-story",
        },
      ],
    },
    luxuryPromise: {
      enabled: true,
      kicker: "Our promise",
      title: "Craft, care, delivered.",
      items: [
        {
          title: "Complimentary tailoring",
          copy: "First alteration on full-price pieces, within 30 days of delivery.",
        },
        {
          title: "Studio packaging",
          copy: "Recycled tissue, cotton dust bags, and a note from the atelier.",
        },
        {
          title: "White-glove returns",
          copy: "Exchanges arranged with care — no harsh policy language.",
        },
      ],
    },
    instagramGallery: {
      enabled: true,
      kicker: "@nayastory",
      title: "In the frame",
      images: [
        IMG("photo-1515886657613-9f3515b0c78f", 600),
        IMG("photo-1524504388940-b1c1722653e1", 600),
        IMG("photo-1483985988355-763728e1935b", 600),
        IMG("photo-1515377905703-c4788e51af15", 600),
        IMG("photo-1525507119028-ed4c629a60a7", 600),
        IMG("photo-1509631179647-0177331693ae", 600),
      ],
      linkHref: "https://instagram.com",
    },
  };
}
