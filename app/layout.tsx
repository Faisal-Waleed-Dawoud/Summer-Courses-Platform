import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["latin"]
})

export const metadata: Metadata = {
  title: {
    template: "SCP | %s",
    default: "SCP"},
  description: "This is a summer courses platform that enables UPM students to enroll for summer courses in other universities",
  openGraph: {
    title: "SCP",
    description: "This is a summer courses platform that enables UPM students to enroll for summer courses in other universities",
    siteName: "SCP",
    images: [
      {
        url: "https://i.ibb.co/LDk6zT2T/scp-icon.png",
        width: 1024,
        height: 798,
        alt: "SCP Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SCP",
    description: "This is a summer courses platform that enables UPM students to enroll for summer courses in other universities",
    images: ["https://i.ibb.co/LDk6zT2T/scp-icon.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${rubik.variable} antialiased`}
      >
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
