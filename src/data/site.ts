import siteJson from "../../content/settings/site.json";

export type Site = {
  menuAbout: string;
  menuServices: string;
  menuProjects: string;
  menuContact: string;
  heroHeading: string;
  heroTagline: string;
  heroButton: string;
  aboutHeading: string;
  aboutText: string;
  aboutButton: string;
  servicesHeading: string;
  projectsHeading: string;
  ctaLine1: string;
  ctaLine2: string;
  contactButton: string;
  contactEmail: string;
  companyName: string;
  lineLink?: string;
  lineQR?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  tiktokUrl?: string;
  linkedinUrl?: string;
  followHeading?: string;
  phones?: { number: string }[];
};

export const site: Site = siteJson as Site;
