import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '../../layouts/AppLayout';
import { TxStatusBanner, type TxStatusState } from '../../components/TxStatusBanner';
import { useAuth } from '../../context/AuthContext';
import { useWallet } from '../../context/WalletContext';
import { apiRequest } from '../../services/api';
import { extractEthersError, getSignerLibraryContract } from '../../blockchain/libraryContract';
import type { ReservationItem } from '../../types/library';

export function StudentReservationsPage() {
  const { user, token } = useAuth();
  const { isVerified, matchesProfileWallet, connectAndVerify } = useWallet();

  const [reservations, setReservations] = useState<ReservationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [txStatus, setTxStatus] = useState<TxStatusState>({ status: 'idle', message: '' });

  const loadReservations = useCallback(async () => {
    if (!token || !user?.walletAddress) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await apiRequest<{ reservations: ReservationItem[] }>(
        `/api/reservations?wallet=${encodeURIComponent(user.walletAddress)}`,
        { method: 'GET' },
        token,
      );
      setReservations(data.reservations);
    } finally {
      setLoading(false);
    }
  }, [token, user?.walletAddress]);

  useEffect(() => {
    void loadReservations();
  }, [loadReservations]);

  async function handleCancel(reservationId: number, title: string) {
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
        message: `Confirm cancelling reservation for "${title}" in MetaMask...`,
      });
      const contract = await getSignerLibraryContract();
      const tx = await contract.cancelReservation(reservationId);
      const receipt = await tx.wait();
      await apiRequest('/api/transactions/sync', { method: 'POST' }, token);

      setTxStatus({
        status: 'confirmed',
        message: `Cancelled reservation #${reservationId}.`,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
      });
      await loadReservations();
    } catch (err) {
      setTxStatus({ status: 'failed', message: extractEthersError(err) });
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-3xl font-bold text-primary">My Reservations</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track your FIFO reservation queue status, cancel waiting requests, or claim allocated copies.
          </p>
        </div>

        <TxStatusBanner
          state={txStatus}
          onDismiss={() => setTxStatus({ status: 'idle', message: '' })}
        />

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading your reservations...</p>
          ) : reservations.length === 0 ? (
            <p className="text-sm text-muted-foreground">You have no reservations.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="py-2 pr-4">Queue #</th>
                    <th className="py-2 pr-4">Book Title</th>
                    <th className="py-2 pr-4">Created</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {reservations.map((r) => (
                    <tr key={r.reservationId}>
                      <td className="py-3 pr-4 font-mono text-xs">#{r.reservationId}</td>
                      <td className="py-3 pr-4 font-medium">{r.bookTitle}</td>
                      <td className="py-3 pr-4 text-xs">
                        {new Date(r.createdAt * 1000).toLocaleString()}
                      </td>
                      <td className="py-3 pr-4">
                        <span className="rounded bg-muted px-2 py-0.5 text-xs font-semibold">
                          {r.status}
                        </span>
                      </td>
                      <td className="py-3">
                        {r.status === 'WAITING' && (
                          <button
                            type="button"
                            disabled={txStatus.status === 'pending'}
                            onClick={() => void handleCancel(r.reservationId, r.bookTitle)}
                            className="cursor-pointer rounded border border-destructive/40 px-2.5 py-1 text-xs font-semibold text-destructive hover:bg-destructive/10"
                          >
                            Cancel
                          </button>
                        )}
                        {r.status === 'ALLOCATED' && (
                          <Link
                            to="/student/catalogue"
                            className="rounded bg-accent px-2.5 py-1 text-xs font-semibold text-accent-foreground hover:opacity-90"
                          >
                            Claim in Catalogue
                          </Link>
                        )}
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
