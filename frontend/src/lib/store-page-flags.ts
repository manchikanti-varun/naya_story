import type { HomepageConfig } from "@/types/homepage";

export type StorePageKey = "collections" | "newIn" | "ourStory";

export type StorePageFlags = {
  collections: boolean;
  newIn: boolean;
  ourStory: boolean;
};

export function storePageFlagsFromHomepage(hp: HomepageConfig): StorePageFlags {
  return {
    collections: hp.collectionsPage?.enabled !== false,
    newIn: hp.newInPage?.enabled !== false,
    ourStory: hp.ourStoryPage?.enabled !== false,
  };
}

export function isStorePageEnabled(hp: HomepageConfig, page: StorePageKey): boolean {
  return storePageFlagsFromHomepage(hp)[page];
}
