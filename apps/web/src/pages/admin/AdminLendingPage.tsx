import { useCallback, useEffect, useState } from 'react';
import { MagnifyingGlass } from '@phosphor-icons/react';
import { AppLayout } from '../../layouts/AppLayout';
import { TxStatusBanner, type TxStatusState } from '../../components/TxStatusBanner';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../services/api';
import { extractEthersError, getSignerLibraryContract } from '../../blockchain/libraryContract';
import type { LendingRecordItem } from '../../types/library';

export function AdminLendingPage() {
  const { token } = useAuth();
  const [records, setRecords] = useState<LendingRecordItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [txStatus, setTxStatus] = useState<TxStatusState>({ status: 'idle', message: '' });

  const loadRecords = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await apiRequest<{ records: LendingRecordItem[] }>(
        '/api/lending',
        { method: 'GET' },
        token,
      );
      setRecords(data.records);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadRecords();
  }, [loadRecords]);

  async function handleConfirmReturn(lendingId: number) {
    if (!token) return;
    try {
      setTxStatus({ status: 'pending', message: `Confirm return for Loan #${lendingId} in MetaMask...` });
      const contract = await getSignerLibraryContract();
      const tx = await contract.returnBook(lendingId);
      const receipt = await tx.wait();
      await apiRequest('/api/transactions/sync', { method: 'POST' }, token);

      setTxStatus({
        status: 'confirmed',
        message: `Loan #${lendingId} marked returned.`,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
      });
      await loadRecords();
    } catch (err) {
      setTxStatus({ status: 'failed', message: extractEthersError(err) });
    }
  }

  const filtered = records.filter((r) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      r.bookTitle.toLowerCase().includes(q) ||
      r.borrowerName.toLowerCase().includes(q) ||
      (r.borrowerUsn?.toLowerCase().includes(q) ?? false) ||
      String(r.copyId).includes(q)
    );
  });

  const nowSec = Math.floor(Date.now() / 1000);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-heading text-3xl font-bold text-primary">Lending Management</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Inspect active and returned loans, overdue status, and confirm returns.
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
              placeholder="Search student or book..."
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

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading lending records...</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">No lending records found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="py-2 pr-4">Loan / Copy</th>
                    <th className="py-2 pr-4">Book</th>
                    <th className="py-2 pr-4">Borrower</th>
                    <th className="py-2 pr-4">Due Date</th>
                    <th className="py-2 pr-4">Status / Fine</th>
                    <th className="py-2">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((r) => {
                    const isOverdue = r.status === 'ACTIVE' && nowSec > r.dueAt;
                    return (
                      <tr key={r.lendingId}>
                        <td className="py-3 pr-4 font-mono text-xs">
                          #{r.lendingId} (Copy #{r.copyId})
                        </td>
                        <td className="py-3 pr-4 font-medium">{r.bookTitle}</td>
                        <td className="py-3 pr-4">
                          <p className="font-medium">{r.borrowerName}</p>
                          <p className="text-xs text-muted-foreground">{r.borrowerUsn ?? r.borrowerWallet}</p>
                        </td>
                        <td className="py-3 pr-4 text-xs">
                          {new Date(r.dueAt * 1000).toLocaleDateString()}
                          {isOverdue && (
                            <span className="ml-2 rounded bg-destructive/10 px-1.5 py-0.5 font-semibold text-destructive">
                              Overdue
                            </span>
                          )}
                        </td>
                        <td className="py-3 pr-4 text-xs">
                          <span
                            className={`rounded px-2 py-0.5 font-semibold ${
                              r.status === 'ACTIVE'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {r.status}
                          </span>
                          {r.fine > 0 && <span className="ml-2 font-semibold">₹{r.fine}</span>}
                        </td>
                        <td className="py-3">
                          {r.status === 'ACTIVE' && (
                            <button
                              type="button"
                              onClick={() => void handleConfirmReturn(r.lendingId)}
                              className="cursor-pointer rounded bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground hover:opacity-90"
                            >
                              Confirm Return
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
