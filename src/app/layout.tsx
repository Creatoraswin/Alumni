import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import Footer from "@/components/ui/Footer";
import { AppLayoutWrapper } from "@/components/AppLayoutWrapper";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "https://alumni.sparvixainnovations.com"),
  title: "CUTMAP Alumni Dashboard",
  description: "CUTMAP Alumni Dashboard - Connect with alumni from CUTMAP institutions",
  openGraph: {
    title: "CUTMAP Alumni Dashboard",
    description: "CUTMAP Alumni Dashboard - Connect with alumni from CUTMAP institutions",
    type: "website",
    images: ["/Centurion-University-AP-logo.webp"],
  },
  twitter: {
    card: "summary_large_image",
    site: "cutmap",
    images: ["/Centurion-University-AP-logo.webp"],
  },
  icons: {
    icon: "/Centurion-University-AP-logo.webp",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="referrer" content="no-referrer" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`} suppressHydrationWarning>
        <Providers>
          <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-secondary/30 to-accent/20">
            <AppLayoutWrapper>
              <div className="flex-1 flex flex-col">
                {children}
              </div>
            </AppLayoutWrapper>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
