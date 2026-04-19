import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: {
    default: "Wittgenstein",
    template: "%s · Wittgenstein",
  },
  description:
    "Harness-first multimodal stack: typed codecs, manifest spine, sole neural image path (scene → adapter → frozen decoder → PNG).",
  keywords: [
    "LLM",
    "multimodal",
    "codec",
    "harness",
    "manifest",
    "TypeScript",
  ],
  openGraph: {
    title: "Wittgenstein",
    description:
      "Text-native models, file-native outputs — schemas, codecs, and reproducible runs.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${mono.variable} bg-canvas text-ink antialiased`}>
        {children}
      </body>
    </html>
  );
}
