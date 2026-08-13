import { site } from "../data/site";

export default function LineContact({ center = false }: { center?: boolean }) {
  const qr = site.lineQR?.trim();
  const link = site.lineLink?.trim();

  if (!qr && !link) {
    return (
      <a href="#contact" data-umami-event="contact-fallback"><button className="btn-contact">ติดต่อเรา</button></a>
    );
  }

  return (
    <div className={`line-contact${center ? " line-contact-center" : ""}`}>
      {qr && (
        <div className="line-qr">
          <img src={qr} alt="LINE QR code" />
          <span>สแกนเพื่อแอดไลน์</span>
        </div>
      )}
      {link && (
        <a href={link} target="_blank" rel="noopener noreferrer" data-umami-event="line-about">
          <button className="btn-contact">แอดไลน์คุยกับเรา</button>
        </a>
      )}
    </div>
  );
}
