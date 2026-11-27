# BlockLib Implementation Checklist & Decisions

Authoritative specification: [BlockLib_PLAN.md](../BlockLib_PLAN.md)

## Phase Checklist

### Phase 0 — Repository inspection and planning
- [x] Inspect workspace and confirm Node.js (`v24.15.0`), npm (`npm.cmd 11.12.1`), and Git (`2.53.0`)
- [x] Initialize Git repository and `.gitignore`
- [x] Create monorepo structure (`apps/web`, `apps/api`, `apps/blockchain`, `prisma`, `docs`)
- [x] Create root `package.json`, `.env.example`, and `README.md`
- [x] Create `docs/architecture.md`
- [x] Create `docs/checklist.md` with assumptions and unresolved decisions
- [x] Generate UI/UX design system baseline (`design-system/blocklib/MASTER.md`)

### Phase 1 — Project foundation
- [x] Create React + TypeScript + Vite + Tailwind CSS frontend (`apps/web`)
- [x] Create Express + TypeScript backend (`apps/api`)
- [x] Configure PostgreSQL and Prisma (`prisma/schema.prisma`, root `prisma:*` scripts)
- [x] Create initial `User` and `Book` metadata models and run initial migration
- [x] Add environment configuration validation
- [x] Add `GET /api/health` endpoint
- [x] Add basic login (`POST /api/auth/login`, `GET /api/auth/me`) and role-based route protection
- [x] Create shared API response and error formats
- [x] Seed initial admin and student test accounts

### Phase 2 — Hardhat and wallet setup
- [x] Initialize Hardhat in `apps/blockchain`
- [x] Configure Solidity `0.8.x` (`0.8.28`) compiler and local network (`chainId: 31337`)
- [x] Document MetaMask local network setup and test accounts (`docs/setup.md`)
- [x] Write and test minimal contract (`TestConnection.sol`) and deployment script (`deploy-test.ts`)

### Phase 3 — Implement `Library.sol`
- [x] Admin/deployer identity & access control
- [x] Member registration & active status
- [x] Book and physical copy registration
- [x] Read functions for books, copies, members, loans, reservations, fines
- [x] Borrowing and lending records
- [x] Return confirmation & overdue fine calculation (`block.timestamp`, integer INR)
- [x] Fine balance & simulated settlement
- [x] FIFO reservation queue, cancellation, and return-time allocation
- [x] All required events (`BookRegistered`, `BookCopyRegistered`, `MemberRegistered`, `BookBorrowed`, `BookReturned`, `BookReserved`, `ReservationCancelled`, `ReservationAllocated`, `FineSettled`)

### Phase 4 — Contract tests and deployment
- [x] Access and registration tests
- [x] Borrowing rule tests
- [x] Return and fine calculation/settlement tests
- [x] Reservation queue and allocation tests
- [x] Deployment script (`apps/blockchain/scripts/deploy.ts`) exporting address/ABI
- [x] Contract and testing documentation (`docs/smart-contracts.md`, `docs/testing.md`)

### Phase 5 — Backend integration
- [x] Complete Prisma schema (`User`, `Book`, `BookCopy`, `BlockchainTransaction`, `BlockchainEvent` with unique `(txHash, logIndex)`)
- [x] Nonce-based wallet signature verification (`/api/auth/wallet-nonce`, `/api/auth/verify-wallet`)
- [x] Profile, book metadata, member, and dashboard APIs
- [x] Read-only provider and idempotent event indexer (`(txHash, logIndex)`)
- [x] Transaction lookup and state sync/reconciliation APIs

### Phase 6 — Admin portal
- [x] Admin login & authorized wallet verification
- [x] Admin dashboard (statistic cards)
- [x] Book management (list, search, register book, add copies)
- [x] Member management (register student, link wallet, activate/deactivate)
- [x] Lending management (active loans, return confirmation, overdue status)
- [x] Reservations queue view
- [x] Fine management & settlement inspection
- [x] Transaction history view

### Phase 7 — Student portal
- [x] Student login & linked wallet verification
- [x] Student dashboard
- [x] Book catalogue & search with copy availability
- [x] Borrow available copy & reserve unavailable title
- [x] Cancel reservation
- [x] My Loans & lending history
- [x] My Fines & simulated fine settlement
- [x] My Transactions view

### Phase 8 — End-to-end testing
- [x] Verify full 15-step scenario with 1 admin wallet and 2+ student wallets (`E2E.test.ts`)
- [x] Verify overdue fine calculation with controlled local-chain time

### Phase 9 — Final quality and documentation
- [x] Run all contract tests, frontend build/typecheck, backend typecheck
- [x] Prepare seed data and reset/redeploy commands (`demo:reset`, `seed-demo.ts`, `start-blocklib.bat`, `start-blocklib.sh`)
- [x] Write `docs/setup.md`, `docs/smart-contracts.md`, `docs/testing.md`, `docs/demo-script.md`, `docs/viva-guide.md`
- [x] Update `README.md` with complete setup and demo instructions

---

## Mandatory Test & Demonstration Scenarios (Section 11)
- [x] 1. Register book — confirmed transaction
- [x] 2. Register physical copies — unique copies recorded
- [x] 3. Register member — member wallet registered
- [x] 4. View catalogue — book and copy availability visible
- [x] 5. Borrow available copy — lending record created
- [x] 6. Borrow same copy again — transaction rejected
- [x] 7. Borrow as inactive/unregistered member — transaction rejected
- [x] 8. Exceed active loan limit (max 3) — transaction rejected
- [x] 9. Reserve unavailable title — reservation recorded
- [x] 10. Cancel own reservation — reservation cancelled
- [x] 11. Return borrowed book — return recorded
- [x] 12. Return same loan twice — transaction rejected
- [x] 13. Return overdue book — fine calculated automatically
- [x] 14. View outstanding fine — correct balance displayed
- [x] 15. Settle fine — settlement transaction confirmed
- [x] 16. Return copy with waiting reservation — next valid reservation receives priority
- [x] 17. View transaction history — hash, block, and event visible

---

## Assumptions & Unresolved Decisions

1. **Specification filename:** The workspace contains `BlockLib_PLAN.md` rather than `PLAN.md`. We treat `BlockLib_PLAN.md` as the authoritative specification without renaming it unless requested.
2. **Windows npm execution:** PowerShell execution policy blocks `npm.ps1`. All npm commands in this environment must use `npm.cmd` (or `cmd /c npm`).
3. **PostgreSQL availability:** `psql` was not found on PATH during Phase 0 inspection. Before Phase 1 database migrations run, we need to confirm whether PostgreSQL is installed locally (e.g., via standard Windows service / Docker) or needs to be configured.
4. **Node.js `v24.15.0` & Hardhat:** Hardhat v2 vs. Node v24 compatibility will be verified in Phase 2 when installing `apps/blockchain` dependencies (and if Hardhat v2 warns on Node 24, we will document the exact tested version).
5. **Fine blocking threshold:** Section 5.2 specifies *"The member is not blocked by the configured outstanding-fine rule."* We will configure an explicit `maxAllowedFine` (default `0`, i.e., any unpaid fine > 0 blocks new borrows until settled) as a clearly documented constant/configurable parameter in `Library.sol`.
