import { expect } from 'chai';
import { ethers } from 'hardhat';
import { time } from '@nomicfoundation/hardhat-toolbox/network-helpers';

describe('Library.sol (Phase 3 Core Smoke Tests)', () => {
  it('registers books, copies, members, and handles borrow -> reserve -> return -> fine -> settle', async () => {
    const [admin, student1, student2] = await ethers.getSigners();
    const Library = await ethers.getContractFactory('Library');
    const library = await Library.deploy();
    await library.waitForDeployment();

    // Admin registers book, copy, and members
    await expect(library.connect(admin).registerBook('Database System Concepts', 'Silberschatz', '978-0078022159'))
      .to.emit(library, 'BookRegistered')
      .withArgs(1n, 'Database System Concepts', 'Silberschatz', '978-0078022159');

    await expect(library.connect(admin).registerBookCopy(1n, 1001n))
      .to.emit(library, 'BookCopyRegistered')
      .withArgs(1001n, 1n);

    await library.connect(admin).registerMember(student1.address);
    await library.connect(admin).registerMember(student2.address);

    // Student 1 borrows copy 1001
    await expect(library.connect(student1).borrowBook(1001n)).to.emit(library, 'BookBorrowed');

    // Student 2 cannot borrow already-borrowed copy, so reserves book 1
    await expect(library.connect(student2).borrowBook(1001n)).to.be.revertedWith(
      'Copy is not available for borrowing',
    );
    await expect(library.connect(student2).reserveBook(1n)).to.emit(library, 'BookReserved');

    // Advance 16 days (2 days overdue at ₹5/day = ₹10 fine)
    await time.increase(16 * 24 * 60 * 60);

    // Student 1 returns copy -> fine ₹10 assessed & copy allocated to Student 2
    await expect(library.connect(student1).returnBook(1n))
      .to.emit(library, 'BookReturned')
      .and.to.emit(library, 'ReservationAllocated')
      .withArgs(1n, 1n, 1001n, student2.address);

    expect(await library.getOutstandingFine(student1.address)).to.equal(10n);

    // Student 1 settles fine
    await expect(library.connect(student1).settleFine()).to.emit(library, 'FineSettled');
    expect(await library.getOutstandingFine(student1.address)).to.equal(0n);

    // Student 2 claims allocated copy
    await expect(library.connect(student2).borrowBook(1001n)).to.emit(library, 'BookBorrowed');
  });
});
