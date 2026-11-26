import { useEffect, useState } from 'react';
import { AppLayout } from '../../layouts/AppLayout';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../services/api';
import type { MemberItem, ReservationItem } from '../../types/library';

interface AdminStats {
  totalBooks: number;
  totalCopies: number;
  totalMembers: number;
  availableCopies: number;
  borrowedCopies: number;
  reservedCopies: number;
}

export function AdminDashboardPage() {
  const { token } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [activeReservations, setActiveReservations] = useState(0);
  const [totalOutstandingFines, setTotalOutstandingFines] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    Promise.all([
      apiRequest<{ stats: AdminStats }>('/api/dashboard/admin', { method: 'GET' }, token),
      apiRequest<{ reservations: ReservationItem[] }>('/api/reservations', { method: 'GET' }, token),
      apiRequest<{ members: MemberItem[] }>('/api/members', { method: 'GET' }, token),
    ])
      .then(([dash, resData, memData]) => {
        if (cancelled) return;
        setStats(dash.stats);
        setActiveReservations(
          resData.reservations.filter((r) => r.status === 'WAITING' || r.status === 'ALLOCATED')
            .length,
        );
        setTotalOutstandingFines(
          memData.members.reduce((sum, m) => sum + (m.onChain?.outstandingFine ?? 0), 0),
        );
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const cards = [
    { label: 'Total Book Titles', value: stats?.totalBooks ?? 0 },
    { label: 'Total Physical Copies', value: stats?.totalCopies ?? 0 },
    { label: 'Registered Members', value: stats?.totalMembers ?? 0 },
    { label: 'Currently Borrowed', value: stats?.borrowedCopies ?? 0 },
    { label: 'Available Copies', value: stats?.availableCopies ?? 0 },
    { label: 'Active Reservations', value: activeReservations },
    { label: 'Outstanding Fines', value: `₹${totalOutstandingFines}` },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-3xl font-bold text-primary">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Overview of library catalogue, on-chain copy availability, reservations, and fines.
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
            Loading dashboard statistics...
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((card) => (
              <div
                key={card.label}
                className="rounded-xl border border-border bg-card p-5 shadow-sm"
              >
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {card.label}
                </p>
                <p className="mt-2 font-heading text-3xl font-bold text-primary">{card.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
