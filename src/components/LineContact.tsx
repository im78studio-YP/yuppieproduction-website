import { site } from "../data/site";

export default function LineContact({ center = false }: { center?: boolean }) {
  const qr = site.lineQR?.trim();
  const link = site.lineLink?.trim();
  const lineId = site.lineId?.trim();
  const accountLabel = lineId ? `LINE ${lineId}` : "LINE";

  if (!qr && !link) {
    return (
      <a className="btn-contact" href="#contact" data-umami-event="contact-fallback">ติดต่อเรา</a>
    );
  }

  return (
    <div className={`line-contact${center ? " line-contact-center" : ""}`}>
      {qr && (
        <div className="line-qr">
          {link ? (
            <a href={link} target="_blank" rel="noopener noreferrer" data-umami-event="line-qr">
              <img src={qr} alt={`QR Code สำหรับเพิ่มเพื่อน ${accountLabel}`} />
            </a>
          ) : (
            <img src={qr} alt={`QR Code สำหรับเพิ่มเพื่อน ${accountLabel}`} />
          )}
          <span>สแกนเพื่อแอด {accountLabel}</span>
        </div>
      )}
      {link && (
        <a className="btn-contact" href={link} target="_blank" rel="noopener noreferrer" data-umami-event="line-about">
          แอด {accountLabel}
        </a>
      )}
    </div>
  );
}
