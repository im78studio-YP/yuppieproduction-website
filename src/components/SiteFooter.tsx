import { Mail } from "lucide-react";
import { site } from "../data/site";
import { IconPhone } from "./Icons";
import SocialFollow from "./SocialFollow";

const footerLinks = [
  { href: "#about", label: "เกี่ยวกับเรา" },
  { href: "#services", label: "บริการของเรา" },
  { href: "#projects", label: "ผลงานที่ผ่านมา" },
  { href: "#contact", label: "ติดต่อทีมยัพพี" },
];

export default function SiteFooter() {
  const email = site.contactEmail?.trim();
  const lineLink = site.lineLink?.trim();
  const lineId = site.lineId?.trim();
  const lineQR = site.lineQR?.trim();
  const phones = (site.phones ?? []).filter((phone) => phone.number?.trim());

  return (
    <footer id="contact" className="site-footer">
      <div className="footer-cta">
        <div className="hero-heading footer-cta-heading">
          {site.ctaLine1}<br />{site.ctaLine2}
        </div>
      </div>

      <div className="footer-panel">
        <div className="footer-panel-inner">
          <div className="footer-brand-row">
            <img className="footer-logo" src="/logo.png" alt="Yuppie Production" />
            <p>{site.heroTagline}</p>
          </div>

          <div className="footer-grid">
            <section className="footer-column" aria-labelledby="footer-contact-heading">
              <h3 id="footer-contact-heading">ติดต่อเรา</h3>
              <div className="footer-link-list">
                {email && (
                  <a href={`mailto:${email}`}>
                    <Mail size={20} aria-hidden="true" />
                    <span>{email}</span>
                  </a>
                )}
                {phones.map((phone) => (
                  <a key={phone.number} href={`tel:${phone.number.replace(/[^0-9+]/g, "")}`}>
                    <IconPhone size={20} />
                    <span>{phone.number}</span>
                  </a>
                ))}
              </div>
            </section>

            <nav className="footer-column" aria-labelledby="footer-links-heading">
              <h3 id="footer-links-heading">เมนูหลัก</h3>
              <div className="footer-nav-links">
                {footerLinks.map((link) => (
                  <a key={link.href} href={link.href}>{link.label}</a>
                ))}
              </div>
            </nav>

            <SocialFollow />

            {(lineQR || lineLink) && (
              <section className="footer-line-card" aria-labelledby="footer-line-heading">
                <div className="footer-line-copy">
                  <h3 id="footer-line-heading">LINE Official</h3>
                  <p>{lineId || "ทีมยัพพี"}</p>
                </div>
                {lineQR && (
                  lineLink ? (
                    <a className="footer-qr-link" href={lineLink} target="_blank" rel="noopener noreferrer"
                      aria-label={`เพิ่มเพื่อน LINE ${lineId || "ทีมยัพพี"}`}>
                      <img src={lineQR} alt={`QR Code สำหรับเพิ่มเพื่อน LINE ${lineId || "ทีมยัพพี"}`} />
                    </a>
                  ) : (
                    <img className="footer-qr-image" src={lineQR}
                      alt={`QR Code สำหรับเพิ่มเพื่อน LINE ${lineId || "ทีมยัพพี"}`} />
                  )
                )}
                {lineLink && (
                  <a className="footer-line-action" href={lineLink} target="_blank" rel="noopener noreferrer">
                    เพิ่มเพื่อน
                  </a>
                )}
              </section>
            )}
          </div>

          <div className="footer-bottom">
            <p>Copyright © {new Date().getFullYear()} {site.companyName}. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
