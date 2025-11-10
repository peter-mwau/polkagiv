import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { PolkadotProvider } from "./providers/PolkadotProvider";
import { WalletProvider } from "./contexts/WalletContext";
import Providers from "./providers/Provider";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { CampaignsProvider } from "./contexts/CampaignsContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PolkaGiv",
  description: "Transparent aid, powered by Polkadot",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <PolkadotProvider appName="PolkaGiv">
          <Providers>
            <CampaignsProvider>
              <WalletProvider>
                {children}
                <ToastContainer
                  position="top-right"
                  autoClose={5000}
                  hideProgressBar={false}
                  newestOnTop={false}
                  closeOnClick
                  rtl={false}
                  pauseOnFocusLoss
                  draggable
                  pauseOnHover
                  theme="light"
                />
              </WalletProvider>
            </CampaignsProvider>
          </Providers>
        </PolkadotProvider>
      </body>
    </html>
  );
}
