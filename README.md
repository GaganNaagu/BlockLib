# BlockLib — Blockchain-Based Library Book Lending System

**Course:** 22CS732 — Blockchain Technology (Team 16, Section B)  
**Team:** Gagan S G (`02JST23UCS030`), Ekanth LS (`01JST23UCS042`), Hithen S Gowda (`01JST23UCS052`)

BlockLib is a full-stack decentralized library lending application backed by a local Ethereum-compatible EVM blockchain (Hardhat Network), a Solidity smart contract (`Library.sol`), an Express + Prisma + PostgreSQL backend, and a React + TypeScript + Tailwind CSS frontend with MetaMask integration.

---

## 1. Prerequisites

Install these on your machine before starting:
1. **Node.js** `v20+` (tested on `v24.15.0`) — [nodejs.org](https://nodejs.org/)
2. **PostgreSQL 16+** running locally on port `5432` — [postgresql.org](https://www.postgresql.org/download/)
3. **MetaMask** browser extension (Chrome / Edge / Brave) — [metamask.io](https://metamask.io/download/)
4. **Git** — [git-scm.com](https://git-scm.com/)

> **Windows PowerShell note:** If PowerShell blocks `npm` (`npm.ps1 cannot be loaded`), prefix commands with `cmd /c "npm ..."` or run them in **Command Prompt (`cmd`)**.

---

## 2. Step-by-Step Setup (From 0 to Running)

### Step 1: Clone the repository and install dependencies
```powershell
git clone https://github.com/GaganNaagu/BlockLib.git
cd BlockLib
cmd /c "npm install"
```

### Step 2: Create the PostgreSQL database
Ensure the PostgreSQL service (`postgresql-x64-16`) is running, then create a database named `blocklib`:

- **Using pgAdmin 4:** Expand **Servers → PostgreSQL 16 → Databases** → right-click **Databases → Create → Database...** → name it `blocklib` → **Save**.
- **Or using `psql`:**
  ```powershell
  & "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres
  ```
  ```sql
  CREATE DATABASE blocklib;
  \q
  ```

### Step 3: Configure `.env`
```powershell
Copy-Item .env.example .env
```
Open `.env` and set your PostgreSQL password in `DATABASE_URL` and a local `JWT_SECRET`:
```env
PORT=4000
DATABASE_URL=postgresql://postgres:YOUR_POSTGRES_PASSWORD@localhost:5432/blocklib
JWT_SECRET=blocklib_local_dev_secret
```
*(You do **not** need to manually paste `LIBRARY_CONTRACT_ADDRESS` or `VITE_LIBRARY_CONTRACT_ADDRESS` — the deploy script automatically updates both inside `.env`! Never commit `.env` or `Accounts.md` to Git; if sharing with teammates, send `.env` privately.)*

### Step 4: Generate Prisma client & run the initial migration
```powershell
cmd /c "npm run prisma:generate"
cmd /c "npm run prisma:migrate -- --name init"
```

---

## 3. Starting the Application

### Option A — One-Click Launcher (Recommended)
- **Windows:** Double-click **`start-blocklib.bat`** (or run `.\start-blocklib.bat`).
- **Linux / macOS / Git Bash:** Run `chmod +x start-blocklib.sh && ./start-blocklib.sh`.

This automatically opens **3 terminals**:
1. **Hardhat Local Blockchain** (`http://127.0.0.1:8545`, Chain ID `31337`)
2. **Demo Reset + API** (`npm run demo:reset && npm run dev:api`):
   - Resets PostgreSQL and seeds 1 Admin + 2 Students
   - Deploys `Library.sol` and **auto-updates `.env`** with the contract address
   - Registers both students and 2 sample books on-chain
   - Auto-generates a local **`Accounts.md`** (gitignored) with all login emails, passwords, and MetaMask private keys
   - Starts Express API on `http://localhost:4000`
3. **React + Vite Frontend** (`http://localhost:5173`)

### Option B — Manual 3-Terminal Startup
- **Terminal 1:** `cmd /c "npm run node:blockchain"`
- **Terminal 2:** `cmd /c "npm run demo:reset && npm run dev:api"`
- **Terminal 3:** `cmd /c "npm run dev:web"`

Open **`http://localhost:5173`** in your browser.

---

## 4. MetaMask Setup & Connection Guide (0 to End)

### Part A: Add the Hardhat Local Network
1. Open the **MetaMask** extension and unlock it.
2. Click the **network selector** in the top-left corner → **Add a custom network**.
3. Enter these exact values and click **Save**:
   - **Network Name:** `Hardhat Local`
   - **Default RPC URL:** `http://127.0.0.1:8545`
   - **Chain ID:** `31337`
   - **Currency Symbol:** `ETH`
4. Make sure **Hardhat Local** is selected in the top-left network dropdown.

### Part B: Import Demo Accounts into MetaMask
When `demo:reset` (or `start-blocklib.bat`) finishes, open the generated **`Accounts.md`** file in the project root — it lists the exact private keys for Account #0, #1, and #2.

1. In MetaMask, click the **account selector** at the top-center → **Add account or hardware wallet** → **Import account**.
2. Paste the **Private Key** from `Accounts.md` and click **Import**.
3. Repeat for all 3 accounts and rename them in MetaMask for easy switching:
   - **Account #0 (`0xf39F...2266`)** → `BlockLib Admin`
   - **Account #1 (`0x7099...79C8`)** → `BlockLib Student 1`
   - **Account #2 (`0x3C44...93BC`)** → `BlockLib Student 2`
4. Each account should show **`10000 ETH`** on `Hardhat Local` (fake local test ETH).

### Part C: Connect & Verify Wallet in BlockLib
1. Sign in to BlockLib at `http://localhost:5173` (e.g., `admin@blocklib.edu` / `Admin@123`).
2. Make sure the matching account (`BlockLib Admin`) is active in MetaMask.
3. Click **Connect Wallet** in the top-right header of BlockLib → approve MetaMask → click **Sign** on the nonce verification message.
4. The header will show your shortened address and a green **`Verified`** badge.

> **Troubleshooting `"Nonce too high"`:** If you restart `node:blockchain` after sending transactions in an earlier session, MetaMask's cached nonce will be ahead of the fresh chain. Open MetaMask **Settings → Transactions (or Developer tools) → Clear activity tab data**, and keep `node:blockchain` running throughout your demo.

---

## 5. Seeded Demo Login Credentials

| Role | Email | Password | Linked Hardhat Wallet |
|---|---|---|---|
| **Admin** | `admin@blocklib.edu` | `Admin@123` | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` (Account #0) |
| **Student 1 (Gagan S G)** | `student1@blocklib.edu` | `Student@123` | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` (Account #1) |
| **Student 2 (Ekanth LS)** | `student2@blocklib.edu` | `Student@123` | `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` (Account #2) |

---

## 6. Verification Commands
```powershell
cmd /c "npm run test:blockchain"   # Smart contract unit + Phase 8 E2E tests
cmd /c "npm run build:api"         # Backend TypeScript check & build
cmd /c "npm run build:web"         # Frontend TypeScript check & Vite build
```

---

## 7. Documentation Index
- [System Architecture](docs/architecture.md)
- [Smart Contract Reference (`Library.sol`)](docs/smart-contracts.md)
- [Testing Summary](docs/testing.md)
- [5–7 Minute Faculty Demo Script](docs/demo-script.md)
- [Viva & Technical Explanation Guide](docs/viva-guide.md)
- [Implementation Checklist](docs/checklist.md)
