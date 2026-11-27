# BlockLib — 5–7 Minute Faculty Demonstration Script

## Before Stepping Up to Present
1. Run `start-blocklib.bat` (or start the 3 terminals with `npm run demo:reset`).
2. Wait until all 3 terminals show running (`8545`, `4000`, `5173`).
3. Open `http://localhost:5173` in your browser with MetaMask unlocked on **Hardhat Local**.
4. *(If you restarted Hardhat after earlier tests, clear MetaMask's activity tab data once before the demo so nonces start at `0`.)*
5. **Do not** restart the Hardhat terminal during the demo.

---

## Live Demo Sequence (5–7 Minutes)

### 1. Admin Login & Dashboard (~45 sec)
- Sign in as `admin@blocklib.edu` / `Admin@123`.
- Switch MetaMask to **Account #0 (`0xf39F...2266`)** → click **Connect Wallet** → sign the nonce challenge.
- Show the **Admin Dashboard**: seeded book titles, physical copies, registered members (`Active`), and fine summary.

### 2. Book & Copy Registration (~1 min)
- Open **Books & Copies** (`/admin/books`).
- Register a new title (e.g., *Clean Code*, *Robert C. Martin*, `978-0132350884`) and confirm in MetaMask.
- Add physical copy **`3001`** to it and confirm in MetaMask.
- Point out the **Transaction Confirmed** banner showing the Keccak-256 **tx hash** and **block number**.

### 3. Member Management (~30 sec)
- Open **Members** (`/admin/members`).
- Show that Student 1 (`Gagan S G`) and Student 2 (`Ekanth LS`) are registered and `Active` on-chain, with their USN/email stored in PostgreSQL and only their wallet address stored on-chain.

### 4. Student 1 Login & Borrowing (~1 min)
- Sign out → sign in as `student1@blocklib.edu` / `Student@123`.
- Switch MetaMask to **Account #1 (`0x7099...79C8`)** → click **Connect Wallet** & sign nonce.
- Open **Book Catalogue** (`/student/catalogue`) → borrow **Copy #2001** (*Mastering Ethereum*) → confirm in MetaMask.
- Open **My Loans** (`/student/loans`) → show the active loan and 14-day due date.

### 5. Duplicate Borrow Prevention & Reservation (~1 min)
- Sign out → sign in as `student2@blocklib.edu` / `Student@123`.
- Switch MetaMask to **Account #2 (`0x3C44...93BC`)** → click **Connect Wallet** & sign nonce.
- Open **Book Catalogue** → *Mastering Ethereum* has 0 available copies, so click **Reserve Title** → confirm in MetaMask.
- Open **My Reservations** → show `WAITING` in the FIFO queue.

### 6. Return & Automatic Reservation Allocation (~1 min)
- Sign back in as **Student 1** (MetaMask **Account #1**) → **My Loans** → click **Return Book** on *Mastering Ethereum* (`Copy #2001`).
- Switch back to **Student 2** (MetaMask **Account #2**) → **My Reservations** now shows `ALLOCATED`, and **Book Catalogue** shows **Claim Reserved Copy #2001**.

### 7. Overdue Fine Calculation & Transaction History (~1 min)
- Open **Transactions** (`/admin/transactions` or `/student/transactions`) to show every confirmed transaction hash, block number, and indexed event.
- Explain (and optionally show the automated Phase 8 test `npm run test:blockchain`) how `Library.sol` computes overdue fines using `block.timestamp`:
  $$\text{fine} = \left\lfloor \frac{\text{block.timestamp} - \text{dueAt}}{86400} \right\rfloor \times ₹5$$
  and how `settleFine()` clears the on-chain balance and emits `FineSettled`.
