import { useCallback, useEffect, useState } from 'react';
import { ArrowsClockwise } from '@phosphor-icons/react';
import { AppLayout } from '../../layouts/AppLayout';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../services/api';
import { shortenAddress } from '../../blockchain/libraryContract';
import type { BlockchainTxItem } from '../../types/library';

export function StudentTransactionsPage() {
  const { user, token } = useAuth();
  const [transactions, setTransactions] = useState<BlockchainTxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const loadTransactions = useCallback(async () => {
    if (!token || !user?.walletAddress) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await apiRequest<{ transactions: BlockchainTxItem[] }>(
        `/api/transactions?wallet=${encodeURIComponent(user.walletAddress)}`,
        { method: 'GET' },
        token,
      );
      setTransactions(data.transactions);
    } finally {
      setLoading(false);
    }
  }, [token, user?.walletAddress]);

  useEffect(() => {
    void loadTransactions();
  }, [loadTransactions]);

  async function handleSync() {
    if (!token) return;
    setSyncing(true);
    try {
      await apiRequest('/api/transactions/sync', { method: 'POST' }, token);
      await loadTransactions();
    } finally {
      setSyncing(false);
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-heading text-3xl font-bold text-primary">My Transactions</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Your confirmed lending, return, reservation, and fine settlement transactions.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void handleSync()}
            disabled={syncing}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-3.5 py-2 text-xs font-semibold hover:bg-muted"
          >
            <ArrowsClockwise size={15} className={syncing ? 'animate-spin' : ''} aria-hidden="true" />
            {syncing ? 'Syncing...' : 'Refresh'}
          </button>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading your transactions...</p>
          ) : transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No transactions recorded for your wallet yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="py-2 pr-4">Tx Hash</th>
                    <th className="py-2 pr-4">Block</th>
                    <th className="py-2 pr-4">Action</th>
                    <th className="py-2 pr-4">Timestamp</th>
                    <th className="py-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {transactions.map((tx) => (
                    <tr key={tx.id}>
                      <td className="py-3 pr-4 font-mono text-xs" title={tx.txHash}>
                        {shortenAddress(tx.txHash)}
                      </td>
                      <td className="py-3 pr-4 font-mono text-xs">#{tx.blockNumber ?? '-'}</td>
                      <td className="py-3 pr-4 font-medium">{tx.eventType}</td>
                      <td className="py-3 pr-4 text-xs">
                        {new Date(tx.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3">
                        <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                          {tx.status}
                        </span>
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
