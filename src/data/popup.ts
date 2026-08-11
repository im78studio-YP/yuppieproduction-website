import popupJson from "../../content/settings/popup.json";

export type PopupData = {
  enabled?: boolean;
  image?: string;
  title?: string;
  body?: string;
  buttonLabel?: string;
  buttonLink?: string;
};

export const popup: PopupData = popupJson as PopupData;
