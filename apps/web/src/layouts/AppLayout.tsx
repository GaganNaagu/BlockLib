import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Books, SignOut, ShieldCheck, Student } from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isAdmin = user?.role === 'ADMIN';
  const navItems = isAdmin
    ? [{ label: 'Admin Dashboard', to: '/admin' }]
    : [{ label: 'Student Dashboard', to: '/student' }];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Books size={22} weight="regular" aria-hidden="true" />
            </div>
            <div>
              <span className="font-heading text-2xl font-bold tracking-tight text-primary">
                BlockLib
              </span>
              <p className="text-xs text-muted-foreground">
                Blockchain-Backed Library Lending System
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5 text-sm">
              {isAdmin ? (
                <ShieldCheck size={18} className="text-primary" aria-hidden="true" />
              ) : (
                <Student size={18} className="text-primary" aria-hidden="true" />
              )}
              <span className="font-medium text-foreground">{user?.name}</span>
              <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                {user?.role}
              </span>
            </div>

            <button
              type="button"
              onClick={logout}
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <SignOut size={16} aria-hidden="true" />
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-6 py-8 md:grid-cols-12">
        <aside className="md:col-span-3">
          <nav aria-label="Portal Navigation" className="rounded-xl border border-border bg-card p-3 shadow-sm">
            <ul className="space-y-1">
              {navItems.map((item) => {
                const active = location.pathname === item.to;
                return (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      className={`block rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                        active
                          ? 'bg-primary text-primary-foreground'
                          : 'text-secondary hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>

        <main className="md:col-span-9">{children}</main>
      </div>
    </div>
  );
}
