# Polkagiv

A decentralized crowdfunding and donation platform built with Next.js, TypeScript, EVM tooling (viem/ethers/wagmi/RainbowKit) and optional Polkadot integrations. Polkagiv lets creators launch donation campaigns and supporters donate using ERC-20 tokens (USDC in the demo).

Deployment target: this project is deployed to Moonbase Alpha (Moonbeam's testnet) — an EVM-compatible parachain in the Polkadot ecosystem. Ensure your wallet/RPC are set to Moonbase Alpha when interacting with the demo contracts.

Repository: https://github.com/peter-mwau/polkagiv.git

## Highlights / Strong points

- Modern Next.js app (app-router) using TypeScript and Tailwind for a responsive, accessible UI.
- EVM-first flows implemented using viem for lightweight RPC interactions and wagmi + RainbowKit for a polished wallet UX.
- Dual wallet support: browser provider (MetaMask / injected wallets) and private-key fallback for development or server-side testing.
- Complete on-chain flows implemented: create campaign, donate (with ERC-20 approval), withdraw, cancel, refund.
- Polkadot support included (dynamic imports to avoid SSR issues) so substrate workflows can be added without breaking SSR.
- Deployed / tested on Moonbase Alpha testnet (EVM-compatible parachain on Polkadot) — the README and default configs assume Moonbase Alpha as the target network.
- Helpful UX features: Create campaign form, Donation modal with suggested amounts and approval flow, campaign details with recent activity (last 24h), donation history and progress bars.
- Contract ABIs and artifacts are included in `artifacts/` so you can wire to local or test deployments quickly.

---

## Quick start — clone & run locally

1. Clone the repository

```bash
git clone https://github.com/peter-mwau/polkagiv.git
cd polkagiv
```

2. Install dependencies

```bash
# npm
npm install

# or, if you prefer pnpm
# pnpm install
```

3. Add environment variables

Create a `.env.local` file in the project root (do not commit it). Example values below.

```env
# EVM donor contract address (must match the chain you're using)
NEXT_PUBLIC_DONOR_CONTRACT_ADDRESS=0xYourDeployedDonorAddress

# USDC (token used in the demo)
NEXT_PUBLIC_USDC_CONTRACT_ADDRESS=0xYourUSDCAddress

# Optional: private key for local fallback (development only)
NEXT_PUBLIC_PRIVATE_KEY=0xyour_private_key_here

# Optional: public RPC url used in lib/public client (if not using window.ethereum)
NEXT_PUBLIC_RPC_URL=https://rpc.example

# Optional: RainbowKit / Wallet connect project id (if applicable)
NEXT_PUBLIC_RAINBOWKIT_PROJECT_ID=your_project_id
```

Important: keep private keys out of source control. Only set `NEXT_PUBLIC_PRIVATE_KEY` for local testing.

Note: this repository targets Moonbase Alpha by default. If you want to use a different EVM network, update `NEXT_PUBLIC_DONOR_CONTRACT_ADDRESS` and `NEXT_PUBLIC_RPC_URL` to point to the contract and RPC for that chain, and switch your wallet network accordingly.

4. Start the dev server

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

---

## Project structure (high level)

- `app/` — Next.js app routes, layout, and pages (app router).
  - `app/campaigns/` — campaign listing, sidebar, details.
  - `app/components/` — shared components (Navbar2, CreateCampaign, DonationModal, CampaignCard, etc.).
  - `app/contexts/` — React contexts (WalletContext, CampaignsContext, PolkadotContext).
  - `app/hooks/` — hooks for contract interactions (`useContract.ts` uses ethers; `useCampaign.ts` uses viem).
- `app/lib/contract.ts` — viem public client and wallet client helpers, donor contract ABI and address constants.
- `artifacts/` — compiled contract ABIs and artifacts (DonorContract.json, UsdCoin.json).

---

## How main flows work

- Create campaign: `CreateCampaign` collects inputs then calls the viem write helper; transactions are submitted via the connected wallet or a private-key fallback.
- Donate: `DonationModal` checks ERC-20 allowance and calls `approve` if needed, then calls `donateToCampaign`.
- Wallets: `WalletContext` handles `eth_requestAccounts` and private-key fallback and listens for `accountsChanged` to keep the UI in sync.
- Campaigns: `CampaignsContext` reads `getAllCampaigns()` from the contract and transforms raw data into UI-friendly objects.

---

## Common issues & debugging tips

- Wagmi / RainbowKit errors: ensure you wrap your app with `WagmiConfig` (wagmi v2) — this repo uses `WagmiConfig` in the providers file.
- SSR `window is not defined` with polkadot: the provider dynamically imports `@polkadot/extension-dapp` in client-side code to avoid this.
- viem decode error `could not decode result data (value="0x")`: usually means either the contract isn't deployed at the address you're calling, or the RPC/chain is incorrect. Quick checks:
  - In browser console (with MetaMask on the target chain):
    ```js
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.getCode("0xYourDonorAddress"); // should not be '0x'
    await provider.getNetwork();
    ```
- No signer available: ensure wallet is connected (ui `connect` button), or set `NEXT_PUBLIC_PRIVATE_KEY` for a local fallback during development.

---

## Notes & possible improvements

- Parse the `CampaignCreated` event from create transaction to return the new campaign ID in the UI.
- Memoize the sorted/filtered donations list with `useMemo` for better performance with large histories.
- Make the `recent activity` time window configurable.
- Add unit/integration tests for hooks and wallet flows.

---

## Contributing

- Fork, create a branch, open a PR. Keep secrets out of commits.

---

If you'd like, I can also add a `.env.example` and a small diagnostic script (check contract bytecode + chainId). Want me to add those files as well?

---

© Your project — Polkagiv
