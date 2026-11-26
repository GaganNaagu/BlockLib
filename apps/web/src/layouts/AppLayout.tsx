import { useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Books,
  Check,
  ClockCounterClockwise,
  Copy,
  CurrencyInr,
  ListChecks,
  ShieldCheck,
  SignOut,
  Student,
  Users,
  Wallet,
  WarningCircle,
} from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';
import { useWallet } from '../context/WalletContext';
import { shortenAddress } from '../blockchain/libraryContract';

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const {
    account,
    isCorrectNetwork,
    isVerified,
    isConnecting,
    walletError,
    connectAndVerify,
    switchToHardhat,
  } = useWallet();
  const location = useLocation();
  const [copied, setCopied] = useState(false);

  const isAdmin = user?.role === 'ADMIN';
  const navItems = isAdmin
    ? [
        { label: 'Dashboard', to: '/admin', icon: Books },
        { label: 'Books & Copies', to: '/admin/books', icon: Books },
        { label: 'Members', to: '/admin/members', icon: Users },
        { label: 'Lending & Returns', to: '/admin/lending', icon: ListChecks },
        { label: 'Reservations', to: '/admin/reservations', icon: ListChecks },
        { label: 'Fines', to: '/admin/fines', icon: CurrencyInr },
        { label: 'Transactions', to: '/admin/transactions', icon: ClockCounterClockwise },
      ]
    : [
        { label: 'Dashboard', to: '/student', icon: Books },
        { label: 'Book Catalogue', to: '/student/catalogue', icon: Books },
        { label: 'My Loans', to: '/student/loans', icon: ListChecks },
        { label: 'My Reservations', to: '/student/reservations', icon: ListChecks },
        { label: 'My Fines', to: '/student/fines', icon: CurrencyInr },
        { label: 'My Transactions', to: '/student/transactions', icon: ClockCounterClockwise },
      ];

  function copyAddress() {
    if (!account) return;
    void navigator.clipboard.writeText(account);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4">
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

          <div className="flex flex-wrap items-center gap-3">
            {account ? (
              <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/60 px-3 py-1.5 text-xs">
                <Wallet size={16} className="text-primary" aria-hidden="true" />
                <span className="font-mono font-medium text-foreground">
                  {shortenAddress(account)}
                </span>
                <button
                  type="button"
                  onClick={copyAddress}
                  title="Copy wallet address"
                  aria-label="Copy wallet address"
                  className="cursor-pointer rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>
                {!isCorrectNetwork ? (
                  <button
                    type="button"
                    onClick={() => void switchToHardhat()}
                    className="cursor-pointer rounded bg-destructive px-2 py-0.5 font-semibold text-destructive-foreground"
                  >
                    Switch to Hardhat
                  </button>
                ) : isVerified ? (
                  <span className="rounded bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-800">
                    Verified
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => void connectAndVerify()}
                    disabled={isConnecting}
                    className="cursor-pointer rounded bg-accent px-2 py-0.5 font-semibold text-accent-foreground"
                  >
                    {isConnecting ? 'Verifying...' : 'Verify Wallet'}
                  </button>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => void connectAndVerify()}
                disabled={isConnecting}
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-accent px-3.5 py-2 text-xs font-semibold text-accent-foreground transition hover:opacity-90"
              >
                <Wallet size={16} aria-hidden="true" />
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </button>
            )}

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

        {walletError && (
          <div className="border-t border-destructive/30 bg-destructive/10 px-6 py-2 text-xs text-destructive">
            <div className="mx-auto flex max-w-7xl items-center gap-2">
              <WarningCircle size={16} className="shrink-0" aria-hidden="true" />
              <span>{walletError}</span>
            </div>
          </div>
        )}
      </header>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-6 py-8 md:grid-cols-12">
        <aside className="md:col-span-3">
          <nav
            aria-label="Portal Navigation"
            className="rounded-xl border border-border bg-card p-3 shadow-sm"
          >
            <ul className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = location.pathname === item.to;
                return (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                        active
                          ? 'bg-primary text-primary-foreground'
                          : 'text-secondary hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      <Icon size={17} aria-hidden="true" />
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
