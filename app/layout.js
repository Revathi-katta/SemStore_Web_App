import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Sem Store",
  description: "Academic resource sharing app for IITGN",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Cloudinary Upload Widget Script */}
        <script
          src="https://widget.cloudinary.com/v2.0/global/all.js"
          type="text/javascript"
          async
        ></script>

        {/* ✅ PWA meta + manifest */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1e293b" />
        <link rel="apple-touch-icon" href="/iitgn_logo.png" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}

