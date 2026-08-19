export type Service = {
  number: string;
  name: string;
  description: string;
  href?: string;
};

const modules = import.meta.glob<Service>("/content/services/*.json", { eager: true });

export const services: Service[] = Object.values(modules)
  .map((m) => (m as unknown as { default: Service }).default ?? (m as unknown as Service))
  .sort((a, b) => a.number.localeCompare(b.number));
