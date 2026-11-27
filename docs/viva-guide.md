# BlockLib — Complete Technical & Viva Explanation Guide

This document explains **every technology chosen**, **why it was used**, **how each development phase fits together**, and **common faculty/viva questions**.

---

## 1. Technologies Used and Why

| Layer | Technology | Why It Was Chosen |
|---|---|---|
| **Smart Contract** | **Solidity (`0.8.28`)** | Enforces lending rules (`maxActiveLoans = 3`, `14 days` loan period, `₹5/day` fine, FIFO reservations, no double-borrowing) on-chain so no single database admin can silently alter rules. |
| **Local Blockchain** | **Hardhat + Hardhat Network** | Provides a fast, deterministic local Ethereum Virtual Machine (EVM) with 20 pre-funded test accounts (`chainId: 31337`), instant mining, and time-manipulation helpers (`time.increase`) for testing 14-day overdue fines in milliseconds. |
| **Wallet & Signing** | **MetaMask** | Demonstrates asymmetric key pairs, Ethereum addresses, and digital signatures (Syllabus Unit 4). Ensures only the owner of a wallet can authorize transactions on their behalf. |
| **Blockchain SDK** | **ethers.js (`v6`)** | Connects both the React frontend (via `BrowserProvider` + MetaMask signer) and the Express backend (via read-only `JsonRpcProvider` + `getLogs`) to `Library.sol`. |
| **Frontend** | **React + TypeScript + Vite + Tailwind CSS** | Single-page application with strict TypeScript types, fast Vite bundling, and role-based Admin and Student portals. |
| **Backend** | **Node.js + Express + TypeScript** | Handles off-chain JWT authentication, nonce-based wallet ownership verification, searchable catalogue APIs, and idempotent blockchain event indexing. |
| **Database & ORM** | **PostgreSQL + Prisma** | Stores sensitive personal data (student names, USNs, emails, password hashes) off-chain and caches indexed blockchain events (`(txHash, logIndex)` unique) for fast querying. |

---

## 2. Phase-by-Phase Build Summary

- **Phase 0 (Planning & Monorepo):** Created the 3-area monorepo (`apps/web`, `apps/api`, `apps/blockchain`), `docs/architecture.md`, and the UI/UX design system (`design-system/blocklib/MASTER.md`).
- **Phase 1 (Foundation):** Built the Express API (`GET /api/health`, `POST /api/auth/login`, `GET /api/auth/me`, JWT + role middleware), Prisma `User`/`Book` models, and React login + protected routing.
- **Phase 2 (Hardhat & Wallet):** Configured Hardhat (`chainId: 31337`), Solidity `0.8.28`, MetaMask local network setup, and `TestConnection.sol` verification.
- **Phase 3 (`Library.sol`):** Implemented the single authoritative smart contract with per-copy lending (`copyId`), borrower/admin return confirmation, `block.timestamp` integer fine calculation, `settleFine()`, and an $O(1)$-amortized FIFO reservation queue using `bookQueueHead`.
- **Phase 4 (Contract Tests & Deploy):** Wrote 11 automated Mocha/Chai tests covering access control, borrowing limits, overdue fines, and reservations, plus `deploy.ts` exporting `Library.json`.
- **Phase 5 (Backend Integration):** Added `BookCopy`, `BlockchainTransaction`, and `BlockchainEvent` (`@@unique([txHash, logIndex])`) to Prisma, nonce-based wallet signature verification (`ethers.verifyMessage`), and a `getLogs` polling event indexer that ignores failed/reverted transactions.
- **Phase 6 (Admin Portal):** Connected MetaMask (`WalletContext`), `TxStatusBanner` (`Pending`/`Confirmed`/`Failed`), and all 7 Admin pages (Dashboard, Books & Copies, Members, Lending & Returns, Reservations, Fines, Transactions).
- **Phase 7 (Student Portal):** Built all 6 Student pages (Dashboard, Book Catalogue with Borrow/Reserve/Claim, My Loans with Return, My Reservations with Cancel, My Fines with Settle, My Transactions).
- **Phase 8 (End-to-End Testing):** Added `E2E.test.ts` automating the full 15-step multi-student lifecycle including controlled time-travel overdue fine verification.
- **Phase 9 (Final Quality & Launchers):** Added `demo:reset` (DB + contract deploy + on-chain seed in one command), `start-blocklib.bat` / `start-blocklib.sh`, `README.md`, and this guide.

---

## 3. Syllabus Mapping (22CS732)

- **Distributed Ledger & Blockchain:** Every lending, return, reservation, and fine settlement is recorded as an immutable EVM transaction.
- **Blocks & Chained Blocks:** The UI and Transaction History display the confirmed **block number** and **transaction hash**.
- **Hashing:** Ethereum transaction hashes use **Keccak-256** (note: distinct from SHA-256).
- **Smart Contracts:** `Library.sol` enforces library rules deterministically on the EVM without trusting client-side checks.
- **Cryptography & Key Pairs:** MetaMask signs both **nonce verification messages** (`personal_sign`) and **on-chain transactions** using the user's private key.
- **Consensus (Academic Accuracy):** Hardhat Network is a local single-node development EVM used for deterministic testing and demonstration; BlockLib does not claim to implement a custom BFT consensus protocol.

---

## 4. Common Viva / Faculty Questions & Answers

1. **Why not store student names and USNs on the blockchain?**  
   Public/consortium ledgers are transparent and immutable. Storing PII (names, USNs, emails) on-chain violates privacy. Instead, PostgreSQL stores personal profiles off-chain, and `Library.sol` only maps **wallet addresses** to loan counts, fines, and reservations.

2. **Why does MetaMask ask to confirm a small amount of ETH (e.g., `0.0001 ETH`) for adding or borrowing a book?**  
   That is **Gas** — the EVM computational fee required to execute state-changing transactions. On Hardhat Local, it uses **fake test ETH** from the 10,000 ETH test balance. No real money is spent; library fines are tracked separately as **integer INR** in `Library.sol`.

3. **Why did we need a "Sync On-Chain" / `demo:reset` step?**  
   PostgreSQL persists on disk, while Hardhat Local runs in memory. `demo:reset` synchronizes both by resetting PostgreSQL, deploying `Library.sol`, and registering the seeded student wallets and initial books on-chain in one step.

4. **How do you prevent two students from borrowing the same physical book?**  
   Borrowing operates on a unique physical **`copyId`** (e.g., `1001`), not just the abstract title. Once `copies[1001].status` becomes `BORROWED`, any concurrent or subsequent `borrowBook(1001)` call reverts inside `Library.sol`.

5. **How is the overdue fine calculated?**  
   Using the blockchain's `block.timestamp` and integer division:  
   `overdueDays = (block.timestamp - dueAt) / 1 days`, `fine = overdueDays * 5`.  
   Integer rupees avoid floating-point rounding bugs in Solidity.
