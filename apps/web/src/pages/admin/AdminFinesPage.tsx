import { useEffect, useState } from 'react';
import { AppLayout } from '../../layouts/AppLayout';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../services/api';
import { shortenAddress } from '../../blockchain/libraryContract';
import type { BlockchainTxItem, LendingRecordItem, MemberItem } from '../../types/library';

export function AdminFinesPage() {
  const { token } = useAuth();
  const [members, setMembers] = useState<MemberItem[]>([]);
  const [fineLoans, setFineLoans] = useState<LendingRecordItem[]>([]);
  const [settlements, setSettlements] = useState<BlockchainTxItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    Promise.all([
      apiRequest<{ members: MemberItem[] }>('/api/members', { method: 'GET' }, token),
      apiRequest<{ records: LendingRecordItem[] }>('/api/lending', { method: 'GET' }, token),
      apiRequest<{ transactions: BlockchainTxItem[] }>(
        '/api/transactions?eventType=FineSettled',
        { method: 'GET' },
        token,
      ),
    ])
      .then(([mData, lData, tData]) => {
        setMembers(mData.members);
        setFineLoans(lData.records.filter((r) => r.fine > 0));
        setSettlements(tData.transactions);
      })
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-3xl font-bold text-primary">Fine Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Outstanding member balances, assessed overdue fines, and confirmed settlements.
          </p>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading fine records...</p>
        ) : (
          <>
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <h2 className="mb-3 font-heading text-xl font-bold text-primary">
                Member Outstanding Balances
              </h2>
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="py-2 pr-4">Student</th>
                    <th className="py-2 pr-4">Wallet</th>
                    <th className="py-2">Outstanding Fine</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {members.map((m) => (
                    <tr key={m.id}>
                      <td className="py-2.5 pr-4 font-medium">{m.name}</td>
                      <td className="py-2.5 pr-4 font-mono text-xs">
                        {shortenAddress(m.walletAddress)}
                      </td>
                      <td className="py-2.5 font-semibold">₹{m.onChain.outstandingFine}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <h2 className="mb-3 font-heading text-xl font-bold text-primary">
                Assessed Overdue Fines
              </h2>
              {fineLoans.length === 0 ? (
                <p className="text-sm text-muted-foreground">No overdue fines assessed yet.</p>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="py-2 pr-4">Loan</th>
                      <th className="py-2 pr-4">Book</th>
                      <th className="py-2 pr-4">Borrower</th>
                      <th className="py-2">Fine</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {fineLoans.map((l) => (
                      <tr key={l.lendingId}>
                        <td className="py-2.5 pr-4 font-mono text-xs">#{l.lendingId}</td>
                        <td className="py-2.5 pr-4">{l.bookTitle}</td>
                        <td className="py-2.5 pr-4">{l.borrowerName}</td>
                        <td className="py-2.5 font-semibold text-destructive">₹{l.fine}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <h2 className="mb-3 font-heading text-xl font-bold text-primary">
                Settlement Transactions
              </h2>
              {settlements.length === 0 ? (
                <p className="text-sm text-muted-foreground">No fine settlements recorded yet.</p>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="py-2 pr-4">Tx Hash</th>
                      <th className="py-2 pr-4">From</th>
                      <th className="py-2 pr-4">Block</th>
                      <th className="py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {settlements.map((tx) => (
                      <tr key={tx.id}>
                        <td className="py-2.5 pr-4 font-mono text-xs">{shortenAddress(tx.txHash)}</td>
                        <td className="py-2.5 pr-4 font-mono text-xs">
                          {shortenAddress(tx.fromAddress)}
                        </td>
                        <td className="py-2.5 pr-4 font-mono text-xs">#{tx.blockNumber ?? '-'}</td>
                        <td className="py-2.5 text-xs font-semibold text-emerald-700">{tx.status}</td>
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
