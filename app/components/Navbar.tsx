"use client";

import Image from "next/image";
import { usePolkadot } from "../contexts/PolkadotContext";

function Navbar() {
  const {
    accounts,
    selectedAccount,
    isConnected,
    isConnecting,
    connect,
    disconnect,
    selectAccount,
    error,
    evmAddress,
    isEVMConnected,
  } = usePolkadot();

  const handleConnect = async () => {
    await connect();
  };

  const handleDisconnect = () => {
    disconnect();
  };
  return (
    <div className="w-[80%] mx-auto items-center flex justify-around z-50 bg-transparent py-5 rounded-lg fixed top-0 left-0 right-0">
      {/* <div className="flex flex-row gap-3"> */}
      <div className="items-start flex flex-row gap-3">
        <Image
          src="/globe.svg"
          alt="PolkaGiv Logo"
          className="my-auto"
          width={40}
          height={40}
        />
        <h2 className="text-white font-semibold my-auto">PolkaGiv</h2>
      </div>
      <div className="items-center">
        <ul className="flex flex-row gap-5 text-white font-medium">
          <li className="hover:underline cursor-pointer">Home</li>
          <li className="hover:underline cursor-pointer">About</li>
          <li className="hover:underline cursor-pointer">Projects</li>
          <li className="hover:underline cursor-pointer">Contact</li>
        </ul>
      </div>
      <div className="items-end">
        {/* <button className="bg-white text-black px-4 py-2 rounded-md font-medium hover:bg-gray-200 transition">
          Get Started
        </button> */}
        {!(isConnected || isEVMConnected) ? (
          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className="bg-white text-black px-4 py-2 rounded-md font-medium hover:bg-gray-200 transition hover:cursor-pointer "
          >
            {isConnecting ? "Connecting..." : "Get Started"}
          </button>
        ) : (
          <div className="connected-wallet">
            {isConnected && (
              <>
                <select
                  value={selectedAccount?.address || ""}
                  onChange={(e) => {
                    const account = accounts.find(
                      (acc) => acc.address === e.target.value
                    );
                    if (account) selectAccount(account);
                  }}
                >
                  {accounts.map((account) => (
                    <option key={account.address} value={account.address}>
                      {account.meta.name} ({account.address.slice(0, 8)}...)
                    </option>
                  ))}
                </select>
                <button onClick={handleDisconnect} className="disconnect-btn">
                  Disconnect
                </button>
              </>
            )}

            {isEVMConnected && !isConnected && (
              <div className="connected-wallet-evm">
                <span className="px-4 py-2 bg-white text-black rounded-md">
                  {evmAddress?.slice(0, 8)}...
                </span>
                <button onClick={handleDisconnect} className="disconnect-btn">
                  Disconnect
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      {/* </div> */}
    </div>
  );
}

export default Navbar;
