import { expect } from 'chai';
import { ethers } from 'hardhat';
import { time } from '@nomicfoundation/hardhat-toolbox/network-helpers';

describe('Library.sol (Phase 4 Full Suite)', () => {
  async function deployFixture() {
    const [admin, student1, student2, student3, outsider] = await ethers.getSigners();
    const Library = await ethers.getContractFactory('Library');
    const library = await Library.deploy();
    await library.waitForDeployment();
    return { library, admin, student1, student2, student3, outsider };
  }

  describe('Access and registration', () => {
    it('sets deployer as admin', async () => {
      const { library, admin } = await deployFixture();
      expect(await library.admin()).to.equal(admin.address);
    });

    it('rejects non-admin book, copy, and member registration', async () => {
      const { library, admin, student1, outsider } = await deployFixture();

      await expect(
        library.connect(outsider).registerBook('Clean Code', 'Robert Martin', '978-0132350884'),
      ).to.be.revertedWith('Only admin can perform this action');

      await expect(library.connect(outsider).registerMember(student1.address)).to.be.revertedWith(
        'Only admin can perform this action',
      );

      await library.connect(admin).registerBook('Clean Code', 'Robert Martin', '978-0132350884');
      await expect(library.connect(outsider).registerBookCopy(1n, 1001n)).to.be.revertedWith(
        'Only admin can perform this action',
      );
    });

    it('rejects duplicate member registration and duplicate copy ID', async () => {
      const { library, admin, student1 } = await deployFixture();

      await expect(library.connect(admin).registerMember(student1.address))
        .to.emit(library, 'MemberRegistered')
        .withArgs(student1.address);

      await expect(library.connect(admin).registerMember(student1.address)).to.be.revertedWith(
        'Member already registered',
      );

      await library.connect(admin).registerBook('Clean Code', 'Robert Martin', '978-0132350884');
      await expect(library.connect(admin).registerBookCopy(1n, 1001n))
        .to.emit(library, 'BookCopyRegistered')
        .withArgs(1001n, 1n);

      await expect(library.connect(admin).registerBookCopy(1n, 1001n)).to.be.revertedWith(
        'Copy ID already exists',
      );
    });
  });

  describe('Borrowing', () => {
    it('allows active member to borrow an available copy and rejects duplicate borrow', async () => {
      const { library, admin, student1, student2 } = await deployFixture();
      await library.connect(admin).registerMember(student1.address);
      await library.connect(admin).registerMember(student2.address);
      await library.connect(admin).registerBook('OS Concepts', 'Silberschatz', '978-1119800361');
      await library.connect(admin).registerBookCopy(1n, 1001n);

      await expect(library.connect(student1).borrowBook(1001n)).to.emit(library, 'BookBorrowed');

      const copy = await library.getBookCopy(1001n);
      expect(copy.status).to.equal(1n); // BORROWED

      await expect(library.connect(student2).borrowBook(1001n)).to.be.revertedWith(
        'Copy is not available for borrowing',
      );
    });

    it('rejects borrowing by unregistered or inactive members', async () => {
      const { library, admin, student1, outsider } = await deployFixture();
      await library.connect(admin).registerMember(student1.address);
      await library.connect(admin).registerBook('OS Concepts', 'Silberschatz', '978-1119800361');
      await library.connect(admin).registerBookCopy(1n, 1001n);

      await expect(library.connect(outsider).borrowBook(1001n)).to.be.revertedWith(
        'Caller is not a registered member',
      );

      await library.connect(admin).setMemberActive(student1.address, false);
      await expect(library.connect(student1).borrowBook(1001n)).to.be.revertedWith(
        'Member account is inactive',
      );
    });

    it('enforces maximum active loan limit (3)', async () => {
      const { library, admin, student1 } = await deployFixture();
      await library.connect(admin).registerMember(student1.address);
      await library.connect(admin).registerBook('Algorithms', 'CLRS', '978-0262046305');
      for (const copyId of [1001n, 1002n, 1003n, 1004n]) {
        await library.connect(admin).registerBookCopy(1n, copyId);
      }

      await library.connect(student1).borrowBook(1001n);
      await library.connect(student1).borrowBook(1002n);
      await library.connect(student1).borrowBook(1003n);

      await expect(library.connect(student1).borrowBook(1004n)).to.be.revertedWith(
        'Maximum active loan limit reached',
      );
    });

    it('blocks member with outstanding fine from borrowing until settled', async () => {
      const { library, admin, student1 } = await deployFixture();
      await library.connect(admin).registerMember(student1.address);
      await library.connect(admin).registerBook('Algorithms', 'CLRS', '978-0262046305');
      await library.connect(admin).registerBookCopy(1n, 1001n);
      await library.connect(admin).registerBookCopy(1n, 1002n);

      await library.connect(student1).borrowBook(1001n);
      await time.increase(15 * 24 * 60 * 60); // 1 day overdue => ₹5 fine
      await library.connect(student1).returnBook(1n);

      expect(await library.getOutstandingFine(student1.address)).to.equal(5n);
      await expect(library.connect(student1).borrowBook(1002n)).to.be.revertedWith(
        'Outstanding fine must be settled first',
      );

      await library.connect(student1).settleFine();
      await expect(library.connect(student1).borrowBook(1002n)).to.emit(library, 'BookBorrowed');
    });
  });

  describe('Returns and fines', () => {
    it('allows borrower or admin to return, rejects unrelated wallet and double return', async () => {
      const { library, admin, student1, student2 } = await deployFixture();
      await library.connect(admin).registerMember(student1.address);
      await library.connect(admin).registerMember(student2.address);
      await library.connect(admin).registerBook('Networks', 'Tanenbaum', '978-0132126953');
      await library.connect(admin).registerBookCopy(1n, 1001n);
      await library.connect(admin).registerBookCopy(1n, 1002n);

      await library.connect(student1).borrowBook(1001n);
      await expect(library.connect(student2).returnBook(1n)).to.be.revertedWith(
        'Only borrower or admin can confirm return',
      );

      await expect(library.connect(student1).returnBook(1n)).to.emit(library, 'BookReturned');
      await expect(library.connect(student1).returnBook(1n)).to.be.revertedWith(
        'Book has already been returned',
      );

      // Admin can confirm return on behalf of borrower
      await library.connect(student1).borrowBook(1002n);
      await expect(library.connect(admin).returnBook(2n)).to.emit(library, 'BookReturned');
    });

    it('calculates zero fine on time and integer ₹5/day overdue fine', async () => {
      const { library, admin, student1, student2 } = await deployFixture();
      await library.connect(admin).registerMember(student1.address);
      await library.connect(admin).registerMember(student2.address);
      await library.connect(admin).registerBook('Networks', 'Tanenbaum', '978-0132126953');
      await library.connect(admin).registerBookCopy(1n, 1001n);
      await library.connect(admin).registerBookCopy(1n, 1002n);

      // On-time return (10 days)
      await library.connect(student1).borrowBook(1001n);
      await time.increase(10 * 24 * 60 * 60);
      await library.connect(student1).returnBook(1n);
      expect(await library.getOutstandingFine(student1.address)).to.equal(0n);

      // Overdue return (14 days + 3 days 2 hours => 3 full overdue days => ₹15)
      await library.connect(student2).borrowBook(1002n);
      await time.increase(17 * 24 * 60 * 60 + 2 * 60 * 60);
      await library.connect(student2).returnBook(2n);

      expect(await library.getOutstandingFine(student2.address)).to.equal(15n);
      expect(await library.getOutstandingFine(student1.address)).to.equal(0n);

      await expect(library.connect(student2).settleFine()).to.emit(library, 'FineSettled');
      expect(await library.getOutstandingFine(student2.address)).to.equal(0n);
      await expect(library.connect(student2).settleFine()).to.be.revertedWith(
        'No outstanding fine to settle',
      );
    });
  });

  describe('Reservations', () => {
    it('allows reservation only when unavailable, prevents duplicates, and handles cancel + FIFO allocation', async () => {
      const { library, admin, student1, student2, student3 } = await deployFixture();
      await library.connect(admin).registerMember(student1.address);
      await library.connect(admin).registerMember(student2.address);
      await library.connect(admin).registerMember(student3.address);
      await library.connect(admin).registerBook('Compilers', 'Aho', '978-0321486813');
      await library.connect(admin).registerBookCopy(1n, 1001n);

      // Cannot reserve when copy is available
      await expect(library.connect(student2).reserveBook(1n)).to.be.revertedWith(
        'Available copy exists; borrow directly instead',
      );

      // Student 1 borrows the only copy
      await library.connect(student1).borrowBook(1001n);

      // Student 2 and Student 3 reserve; duplicate reservation rejected
      await expect(library.connect(student2).reserveBook(1n)).to.emit(library, 'BookReserved');
      await expect(library.connect(student2).reserveBook(1n)).to.be.revertedWith(
        'Active reservation already exists',
      );
      await expect(library.connect(student3).reserveBook(1n)).to.emit(library, 'BookReserved');

      // Student 2 cancels own reservation (reservationId 1); Student 3 cannot cancel Student 2's
      await expect(library.connect(student2).cancelReservation(1n)).to.emit(
        library,
        'ReservationCancelled',
      );

      // Student 1 returns -> skipped cancelled reservation 1, allocated to Student 3 (reservationId 2)
      await expect(library.connect(student1).returnBook(1n))
        .to.emit(library, 'ReservationAllocated')
        .withArgs(2n, 1n, 1001n, student3.address);

      // Unrelated member (Student 2) cannot borrow reserved copy
      await expect(library.connect(student2).borrowBook(1001n)).to.be.revertedWith(
        'Copy is reserved for another member',
      );

      // Allocated member (Student 3) claims the reserved copy
      await expect(library.connect(student3).borrowBook(1001n)).to.emit(library, 'BookBorrowed');
    });
  });
});
