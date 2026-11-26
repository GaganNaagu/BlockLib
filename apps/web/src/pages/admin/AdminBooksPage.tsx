import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { MagnifyingGlass, Plus } from '@phosphor-icons/react';
import { AppLayout } from '../../layouts/AppLayout';
import { TxStatusBanner, type TxStatusState } from '../../components/TxStatusBanner';
import { useAuth } from '../../context/AuthContext';
import { useWallet } from '../../context/WalletContext';
import { apiRequest } from '../../services/api';
import { extractEthersError, getSignerLibraryContract } from '../../blockchain/libraryContract';
import type { BookItem } from '../../types/library';

export function AdminBooksPage() {
  const { token } = useAuth();
  const { isVerified, connectAndVerify } = useWallet();

  const [books, setBooks] = useState<BookItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [txStatus, setTxStatus] = useState<TxStatusState>({ status: 'idle', message: '' });

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [isbn, setIsbn] = useState('');
  const [category, setCategory] = useState('Computer Science');

  const [selectedBookId, setSelectedBookId] = useState('');
  const [copyIdInput, setCopyIdInput] = useState('');

  const loadBooks = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const q = search.trim() ? `?q=${encodeURIComponent(search.trim())}` : '';
      const data = await apiRequest<{ books: BookItem[] }>(`/api/books${q}`, { method: 'GET' }, token);
      setBooks(data.books);
      if (!selectedBookId && data.books.length > 0) {
        setSelectedBookId(data.books[0].id);
      }
    } finally {
      setLoading(false);
    }
  }, [token, search, selectedBookId]);

  useEffect(() => {
    void loadBooks();
  }, [loadBooks]);

  async function handleRegisterBook(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    if (!isVerified) {
      await connectAndVerify();
    }

    try {
      setTxStatus({ status: 'pending', message: 'Confirm book registration in MetaMask...' });
      const contract = await getSignerLibraryContract();
      const tx = await contract.registerBook(title.trim(), author.trim(), isbn.trim());
      setTxStatus({
        status: 'pending',
        message: 'Waiting for block confirmation...',
        txHash: tx.hash,
      });
      const receipt = await tx.wait();

      let chainBookId = 0;
      for (const log of receipt.logs) {
        try {
          const parsed = contract.interface.parseLog(log);
          if (parsed?.name === 'BookRegistered') {
            chainBookId = Number(parsed.args[0]);
            break;
          }
        } catch {
          // ignore unrelated logs
        }
      }

      if (chainBookId > 0) {
        await apiRequest(
          '/api/books',
          {
            method: 'POST',
            body: JSON.stringify({
              chainBookId,
              title: title.trim(),
              author: author.trim(),
              isbn: isbn.trim(),
              category: category.trim() || 'General',
            }),
          },
          token,
        );
      }
      await apiRequest('/api/transactions/sync', { method: 'POST' }, token);

      setTxStatus({
        status: 'confirmed',
        message: `Registered "${title.trim()}" (On-chain Book ID #${chainBookId}).`,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
      });
      setTitle('');
      setAuthor('');
      setIsbn('');
      await loadBooks();
    } catch (err) {
      setTxStatus({ status: 'failed', message: extractEthersError(err) });
    }
  }

  async function handleAddCopy(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    const book = books.find((b) => b.id === selectedBookId);
    if (!book) return;

    const chainCopyId = Number(copyIdInput);
    if (!Number.isInteger(chainCopyId) || chainCopyId <= 0) {
      setTxStatus({ status: 'failed', message: 'Copy ID must be a positive integer.' });
      return;
    }

    try {
      setTxStatus({ status: 'pending', message: 'Confirm physical copy registration in MetaMask...' });
      const contract = await getSignerLibraryContract();
      const tx = await contract.registerBookCopy(book.chainBookId, chainCopyId);
      setTxStatus({
        status: 'pending',
        message: 'Waiting for block confirmation...',
        txHash: tx.hash,
      });
      const receipt = await tx.wait();

      await apiRequest(
        `/api/books/${book.id}/copies`,
        {
          method: 'POST',
          body: JSON.stringify({ chainCopyId }),
        },
        token,
      );
      await apiRequest('/api/transactions/sync', { method: 'POST' }, token);

      setTxStatus({
        status: 'confirmed',
        message: `Added copy #${chainCopyId} to "${book.title}".`,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
      });
      setCopyIdInput('');
      await loadBooks();
    } catch (err) {
      setTxStatus({ status: 'failed', message: extractEthersError(err) });
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-3xl font-bold text-primary">Book Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Register book titles and physical copies on-chain, and inspect copy availability.
          </p>
        </div>

        <TxStatusBanner
          state={txStatus}
          onDismiss={() => setTxStatus({ status: 'idle', message: '' })}
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <form
            onSubmit={handleRegisterBook}
            className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-3"
          >
            <h2 className="font-heading text-xl font-bold text-primary">Register New Book</h2>
            <input
              type="text"
              required
              placeholder="Book Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                required
                placeholder="Author"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm"
              />
              <input
                type="text"
                required
                placeholder="ISBN"
                value={isbn}
                onChange={(e) => setIsbn(e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm"
              />
            </div>
            <input
              type="text"
              placeholder="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={txStatus.status === 'pending'}
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:opacity-90 disabled:opacity-50"
            >
              <Plus size={16} aria-hidden="true" />
              Register Book On-Chain
            </button>
          </form>

          <form
            onSubmit={handleAddCopy}
            className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-3"
          >
            <h2 className="font-heading text-xl font-bold text-primary">Add Physical Copy</h2>
            <select
              value={selectedBookId}
              onChange={(e) => setSelectedBookId(e.target.value)}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
            >
              {books.map((b) => (
                <option key={b.id} value={b.id}>
                  #{b.chainBookId} — {b.title}
                </option>
              ))}
            </select>
            <input
              type="number"
              required
              min={1}
              placeholder="Physical Copy ID (e.g. 1001)"
              value={copyIdInput}
              onChange={(e) => setCopyIdInput(e.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={txStatus.status === 'pending' || books.length === 0}
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              <Plus size={16} aria-hidden="true" />
              Register Copy On-Chain
            </button>
          </form>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-heading text-xl font-bold text-primary">Catalogue</h2>
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
                className="w-full rounded-lg border border-border pl-9 pr-3 py-2 text-sm"
              />
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground">Loading books...</p>
          ) : books.length === 0 ? (
            <p className="text-sm text-muted-foreground">No books registered yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="py-2 pr-4">ID</th>
                    <th className="py-2 pr-4">Title & Author</th>
                    <th className="py-2 pr-4">ISBN</th>
                    <th className="py-2 pr-4">Availability</th>
                    <th className="py-2">Physical Copies</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {books.map((book) => (
                    <tr key={book.id}>
                      <td className="py-3 pr-4 font-mono">#{book.chainBookId}</td>
                      <td className="py-3 pr-4">
                        <p className="font-semibold text-foreground">{book.title}</p>
                        <p className="text-xs text-muted-foreground">{book.author}</p>
                      </td>
                      <td className="py-3 pr-4 font-mono text-xs">{book.isbn}</td>
                      <td className="py-3 pr-4 text-xs">
                        <span className="font-semibold text-emerald-700">
                          {book.counts.available} avail
                        </span>{' '}
                        / {book.counts.borrowed} borrowed / {book.counts.reserved} reserved
                      </td>
                      <td className="py-3">
                        <div className="flex flex-wrap gap-1.5">
                          {book.copies.map((c) => (
                            <span
                              key={c.id}
                              className="rounded bg-muted px-2 py-0.5 font-mono text-xs"
                            >
                              #{c.chainCopyId} ({c.status})
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
