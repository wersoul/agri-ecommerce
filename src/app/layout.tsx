import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const SITE_URL = "https://agri-ecommerce.pages.dev";
const SITE_NAME = "KNK Part";
const SITE_NAME_TH = "เคเอ็นเค พาร์ท";
const SEO_KEYWORDS = [
  "อะไหล่เกษตร",
  "อะไหล่เครื่องมือ",
  "เครื่องมือเกษตร",
  "อะไหล่รถไถ",
  "อะไหล่เครื่องตัดหญ้า",
  "อะไหล่เครื่องยนต์",
  "อะไหล่ปั๊มน้ำ",
  "อะไหล่เครื่องพ่นยา",
  "อะไหล่เลื่อยยนต์",
  "อะไหล่รถไถเดินตาม",
  "เพรสเชอร์สวิทช์",
  "โอเวอร์โหลดสวิทช์",
  "คอนเดนเซอร์",
  "ซีลปั๊มน้ำ",
  "อะไหล่ปั๊มชัก",
  "อะไหล่ตัดหญ้า",
  "NB411",
  "CG328",
  "GX35",
  "GX160",
  "G200",
  "MS180",
  "MS381",
  "ร้านอะไหล่เกษตร",
  "ขายอะไหล่เกษตรออนไลน์",
  "อะไหล่เกษตรราคาถูก",
  "อุปกรณ์การเกษตร",
  "เครื่องมือช่างเกษตร",
  "อะไหล่เครื่องจักรเกษตร",
  "knkpart",
  "KNK Part",
  "เคเอ็นเค พาร์ท",
].join(", ");

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} (${SITE_NAME_TH}) - ร้านอะไหล่เกษตร อะไหล่เครื่องมือ เครื่องมือเกษตร`,
    template: `%s | ${SITE_NAME} - อะไหล่เกษตร`,
  },
  description:
    "KNK Part - ร้านขายอะไหล่เกษตร อะไหล่เครื่องมือ เครื่องมือเกษตรครบวงจร อะไหล่รถไถ อะไหล่เครื่องตัดหญ้า อะไหล่เครื่องยนต์ อะไหล่ปั๊มน้ำ อะไหล่เครื่องพ่นยา อะไหล่เลื่อยยนต์ พร้อมจัดส่งทั่วประเทศ",
  keywords: SEO_KEYWORDS,
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: "website",
    locale: "th_TH",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} - ร้านอะไหล่เกษตร อะไหล่เครื่องมือ เครื่องมือเกษตร`,
    description:
      "ร้านขายอะไหล่เกษตรและเครื่องมือเกษตรครบวงจร อะไหล่รถไถ อะไหล่เครื่องตัดหญ้า อะไหล่เครื่องยนต์ อะไหล่ปั๊มน้ำ อะไหล่เครื่องพ่นยา อะไหล่เลื่อยยนต์",
    images: [
      {
        url: "/images/knkpart/banners/15-PP-INT-Main-Banner.jpg",
        width: 2480,
        height: 1000,
        alt: `${SITE_NAME} - อะไหล่เกษตร เครื่องมือเกษตร`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} - อะไหล่เกษตร อะไหล่เครื่องมือ เครื่องมือเกษตร`,
    description:
      "ร้านขายอะไหล่เกษตร อะไหล่เครื่องมือ เครื่องมือเกษตร ครบวงจร",
    images: ["/images/knkpart/banners/15-PP-INT-Main-Banner.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/images/knkpart/favicon.png", type: "image/png", sizes: "157x65" },
    ],
    shortcut: "/images/knkpart/favicon.png",
    apple: "/images/knkpart/favicon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // JSON-LD Structured Data for SEO
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Store",
    name: `${SITE_NAME} (${SITE_NAME_TH})`,
    alternateName: "KNK Part อะไหล่เกษตร",
    url: SITE_URL,
    logo: `${SITE_URL}/images/knkpart/logoknk.svg`,
    description:
      "ร้านขายอะไหล่เกษตร อะไหล่เครื่องมือ เครื่องมือเกษตร ครบวงจร",
    image: `${SITE_URL}/images/knkpart/banners/15-PP-INT-Main-Banner.jpg`,
    telephone: "+66-2-xxx-xxxx",
    address: {
      "@type": "PostalAddress",
      addressCountry: "TH",
      addressLocality: "กรุงเทพมหานคร",
    },
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      opens: "08:00",
      closes: "18:00",
    },
    priceRange: "฿฿",
    sameAs: [],
    keywords:
      "อะไหล่เกษตร, อะไหล่เครื่องมือ, เครื่องมือเกษตร, อะไหล่รถไถ, อะไหล่เครื่องตัดหญ้า",
  };

  return (
    <html lang="th">
      <head>
        <link rel="icon" type="image/png" href="/images/knkpart/favicon.png" />
        <link rel="apple-touch-icon" href="/images/knkpart/favicon.png" />
        <meta name="geo.region" content="TH" />
        <meta name="geo.placename" content="Thailand" />
        <meta name="language" content="Thai" />
        <meta name="rating" content="general" />
        <meta name="distribution" content="global" />
        <meta name="revisit-after" content="7 days" />
        <meta property="og:image:width" content="2480" />
        <meta property="og:image:height" content="1000" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}