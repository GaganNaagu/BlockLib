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
- [ ] Complete Prisma schema (`User`, `Book`, `BookCopy`, `BlockchainTransaction`, `BlockchainEvent`)
- [ ] Nonce-based wallet signature verification
- [ ] Profile and book metadata APIs
- [ ] Read-only provider and idempotent event indexer (`(txHash, logIndex)`)
- [ ] Transaction lookup and state reconciliation APIs

### Phase 6 — Admin portal
- [ ] Admin login & authorized wallet check
- [ ] Admin dashboard (statistic cards)
- [ ] Book management (list, search, register book, add copies)
- [ ] Member management (register student, link wallet, activate/deactivate)
- [ ] Lending management (active loans, return confirmation, overdue status)
- [ ] Reservations queue view
- [ ] Fine management & settlement inspection
- [ ] Transaction history view

### Phase 7 — Student portal
- [ ] Student login & linked wallet verification
- [ ] Student dashboard
- [ ] Book catalogue & search with copy availability
- [ ] Borrow available copy & reserve unavailable title
- [ ] Cancel reservation
- [ ] My Loans & lending history
- [ ] My Fines & simulated fine settlement
- [ ] My Transactions view

### Phase 8 — End-to-end testing
- [ ] Verify full 15-step scenario with 1 admin wallet and 2+ student wallets
- [ ] Verify overdue fine calculation with controlled local-chain time

### Phase 9 — Final quality and documentation
- [ ] Run all contract tests, frontend build/typecheck, backend typecheck/tests
- [ ] Prepare seed data and reset/redeploy commands
- [ ] Write `docs/setup.md`, `docs/smart-contracts.md`, `docs/testing.md`, `docs/demo-script.md`
- [ ] Update `README.md` and capture genuine screenshots

---

## Mandatory Test & Demonstration Scenarios (Section 11)
- [ ] 1. Register book — confirmed transaction
- [ ] 2. Register physical copies — unique copies recorded
- [ ] 3. Register member — member wallet registered
- [ ] 4. View catalogue — book and copy availability visible
- [ ] 5. Borrow available copy — lending record created
- [ ] 6. Borrow same copy again — transaction rejected
- [ ] 7. Borrow as inactive/unregistered member — transaction rejected
- [ ] 8. Exceed active loan limit (max 3) — transaction rejected
- [ ] 9. Reserve unavailable title — reservation recorded
- [ ] 10. Cancel own reservation — reservation cancelled
- [ ] 11. Return borrowed book — return recorded
- [ ] 12. Return same loan twice — transaction rejected
- [ ] 13. Return overdue book — fine calculated automatically
- [ ] 14. View outstanding fine — correct balance displayed
- [ ] 15. Settle fine — settlement transaction confirmed
- [ ] 16. Return copy with waiting reservation — next valid reservation receives priority
- [ ] 17. View transaction history — hash, block, and event visible

---

## Assumptions & Unresolved Decisions

1. **Specification filename:** The workspace contains `BlockLib_PLAN.md` rather than `PLAN.md`. We treat `BlockLib_PLAN.md` as the authoritative specification without renaming it unless requested.
2. **Windows npm execution:** PowerShell execution policy blocks `npm.ps1`. All npm commands in this environment must use `npm.cmd` (or `cmd /c npm`).
3. **PostgreSQL availability:** `psql` was not found on PATH during Phase 0 inspection. Before Phase 1 database migrations run, we need to confirm whether PostgreSQL is installed locally (e.g., via standard Windows service / Docker) or needs to be configured.
4. **Node.js `v24.15.0` & Hardhat:** Hardhat v2 vs. Node v24 compatibility will be verified in Phase 2 when installing `apps/blockchain` dependencies (and if Hardhat v2 warns on Node 24, we will document the exact tested version).
5. **Fine blocking threshold:** Section 5.2 specifies *"The member is not blocked by the configured outstanding-fine rule."* We will configure an explicit `maxAllowedFine` (default `0`, i.e., any unpaid fine > 0 blocks new borrows until settled) as a clearly documented constant/configurable parameter in `Library.sol`.
