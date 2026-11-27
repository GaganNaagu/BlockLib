import { useCallback, useEffect, useState } from 'react';
import { AppLayout } from '../../layouts/AppLayout';
import { TxStatusBanner, type TxStatusState } from '../../components/TxStatusBanner';
import { useAuth } from '../../context/AuthContext';
import { useWallet } from '../../context/WalletContext';
import { apiRequest } from '../../services/api';
import { extractEthersError, getSignerLibraryContract } from '../../blockchain/libraryContract';
import type { LendingRecordItem } from '../../types/library';

export function StudentFinesPage() {
  const { user, token } = useAuth();
  const { isVerified, matchesProfileWallet, connectAndVerify } = useWallet();

  const [outstandingFine, setOutstandingFine] = useState(0);
  const [fineHistory, setFineHistory] = useState<LendingRecordItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [txStatus, setTxStatus] = useState<TxStatusState>({ status: 'idle', message: '' });

  const loadFines = useCallback(async () => {
    if (!token || !user?.walletAddress) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [dash, lending] = await Promise.all([
        apiRequest<{ stats: { outstandingFine: number } }>(
          '/api/dashboard/student',
          { method: 'GET' },
          token,
        ),
        apiRequest<{ records: LendingRecordItem[] }>(
          `/api/lending?wallet=${encodeURIComponent(user.walletAddress)}`,
          { method: 'GET' },
          token,
        ),
      ]);
      setOutstandingFine(dash.stats.outstandingFine);
      setFineHistory(lending.records.filter((r) => r.fine > 0));
    } finally {
      setLoading(false);
    }
  }, [token, user?.walletAddress]);

  useEffect(() => {
    void loadFines();
  }, [loadFines]);

  async function handleSettleFine() {
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
      setTxStatus({
        status: 'pending',
        message: `Confirm simulated settlement of ₹${outstandingFine} in MetaMask...`,
      });
      const contract = await getSignerLibraryContract();
      const tx = await contract.settleFine();
      setTxStatus({ status: 'pending', message: 'Waiting for confirmation...', txHash: tx.hash });
      const receipt = await tx.wait();
      await apiRequest('/api/transactions/sync', { method: 'POST' }, token);

      setTxStatus({
        status: 'confirmed',
        message: 'Outstanding fine settled on-chain.',
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
      });
      await loadFines();
    } catch (err) {
      setTxStatus({ status: 'failed', message: extractEthersError(err) });
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-3xl font-bold text-primary">My Fines</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            View overdue penalty balance (₹5/day) and settle simulated fines on-chain.
          </p>
        </div>

        <TxStatusBanner
          state={txStatus}
          onDismiss={() => setTxStatus({ status: 'idle', message: '' })}
        />

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading fine details...</p>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-6 shadow-sm">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Outstanding Fine Balance
                </p>
                <p className="mt-1 font-heading text-4xl font-bold text-primary">
                  ₹{outstandingFine}
                </p>
              </div>
              <button
                type="button"
                disabled={outstandingFine === 0 || txStatus.status === 'pending'}
                onClick={() => void handleSettleFine()}
                className="cursor-pointer rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Settle Fine (Simulated)
              </button>
            </div>

            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <h2 className="mb-3 font-heading text-xl font-bold text-primary">Fine History</h2>
              {fineHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground">No overdue fines recorded.</p>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="py-2 pr-4">Loan</th>
                      <th className="py-2 pr-4">Book</th>
                      <th className="py-2 pr-4">Returned</th>
                      <th className="py-2">Assessed Fine</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {fineHistory.map((r) => (
                      <tr key={r.lendingId}>
                        <td className="py-2.5 pr-4 font-mono text-xs">#{r.lendingId}</td>
                        <td className="py-2.5 pr-4">{r.bookTitle}</td>
                        <td className="py-2.5 pr-4 text-xs">
                          {new Date(r.returnedAt * 1000).toLocaleDateString()}
                        </td>
                        <td className="py-2.5 font-semibold text-destructive">₹{r.fine}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
