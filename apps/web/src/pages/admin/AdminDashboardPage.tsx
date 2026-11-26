import { AppLayout } from '../../layouts/AppLayout';

export function AdminDashboardPage() {
  return (
    <AppLayout>
      <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h1 className="font-heading text-3xl font-bold text-primary">Admin Dashboard</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Phase 1 authentication and role protection active. Book, member, lending, reservation,
          fine, and transaction modules will be connected in Phases 5 and 6.
        </p>
      </section>
    </AppLayout>
  );
}
