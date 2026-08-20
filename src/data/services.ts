export type Service = {
  number: string;
  name: string;
  description: string;
  href?: string;
  visible?: boolean;
};

const modules = import.meta.glob<Service>("/content/services/*.json", { eager: true });

export const services: Service[] = Object.values(modules)
  .map((m) => (m as unknown as { default: Service }).default ?? (m as unknown as Service))
  .filter((service) => service.visible !== false)
  .sort((a, b) => a.number.localeCompare(b.number));
