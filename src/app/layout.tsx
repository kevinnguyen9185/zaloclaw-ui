import type { Metadata } from "next";
import { Be_Vietnam_Pro, Geist_Mono, Lexend } from "next/font/google";
import "./globals.css";
import { GatewayProvider } from "@/lib/gateway/context";
import { ThemeProvider } from "@/lib/theme/context";
import { getThemeBootstrapScript } from "@/lib/theme/engine";

const beVietnam = Be_Vietnam_Pro({
  variable: "--font-be-vietnam",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin", "vietnamese"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const lexend = Lexend({
  variable: "--font-lexend",
  weight: ["500", "600", "700"],
  subsets: ["latin", "vietnamese"],
});

export const metadata: Metadata = {
  title: "ZaloClaw",
  description: "Intelligent Data Clawing. Effortless Connection.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const bootstrapScript = getThemeBootstrapScript();

  return (
    <html
      lang="en"
      className={`${beVietnam.variable} ${geistMono.variable} ${lexend.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootstrapScript }} />
      </head>
      <body className="min-h-full flex flex-col">
        <GatewayProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </GatewayProvider>
      </body>
    </html>
  );
}
