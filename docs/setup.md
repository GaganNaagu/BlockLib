# BlockLib Local Development Setup

## 1. Prerequisites
- **Node.js** (v20+ recommended; tested on v24.15.0)
- **PostgreSQL 16+** running locally on port `5432`
- **MetaMask** browser extension
- **Git**

> **Windows PowerShell note:** If `npm` is blocked by execution policy (`npm.ps1 cannot be loaded`), prefix commands with `cmd /c "npm ..."` or use `npm.cmd`.

---

## 2. Environment Configuration
1. Copy `.env.example` to `.env` in the repository root:
   ```powershell
   Copy-Item .env.example .env
   ```
2. Update `DATABASE_URL` with your local PostgreSQL username and password, and set a local `JWT_SECRET`.
3. Never commit `.env` or any private keys.

---

## 3. Database & API Setup
```powershell
cmd /c "npm install"
cmd /c "npm run prisma:generate"
cmd /c "npm run prisma:migrate -- --name init"
cmd /c "npm run prisma:seed"
cmd /c "npm run dev:api"
```

---

## 4. Local Blockchain (Hardhat Network) Setup
1. Start the local Hardhat node in a dedicated terminal (keep it running):
   ```powershell
   cmd /c "npm run node:blockchain"
   ```
   Hardhat prints 20 deterministic local test accounts (each funded with 10,000 ETH) and listens at:
   - **RPC URL:** `http://127.0.0.1:8545`
   - **Chain ID:** `31337`

2. Deploy the Phase 2 test contract and submit a verification transaction:
   ```powershell
   cmd /c "npm --workspace=apps/blockchain run deploy:test"
   ```
   This deploys `TestConnection.sol`, sends a `ping` transaction, prints the transaction hash and confirmed block number, and writes the contract address + ABI to `apps/blockchain/deployments/TestConnection.json`.

---

## 5. MetaMask Local Network Configuration
1. Open **MetaMask** → click the network selector (top-left) → **Add a custom network**.
2. Enter:
   - **Network name:** `Hardhat Local`
   - **Default RPC URL:** `http://127.0.0.1:8545`
   - **Chain ID:** `31337`
   - **Currency symbol:** `ETH`
3. Save and switch MetaMask to **Hardhat Local**.
4. Import local development accounts from the `npm run node:blockchain` terminal output:
   - **Account #0** (`0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`) → **Admin / Deployer**
   - **Account #1** (`0x70997970C51812dc3A010C7d01b50e0d17dc79C8`) → **Student 1**
   - **Account #2** (`0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`) → **Student 2**
   > **Security warning:** These Hardhat private keys are publicly known and for **local development only**. Never send real funds to them.

---

## 6. Frontend Setup
```powershell
cmd /c "npm run dev:web"
```
Open `http://localhost:5173`.
