# BlockLib Architecture

## 1. Overview

BlockLib is a blockchain-backed library book lending system designed for academic evaluation. It uses a three-area monorepo with one Solidity smart contract, one React + TypeScript frontend, one Express + TypeScript backend, and one PostgreSQL database.

```text
                         BLOCKLIB
                            |
             +--------------+--------------+
             |                             |
       React Frontend                Express Backend
       Admin Portal                  Authentication
       Student Portal                Profile APIs
       MetaMask / ethers             Catalogue APIs
             |                       Event indexing
             |                             |
             |                       PostgreSQL (Prisma)
             |                       User profiles
             |                       Book metadata
             |                       Search/index data
             |                       Transaction index
             |
        ethers.js
             |
        Library.sol
        Solidity contract
             |
      Hardhat local EVM
      Blockchain ledger
```

## 2. Application Layers

### 2.1 Frontend (`apps/web`)
- **Stack:** React, TypeScript, Vite, Tailwind CSS, `ethers.js`.
- **Portals:** Role-based navigation separating the **Admin/Librarian Portal** and **Student Portal**, plus shared login, wallet connection, wallet-mismatch, and profile views.
- **Responsibilities:**
  - Authenticate users via the Express API (JWT/session).
  - Connect to MetaMask, verify the connected wallet matches the user's profile via a nonce-based signature challenge, and prompt for network switching to Hardhat Local (`chainId: 31337`).
  - Submit state-changing blockchain transactions directly through the user's MetaMask wallet and `ethers.js`.
  - Display accurate transaction states (`Pending`, `Confirmed`, `Failed`) and verifiable transaction hashes/block numbers.

### 2.2 Backend (`apps/api` + `prisma/`)
- **Stack:** Node.js, Express, TypeScript, Prisma ORM, PostgreSQL.
- **Responsibilities:**
  - Application authentication, password hashing, JWT issuance, and role-based route protection (`ADMIN` vs. `STUDENT`).
  - Nonce-based wallet ownership verification.
  - Off-chain user profile storage (name, USN, email, role, linked wallet address).
  - Searchable book catalogue metadata and presentation.
  - Read-only connection to the local Hardhat EVM node to listen for and index `Library.sol` events into PostgreSQL (`BlockchainTransaction`, `BlockchainEvent` with unique `(txHash, logIndex)`).
  - Reconciliation/lookup endpoints without overriding authoritative on-chain state.

### 2.3 Blockchain (`apps/blockchain`)
- **Stack:** Solidity `0.8.x`, Hardhat, Hardhat Network, Mocha/Chai.
- **Contract:** Single contract at `apps/blockchain/contracts/Library.sol`.
- **Responsibilities:**
  - Authoritative source of truth for registered member wallet status, book/copy identifiers, copy availability (`AVAILABLE`, `BORROWED`, `RESERVED`), active loans, due timestamps, FIFO reservation queues, calculated overdue fines (integer INR), and fine settlements.
  - Emit events (`BookRegistered`, `BookCopyRegistered`, `MemberRegistered`, `BookBorrowed`, `BookReturned`, `BookReserved`, `ReservationCancelled`, `ReservationAllocated`, `FineSettled`) for backend indexing.

## 3. Responsibility Boundaries

| Concern | Authoritative Store | Notes |
|---|---|---|
| Member active status, loan count, fine balance | `Library.sol` (on-chain) | Enforced by contract modifiers/checks |
| Book & physical copy availability & lending state | `Library.sol` (on-chain) | Students borrow specific `copyId`s |
| Reservation FIFO queue & allocation | `Library.sol` (on-chain) | Allocated automatically on return |
| Overdue penalty calculation (`floor(overdueSeconds / 1 day) * finePerDay`) | `Library.sol` (on-chain) | Uses `block.timestamp` and integer arithmetic |
| Student names, USNs, emails, passwords, roles | PostgreSQL | Never stored on-chain |
| Catalogue search metadata & indexed event cache | PostgreSQL | Read optimization only; never overrides chain state |

## 4. Transaction & Synchronization Lifecycle

1. Frontend requests a contract write via `ethers.js` and MetaMask.
2. User signs and submits the transaction in MetaMask; UI shows `Pending`.
3. Frontend awaits the transaction receipt (`tx.wait()`).
4. If the receipt succeeds (`status === 1`), UI shows `Confirmed` with the transaction hash and block number.
5. Backend indexes emitted events into PostgreSQL (idempotent on `(txHash, logIndex)`).
6. If the transaction reverts or is rejected, UI shows `Failed` and PostgreSQL does not record the operation as completed.

## 5. Core Default Business Rules

| Rule | Default Value |
|---|---|
| Maximum active loans per student | 3 |
| Loan period | 14 days |
| Overdue fine | ₹5 per overdue day (integer INR) |
| Reservation order | First-come-first-served (FIFO) |
| Local network | Hardhat Network (`chainId: 31337`, `http://127.0.0.1:8545`) |
