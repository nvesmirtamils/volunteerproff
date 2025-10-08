# VolunteerProof Hardhat

## Env

Set environment variables:

```
PRIVATE_KEY=0x...
INFURA_API_KEY=...
ETHERSCAN_API_KEY=...
```

## Install & Compile

```
npm install
npm run compile
```

## Deploy

Local:

```
npx hardhat node
npm run deploy:localhost
```

Sepolia:

```
npm run deploy:sepolia
```

Copy deployed `VolunteerProof` address into frontend `abi/VolunteerProofAddresses.ts`.




