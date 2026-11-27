import { useCallback, useEffect, useState } from 'react';
import { AppLayout } from '../../layouts/AppLayout';
import { TxStatusBanner, type TxStatusState } from '../../components/TxStatusBanner';
import { useAuth } from '../../context/AuthContext';
import { useWallet } from '../../context/WalletContext';
import { apiRequest } from '../../services/api';
import { extractEthersError, getSignerLibraryContract } from '../../blockchain/libraryContract';
import type { LendingRecordItem } from '../../types/library';

export function StudentLoansPage() {
  const { user, token } = useAuth();
  const { isVerified, matchesProfileWallet, connectAndVerify } = useWallet();

  const [records, setRecords] = useState<LendingRecordItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [txStatus, setTxStatus] = useState<TxStatusState>({ status: 'idle', message: '' });

  const loadLoans = useCallback(async () => {
    if (!token || !user?.walletAddress) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await apiRequest<{ records: LendingRecordItem[] }>(
        `/api/lending?wallet=${encodeURIComponent(user.walletAddress)}`,
        { method: 'GET' },
        token,
      );
      setRecords(data.records);
    } finally {
      setLoading(false);
    }
  }, [token, user?.walletAddress]);

  useEffect(() => {
    void loadLoans();
  }, [loadLoans]);

  async function handleReturn(lendingId: number, title: string) {
    if (!token) return;
    if (!isVerified) {
      await connectAndVerify();
    }
    if (!matchesProfileWallet) {
      setTxStatus({
        status: 'failed',
        message: `Please switch MetaMask to your registered wallet (${user?.walletAddress}).`,
      });
      return;
    }

    try {
      setTxStatus({ status: 'pending', message: `Confirm return of "${title}" in MetaMask...` });
      const contract = await getSignerLibraryContract();
      const tx = await contract.returnBook(lendingId);
      setTxStatus({ status: 'pending', message: 'Waiting for confirmation...', txHash: tx.hash });
      const receipt = await tx.wait();
      await apiRequest('/api/transactions/sync', { method: 'POST' }, token);

      setTxStatus({
        status: 'confirmed',
        message: `Returned "${title}" (Loan #${lendingId}).`,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
      });
      await loadLoans();
    } catch (err) {
      setTxStatus({ status: 'failed', message: extractEthersError(err) });
    }
  }

  const nowSec = Math.floor(Date.now() / 1000);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-3xl font-bold text-primary">My Loans</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your active borrowed books, due dates, return history, and assessed overdue fines.
          </p>
        </div>

        <TxStatusBanner
          state={txStatus}
          onDismiss={() => setTxStatus({ status: 'idle', message: '' })}
        />

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading your loans...</p>
          ) : records.length === 0 ? (
            <p className="text-sm text-muted-foreground">You have no lending records yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="py-2 pr-4">Book & Copy</th>
                    <th className="py-2 pr-4">Borrowed</th>
                    <th className="py-2 pr-4">Due Date</th>
                    <th className="py-2 pr-4">Status / Fine</th>
                    <th className="py-2">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {records.map((r) => {
                    const isOverdue = r.status === 'ACTIVE' && nowSec > r.dueAt;
                    return (
                      <tr key={r.lendingId}>
                        <td className="py-3 pr-4">
                          <p className="font-medium">{r.bookTitle}</p>
                          <p className="font-mono text-xs text-muted-foreground">
                            Loan #{r.lendingId} • Copy #{r.copyId}
                          </p>
                        </td>
                        <td className="py-3 pr-4 text-xs">
                          {new Date(r.borrowedAt * 1000).toLocaleDateString()}
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
                          {r.fine > 0 && (
                            <span className="ml-2 font-semibold text-destructive">
                              Fine: ₹{r.fine}
                            </span>
                          )}
                        </td>
                        <td className="py-3">
                          {r.status === 'ACTIVE' && (
                            <button
                              type="button"
                              disabled={txStatus.status === 'pending'}
                              onClick={() => void handleReturn(r.lendingId, r.bookTitle)}
                              className="cursor-pointer rounded bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
                            >
                              Return Book
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
