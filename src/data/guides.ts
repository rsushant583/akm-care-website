/**
 * Educational guides for GEO / answer-first content.
 * Only topics backed by real catalog or store policy belong here.
 */

export type GuideMeta = {
  slug: string;
  path: string;
  title: string;
  description: string;
  summary: string;
  relatedCategory?: string;
};

export const GUIDES: GuideMeta[] = [
  {
    slug: "saree-length",
    path: "/guides/saree-length",
    title: "How to read saree length on AKM Care",
    description:
      "What “Mtrs APX” means on AKM Care saree product pages, where to find length, and how to open the sarees category.",
    summary:
      "Saree length on this store is the catalog dimensions value, usually written as metres approximate (Mtrs APX). Always check the product page for that SKU.",
    relatedCategory: "sarees",
  },
];

export function getGuide(slug: string): GuideMeta | undefined {
  return GUIDES.find((g) => g.slug === slug);
}
