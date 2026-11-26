export type CopyStatus = 'AVAILABLE' | 'BORROWED' | 'RESERVED' | 'UNKNOWN';
export type LendingStatus = 'ACTIVE' | 'RETURNED';
export type ReservationStatus = 'WAITING' | 'ALLOCATED' | 'CANCELLED' | 'FULFILLED';

export interface BookCopyItem {
  id: string;
  chainCopyId: number;
  status: CopyStatus;
  reservedFor: string | null;
}

export interface BookItem {
  id: string;
  chainBookId: number;
  title: string;
  author: string;
  isbn: string;
  category: string;
  copies: BookCopyItem[];
  counts: {
    total: number;
    available: number;
    borrowed: number;
    reserved: number;
  };
}

export interface MemberItem {
  id: string;
  name: string;
  usn: string | null;
  email: string;
  role: 'ADMIN' | 'STUDENT';
  walletAddress: string | null;
  createdAt: string;
  onChain: {
    registered: boolean;
    active: boolean;
    outstandingFine: number;
    activeLoanCount: number;
  };
}

export interface LendingRecordItem {
  lendingId: number;
  copyId: number;
  bookTitle: string;
  chainBookId: number | null;
  borrowerWallet: string;
  borrowerName: string;
  borrowerUsn: string | null;
  borrowedAt: number;
  dueAt: number;
  returnedAt: number;
  fine: number;
  status: LendingStatus;
}

export interface ReservationItem {
  reservationId: number;
  chainBookId: number;
  bookTitle: string;
  memberWallet: string;
  memberName: string;
  memberUsn: string | null;
  createdAt: number;
  status: ReservationStatus;
}

export interface BlockchainTxItem {
  id: string;
  txHash: string;
  blockNumber: number | null;
  fromAddress: string;
  eventType: string;
  status: 'PENDING' | 'CONFIRMED' | 'FAILED';
  createdAt: string;
}

export interface BlockchainEventItem {
  id: string;
  txHash: string;
  logIndex: number;
  eventName: string;
  entityId: string | null;
  blockNumber: number;
  blockTimestamp: string;
  payload: Record<string, unknown>;
}
