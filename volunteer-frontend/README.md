# VolunteerProof Frontend

## Quick Start

### 1) Install

```
npm install
```

### 2) Configure Contract Address

Edit `abi/VolunteerProofAddresses.ts`, set Sepolia address after deployment:

```
export const VolunteerProofAddresses = {
  "11155111": { address: "0x...", chainId: 11155111, chainName: "sepolia" }
};
```

### 3) Run Dev

```
npm run dev
```

Open `/add` to submit, `/my` to view mine (with userDecrypt), `/wall` for public wall.

## FHEVM

- Local: uses `@fhevm/mock-utils` (RPC http://localhost:8545)
- Sepolia: loads UMD `@zama-fhe/relayer-sdk` then `initSDK()` → `createInstance()`




