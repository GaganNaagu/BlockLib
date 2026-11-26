import { CheckCircle, SpinnerGap, WarningCircle } from '@phosphor-icons/react';

export interface TxStatusState {
  status: 'idle' | 'pending' | 'confirmed' | 'failed';
  message: string;
  txHash?: string;
  blockNumber?: number;
}

export function TxStatusBanner({ state, onDismiss }: { state: TxStatusState; onDismiss?: () => void }) {
  if (state.status === 'idle') return null;

  const styles = {
    pending: 'border-accent/40 bg-accent/10 text-accent',
    confirmed: 'border-emerald-300 bg-emerald-50 text-emerald-900',
    failed: 'border-destructive/40 bg-destructive/10 text-destructive',
  }[state.status];

  return (
    <div role="status" className={`mb-5 flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${styles}`}>
      <div className="flex items-start gap-2.5">
        {state.status === 'pending' && <SpinnerGap size={18} className="mt-0.5 animate-spin shrink-0" aria-hidden="true" />}
        {state.status === 'confirmed' && <CheckCircle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />}
        {state.status === 'failed' && <WarningCircle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />}
        <div>
          <p className="font-semibold">
            {state.status === 'pending' && 'Transaction Pending'}
            {state.status === 'confirmed' && 'Transaction Confirmed'}
            {state.status === 'failed' && 'Transaction Failed'}
          </p>
          <p className="mt-0.5">{state.message}</p>
          {state.txHash && (
            <p className="mt-1 font-mono text-xs break-all">
              Hash: {state.txHash}
              {state.blockNumber !== undefined ? ` • Block #${state.blockNumber}` : ''}
            </p>
          )}
        </div>
      </div>
      {onDismiss && state.status !== 'pending' && (
        <button
          type="button"
          onClick={onDismiss}
          className="cursor-pointer rounded px-2 py-1 text-xs font-medium hover:bg-black/5"
        >
          Dismiss
        </button>
      )}
    </div>
  );
}
