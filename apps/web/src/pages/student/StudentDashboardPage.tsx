import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '../../layouts/AppLayout';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../services/api';
import type { LendingRecordItem, ReservationItem } from '../../types/library';

interface StudentStats {
  activeLoans: number;
  outstandingFine: number;
  activeReservations: number;
  registeredOnChain: boolean;
  activeOnChain: boolean;
}

export function StudentDashboardPage() {
  const { user, token } = useAuth();
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [activeLoans, setActiveLoans] = useState<LendingRecordItem[]>([]);
  const [reservations, setReservations] = useState<ReservationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || !user) return;
    const walletQuery = user.walletAddress
      ? `?wallet=${encodeURIComponent(user.walletAddress)}`
      : '';

    Promise.all([
      apiRequest<{ stats: StudentStats }>('/api/dashboard/student', { method: 'GET' }, token),
      apiRequest<{ records: LendingRecordItem[] }>(
        `/api/lending${walletQuery}`,
        { method: 'GET' },
        token,
      ),
      apiRequest<{ reservations: ReservationItem[] }>(
        `/api/reservations${walletQuery}`,
        { method: 'GET' },
        token,
      ),
    ])
      .then(([dash, lendingData, resData]) => {
        setStats(dash.stats);
        setActiveLoans(lendingData.records.filter((r) => r.status === 'ACTIVE'));
        setReservations(
          resData.reservations.filter((r) => r.status === 'WAITING' || r.status === 'ALLOCATED'),
        );
      })
      .finally(() => setLoading(false));
  }, [token, user]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-3xl font-bold text-primary">Student Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Welcome, {user?.name} ({user?.usn ?? user?.email}).
          </p>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading your library summary...</p>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Active Loans
                </p>
                <p className="mt-2 font-heading text-3xl font-bold text-primary">
                  {stats?.activeLoans ?? 0} / 3
                </p>
              </div>
              <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Active Reservations
                </p>
                <p className="mt-2 font-heading text-3xl font-bold text-primary">
                  {stats?.activeReservations ?? 0}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Outstanding Fine
                </p>
                <p className="mt-2 font-heading text-3xl font-bold text-primary">
                  ₹{stats?.outstandingFine ?? 0}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  On-Chain Status
                </p>
                <p className="mt-2 text-sm font-semibold">
                  {!stats?.registeredOnChain ? (
                    <span className="text-amber-700">Pending Admin Registration</span>
                  ) : stats.activeOnChain ? (
                    <span className="text-emerald-700">Registered & Active</span>
                  ) : (
                    <span className="text-destructive">Inactive</span>
                  )}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="font-heading text-xl font-bold text-primary">
                    Currently Borrowed
                  </h2>
                  <Link to="/student/loans" className="text-xs font-semibold text-accent hover:underline">
                    View all
                  </Link>
                </div>
                {activeLoans.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No active loans.</p>
                ) : (
                  <ul className="divide-y divide-border text-sm">
                    {activeLoans.map((l) => (
                      <li key={l.lendingId} className="flex items-center justify-between py-2.5">
                        <div>
                          <p className="font-medium">{l.bookTitle}</p>
                          <p className="text-xs text-muted-foreground">Copy #{l.copyId}</p>
                        </div>
                        <span className="text-xs font-medium">
                          Due {new Date(l.dueAt * 1000).toLocaleDateString()}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="font-heading text-xl font-bold text-primary">
                    Active Reservations
                  </h2>
                  <Link
                    to="/student/reservations"
                    className="text-xs font-semibold text-accent hover:underline"
                  >
                    Manage
                  </Link>
                </div>
                {reservations.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No active reservations.</p>
                ) : (
                  <ul className="divide-y divide-border text-sm">
                    {reservations.map((r) => (
                      <li key={r.reservationId} className="flex items-center justify-between py-2.5">
                        <span className="font-medium">{r.bookTitle}</span>
                        <span className="rounded bg-muted px-2 py-0.5 text-xs font-semibold">
                          {r.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
