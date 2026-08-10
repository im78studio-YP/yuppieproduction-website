import mediaJson from "../../content/settings/media.json";

export type SiteMedia = {
  heroImage?: string;
  marqueeImages?: string[];
};

export const media: SiteMedia = mediaJson as SiteMedia;
