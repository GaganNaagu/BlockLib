# BlockLib --- Project Development Plan

**Course:** 22CS732 --- Blockchain Technology\
**Project:** Blockchain-Based Library Book Lending System\
**Team:** 16, Section B\
**Team members:** - Gagan S G --- 02JST23UCS030 - Ekanth LS ---
01JST23UCS042 - Hithen S Gowda --- 01JST23UCS052

**Submission deadline:** 5 December 2026\
**Target IDE:** Google Antigravity IDE\
**Document purpose:** Implementation plan and working instructions for
the AI coding agent.

------------------------------------------------------------------------

## 1. Project brief

Build **BlockLib**, a small but complete library book lending
application backed by an Ethereum-compatible local blockchain.

The application must let an administrator manage books and library
members, and let registered students browse books, borrow available
copies, reserve unavailable titles, return borrowed books, view
outstanding overdue penalties, and inspect blockchain-backed activity.

The project must remain straightforward to build, explain and
demonstrate in an academic evaluation. Do not add enterprise features
that do not help satisfy the assigned problem.

### 1.1 Official assignment requirements

The Group 16 assignment describes a decentralized application for
recording:

-   Book borrowing
-   Book returns
-   Reservations
-   Outstanding penalties
-   Transparent smart-contract rules

The expected implementation explicitly includes:

1.  Book registration
2.  Member registration
3.  Lending records
4.  Return confirmation
5.  Overdue penalty calculation
6.  Digital transaction history

**All six expected implementation items and both additional
problem-statement requirements (reservations and outstanding penalties)
are mandatory.** Do not remove or replace them with mock screens.

### 1.2 Project objectives

-   Record important library lending operations on an
    Ethereum-compatible blockchain.
-   Enforce basic lending rules through a Solidity smart contract.
-   Prevent the same physical copy from being borrowed by two students
    simultaneously.
-   Record returns and calculate overdue penalties using blockchain
    timestamps.
-   Support a simple first-come-first-served reservation queue.
-   Display verifiable transaction hashes and transaction details.
-   Provide separate Admin/Librarian and Student interfaces.
-   Keep the implementation small enough for the team to understand and
    explain.

### 1.3 Out of scope

Do not implement the following unless explicitly approved later:

-   Real cryptocurrency or real-money payments
-   Ethereum mainnet deployment
-   NFT book ownership
-   Multiple blockchain networks
-   Hyperledger Fabric or Solana
-   Microservices
-   Redis, Kafka or Kubernetes
-   Email/SMS/push notification infrastructure
-   QR scanning
-   AI recommendations or chatbots
-   Complex analytics
-   A custom blockchain or consensus algorithm
-   A separate blockchain explorer product

------------------------------------------------------------------------

## 2. Syllabus alignment and technology decisions

The supplied 7th-semester syllabus covers blockchain fundamentals and
architecture, distributed ledgers, hashing, decentralization, consensus,
smart contracts, cryptography, Bitcoin and Ethereum. Unit 4 specifically
covers Ethereum, EVM, clients, key pairs, addresses, wallets,
transactions, Ethereum languages and development tools.

The prescribed textbook in the supplied syllabus is:

**Blockchain Technology: Concepts and Applications** --- Saurabh Kumar
and Ashutosh Saxena, Wiley Publications, 2020.

### 2.1 Selected implementation stack

  -----------------------------------------------------------------------
  Layer                   Technology              Reason
  ----------------------- ----------------------- -----------------------
  Blockchain platform     Ethereum-compatible EVM Aligns with the
                          local network           Ethereum topics in Unit
                                                  4

  Smart contract language Solidity                Implements the lending
                                                  rules

  Development environment Hardhat                 Compiles, deploys and
                                                  tests Solidity
                                                  contracts

  Local blockchain        Hardhat Network         Enables repeatable
                                                  local demonstrations

  Wallet                  MetaMask                Demonstrates wallet
                                                  addresses and
                                                  transaction signing

  Blockchain library      ethers.js               Connects the web
                                                  application to the
                                                  contract

  Frontend                React + TypeScript +    Admin and student user
                          Vite                    interfaces

  Styling                 Tailwind CSS            Consistent UI styling

  Backend                 Node.js + Express       Authentication and
                                                  supporting APIs

  Database                PostgreSQL              User profiles and
                                                  searchable catalogue
                                                  data

  ORM                     Prisma                  Database schema and
                                                  migrations

  Contract tests          Hardhat with Mocha/Chai Automated
                                                  smart-contract tests

  Version control         Git                     Team collaboration and
                                                  change tracking
  -----------------------------------------------------------------------

Use compatible, stable package versions and commit the lockfile. Do not
upgrade major dependencies partway through implementation without a
reason.

### 2.2 Syllabus concepts to demonstrate

  -----------------------------------------------------------------------
  Syllabus topic                      How BlockLib demonstrates or
                                      explains it
  ----------------------------------- -----------------------------------
  Distributed ledger and blockchain   Lending operations are recorded as
                                      blockchain transactions

  Blocks and chained blocks           Show block number and transaction
                                      hash for a confirmed operation

  Hashing                             Explain transaction hashes;
                                      optionally demonstrate SHA-256
                                      separately on a sample document

  Decentralization                    Explain that contract rules are
                                      executed by the blockchain network
                                      rather than trusted solely to a
                                      normal database

  Smart contracts                     Solidity functions enforce book and
                                      lending rules

  Cryptography and key pairs          MetaMask account, wallet address
                                      and transaction signature

  Ethereum and EVM                    Deploy and execute the Solidity
                                      contract on a local EVM-compatible
                                      network

  Transactions                        Show pending, confirmed and failed
                                      transactions

  Consensus                           Explain the local development
                                      network accurately; do not claim to
                                      have implemented a production
                                      consensus algorithm
  -----------------------------------------------------------------------

**Technical accuracy:** Ethereum transaction hashes use Keccak-256, not
SHA-256. If SHA-256 is demonstrated for Unit 2, identify it as a
separate hash demonstration, not as Ethereum's transaction-hash
algorithm. Hardhat Network is a local development environment; do not
claim that the project implements a new Byzantine fault-tolerant
consensus algorithm.

------------------------------------------------------------------------

## 3. Scope and user roles

The application has two user-facing portals.

### 3.1 Admin/Librarian portal

The admin can:

-   Sign in to the application.
-   Connect the authorised administrator wallet.
-   Register a book title.
-   Register one or more physical copies of a title.
-   Register a library member and associate their wallet address.
-   View the book catalogue and copy availability.
-   View active lending records.
-   Confirm a book return.
-   View reservations.
-   View outstanding fines.
-   Record a simulated fine settlement.
-   Inspect transaction history.

For the simple academic version, use one administrator wallet. The
deploying account is the initial administrator. Do not build a complex
multi-role governance system.

### 3.2 Student portal

A registered student can:

-   Sign in to the application.
-   Connect the wallet registered against their member profile.
-   Browse and search the book catalogue.
-   View whether copies are available.
-   Borrow an available copy.
-   Reserve a title when no copy is available.
-   Cancel their own active reservation.
-   View current loans and due dates.
-   View previous lending and return records.
-   View outstanding fines.
-   Settle their simulated fine.
-   View their transaction history.

### 3.3 Authentication and wallet identity

Keep application authentication and blockchain identity distinct:

-   Application login identifies the user's profile and portal role.
-   The connected wallet identifies the blockchain account that submits
    or authorises a transaction.
-   The backend must verify that the connected wallet belongs to the
    authenticated profile.
-   A user must not become an administrator merely by connecting an
    arbitrary wallet.
-   The administrator wallet address must be configured through
    environment/configuration, not hardcoded in frontend source.
-   Use a wallet-signature challenge (for example, a nonce-based signed
    message) to prove wallet ownership when linking or verifying a
    wallet. Do not accept a wallet address supplied as plain text as
    proof of ownership.

For the local demonstration, seed one admin profile and at least two
student profiles, each mapped to a separate local MetaMask account.

------------------------------------------------------------------------

## 4. Simplified system architecture

Use one Solidity contract, one React application, one Express API and
one PostgreSQL database.

``` text
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
             |                       PostgreSQL
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

### 4.1 Responsibility boundaries

**Smart contract is authoritative for:**

-   Registered on-chain member wallet status
-   Book and physical-copy identifiers and availability
-   Borrowing state
-   Return state
-   Due timestamps
-   Reservation state and queue order
-   Calculated fine balances
-   Fine settlement state
-   Contract events

**PostgreSQL is used for:**

-   Student names, USNs, emails and profile details
-   Application credentials and roles
-   Book search metadata and catalogue presentation
-   Cached/indexed blockchain events
-   Transaction display metadata
-   Application audit and notification records if needed

Do not store sensitive student details such as name, USN or email
on-chain.

### 4.2 Synchronisation rule

A blockchain transaction is not successful merely because the frontend
submitted it.

Use this lifecycle:

1.  Frontend requests a wallet transaction.
2.  Wallet signs and submits it.
3.  UI displays `Pending`.
4.  Wait for the transaction receipt.
5.  If receipt status indicates success, display `Confirmed`.
6.  Index emitted events into PostgreSQL.
7.  If the transaction reverts or fails, display `Failed` and do not
    mark the application record as completed.

The backend's indexed data is a read optimisation. It must not silently
override the smart contract's state.

------------------------------------------------------------------------

## 5. Core business rules

Use these initial project defaults. Keep them in one clearly documented
place in the contract or configuration.

  Rule                                                 Initial value
  ---------------------------------- -------------------------------
  Maximum active loans per student                                 3
  Loan period                                                14 days
  Overdue fine                                    ₹5 per overdue day
  Reservation order                          First-come-first-served
  Fine currency                        Simulated INR, integer rupees
  Blockchain                                   Local Hardhat network

These are project defaults, not values specified by the assignment. Make
them easy to change if the faculty provides different rules.

### 5.1 Book titles and physical copies

A title can have multiple physical copies.

Example:

-   Title: Database System Concepts
-   Book ID: 1
-   Copies: 1001, 1002, 1003

A student borrows a **copy ID**, not an abstract title. This prevents
two students from borrowing the same physical copy.

Use simple copy states:

-   `AVAILABLE`
-   `BORROWED`
-   `RESERVED`
-   `MAINTENANCE` (optional; include only if it remains easy to
    implement)

### 5.2 Borrowing rules

A borrowing transaction must verify:

1.  The caller is a registered and active member.
2.  The book and physical copy exist.
3.  The copy is available.
4.  The member has fewer than the maximum permitted active loans.
5.  The member is not blocked by the configured outstanding-fine rule.
6.  The copy is not allocated to another member's reservation.

On success:

-   Create a lending record.
-   Set borrower wallet.
-   Record `borrowedAt`.
-   Set `dueAt = block.timestamp + 14 days`.
-   Set lending status to active.
-   Mark the copy borrowed.
-   Emit a `BookBorrowed` event.

### 5.3 Return rules and fine calculation

A return must verify:

-   The lending record exists.
-   The lending record is active.
-   The caller is the borrower or the administrator.
-   The same lending record has not already been returned.

Calculate:

``` text
overdueSeconds = max(0, block.timestamp - dueAt)
overdueDays = floor(overdueSeconds / 1 day)

fine = overdueDays * finePerDay
```

Use integer arithmetic. A return one second after the due timestamp does
not count as a full overdue day under this formula; it begins counting
after a complete 24-hour overdue period. Document this rule in the
report and demo.

On successful return:

-   Mark the lending record returned.
-   Record the return timestamp.
-   Record the calculated fine.
-   Add the fine to the member's outstanding balance.
-   Update the copy state.
-   If a valid reservation is waiting, allocate the returned copy to the
    next eligible reservation; otherwise mark it available.
-   Emit a `BookReturned` event and any reservation-allocation event.

### 5.4 Reservations

Implement a simple FIFO queue per book title. Avoid a complicated
priority engine.

Rules:

-   A member can reserve a title only when no copy is available for
    immediate borrowing.
-   A member cannot have duplicate active reservations for the same
    title.
-   Store reservation ID, book ID, member wallet, timestamp and status.
-   Allow a member to cancel their own active reservation.
-   When a copy is returned, allocate it to the earliest eligible active
    reservation.
-   Skip cancelled or otherwise invalid queue entries.
-   Mark the copy `RESERVED` and record which member it is reserved for.
-   The allocated member can borrow/claim the reserved copy using a
    clearly defined contract function or the normal borrow function with
    reservation validation.

Do not add reservation expiry unless the basic queue is complete and
tested. Expiry is not necessary for the first version.

### 5.5 Outstanding fines and settlement

-   Fine is calculated on return.
-   Fine is added to the member's outstanding balance.
-   The member can view the outstanding balance.
-   Provide a simple simulated settlement function.
-   Settlement must update the on-chain balance and emit a `FineSettled`
    event.
-   No actual INR payment, cryptocurrency transfer or payment gateway is
    required.
-   Do not label a fine as paid in PostgreSQL before the settlement
    transaction is confirmed.

Use integer rupee amounts; do not use floating-point arithmetic for
contract money values.

------------------------------------------------------------------------

## 6. Smart contract specification

Create one contract:

`apps/blockchain/contracts/Library.sol`

Use Solidity 0.8.x and clear naming. Keep the contract readable and
comment important checks. Use custom errors or clear `require` messages.
Avoid unnecessary inheritance and complicated patterns.

### 6.1 Suggested data structures

The exact implementation may be refined after the coding agent checks
Solidity compiler constraints, but preserve the following logical data.

**Book**

-   `bookId`
-   `title`
-   `author`
-   `isbn`
-   `exists`

**BookCopy**

-   `copyId`
-   `bookId`
-   `status`
-   `reservedFor` (zero address if not reserved)

**Member**

-   `active`
-   `outstandingFine`
-   `activeLoanCount`

**LendingRecord**

-   `lendingId`
-   `copyId`
-   `borrower`
-   `borrowedAt`
-   `dueAt`
-   `returnedAt`
-   `fine`
-   `status`

**Reservation**

-   `reservationId`
-   `bookId`
-   `member`
-   `createdAt`
-   `status`

Do not store student name, USN, email or other unnecessary personal
details in the contract.

### 6.2 Suggested contract functions

Administrative functions:

``` solidity
registerBook(...)
registerBookCopy(...)
registerMember(address memberWallet)
```

Student/lending functions:

``` solidity
borrowBook(uint256 copyId)
returnBook(uint256 lendingId)
reserveBook(uint256 bookId)
cancelReservation(uint256 reservationId)
settleFine()
```

Read functions:

``` solidity
getBook(uint256 bookId)
getBookCopy(uint256 copyId)
getMember(address memberWallet)
getLendingRecord(uint256 lendingId)
getMemberLendingHistory(address memberWallet)
getReservation(uint256 reservationId)
getOutstandingFine(address memberWallet)
```

The agent may choose different function signatures where needed, but
must preserve all behaviours and test them.

### 6.3 Events

Emit events for important state changes:

``` solidity
BookRegistered
BookCopyRegistered
MemberRegistered
BookBorrowed
BookReturned
BookReserved
ReservationCancelled
ReservationAllocated
FineSettled
```

Each event should include the identifiers and wallet addresses needed by
the backend to index the event.

### 6.4 Access control

For the first version:

-   Contract deployer is the administrator.
-   Only administrator can register books, copies and members.
-   Registered active members can borrow and reserve.
-   Borrower or administrator can return a lending record.
-   Only the member with an outstanding fine can settle their own fine,
    unless the team deliberately chooses an admin-assisted settlement
    flow and documents it.
-   Unauthorised actions must revert.

Do not build a general-purpose role-management framework unless
required.

### 6.5 Contract safety

-   Use checks-effects-interactions where relevant.
-   Avoid external calls inside state-update loops.
-   Avoid unbounded loops over all books, members or lending records.
-   Use IDs and paginated/indexed reads where appropriate.
-   Prevent duplicate active loans for a copy.
-   Prevent double returns.
-   Prevent duplicate active reservations.
-   Ensure reservation allocation cannot assign one copy to two members.
-   Test every privileged function with both authorised and unauthorised
    accounts.

------------------------------------------------------------------------

## 7. Frontend specification

Use one React application with role-based navigation and separate
layouts.

### 7.1 Shared pages

-   Login
-   Wallet connection
-   Access denied / wrong wallet
-   Transaction status feedback
-   Profile page

### 7.2 Admin pages

**Admin Dashboard** - Total book titles - Total physical copies -
Registered members - Currently borrowed copies - Available copies -
Active reservations - Outstanding fines summary

Use simple statistic cards. Do not spend time on elaborate charts.

**Book Management** - Book list - Search by title, author or ISBN - Add
book - Add copies to a title - Show available/borrowed/reserved copy
counts - View copy IDs and status

**Member Management** - Register student profile - Link wallet address -
Activate/deactivate membership - View active loans and fine balance

**Lending Management** - View active lending records - Search by student
or book - Confirm return where permitted - Display due date and overdue
status

**Reservations** - View reservation queue for a title - Show member and
queue order - Show allocated/cancelled status

**Fine Management** - View outstanding balances - View fine records -
Inspect settlement transactions

**Transaction History** - Transaction hash - Block number -
Event/action - Wallet address - Timestamp - Confirmation status

### 7.3 Student pages

**Student Dashboard** - Currently borrowed books - Upcoming due dates -
Outstanding fine - Active reservations

**Book Catalogue** - Search title, author and ISBN - Availability
status - View copies available - Borrow button when eligible - Reserve
button when unavailable

**My Loans** - Book title and copy ID - Borrowed date - Due date -
Return status - Fine assessed on return

**My Reservations** - Reserved title - Queue/allocated status - Cancel
reservation action

**My Fines** - Outstanding balance - Fine history - Settle fine action

**My Transactions** - Lending and return transactions - Transaction hash
and block number

### 7.4 UI requirements

-   Build a clean, professional library application.
-   Prefer clear navigation and readable tables.
-   Use consistent colours and typography.
-   Show loading, empty, success and error states.
-   Confirm before important actions.
-   Display wallet address in shortened form with a copy action.
-   Show pending transaction feedback while MetaMask is open.
-   Show transaction hash after submission and confirmation.
-   Disable actions that are not currently valid, but still enforce all
    rules in the contract.
-   Avoid decorative pages and nonfunctional buttons.
-   Make the application responsive, but prioritise desktop
    demonstration quality.

------------------------------------------------------------------------

## 8. Backend and database specification

Use Express and Prisma with PostgreSQL. Keep the backend small.

### 8.1 Suggested database models

**User** - `id` - `name` - `email` - `passwordHash` - `role` (`ADMIN` or
`STUDENT`) - `walletAddress` - `createdAt`

**Book** - `id` - `chainBookId` - `title` - `author` - `isbn` -
`category` - `createdAt`

**BookCopy** - `id` - `chainCopyId` - `bookId` - `createdAt`

**BlockchainTransaction** - `id` - `txHash` - `blockNumber` -
`fromAddress` - `eventType` - `status` - `createdAt`

**BlockchainEvent** - `id` - `txHash` - `logIndex` - `eventName` -
`entityId` - `blockNumber` - `blockTimestamp` - `payload` - Unique
constraint on `(txHash, logIndex)`

Do not create duplicate database models for every on-chain struct unless
there is a concrete query requirement. The database can index events and
keep off-chain profiles; the contract remains authoritative for lending
state.

### 8.2 API routes

Suggested routes:

``` text
POST   /api/auth/login
POST   /api/auth/register
GET    /api/auth/me

GET    /api/books
GET    /api/books/:id
POST   /api/books
POST   /api/books/:id/copies

GET    /api/members
POST   /api/members
GET    /api/members/:id

GET    /api/transactions
GET    /api/transactions/:hash

GET    /api/dashboard/admin
GET    /api/dashboard/student
```

Blockchain writes should be initiated through the connected wallet and
ethers.js unless there is a well-justified server-side operation. Do not
put a privileged development private key in the web frontend.

### 8.3 Backend responsibilities

-   Application login and session/JWT handling.
-   Role checks for API endpoints.
-   Profile management.
-   Book metadata search and presentation.
-   Blockchain event listener/indexer.
-   Transaction lookup.
-   Reconciliation of indexed data with contract state where needed.

The backend must not independently issue a book, return a book, allocate
a reservation or mark a fine settled without the corresponding
successful contract transaction.

------------------------------------------------------------------------

## 9. Repository structure

Use a monorepo with a simple layout:

``` text
blocklib/
│
├── apps/
│   ├── web/
│   │   └── src/
│   │       ├── components/
│   │       ├── pages/
│   │       │   ├── admin/
│   │       │   ├── student/
│   │       │   └── auth/
│   │       ├── layouts/
│   │       ├── hooks/
│   │       ├── services/
│   │       ├── blockchain/
│   │       ├── context/
│   │       └── types/
│   │
│   └── api/
│       └── src/
│           ├── routes/
│           ├── controllers/
│           ├── middleware/
│           ├── services/
│           ├── blockchain/
│           └── server.ts
│
├── apps/blockchain/
│   ├── contracts/
│   │   └── Library.sol
│   ├── scripts/
│   │   └── deploy.ts
│   ├── test/
│   │   └── Library.test.ts
│   ├── hardhat.config.ts
│   └── package.json
│
├── prisma/
│   └── schema.prisma
│
├── docs/
│   ├── architecture.md
│   ├── setup.md
│   ├── smart-contracts.md
│   ├── testing.md
│   └── demo-script.md
│
├── .env.example
├── package.json
├── README.md
└── PLAN.md
```

The agent may adjust the monorepo tooling if needed, but keep the three
application areas clearly separated: web, API and blockchain.

------------------------------------------------------------------------

## 10. Step-by-step implementation phases

The AI agent must implement and verify each phase before proceeding. Do
not generate the entire application in one unreviewed pass.

### Phase 0 --- Repository inspection and planning

Tasks:

1.  Inspect the current Antigravity workspace.
2.  If an existing project is present, inspect it before changing files.
3.  Confirm Node.js, npm and Git availability.
4.  Create the monorepo structure.
5.  Create `docs/architecture.md`.
6.  Create a task checklist based on this plan.
7.  Record assumptions and any unresolved decisions.

Deliverables: - Repository structure - Architecture document -
Implementation checklist

Acceptance criteria: - The team can explain the application layers. - No
unnecessary service or technology has been introduced.

### Phase 1 --- Project foundation

Tasks:

1.  Create React + TypeScript + Vite frontend.
2.  Create Express + TypeScript backend.
3.  Configure PostgreSQL.
4.  Configure Prisma.
5.  Create the initial user and book metadata models.
6.  Add environment configuration and `.env.example`.
7.  Add health-check API.
8.  Add basic login and role-based route protection.
9.  Create shared API response and error formats.

Acceptance criteria: - Frontend starts. - Backend starts. - Backend
connects to PostgreSQL. - Prisma migration succeeds. - Admin and student
test accounts can authenticate. - Secrets are not committed.

### Phase 2 --- Hardhat and wallet setup

Tasks:

1.  Initialise Hardhat in `apps/blockchain`.
2.  Configure Solidity compiler.
3.  Start a local Hardhat node.
4.  Create local development accounts.
5.  Connect MetaMask to the local network.
6.  Configure the chain ID and RPC URL.
7.  Write and deploy a minimal test contract.
8.  Submit one test transaction.
9.  Verify the transaction receipt and block number.

Acceptance criteria: - MetaMask connects to the local network. - A
transaction can be signed and confirmed. - Contract address and ABI are
available to the frontend and backend through configuration/artifacts. -
Local development instructions are documented.

### Phase 3 --- Implement Library.sol

Implement in this order:

1.  Admin/deployer identity.
2.  Member registration and active status.
3.  Book registration.
4.  Physical copy registration.
5.  Read functions for book/member/copy information.
6.  Borrowing and lending records.
7.  Return confirmation.
8.  Overdue fine calculation.
9.  Fine balance and settlement.
10. Reservation queue.
11. Reservation cancellation and allocation.
12. Events for all important operations.

Write tests as each function is implemented.

Acceptance criteria: - All required functions work on the local chain. -
Unauthorised calls revert. - Duplicate borrowing is prevented. - Double
return is prevented. - Fines use blockchain timestamps. - Reservation
allocation follows FIFO. - Events contain enough information for the
backend to index them.

### Phase 4 --- Contract tests and deployment

Minimum test cases:

**Access and registration** - Deployer is admin. - Non-admin cannot
register books. - Non-admin cannot register members. - Duplicate member
registration is rejected. - Duplicate copy ID is rejected.

**Borrowing** - Active member can borrow an available copy. -
Unregistered member cannot borrow. - Inactive member cannot borrow. -
Borrowed copy cannot be borrowed again. - Maximum active loan count is
enforced. - Member with disallowed outstanding fine cannot borrow.

**Returns and fines** - Borrower can return their active loan. - Admin
can confirm a return if supported. - Unrelated wallet cannot return
another member's loan. - Double return is rejected. - On-time return
produces zero fine. - Overdue return calculates the expected fine. -
Fine is added to the correct member. - Fine settlement clears or reduces
the correct balance.

**Reservations** - Member can reserve when no copy is available. -
Member cannot create duplicate active reservation. - Member can cancel
their own reservation. - Cancelled reservation is skipped. - Returned
copy is allocated to the earliest valid reservation. - Reserved copy
cannot be borrowed by an unrelated member.

Acceptance criteria: - All automated tests pass. - Test output is saved
or summarised in project documentation. - No feature is described as
complete unless a test or manual verification supports it.

### Phase 5 --- Backend integration

Tasks:

1.  Configure Prisma and database migrations.
2.  Implement authentication and role checks.
3.  Implement profile and book metadata APIs.
4.  Connect backend to the local blockchain provider for read-only
    contract queries and event indexing.
5.  Listen for contract events.
6.  Store indexed events with transaction hash and log index.
7.  Prevent duplicate event indexing.
8.  Add transaction lookup API.
9.  Add reconciliation/read functions to compare indexed state with the
    contract when necessary.

Acceptance criteria: - Confirmed contract events appear in PostgreSQL. -
Reprocessing an event does not create duplicates. - Failed transactions
are not indexed as successful business operations. - Contract state
remains authoritative.

### Phase 6 --- Admin portal

Build in this order:

1.  Admin login.
2.  Admin dashboard.
3.  Book list and search.
4.  Register book.
5.  Add physical copies.
6.  Register student/member and wallet.
7.  Member list and details.
8.  Active lending records.
9.  Return confirmation.
10. Reservation queue.
11. Outstanding fine view.
12. Fine settlement view/action.
13. Transaction history.

Acceptance criteria: - Every admin action is connected to its intended
API or smart-contract function. - Admin cannot perform privileged
contract actions with an unauthorised wallet. - Transaction status is
shown accurately.

### Phase 7 --- Student portal

Build in this order:

1.  Student login.
2.  Wallet verification/connection.
3.  Student dashboard.
4.  Book catalogue and search.
5.  Book details and copy availability.
6.  Borrow book.
7.  Reserve unavailable title.
8.  Cancel reservation.
9.  Active loans and due dates.
10. Lending history.
11. Outstanding fines.
12. Fine settlement.
13. Student transaction history.

Acceptance criteria: - A student can only act as the wallet linked to
their profile. - Invalid actions are blocked in the UI and independently
rejected by the contract. - The student can inspect their own lending
and financial records.

### Phase 8 --- End-to-end testing

Use one admin wallet and at least two student wallets.

Run this scenario:

1.  Admin registers a book title.
2.  Admin registers one physical copy.
3.  Admin registers Student A and Student B.
4.  Student A borrows the copy.
5.  Verify the transaction and lending record.
6.  Student B attempts to borrow the same copy; the contract rejects it.
7.  Student B reserves the title.
8.  Student A returns the book.
9.  Verify that the copy is allocated to Student B according to the
    reservation rule.
10. Student B claims/borrows the allocated copy.
11. Test an overdue return using controlled local-chain time.
12. Verify the calculated fine.
13. Student views the outstanding fine.
14. Student settles the simulated fine.
15. Inspect transaction hashes and event history.

Acceptance criteria: - The full scenario works from the UI. - No manual
database edit is needed to make a blockchain operation appear
successful. - The local chain can be reset and the demo data redeployed
using documented commands.

### Phase 9 --- Final quality and documentation

Tasks:

1.  Run all smart-contract tests.
2.  Run frontend build and type checks.
3.  Run backend type checks and tests.
4.  Test all required workflows manually.
5.  Fix broken links, nonfunctional buttons and misleading status
    indicators.
6.  Prepare seed data and local demo accounts.
7.  Write README setup instructions.
8.  Write a five-to-seven-minute demo script.
9.  Capture real screenshots from the running application.
10. Prepare report material from the actual implementation and test
    output.

Acceptance criteria: - A fresh setup can run by following the README. -
No secrets are committed. - All mandatory requirements are
demonstrated. - Screenshots are genuine application screenshots.

------------------------------------------------------------------------

## 11. Required test and demonstration checklist

Do not mark the project complete until every item below has been tested.

  --------------------------------------------------------------------------
                            \# Requirement / scenario  Expected result
  ---------------------------- ----------------------- ---------------------
                             1 Register book           Book registration
                                                       transaction confirmed

                             2 Register physical       Unique copies
                               copies                  recorded

                             3 Register member         Member wallet
                                                       registered

                             4 View catalogue          Book and copy
                                                       availability visible

                             5 Borrow available copy   Lending record
                                                       created

                             6 Borrow same copy again  Transaction rejected

                             7 Borrow as               Transaction rejected
                               inactive/unregistered   
                               member                  

                             8 Exceed active loan      Transaction rejected
                               limit                   

                             9 Reserve unavailable     Reservation recorded
                               title                   

                            10 Cancel own reservation  Reservation cancelled

                            11 Return borrowed book    Return recorded

                            12 Return same loan twice  Transaction rejected

                            13 Return overdue book     Fine calculated
                                                       automatically

                            14 View outstanding fine   Correct balance
                                                       displayed

                            15 Settle fine             Settlement
                                                       transaction confirmed

                            16 Return copy with        Next valid
                               waiting reservation     reservation receives
                                                       priority

                            17 View transaction        Hash, block and event
                               history                 visible
  --------------------------------------------------------------------------

------------------------------------------------------------------------

## 12. Five-to-seven-minute faculty demonstration

Use this sequence for the final demonstration:

1.  **Admin login:** Show the admin dashboard.
2.  **Book registration:** Register a book and a physical copy. Show the
    transaction hash.
3.  **Member registration:** Register a student wallet.
4.  **Student login:** Connect the student's MetaMask wallet and browse
    the catalogue.
5.  **Borrowing:** Borrow the book and show the confirmed transaction.
6.  **Duplicate prevention:** Attempt to borrow the same copy from
    another student account and show the contract rejection.
7.  **Reservation:** Reserve the unavailable title.
8.  **Return:** Return the first loan and show reservation allocation.
9.  **Penalty:** Demonstrate an overdue return with controlled
    local-chain time and show the fine.
10. **History:** Open transaction history and verify the transactions.

Prepare a seeded demo state so the demonstration does not depend on
typing all data from scratch. Keep a reset/redeploy procedure ready.

------------------------------------------------------------------------

## 13. Antigravity IDE operating instructions for the AI agent

The AI coding agent must follow these rules throughout development.

### 13.1 Work incrementally

-   Read this `PLAN.md` before editing the project.
-   Inspect the existing workspace before creating or overwriting files.
-   Do not attempt to build all phases in one response.
-   Work on one phase or a small group of related tasks at a time.
-   After each phase, report changed files, commands run, test results
    and remaining issues.
-   Wait for the developer/user to review the phase before moving to a
    major next phase.
-   Keep this plan updated when a decision is changed, but do not
    silently remove a requirement.

### 13.2 Preserve mandatory scope

Never remove these requirements:

-   Book registration
-   Member registration
-   Lending records
-   Return confirmation
-   Overdue penalty calculation
-   Digital transaction history
-   Reservations
-   Outstanding penalties

If a feature is difficult, simplify its implementation rather than
omitting it.

### 13.3 Avoid unnecessary complexity

-   One Solidity contract is preferred.
-   One local blockchain network is sufficient.
-   One React application with two role-based portals is sufficient.
-   One Express API is sufficient.
-   One PostgreSQL database is sufficient.
-   Do not add microservices, message queues, caching servers or
    external cloud services without explicit approval.
-   Do not create placeholder buttons.
-   Do not fake blockchain transactions.
-   Do not add features outside the scope just to make the project look
    larger.

### 13.4 Security and correctness

-   Never commit private keys, passwords or API secrets.
-   Use local development wallets only for local development.
-   Do not put administrator private keys in React source.
-   Validate all input on both client and server.
-   Enforce critical business rules in the Solidity contract.
-   Do not trust frontend-only checks.
-   Do not store sensitive personal information on-chain.
-   Do not mark transactions confirmed until a successful receipt is
    available.
-   Handle wallet rejection, network mismatch, transaction revert and
    backend indexing failure.
-   Use integer amounts for fines.
-   Use blockchain timestamps for overdue calculations.

### 13.5 Required response after each development task

At the end of each task, provide:

1.  **Completed:** What was implemented.
2.  **Files changed:** Important files created or modified.
3.  **Commands run:** Installation, migration, deployment or test
    commands.
4.  **Verification:** Actual test/build output, not assumed success.
5.  **Known issues:** Anything incomplete.
6.  **Next step:** The next small task in this plan.

Do not claim a test passed unless it was actually executed.

------------------------------------------------------------------------

## 14. Environment configuration

Create `.env.example` with placeholders only. Expected configuration may
include:

``` env
# API
PORT=4000
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/blocklib
JWT_SECRET=replace_with_local_secret

# Local blockchain
BLOCKCHAIN_RPC_URL=http://127.0.0.1:8545
BLOCKCHAIN_CHAIN_ID=31337
LIBRARY_CONTRACT_ADDRESS=

# Frontend
VITE_API_BASE_URL=http://localhost:4000
VITE_BLOCKCHAIN_CHAIN_ID=31337
VITE_LIBRARY_CONTRACT_ADDRESS=
```

Do not commit a real `.env` file. Document how to obtain the deployed
contract address after running the deployment script. Keep private
development keys out of the frontend and out of Git.

------------------------------------------------------------------------

## 15. Final definition of done

BlockLib is complete only when:

-   All eight requirement areas are implemented.
-   Admin and Student portals both work.
-   The single Solidity contract is deployed on the local Hardhat
    network.
-   Wallet transactions are real and verifiable.
-   Borrowing, returns, reservations and penalties are enforced by
    contract logic.
-   Duplicate borrowing and double returns are rejected.
-   Reservation allocation works.
-   Fine balances and settlement work.
-   Transaction history is visible.
-   Automated contract tests pass.
-   Frontend build and backend checks pass.
-   README setup instructions work on a fresh environment.
-   The team can demonstrate the complete workflow.
-   Report screenshots are captured from the actual running application.

**Final guiding principle:** Build the smallest reliable implementation
that satisfies every requirement in the Group 16 assignment. Prioritise
correctness, explainability and a dependable live demonstration over
unnecessary features.
