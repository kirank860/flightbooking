import type { Metadata } from "next";
import { Instrument_Serif, Public_Sans } from "next/font/google";
import NextTopLoader from "nextjs-toploader";
import "./globals.css";
import AuthBootstrap from "./components/AuthBootstrap";
import PageTransition from "./components/PageTransition";

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

const publicSans = Public_Sans({
  variable: "--font-public-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: "AeroGlide — Fly with room to breathe",
  description: "Compare fares, book flights, and manage trips with AeroGlide.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${instrumentSerif.variable} ${publicSans.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-page text-ink">
        <NextTopLoader color="#0E5C63" height={3} showSpinner={false} shadow="0 0 10px #0E5C63,0 0 5px #0E5C63" />
        <AuthBootstrap />
        <PageTransition>{children}</PageTransition>
      </body>
    </html>
  );
}
