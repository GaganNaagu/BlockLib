import { expect } from 'chai';
import { ethers } from 'hardhat';
import { time } from '@nomicfoundation/hardhat-toolbox/network-helpers';

describe('BlockLib Phase 8 — Full 15-Step End-to-End Scenario', () => {
  it('executes the complete lending, reservation, overdue fine, and settlement lifecycle', async () => {
    const [admin, studentA, studentB] = await ethers.getSigners();

    const Library = await ethers.getContractFactory('Library');
    const library = await Library.deploy();
    await library.waitForDeployment();

    // 1. Admin registers a book title
    const txBook = await library
      .connect(admin)
      .registerBook('Database System Concepts', 'Abraham Silberschatz', '978-0078022159');
    await expect(txBook).to.emit(library, 'BookRegistered');

    // 2. Admin registers one physical copy
    const txCopy = await library.connect(admin).registerBookCopy(1n, 1001n);
    await expect(txCopy).to.emit(library, 'BookCopyRegistered');

    // 3. Admin registers Student A and Student B
    await expect(library.connect(admin).registerMember(studentA.address)).to.emit(
      library,
      'MemberRegistered',
    );
    await expect(library.connect(admin).registerMember(studentB.address)).to.emit(
      library,
      'MemberRegistered',
    );

    // 4. Student A borrows the copy
    const txBorrowA = await library.connect(studentA).borrowBook(1001n);
    const receiptBorrowA = await txBorrowA.wait();
    expect(receiptBorrowA?.status).to.equal(1);

    // 5. Verify lending record
    const loanA = await library.getLendingRecord(1n);
    expect(loanA.borrower).to.equal(studentA.address);
    expect(loanA.copyId).to.equal(1001n);
    expect(loanA.status).to.equal(0n); // ACTIVE

    // 6. Student B attempts to borrow the same copy -> rejected
    await expect(library.connect(studentB).borrowBook(1001n)).to.be.revertedWith(
      'Copy is not available for borrowing',
    );

    // 7. Student B reserves the title
    await expect(library.connect(studentB).reserveBook(1n)).to.emit(library, 'BookReserved');

    // 8. Student A returns the book (on time)
    await expect(library.connect(studentA).returnBook(1n))
      .to.emit(library, 'BookReturned')
      .and.to.emit(library, 'ReservationAllocated')
      .withArgs(1n, 1n, 1001n, studentB.address);

    // 9. Verify copy is allocated to Student B
    const copyAfterReturn = await library.getBookCopy(1001n);
    expect(copyAfterReturn.status).to.equal(2n); // RESERVED
    expect(copyAfterReturn.reservedFor).to.equal(studentB.address);

    // 10. Student B claims/borrows the allocated copy
    await expect(library.connect(studentB).borrowBook(1001n)).to.emit(library, 'BookBorrowed');

    // 11. Test overdue return using controlled local-chain time (17 days => 3 days overdue)
    await time.increase(17 * 24 * 60 * 60);
    const txReturnB = await library.connect(studentB).returnBook(2n);
    const receiptReturnB = await txReturnB.wait();

    // 12. Verify calculated fine (3 days * ₹5/day = ₹15)
    const loanB = await library.getLendingRecord(2n);
    expect(loanB.fine).to.equal(15n);

    // 13. Student B views outstanding fine
    expect(await library.getOutstandingFine(studentB.address)).to.equal(15n);

    // 14. Student B settles the simulated fine
    const txSettle = await library.connect(studentB).settleFine();
    const receiptSettle = await txSettle.wait();
    expect(await library.getOutstandingFine(studentB.address)).to.equal(0n);

    // 15. Verify transaction hashes and block numbers are recorded
    expect(receiptBorrowA?.hash).to.match(/^0x[a-fA-F0-9]{64}$/);
    expect(receiptReturnB?.blockNumber).to.be.greaterThan(receiptBorrowA!.blockNumber);
    expect(receiptSettle?.status).to.equal(1);
  });
});
