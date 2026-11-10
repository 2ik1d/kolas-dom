import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "КоЛАС Дом — строительство каркасных домов в Московской области",
  description: "Каркасные дома под ключ и тёплый контур в Московской области. Проекты домов, комплектации и расчёт стоимости строительства от КоЛАС Дом.",
  metadataBase: new URL('https://kolas-dom-homes.tastytoffee2.chatgpt.site'),
  openGraph: {title:'КоЛАС Дом — дома для комфортной жизни',description:'Каркасные дома под ключ и тёплый контур в Московской области',locale:'ru_RU',type:'website',images:[{url:'/images/hero.webp',width:2000,height:1200,alt:'Архитектурная иллюстрация современного деревянного дома'}]},
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className="antialiased">{children}</body>
    </html>
  );
}
