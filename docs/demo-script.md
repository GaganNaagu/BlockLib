# BlockLib — 5–7 Minute Faculty Demonstration Script (With Syllabus & Concept Explanations)

## Before Stepping Up to Present
1. Run `start-blocklib.bat` (opens Hardhat Local `8545`, runs `demo:reset` + Express API `4000`, and starts React Frontend `5173`).
2. Open `http://localhost:5173` with MetaMask unlocked on **Hardhat Local** (`Chain ID: 31337`).
3. *(If you restarted Hardhat after earlier tests, clear MetaMask's activity tab data once before the demo so nonces start at `0`.)*
4. **Do not** restart the Hardhat terminal during the demo.

---

## Live Demo Sequence

### Step 1: Admin Login & Wallet Verification (~45 sec)
- **What to show:** Sign in as `admin@blocklib.edu` / `Admin@123`. Select **BlockLib Admin (`0xf39F...2266`)** in MetaMask → click **Connect Wallet** → sign the nonce challenge → show the green **`Verified`** badge and **Admin Dashboard**.
- **Why this is done:** Separates *application login* (email/password + JWT for UI role) from *blockchain identity* (proving you actually own the private key of the Admin wallet).
- **Blockchain Subject Topic:** *Unit 4 — Ethereum Wallets, Key Pairs, Addresses & Digital Signatures.*
- **Concepts Used:**
  - **Asymmetric Cryptography (ECDSA secp256k1):** MetaMask holds a private key and derives a public Ethereum address (`0xf39F...`).
  - **Nonce Challenge (`personal_sign`):** Backend generates a random one-time string (nonce); MetaMask signs it with the private key; backend recovers the signer via `ethers.verifyMessage` to prove ownership without ever seeing the private key.

---

### Step 2: Book & Physical Copy Registration (~1 min)
- **What to show:** Go to **Books & Copies** → register a new book (e.g. *Clean Code*, *Robert C. Martin*, `978-0132350884`) → confirm in MetaMask → add Copy **`3001`** → confirm in MetaMask. Point out the **Transaction Confirmed** banner with the **Transaction Hash** and **Block Number**.
- **Why this is done:** Creates an immutable record of the book title and assigns a unique `copyId` (`3001`) so lending tracks individual physical copies rather than just abstract titles.
- **Blockchain Subject Topic:** *Unit 1 & 4 — Distributed Ledgers, Blocks, Hashing & Smart Contracts.*
- **Concepts Used:**
  - **Smart Contract (`onlyAdmin` modifier):** `Library.sol` checks `msg.sender == admin` so no student can forge books or copies.
  - **Gas (the small ETH fee in MetaMask):** Every state-changing EVM transaction pays gas (in fake local test ETH) to compensate for computation/storage and prevent spam.
  - **Keccak-256 Transaction Hash & Block Number:** Each confirmed transaction receives a unique 64-hex-character Keccak-256 hash and is sealed into a numbered block. *(Note: Ethereum uses Keccak-256, distinct from Bitcoin's SHA-256.)*

---

### Step 3: Member Management & Privacy Boundary (~30 sec)
- **What to show:** Go to **Members** → show `Gagan S G` (`0x7099...79C8`) and `Ekanth LS` (`0x3C44...93BC`) are `Active` on-chain.
- **Why this is done:** Demonstrates our **on-chain vs. off-chain privacy boundary**.
- **Blockchain Subject Topic:** *Unit 1 & 3 — Public/Permissioned Ledger Transparency & Off-Chain Data Architecture.*
- **Concepts Used:**
  - **Off-chain Storage (PostgreSQL):** Student names, USNs, emails, and passwords are PII and stay private in PostgreSQL.
  - **On-chain Whitelist (`mapping(address => Member)`):** `Library.sol` only stores the wallet address, `active` flag, `activeLoanCount`, and `outstandingFine` — zero personal data is exposed on the ledger.

---

### Step 4: Student 1 Login & Borrowing (~1 min)
- **What to show:** Sign out → sign in as `student1@blocklib.edu` / `Student@123`. Switch MetaMask to **BlockLib Student 1 (`0x7099...79C8`)** → **Connect Wallet**. Go to **Book Catalogue** → click **Borrow Copy #2001** (*Mastering Ethereum*) → confirm in MetaMask → open **My Loans** to show `ACTIVE` status and the 14-day due date.
- **Why this is done:** Records the lending contract on-chain with `borrowedAt = block.timestamp` and `dueAt = block.timestamp + 14 days`, locking Copy `#2001` as `BORROWED`.
- **Blockchain Subject Topic:** *Unit 4 — Smart Contract State Transitions & EVM Execution.*
- **Concepts Used:**
  - **Atomic State Transition:** `borrowBook(2001)` checks eligibility (`active` member, `< 3` loans, `0` unpaid fines, copy `AVAILABLE`) and updates state atomically — if any check fails, the entire transaction **reverts**.
  - **Event Emission (`BookBorrowed`):** Emits a structured EVM log that our Express backend indexes into PostgreSQL (deduplicated by `(txHash, logIndex)`).

---

### Step 5: Duplicate Borrow Prevention & FIFO Reservation (~1 min)
- **What to show:** Sign out → sign in as `student2@blocklib.edu` / `Student@123`. Switch MetaMask to **BlockLib Student 2 (`0x3C44...93BC`)** → **Connect Wallet**. Go to **Book Catalogue**: Copy `#2001` is `BORROWED`, so click **Reserve Title** on *Mastering Ethereum* → confirm in MetaMask → open **My Reservations** (`WAITING`).
- **Why this is done:** Proves two students cannot borrow the same physical copy simultaneously, and puts Student 2 into a fair First-Come-First-Served queue.
- **Blockchain Subject Topic:** *Unit 1 & 4 — Double-Spend / Double-Borrow Prevention & Deterministic Contract Rules.*
- **Concepts Used:**
  - **Double-Borrow Prevention:** Just as a blockchain prevents spending the same coin twice, `Library.sol` prevents borrowing the same `copyId` twice.
  - **FIFO Queue (`bookQueueHead`):** Reservations are stored in an ordered queue per book; `bookQueueHead` advances in $O(1)$ amortized steps without unbounded loops (preventing out-of-gas attacks).

---

### Step 6: Return & Automatic Reservation Allocation (~45 sec)
- **What to show:** Sign back in as **Student 1** (MetaMask **Account #1**) → **My Loans** → click **Return Book** on *Mastering Ethereum* (`Copy #2001`). Sign back in as **Student 2** (MetaMask **Account #2**) → **My Reservations** now shows **`ALLOCATED`**, and **Book Catalogue** shows **Claim Reserved Copy #2001**.
- **Why this is done:** Shows that `Library.sol` automatically allocates a returned copy to the earliest waiting student instead of making it `AVAILABLE` to everyone else.
- **Blockchain Subject Topic:** *Unit 4 — Autonomous Smart Contract Execution.*
- **Concepts Used:**
  - **Trustless Automation:** No librarian has to manually assign the returned book; `returnBook()` automatically triggers `_allocateReturnedCopy()` and emits `ReservationAllocated`.

---

### Step 7: Live Overdue Fine & Simulated Settlement (~1 min)
- **What to show (Live in UI!):**
  1. Have **Student 2** click **Claim Reserved Copy #2001** in **Book Catalogue** (now Student 2 has an active 14-day loan).
  2. In any PowerShell terminal in `e:\Projects\BlockLib`, run:
     ```powershell
     cmd /c "npm run demo:advance-time"
     ```
     *(This advances the local Hardhat blockchain clock by **17 days** — 3 days past the 14-day due date!)*
  3. Refresh **My Loans** in the browser → Copy `#2001` now shows **`Overdue`**!
  4. Click **Return Book** → confirm in MetaMask.
  5. Open **My Fines** → shows **Outstanding Fine Balance: `₹15`** (3 overdue days × ₹5/day).
  6. Click **Settle Fine (Simulated)** → confirm in MetaMask → balance resets to **`₹0`**.
- **Why this is done:** Proves overdue penalties are computed tamper-proof using **blockchain time** (`block.timestamp`), not the user's browser clock or a mutable database column.
- **Blockchain Subject Topic:** *Unit 4 — `block.timestamp`, Deterministic Integer Arithmetic & Transaction Lifecycle.*
- **Concepts Used:**
  - **On-chain Timestamp (`block.timestamp`):** Formula $\text{fine} = \lfloor (\text{block.timestamp} - \text{dueAt}) / 86400 \rfloor \times ₹5$ runs inside the EVM.
  - **Integer Money Arithmetic:** Solidity has no floating-point numbers, so fines use integer rupees (`uint256`) to avoid rounding errors.
  - **Fine Blocking Rule:** While `outstandingFine > 0`, `Library.sol` blocks new borrows until `settleFine()` clears the balance and emits `FineSettled`.

---

### Step 8: Verifiable Digital Transaction History (~30 sec)
- **What to show:** Open **My Transactions** (or **Transactions** as Admin) → show every confirmed transaction hash, block number, event type (`BookRegistered`, `BookBorrowed`, `BookReturned`, `ReservationAllocated`, `FineSettled`), and `CONFIRMED` status.
- **Why this is done:** Provides a complete, auditable trail where PostgreSQL only caches confirmed events (`receipt.status === 1`) and never overrides the smart contract.
- **Blockchain Subject Topic:** *Unit 1 & 4 — Immutability, Auditability & Event Indexing.*
- **Concepts Used:**
  - **Event Indexing (`(txHash, logIndex)` unique key):** Backend polls `provider.getLogs` and stores confirmed events idempotently so refreshing/resyncing never creates duplicates.
