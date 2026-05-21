import { mergeHomepageConfig } from "./homepage-defaults.js";
import type { HomepageConfig } from "../types/homepage.js";
import { SiteSettings } from "../models/SiteSettings.js";

function stripProductIdFromHomepage(hp: HomepageConfig, productId: string): HomepageConfig {
  const id = String(productId);
  const drop = (ids: string[]) => ids.filter((x) => String(x) !== id);
  return {
    ...hp,
    bestsellers: { ...hp.bestsellers, productIds: drop(hp.bestsellers.productIds) },
    newIn: { ...hp.newIn, productIds: drop(hp.newIn.productIds) },
  };
}

/** Remove a deleted catalog product from homepage bestsellers / new-in pins (live + draft). */
export async function removeProductFromHomepagePins(productId: string): Promise<void> {
  const doc = await SiteSettings.findOne();
  if (!doc) return;

  const live = mergeHomepageConfig(doc.homepage as Partial<HomepageConfig>);
  const draftSource =
    doc.homepageDraft !== undefined && doc.homepageDraft !== null
      ? (doc.homepageDraft as Partial<HomepageConfig>)
      : doc.homepage;
  const draft = mergeHomepageConfig(draftSource as Partial<HomepageConfig>);

  await SiteSettings.updateOne(
    { _id: doc._id },
    {
      $set: {
        homepage: stripProductIdFromHomepage(live, productId),
        homepageDraft: stripProductIdFromHomepage(draft, productId),
      },
    },
  );
}
