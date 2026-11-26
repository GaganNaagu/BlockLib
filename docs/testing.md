# BlockLib Smart Contract Testing (`Phase 4`)

Run the automated Mocha/Chai test suite against the in-memory Hardhat EVM:

```powershell
cmd /c "npm run test:blockchain"
```

## Covered Test Matrix
1. **Access and registration:** Deployer is admin; non-admin book/copy/member registration reverts; duplicate member registration reverts; duplicate copy ID reverts.
2. **Borrowing:** Active member borrows available copy; duplicate borrow on borrowed copy reverts; unregistered and inactive members revert; max active loan limit (`3`) enforced; outstanding fine blocks new borrows until settled.
3. **Returns and fines:** Borrower or admin can return; unrelated wallet reverts; double return reverts; on-time return yields `0` fine; overdue return calculates `floor(overdueSeconds / 1 day) * 5` integer INR; `settleFine()` clears balance and emits `FineSettled`.
4. **Reservations:** Reserving while a copy is available reverts; duplicate active reservation reverts; owner can cancel waiting reservation; cancelled reservations are skipped; returned copy allocates FIFO to the earliest valid waiting reservation; unrelated member cannot borrow a reserved copy; allocated member can claim the copy.
