"use client";

import Image from "next/image";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function Navbar2() {
  return (
    <nav className="w-full bg-white/5 backdrop-blur-sm border-b border-white/10 fixed top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <Image
              src="/globe.svg"
              alt="PolkaGiv Logo"
              width={32}
              height={32}
              className="text-white"
            />
            <h2 className="text-white font-bold text-xl">PolkaGiv</h2>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              {["Home", "About", "Projects", "Contact"].map((item) => (
                <a
                  key={item}
                  href="#"
                  className="text-white/80 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  {item}
                </a>
              ))}
            </div>
          </div>

          {/* Wallet Connection - Just use RainbowKit */}
          <ConnectButton
            showBalance={{
              smallScreen: false,
              largeScreen: true,
            }}
            accountStatus="address"
            chainStatus="icon"
          />
        </div>
      </div>
    </nav>
  );
}
