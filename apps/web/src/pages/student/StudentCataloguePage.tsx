import { useCallback, useEffect, useState } from 'react';
import { MagnifyingGlass } from '@phosphor-icons/react';
import { AppLayout } from '../../layouts/AppLayout';
import { TxStatusBanner, type TxStatusState } from '../../components/TxStatusBanner';
import { useAuth } from '../../context/AuthContext';
import { useWallet } from '../../context/WalletContext';
import { apiRequest } from '../../services/api';
import { extractEthersError, getSignerLibraryContract } from '../../blockchain/libraryContract';
import type { BookItem } from '../../types/library';

export function StudentCataloguePage() {
  const { token, user } = useAuth();
  const { account, isVerified, matchesProfileWallet, connectAndVerify } = useWallet();

  const [books, setBooks] = useState<BookItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [txStatus, setTxStatus] = useState<TxStatusState>({ status: 'idle', message: '' });

  const loadBooks = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const q = search.trim() ? `?q=${encodeURIComponent(search.trim())}` : '';
      const data = await apiRequest<{ books: BookItem[] }>(`/api/books${q}`, { method: 'GET' }, token);
      setBooks(data.books);
    } finally {
      setLoading(false);
    }
  }, [token, search]);

  useEffect(() => {
    void loadBooks();
  }, [loadBooks]);

  async function ensureWalletReady(): Promise<boolean> {
    if (!isVerified) {
      await connectAndVerify();
    }
    if (!matchesProfileWallet) {
      setTxStatus({
        status: 'failed',
        message: `Please switch MetaMask to your registered wallet (${user?.walletAddress}).`,
      });
      return false;
    }
    return true;
  }

  async function handleBorrow(copyId: number, title: string) {
    if (!token || !(await ensureWalletReady())) return;

    try {
      setTxStatus({
        status: 'pending',
        message: `Confirm borrowing "${title}" (Copy #${copyId}) in MetaMask...`,
      });
      const contract = await getSignerLibraryContract();
      const tx = await contract.borrowBook(copyId);
      setTxStatus({ status: 'pending', message: 'Waiting for confirmation...', txHash: tx.hash });
      const receipt = await tx.wait();
      await apiRequest('/api/transactions/sync', { method: 'POST' }, token);

      setTxStatus({
        status: 'confirmed',
        message: `Borrowed "${title}" (Copy #${copyId}).`,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
      });
      await loadBooks();
    } catch (err) {
      setTxStatus({ status: 'failed', message: extractEthersError(err) });
    }
  }

  async function handleReserve(chainBookId: number, title: string) {
    if (!token || !(await ensureWalletReady())) return;

    try {
      setTxStatus({
        status: 'pending',
        message: `Confirm reservation for "${title}" in MetaMask...`,
      });
      const contract = await getSignerLibraryContract();
      const tx = await contract.reserveBook(chainBookId);
      setTxStatus({ status: 'pending', message: 'Waiting for confirmation...', txHash: tx.hash });
      const receipt = await tx.wait();
      await apiRequest('/api/transactions/sync', { method: 'POST' }, token);

      setTxStatus({
        status: 'confirmed',
        message: `Reserved "${title}". You will be allocated the next returned copy in FIFO order.`,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
      });
      await loadBooks();
    } catch (err) {
      setTxStatus({ status: 'failed', message: extractEthersError(err) });
    }
  }

  const walletLower = (account ?? user?.walletAddress ?? '').toLowerCase();

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-heading text-3xl font-bold text-primary">Book Catalogue</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Browse available copies, borrow a physical copy, or reserve unavailable titles.
            </p>
          </div>
          <div className="relative w-full max-w-xs">
            <MagnifyingGlass
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              type="search"
              placeholder="Search title, author, ISBN..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-border bg-card pl-9 pr-3 py-2 text-sm"
            />
          </div>
        </div>

        <TxStatusBanner
          state={txStatus}
          onDismiss={() => setTxStatus({ status: 'idle', message: '' })}
        />

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading book catalogue...</p>
        ) : books.length === 0 ? (
          <p className="text-sm text-muted-foreground">No books found.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {books.map((book) => {
              const reservedForMe = book.copies.find(
                (c) =>
                  c.status === 'RESERVED' &&
                  c.reservedFor &&
                  c.reservedFor.toLowerCase() === walletLower,
              );
              const firstAvailable = book.copies.find((c) => c.status === 'AVAILABLE');
              const canReserve = book.counts.total > 0 && book.counts.available === 0 && !reservedForMe;

              return (
                <div
                  key={book.id}
                  className="rounded-xl border border-border bg-card p-5 shadow-sm flex flex-wrap items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">
                        #{book.chainBookId}
                      </span>
                      <h2 className="font-heading text-xl font-bold text-primary">{book.title}</h2>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {book.author} • ISBN {book.isbn} • {book.category}
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {book.copies.map((c) => (
                        <span
                          key={c.id}
                          className={`rounded px-2 py-0.5 font-mono text-xs ${
                            c.status === 'AVAILABLE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : c.status === 'RESERVED'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          Copy #{c.chainCopyId}: {c.status}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {reservedForMe && (
                      <button
                        type="button"
                        disabled={txStatus.status === 'pending'}
                        onClick={() => void handleBorrow(reservedForMe.chainCopyId, book.title)}
                        className="cursor-pointer rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-accent-foreground hover:opacity-90 disabled:opacity-50"
                      >
                        Claim Reserved Copy #{reservedForMe.chainCopyId}
                      </button>
                    )}
                    {firstAvailable && (
                      <button
                        type="button"
                        disabled={txStatus.status === 'pending'}
                        onClick={() => void handleBorrow(firstAvailable.chainCopyId, book.title)}
                        className="cursor-pointer rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
                      >
                        Borrow Copy #{firstAvailable.chainCopyId}
                      </button>
                    )}
                    {canReserve && (
                      <button
                        type="button"
                        disabled={txStatus.status === 'pending'}
                        onClick={() => void handleReserve(book.chainBookId, book.title)}
                        className="cursor-pointer rounded-lg border border-primary px-4 py-2 text-xs font-semibold text-primary hover:bg-primary/5 disabled:opacity-50"
                      >
                        Reserve Title
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
