import { site } from "../data/site";
import { IconLine, IconFacebook, IconInstagram, IconTiktok, IconLinkedin, IconPhone } from "./Icons";

export default function SocialFollow() {
  const heading = site.followHeading?.trim() || "ติดตามผลงานทีมยัพพี ได้ที่ :";

  const socials = [
    { url: site.lineLink, label: "LINE", Icon: IconLine },
    { url: site.facebookUrl, label: "Facebook", Icon: IconFacebook },
    { url: site.instagramUrl, label: "Instagram", Icon: IconInstagram },
    { url: site.tiktokUrl, label: "TikTok", Icon: IconTiktok },
    { url: site.linkedinUrl, label: "LinkedIn", Icon: IconLinkedin },
  ].filter((s) => s.url && s.url.trim());

  const phones = (site.phones ?? []).filter((p) => p.number && p.number.trim());

  return (
    <div className="follow">
      <h3 className="follow-heading">{heading}</h3>

      {socials.length > 0 && (
        <div className="social-row">
          {socials.map((s) => (
            <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer"
              className="social-btn" aria-label={s.label} title={s.label}>
              <s.Icon size={22} />
            </a>
          ))}
        </div>
      )}

      {phones.length > 0 && (
        <div className="phone-row">
          {phones.map((p, i) => (
            <a key={i} href={`tel:${p.number.replace(/[^0-9+]/g, "")}`} className="phone-link">
              <IconPhone size={18} /> {p.number}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
