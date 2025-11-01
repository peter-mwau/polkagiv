"use client";

import Image from "next/image";
import { useWallet } from "../contexts/WalletContext";

export default function Navbar2() {
  const { isConnected, isConnecting, address, connect, disconnect } =
    useWallet();

  const truncate = (addr: string | null) =>
    addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "";

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

          {/* Wallet Connection */}
          <div className="flex items-center">
            {!isConnected ? (
              <button
                onClick={connect}
                disabled={isConnecting}
                className="bg-white text-black px-6 py-2 rounded-lg font-medium hover:bg-gray-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                {isConnecting ? (
                  <span className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-black"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Connecting...
                  </span>
                ) : (
                  "Get Started"
                )}
              </button>
            ) : (
              <div className="flex items-center space-x-4">
                <div className="bg-white/10 px-4 py-2 rounded-lg border border-white/20">
                  <span className="text-white text-sm font-medium">
                    {truncate(address)}
                  </span>
                </div>
                <button
                  onClick={disconnect}
                  className="bg-transparent border border-white/30 text-white px-4 py-2 rounded-lg font-medium hover:bg-white/10 transition-all duration-200"
                >
                  Disconnect
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
