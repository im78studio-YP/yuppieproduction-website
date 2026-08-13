import { site } from "../data/site";
import { IconLine, IconFacebook, IconInstagram, IconTiktok, IconLinkedin } from "./Icons";

export default function SocialFollow() {
  const heading = site.followHeading?.trim() || "ติดตามเรา";

  const socials = [
    { url: site.lineLink, label: "LINE", Icon: IconLine },
    { url: site.facebookUrl, label: "Facebook", Icon: IconFacebook },
    { url: site.instagramUrl, label: "Instagram", Icon: IconInstagram },
    { url: site.tiktokUrl, label: "TikTok", Icon: IconTiktok },
    { url: site.linkedinUrl, label: "LinkedIn", Icon: IconLinkedin },
  ].filter((s) => s.url && s.url.trim());

  return (
    <section className="footer-column" aria-labelledby="footer-follow-heading">
      <h3 id="footer-follow-heading">{heading}</h3>
      <div className="footer-social-links">
        {socials.map((social) => (
          <a key={social.label} href={social.url} target="_blank" rel="noopener noreferrer"
            data-umami-event={`social-${social.label.toLowerCase()}`}>
            <social.Icon size={20} />
            <span>{social.label}</span>
          </a>
        ))}
      </div>
    </section>
  );
}
