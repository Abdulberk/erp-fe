import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Sonart Insight",
    template: "%s · Sonart Insight",
  },
  description:
    "ERP stok ve satış raporunu yönetim dashboard'una çeviren analiz arayüzü.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f9f9f7" },
    { media: "(prefers-color-scheme: dark)", color: "#0d0d0d" },
  ],
};

/**
 * Tema damgasını ilk boyamadan önce basar. Olmazsa OS'i yenen seçim
 * hidrasyona kadar görünmez ve ekran bir kare yanlış modda çakar.
 */
const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem("sonart-theme");if(t==="dark"||t==="light"){document.documentElement.setAttribute("data-theme",t);}}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
