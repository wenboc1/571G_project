# CampusGov – Assignment 3 Implementation

## Overview

CampusGov is a simple DAO-style voting dApp built with Solidity, Hardhat, React, MetaMask, and `ethers.js`.

Current implementation:

- proposal creation is gated by CGOV token balance
- voting is one-address-one-vote
- users can vote Yes / No
- proposals can be closed after the voting period ends
- frontend supports wallet connection and contract interaction

---

## Backend Setup

Install dependencies in the project root:

```bash
npm install
```

Compile contracts:

```bash
npx hardhat compile
```

Run tests:

```bash
npx hardhat test
```

---

## Local Deployment

Start a local Hardhat network:

```bash
npx hardhat node
```

Keep this terminal open.

In a second terminal, deploy the contracts:

```bash
npx hardhat run scripts/deploy.js --network localhost
```

After deployment, save the two contract addresses printed in the terminal:

- `CGOVToken deployed to: 0x...`
- `CampusGov deployed to: 0x...`

You will need these addresses for the frontend.

---

## Frontend Setup

Go to the frontend folder and install dependencies:

```bash
cd frontend
npm install
npm install ethers
```

Create this folder if needed:

```bash
mkdir -p src/abi
```

Copy ABI files from the backend build output into the frontend:

```bash
cp ../artifacts/contracts/CampusGov.sol/CampusGov.json src/abi/CampusGov.json
cp ../artifacts/contracts/CGOVToken.sol/CGOVToken.json src/abi/CGOVToken.json
```

Edit:

```bash
src/config.js
```

Set the deployed contract addresses:

```javascript
export const CGOV_TOKEN_ADDRESS = "YOUR_CGOVTOKEN_ADDRESS";
export const CAMPUS_GOV_ADDRESS = "YOUR_CAMPUSGOV_ADDRESS";
```

Start the frontend:

```bash
npm run dev
```

The app usually runs at:

```bash
http://localhost:5173
```

---

## MetaMask Configuration

Add the local Hardhat network in MetaMask:

- **Network Name**: `Hardhat Localhost`
- **RPC URL**: `http://127.0.0.1:8545`
- **Chain ID**: `31337`
- **Currency Symbol**: `ETH`

Then import a Hardhat test account from the `npx hardhat node` output.

Recommended: use **Account #0**, because it has test ETH and receives the initial CGOV token supply after deployment.

---

## How to Use (IMPORTANT)

1. Start `npx hardhat node`
2. Deploy contracts with `npx hardhat run scripts/deploy.js --network localhost`
3. Update `frontend/src/config.js` with the latest deployed addresses
4. Start the frontend with `npm run dev`
5. Open the frontend in the browser
6. Connect MetaMask
7. Create a proposal if your wallet holds enough CGOV
8. Vote Yes / No on active proposals
9. Close a proposal after the deadline

---

## Important Notes

- If you redeploy contracts, the contract addresses will change
- After every redeploy, update `frontend/src/config.js`
- If contract interaction fails, make sure:
  - `hardhat node` is still running
  - MetaMask is connected to `Hardhat Localhost`
  - MetaMask is using the correct Hardhat account
  - ABI files were copied from the latest compilation output
  - `config.js` contains the latest deployed addresses