# BlockLib Smart Contract Reference (`Library.sol`)

**File:** `apps/blockchain/contracts/Library.sol`  
**Compiler:** Solidity `^0.8.28`  
**Network:** Hardhat Local (`chainId: 31337`)

## 1. Purpose & Privacy Boundary
`Library.sol` is the authoritative on-chain ledger for library lending rules, physical copy availability, overdue fine calculation, and FIFO reservations. Sensitive personal information (student names, USNs, emails, passwords) is **never** stored on-chain; it remains in PostgreSQL.

## 2. Default Lending Rules
| Parameter | Default Value | Meaning |
|---|---|---|
| `maxActiveLoans` | `3` | Maximum simultaneous active loans per member |
| `loanPeriod` | `14 days` | Duration before a loan becomes overdue |
| `finePerDay` | `5` | Overdue penalty in integer INR rupees per full 24-hour overdue day |
| `maxAllowedFine` | `0` | Members with `outstandingFine > 0` must settle fines before borrowing again |

## 3. Access Control
- **`admin` (`immutable`):** Set to the contract deployer. Only `admin` can call `registerMember`, `setMemberActive`, `registerBook`, and `registerBookCopy`.
- **`onlyActiveMember`:** Requires `registered == true` and `active == true` for `borrowBook` and `reserveBook`.
- **`returnBook`:** Callable by the original `borrower` or by `admin`.
- **`cancelReservation`:** Callable only by the reservation's owner while `WAITING`.
- **`settleFine`:** Callable by the registered member when `outstandingFine > 0`.

## 4. Overdue Fine Formula
```text
if (block.timestamp > dueAt) {
    overdueDays = (block.timestamp - dueAt) / 1 days; // integer floor
    fine = overdueDays * finePerDay;
}
```
Uses blockchain `block.timestamp` and integer arithmetic.

## 5. Events Indexed by Backend
- `BookRegistered(bookId, title, author, isbn)`
- `BookCopyRegistered(copyId, bookId)`
- `MemberRegistered(memberWallet)`
- `MemberStatusUpdated(memberWallet, active)`
- `BookBorrowed(lendingId, copyId, bookId, borrower, borrowedAt, dueAt)`
- `BookReturned(lendingId, copyId, borrower, returnedAt, fine)`
- `BookReserved(reservationId, bookId, member, createdAt)`
- `ReservationCancelled(reservationId, bookId, member)`
- `ReservationAllocated(reservationId, bookId, copyId, member)`
- `FineSettled(member, amount, settledAt)`
