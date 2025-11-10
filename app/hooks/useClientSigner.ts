// hooks/useEthersSigner.ts
import { useWalletClient } from 'wagmi';
import { ethers } from 'ethers';
import { useMemo } from 'react';

export function useEthersSigner() {
    const { data: walletClient } = useWalletClient();

    return useMemo(() => {
        if (!walletClient) return undefined;

        // Create a provider using the window.ethereum object
        const provider = new ethers.BrowserProvider(window.ethereum as any);

        // Return a promise that resolves to the signer
        return provider.getSigner().then(signer => {
            console.log("Provider created:", provider);
            console.log("Signer created:", signer);
            return signer;
        }).catch(error => {
            console.error("Error creating signer:", error);
            throw error;
        });
    }, [walletClient]);
}