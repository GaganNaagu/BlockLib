# BlockLib — Blockchain-Based Library Book Lending System

**Course:** 22CS732 — Blockchain Technology (Team 16, Section B)  
**Team:** Gagan S G (`02JST23UCS030`), Ekanth LS (`01JST23UCS042`), Hithen S Gowda (`01JST23UCS052`)

BlockLib is a full-stack decentralized library lending application backed by a local Ethereum-compatible EVM blockchain (Hardhat Network), a Solidity smart contract (`Library.sol`), an Express + Prisma + PostgreSQL backend, and a React + TypeScript + Tailwind CSS frontend with MetaMask integration.

---

## 1. Prerequisites
- **Node.js** `v20+` (tested on `v24.15.0`)
- **PostgreSQL 16+** running locally on port `5432`
- **MetaMask** browser extension
- **Git**

> **Windows PowerShell note:** If `npm` is blocked by execution policy (`npm.ps1 cannot be loaded`), prefix commands with `cmd /c "npm ..."` or run them in **Command Prompt (`cmd`)**.

---

## 2. First-Time Setup

1. **Clone & install dependencies:**
   ```powershell
   git clone https://github.com/GaganNaagu/BlockLib.git
   cd BlockLib
   cmd /c "npm install"
   ```

2. **Create PostgreSQL database `blocklib`:**
   ```sql
   CREATE DATABASE blocklib;
   ```

3. **Configure `.env`:**
   ```powershell
   Copy-Item .env.example .env
   ```
   Update `DATABASE_URL` with your PostgreSQL username/password and set a local `JWT_SECRET`.  
   For local Hardhat, the first deployed contract address is always `0x5FbDB2315678afecb367f032d93F642f64180aa3`:
   ```env
   LIBRARY_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
   VITE_LIBRARY_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
   ```

4. **Generate Prisma client & run initial migration:**
   ```powershell
   cmd /c "npm run prisma:generate"
   cmd /c "npm run prisma:migrate -- --name init"
   ```

---

## 3. One-Click Startup (Recommended for Demo)

### Windows
Double-click **`start-blocklib.bat`** (or run `.\start-blocklib.bat` in PowerShell).  
It automatically opens **3 separate terminals**:
1. **Hardhat Local Blockchain** (`http://127.0.0.1:8545`, Chain ID `31337`)
2. **Demo Reset + Express API** (resets DB, deploys `Library.sol`, seeds 1 Admin + 2 Students + 2 Sample Books on-chain & in PostgreSQL, and starts API on `http://localhost:4000`)
3. **React + Vite Frontend** (`http://localhost:5173`)

### Linux / macOS / Git Bash
```bash
chmod +x start-blocklib.sh
./start-blocklib.sh
```

---

## 4. Manual Startup (3 Terminals)

If you prefer starting each service manually:

- **Terminal 1 — Local Blockchain:**
  ```powershell
  cmd /c "npm run node:blockchain"
  ```
- **Terminal 2 — Reset/Seed Demo & Start API:**
  ```powershell
  cmd /c "npm run demo:reset && npm run dev:api"
  ```
- **Terminal 3 — Frontend:**
  ```powershell
  cmd /c "npm run dev:web"
  ```

---

## 5. MetaMask Setup (One-Time)
1. Open MetaMask → **Add a custom network**:
   - **Network Name:** `Hardhat Local`
   - **RPC URL:** `http://127.0.0.1:8545`
   - **Chain ID:** `31337`
   - **Currency Symbol:** `ETH`
2. Import the deterministic Hardhat accounts (printed by `node:blockchain`):
   - **Account #0 (Admin):** `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
   - **Account #1 (Student 1):** `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`
   - **Account #2 (Student 2):** `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`

> **Important Demo Tip:** If you restart `node:blockchain` after sending transactions in a previous session, MetaMask may show `"Nonce too high"`. Clear MetaMask's activity tab data once in MetaMask Settings before starting the demo, and **keep `node:blockchain` running** during the entire demo.

---

## 6. Seeded Demo Login Credentials

| Role | Email | Password | Linked Hardhat Wallet |
|---|---|---|---|
| **Admin** | `admin@blocklib.edu` | `Admin@123` | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` (Account #0) |
| **Student 1 (Gagan S G)** | `student1@blocklib.edu` | `Student@123` | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` (Account #1) |
| **Student 2 (Ekanth LS)** | `student2@blocklib.edu` | `Student@123` | `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` (Account #2) |

---

## 7. Verification Commands
```powershell
cmd /c "npm run test:blockchain"   # Smart contract unit + E2E tests
cmd /c "npm run build:api"         # Backend TypeScript check & build
cmd /c "npm run build:web"         # Frontend TypeScript check & Vite build
```

---

## 8. Documentation Index
- [System Architecture](docs/architecture.md)
- [Smart Contract Reference (`Library.sol`)](docs/smart-contracts.md)
- [Testing Summary](docs/testing.md)
- [5–7 Minute Faculty Demo Script](docs/demo-script.md)
- [Viva & Technical Explanation Guide](docs/viva-guide.md)
- [Implementation Checklist](docs/checklist.md)
