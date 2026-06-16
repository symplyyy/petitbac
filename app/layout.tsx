import "./globals.css";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Petit Bac — Joue entre amis",
  description: "Le Petit Bac multijoueur en ligne, fun et rapide.",
};

export const viewport: Viewport = {
  themeColor: "#FF3D85",
  width: "device-width",
  initialScale: 1,
};

const themeBoot = `try{var t=localStorage.getItem('petitbac:theme');if(!t){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}if(t==='dark')document.documentElement.classList.add('dark');}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBoot }} />
      </head>
      <body className="min-h-screen">
        {/* Decorative desktop side art (hidden on mobile) */}
        <DeskDecor />
        <div className="relative z-10 mx-auto w-full max-w-md md:max-w-xl lg:max-w-2xl min-h-screen flex flex-col px-2 sm:px-0">
          {children}
        </div>
      </body>
    </html>
  );
}

function DeskDecor() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 hidden md:block">
      {/* Big background letters scattered */}
      <span className="absolute top-[10%] left-[6%] font-display font-bold text-[18vw] leading-none text-ink/[0.06] select-none">P</span>
      <span className="absolute bottom-[6%] right-[5%] font-display font-bold text-[18vw] leading-none text-ink/[0.06] select-none">B</span>
      <span className="absolute top-[55%] left-[3%] font-display font-bold text-[10vw] leading-none text-tomato/15 select-none rotate-[-12deg]">!</span>
      <span className="absolute top-[12%] right-[8%] font-display font-bold text-[8vw] leading-none text-cobalt/20 select-none rotate-[8deg]">?</span>

      {/* Hard-shadow square decoration */}
      <div className="absolute top-[28%] left-[8%] w-20 h-20 bg-tomato border-3 border-stroke rotate-[-8deg] shadow-hardlg" />
      <div className="absolute bottom-[28%] right-[9%] w-16 h-16 rounded-full bg-bubble border-3 border-stroke rotate-[6deg] shadow-hardlg" />
    </div>
  );
}
