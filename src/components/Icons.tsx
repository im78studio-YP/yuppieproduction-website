type P = { size?: number };
const box = (size: number) => ({ width: size, height: size, display: "block" as const });

export const IconLine = ({ size = 24 }: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" style={box(size)} aria-hidden="true">
    <path d="M12 2C6.48 2 2 5.64 2 10.12c0 4.02 3.55 7.39 8.35 8.03.32.07.77.21.88.49.1.25.07.63.03.88l-.14.85c-.04.25-.2.99.87.54 1.07-.45 5.76-3.39 7.86-5.81C21.15 13.5 22 11.9 22 10.12 22 5.64 17.52 2 12 2zM8.02 12.58H6.03a.53.53 0 0 1-.53-.53V8.06a.53.53 0 1 1 1.06 0v3.46h1.46a.53.53 0 1 1 0 1.06zm2.08-.53a.53.53 0 1 1-1.06 0V8.06a.53.53 0 1 1 1.06 0v3.99zm4.61 0a.53.53 0 0 1-.42.52h-.11a.53.53 0 0 1-.43-.21l-2.04-2.78v2.47a.53.53 0 1 1-1.06 0V8.06a.53.53 0 0 1 .95-.32l2.05 2.78V8.06a.53.53 0 1 1 1.06 0v3.99zm3.34-2.52a.53.53 0 0 1 0 1.06h-1.46v.93h1.46a.53.53 0 1 1 0 1.06h-1.99a.53.53 0 0 1-.53-.53V8.06a.53.53 0 0 1 .53-.53h1.99a.53.53 0 1 1 0 1.06h-1.46v.94h1.46z"/>
  </svg>
);

export const IconFacebook = ({ size = 24 }: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" style={box(size)} aria-hidden="true">
    <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.52 1.49-3.91 3.78-3.91 1.09 0 2.24.2 2.24.2v2.46H15.2c-1.24 0-1.63.78-1.63 1.57v1.89h2.78l-.44 2.91h-2.34V22c4.78-.79 8.43-4.94 8.43-9.94z"/>
  </svg>
);

export const IconInstagram = ({ size = 24 }: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={box(size)} aria-hidden="true">
    <rect x="2.5" y="2.5" width="19" height="19" rx="5.5"/>
    <circle cx="12" cy="12" r="4.2"/>
    <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none"/>
  </svg>
);

export const IconTiktok = ({ size = 24 }: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" style={box(size)} aria-hidden="true">
    <path d="M16.6 5.82a4.28 4.28 0 0 1-1.06-2.82h-3.2v12.9a2.6 2.6 0 1 1-2.03-2.54v-3.26a5.77 5.77 0 1 0 5.23 5.74V9.01a7.35 7.35 0 0 0 4.3 1.38V7.2a4.3 4.3 0 0 1-3.24-1.38z"/>
  </svg>
);

export const IconLinkedin = ({ size = 24 }: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" style={box(size)} aria-hidden="true">
    <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.35V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.55V9h3.57v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.22.79 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z"/>
  </svg>
);

export const IconPhone = ({ size = 24 }: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" style={box(size)} aria-hidden="true">
    <path d="M6.62 10.79a15.5 15.5 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C10.6 21 3 13.4 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.24.2 2.45.57 3.57a1 1 0 0 1-.24 1.02l-2.21 2.2z"/>
  </svg>
);
