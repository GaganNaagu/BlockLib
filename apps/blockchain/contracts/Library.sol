// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title Library
 * @notice Authoritative smart contract for BlockLib library book lending,
 *         physical copy tracking, overdue fine calculation, and FIFO reservations.
 * @dev Personal details (name, USN, email) are intentionally kept off-chain in PostgreSQL.
 */
contract Library {
    enum CopyStatus {
        AVAILABLE,
        BORROWED,
        RESERVED
    }

    enum LendingStatus {
        ACTIVE,
        RETURNED
    }

    enum ReservationStatus {
        WAITING,
        ALLOCATED,
        CANCELLED,
        FULFILLED
    }

    struct Book {
        uint256 bookId;
        string title;
        string author;
        string isbn;
        bool exists;
    }

    struct BookCopy {
        uint256 copyId;
        uint256 bookId;
        CopyStatus status;
        address reservedFor;
        bool exists;
    }

    struct Member {
        bool registered;
        bool active;
        uint256 outstandingFine;
        uint256 activeLoanCount;
    }

    struct LendingRecord {
        uint256 lendingId;
        uint256 copyId;
        address borrower;
        uint256 borrowedAt;
        uint256 dueAt;
        uint256 returnedAt;
        uint256 fine;
        LendingStatus status;
    }

    struct Reservation {
        uint256 reservationId;
        uint256 bookId;
        address member;
        uint256 createdAt;
        ReservationStatus status;
    }

    address public immutable admin;

    // Configurable lending rules (defaults from BlockLib_PLAN.md Section 5)
    uint256 public maxActiveLoans = 3;
    uint256 public loanPeriod = 14 days;
    uint256 public finePerDay = 5; // Simulated INR, integer rupees
    uint256 public maxAllowedFine = 0;

    uint256 public nextBookId = 1;
    uint256 public nextLendingId = 1;
    uint256 public nextReservationId = 1;

    mapping(uint256 => Book) private books;
    mapping(uint256 => uint256[]) private bookCopyIds;
    mapping(uint256 => BookCopy) private copies;
    mapping(address => Member) private members;
    mapping(uint256 => LendingRecord) private lendingRecords;
    mapping(uint256 => uint256) private activeCopyLendingId;
    mapping(address => uint256[]) private memberLendingIds;

    mapping(uint256 => Reservation) private reservations;
    mapping(uint256 => uint256[]) private bookReservationQueue;
    mapping(uint256 => uint256) private bookQueueHead;
    mapping(uint256 => uint256) private copyReservedReservationId;
    mapping(uint256 => mapping(address => bool)) private hasActiveBookReservation;
    mapping(address => uint256[]) private memberReservationIds;

    event BookRegistered(uint256 indexed bookId, string title, string author, string isbn);
    event BookCopyRegistered(uint256 indexed copyId, uint256 indexed bookId);
    event MemberRegistered(address indexed memberWallet);
    event MemberStatusUpdated(address indexed memberWallet, bool active);
    event BookBorrowed(
        uint256 indexed lendingId,
        uint256 indexed copyId,
        uint256 indexed bookId,
        address borrower,
        uint256 borrowedAt,
        uint256 dueAt
    );
    event BookReturned(
        uint256 indexed lendingId,
        uint256 indexed copyId,
        address indexed borrower,
        uint256 returnedAt,
        uint256 fine
    );
    event BookReserved(
        uint256 indexed reservationId,
        uint256 indexed bookId,
        address indexed member,
        uint256 createdAt
    );
    event ReservationCancelled(
        uint256 indexed reservationId,
        uint256 indexed bookId,
        address indexed member
    );
    event ReservationAllocated(
        uint256 indexed reservationId,
        uint256 indexed bookId,
        uint256 copyId,
        address indexed member
    );
    event FineSettled(address indexed member, uint256 amount, uint256 settledAt);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    modifier onlyActiveMember() {
        Member storage m = members[msg.sender];
        require(m.registered, "Caller is not a registered member");
        require(m.active, "Member account is inactive");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    // -------------------------------------------------------------------------
    // Administrative Functions
    // -------------------------------------------------------------------------

    function registerMember(address memberWallet) external onlyAdmin {
        require(memberWallet != address(0), "Invalid wallet address");
        require(!members[memberWallet].registered, "Member already registered");

        members[memberWallet] = Member({
            registered: true,
            active: true,
            outstandingFine: 0,
            activeLoanCount: 0
        });

        emit MemberRegistered(memberWallet);
    }

    function setMemberActive(address memberWallet, bool active) external onlyAdmin {
        require(members[memberWallet].registered, "Member not registered");
        members[memberWallet].active = active;
        emit MemberStatusUpdated(memberWallet, active);
    }

    function registerBook(
        string calldata title,
        string calldata author,
        string calldata isbn
    ) external onlyAdmin returns (uint256 bookId) {
        require(bytes(title).length > 0, "Title is required");
        require(bytes(author).length > 0, "Author is required");
        require(bytes(isbn).length > 0, "ISBN is required");

        bookId = nextBookId++;
        books[bookId] = Book({
            bookId: bookId,
            title: title,
            author: author,
            isbn: isbn,
            exists: true
        });

        emit BookRegistered(bookId, title, author, isbn);
    }

    function registerBookCopy(uint256 bookId, uint256 copyId) external onlyAdmin {
        require(books[bookId].exists, "Book does not exist");
        require(copyId > 0, "Copy ID must be positive");
        require(!copies[copyId].exists, "Copy ID already exists");

        copies[copyId] = BookCopy({
            copyId: copyId,
            bookId: bookId,
            status: CopyStatus.AVAILABLE,
            reservedFor: address(0),
            exists: true
        });
        bookCopyIds[bookId].push(copyId);

        emit BookCopyRegistered(copyId, bookId);
    }

    // -------------------------------------------------------------------------
    // Lending, Return, Reservation & Fine Functions
    // -------------------------------------------------------------------------

    function borrowBook(uint256 copyId) external onlyActiveMember returns (uint256 lendingId) {
        BookCopy storage copy = copies[copyId];
        require(copy.exists, "Book copy does not exist");

        Member storage member = members[msg.sender];
        require(member.activeLoanCount < maxActiveLoans, "Maximum active loan limit reached");
        require(member.outstandingFine <= maxAllowedFine, "Outstanding fine must be settled first");

        if (copy.status == CopyStatus.RESERVED) {
            require(copy.reservedFor == msg.sender, "Copy is reserved for another member");
            uint256 resId = copyReservedReservationId[copyId];
            if (resId != 0) {
                reservations[resId].status = ReservationStatus.FULFILLED;
                copyReservedReservationId[copyId] = 0;
            }
            hasActiveBookReservation[copy.bookId][msg.sender] = false;
            copy.reservedFor = address(0);
        } else {
            require(copy.status == CopyStatus.AVAILABLE, "Copy is not available for borrowing");
        }

        lendingId = nextLendingId++;
        uint256 borrowedAt = block.timestamp;
        uint256 dueAt = borrowedAt + loanPeriod;

        lendingRecords[lendingId] = LendingRecord({
            lendingId: lendingId,
            copyId: copyId,
            borrower: msg.sender,
            borrowedAt: borrowedAt,
            dueAt: dueAt,
            returnedAt: 0,
            fine: 0,
            status: LendingStatus.ACTIVE
        });

        activeCopyLendingId[copyId] = lendingId;
        memberLendingIds[msg.sender].push(lendingId);
        member.activeLoanCount += 1;
        copy.status = CopyStatus.BORROWED;

        emit BookBorrowed(lendingId, copyId, copy.bookId, msg.sender, borrowedAt, dueAt);
    }

    function returnBook(uint256 lendingId) external {
        require(lendingId > 0 && lendingId < nextLendingId, "Lending record does not exist");
        LendingRecord storage record = lendingRecords[lendingId];
        require(record.status == LendingStatus.ACTIVE, "Book has already been returned");
        require(
            msg.sender == record.borrower || msg.sender == admin,
            "Only borrower or admin can confirm return"
        );

        uint256 fine = 0;
        if (block.timestamp > record.dueAt) {
            uint256 overdueSeconds = block.timestamp - record.dueAt;
            uint256 overdueDays = overdueSeconds / 1 days;
            fine = overdueDays * finePerDay;
        }

        record.status = LendingStatus.RETURNED;
        record.returnedAt = block.timestamp;
        record.fine = fine;

        Member storage borrowerMember = members[record.borrower];
        borrowerMember.activeLoanCount -= 1;
        if (fine > 0) {
            borrowerMember.outstandingFine += fine;
        }

        activeCopyLendingId[record.copyId] = 0;

        emit BookReturned(lendingId, record.copyId, record.borrower, block.timestamp, fine);

        _allocateReturnedCopy(record.copyId);
    }

    function reserveBook(uint256 bookId) external onlyActiveMember returns (uint256 reservationId) {
        require(books[bookId].exists, "Book does not exist");
        require(!_hasAvailableCopy(bookId), "Available copy exists; borrow directly instead");
        require(!hasActiveBookReservation[bookId][msg.sender], "Active reservation already exists");

        reservationId = nextReservationId++;
        reservations[reservationId] = Reservation({
            reservationId: reservationId,
            bookId: bookId,
            member: msg.sender,
            createdAt: block.timestamp,
            status: ReservationStatus.WAITING
        });

        bookReservationQueue[bookId].push(reservationId);
        memberReservationIds[msg.sender].push(reservationId);
        hasActiveBookReservation[bookId][msg.sender] = true;

        emit BookReserved(reservationId, bookId, msg.sender, block.timestamp);
    }

    function cancelReservation(uint256 reservationId) external {
        require(
            reservationId > 0 && reservationId < nextReservationId,
            "Reservation does not exist"
        );
        Reservation storage res = reservations[reservationId];
        require(res.member == msg.sender, "Only reservation owner can cancel");
        require(res.status == ReservationStatus.WAITING, "Reservation is not in waiting state");

        res.status = ReservationStatus.CANCELLED;
        hasActiveBookReservation[res.bookId][msg.sender] = false;

        emit ReservationCancelled(reservationId, res.bookId, msg.sender);
    }

    function settleFine() external {
        Member storage member = members[msg.sender];
        require(member.registered, "Caller is not a registered member");
        require(member.outstandingFine > 0, "No outstanding fine to settle");

        uint256 amount = member.outstandingFine;
        member.outstandingFine = 0;

        emit FineSettled(msg.sender, amount, block.timestamp);
    }

    // -------------------------------------------------------------------------
    // Internal Helpers
    // -------------------------------------------------------------------------

    function _hasAvailableCopy(uint256 bookId) internal view returns (bool) {
        uint256[] storage ids = bookCopyIds[bookId];
        for (uint256 i = 0; i < ids.length; i++) {
            if (copies[ids[i]].status == CopyStatus.AVAILABLE) {
                return true;
            }
        }
        return false;
    }

    function _allocateReturnedCopy(uint256 copyId) internal {
        BookCopy storage copy = copies[copyId];
        uint256 bookId = copy.bookId;
        uint256[] storage queue = bookReservationQueue[bookId];
        uint256 head = bookQueueHead[bookId];

        while (head < queue.length) {
            uint256 resId = queue[head];
            head++;
            Reservation storage res = reservations[resId];

            if (res.status == ReservationStatus.WAITING && members[res.member].active) {
                res.status = ReservationStatus.ALLOCATED;
                bookQueueHead[bookId] = head;
                copy.status = CopyStatus.RESERVED;
                copy.reservedFor = res.member;
                copyReservedReservationId[copyId] = resId;

                emit ReservationAllocated(resId, bookId, copyId, res.member);
                return;
            }
        }

        bookQueueHead[bookId] = head;
        copy.status = CopyStatus.AVAILABLE;
        copy.reservedFor = address(0);
    }

    // -------------------------------------------------------------------------
    // Read Functions
    // -------------------------------------------------------------------------

    function getBook(uint256 bookId) external view returns (Book memory) {
        require(books[bookId].exists, "Book does not exist");
        return books[bookId];
    }

    function getBookCopies(uint256 bookId) external view returns (uint256[] memory) {
        require(books[bookId].exists, "Book does not exist");
        return bookCopyIds[bookId];
    }

    function getBookCopy(uint256 copyId) external view returns (BookCopy memory) {
        require(copies[copyId].exists, "Book copy does not exist");
        return copies[copyId];
    }

    function getMember(address memberWallet) external view returns (Member memory) {
        return members[memberWallet];
    }

    function getLendingRecord(uint256 lendingId) external view returns (LendingRecord memory) {
        require(lendingId > 0 && lendingId < nextLendingId, "Lending record does not exist");
        return lendingRecords[lendingId];
    }

    function getMemberLendingHistory(address memberWallet) external view returns (uint256[] memory) {
        return memberLendingIds[memberWallet];
    }

    function getReservation(uint256 reservationId) external view returns (Reservation memory) {
        require(
            reservationId > 0 && reservationId < nextReservationId,
            "Reservation does not exist"
        );
        return reservations[reservationId];
    }

    function getBookReservationQueue(uint256 bookId) external view returns (uint256[] memory) {
        return bookReservationQueue[bookId];
    }

    function getMemberReservations(address memberWallet) external view returns (uint256[] memory) {
        return memberReservationIds[memberWallet];
    }

    function getOutstandingFine(address memberWallet) external view returns (uint256) {
        return members[memberWallet].outstandingFine;
    }
}
