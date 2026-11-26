import { useEffect, useState } from 'react';
import { AppLayout } from '../../layouts/AppLayout';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../services/api';
import { shortenAddress } from '../../blockchain/libraryContract';
import type { ReservationItem } from '../../types/library';

export function AdminReservationsPage() {
  const { token } = useAuth();
  const [reservations, setReservations] = useState<ReservationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    apiRequest<{ reservations: ReservationItem[] }>('/api/reservations', { method: 'GET' }, token)
      .then((data) => setReservations(data.reservations))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-3xl font-bold text-primary">Reservations</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            First-come-first-served (FIFO) reservation queue across library titles.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading reservations...</p>
          ) : reservations.length === 0 ? (
            <p className="text-sm text-muted-foreground">No reservations recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="py-2 pr-4">Queue #</th>
                    <th className="py-2 pr-4">Book Title</th>
                    <th className="py-2 pr-4">Member</th>
                    <th className="py-2 pr-4">Created</th>
                    <th className="py-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {reservations.map((r) => (
                    <tr key={r.reservationId}>
                      <td className="py-3 pr-4 font-mono">#{r.reservationId}</td>
                      <td className="py-3 pr-4 font-medium">{r.bookTitle}</td>
                      <td className="py-3 pr-4">
                        <p className="font-medium">{r.memberName}</p>
                        <p className="font-mono text-xs text-muted-foreground">
                          {shortenAddress(r.memberWallet)}
                        </p>
                      </td>
                      <td className="py-3 pr-4 text-xs">
                        {new Date(r.createdAt * 1000).toLocaleString()}
                      </td>
                      <td className="py-3">
                        <span className="rounded bg-muted px-2 py-0.5 text-xs font-semibold">
                          {r.status}
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
