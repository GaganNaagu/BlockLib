import { Link } from 'react-router-dom';
import { ShieldWarning } from '@phosphor-icons/react';
import { useAuth } from '../../context/AuthContext';

export function AccessDeniedPage() {
  const { user } = useAuth();
  const homePath = user?.role === 'ADMIN' ? '/admin' : user ? '/student' : '/login';

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md rounded-xl border border-border bg-card p-8 text-center shadow-md">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <ShieldWarning size={26} aria-hidden="true" />
        </div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Access Denied</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your account role does not have permission to view this portal section.
        </p>
        <Link
          to={homePath}
          className="mt-6 inline-block rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          Return to your portal
        </Link>
      </div>
    </div>
  );
}
