// Loads all project JSON files from /content/projects at build time.
// Decap CMS writes/edits these files; a new commit triggers a Cloudflare Pages rebuild.
export type Project = {
  number: string;
  category?: string;
  name: string;
  images?: string[];
};

const modules = import.meta.glob<Project>("/content/projects/*.json", { eager: true });

export const projects: Project[] = Object.values(modules)
  .map((m) => (m as unknown as { default: Project }).default ?? (m as unknown as Project))
  .sort((a, b) => a.number.localeCompare(b.number));
