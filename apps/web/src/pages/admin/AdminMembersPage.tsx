import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { UserPlus } from '@phosphor-icons/react';
import { AppLayout } from '../../layouts/AppLayout';
import { TxStatusBanner, type TxStatusState } from '../../components/TxStatusBanner';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../services/api';
import {
  extractEthersError,
  getSignerLibraryContract,
  shortenAddress,
} from '../../blockchain/libraryContract';
import type { MemberItem } from '../../types/library';

export function AdminMembersPage() {
  const { token } = useAuth();
  const [members, setMembers] = useState<MemberItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [txStatus, setTxStatus] = useState<TxStatusState>({ status: 'idle', message: '' });

  const [name, setName] = useState('');
  const [usn, setUsn] = useState('');
  const [email, setEmail] = useState('');
  const [walletAddress, setWalletAddress] = useState('');

  const loadMembers = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await apiRequest<{ members: MemberItem[] }>('/api/members', { method: 'GET' }, token);
      setMembers(data.members);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadMembers();
  }, [loadMembers]);

  async function handleRegisterMember(e: FormEvent) {
    e.preventDefault();
    if (!token) return;

    try {
      setTxStatus({ status: 'pending', message: 'Confirm member registration in MetaMask...' });
      const contract = await getSignerLibraryContract();
      const tx = await contract.registerMember(walletAddress.trim());
      setTxStatus({ status: 'pending', message: 'Waiting for confirmation...', txHash: tx.hash });
      const receipt = await tx.wait();

      await apiRequest(
        '/api/members',
        {
          method: 'POST',
          body: JSON.stringify({
            name: name.trim(),
            usn: usn.trim(),
            email: email.trim(),
            walletAddress: walletAddress.trim(),
          }),
        },
        token,
      );
      await apiRequest('/api/transactions/sync', { method: 'POST' }, token);

      setTxStatus({
        status: 'confirmed',
        message: `Registered member ${name.trim()} (${shortenAddress(walletAddress.trim())}).`,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
      });
      setName('');
      setUsn('');
      setEmail('');
      setWalletAddress('');
      await loadMembers();
    } catch (err) {
      setTxStatus({ status: 'failed', message: extractEthersError(err) });
    }
  }

  async function handleRegisterOnChainOnly(wallet: string) {
    if (!token) return;
    try {
      setTxStatus({ status: 'pending', message: 'Confirm on-chain member registration...' });
      const contract = await getSignerLibraryContract();
      const tx = await contract.registerMember(wallet);
      const receipt = await tx.wait();
      await apiRequest('/api/transactions/sync', { method: 'POST' }, token);
      setTxStatus({
        status: 'confirmed',
        message: `Registered ${shortenAddress(wallet)} on-chain.`,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
      });
      await loadMembers();
    } catch (err) {
      setTxStatus({ status: 'failed', message: extractEthersError(err) });
    }
  }

  async function handleToggleActive(wallet: string, nextActive: boolean) {
    if (!token) return;
    try {
      setTxStatus({
        status: 'pending',
        message: `${nextActive ? 'Activating' : 'Deactivating'} member in MetaMask...`,
      });
      const contract = await getSignerLibraryContract();
      const tx = await contract.setMemberActive(wallet, nextActive);
      const receipt = await tx.wait();
      await apiRequest('/api/transactions/sync', { method: 'POST' }, token);
      setTxStatus({
        status: 'confirmed',
        message: `Updated status for ${shortenAddress(wallet)}.`,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
      });
      await loadMembers();
    } catch (err) {
      setTxStatus({ status: 'failed', message: extractEthersError(err) });
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-3xl font-bold text-primary">Member Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Register student profiles, link wallet addresses, and manage on-chain active status.
          </p>
        </div>

        <TxStatusBanner
          state={txStatus}
          onDismiss={() => setTxStatus({ status: 'idle', message: '' })}
        />

        <form
          onSubmit={handleRegisterMember}
          className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-3"
        >
          <h2 className="font-heading text-xl font-bold text-primary">Register New Student</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input
              type="text"
              required
              placeholder="Student Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-lg border border-border px-3 py-2 text-sm"
            />
            <input
              type="text"
              required
              placeholder="USN (e.g. 01JST23UCS052)"
              value={usn}
              onChange={(e) => setUsn(e.target.value)}
              className="rounded-lg border border-border px-3 py-2 text-sm"
            />
            <input
              type="email"
              required
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-lg border border-border px-3 py-2 text-sm"
            />
            <input
              type="text"
              required
              placeholder="Wallet Address (0x...)"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              className="rounded-lg border border-border px-3 py-2 font-mono text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={txStatus.status === 'pending'}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:opacity-90 disabled:opacity-50"
          >
            <UserPlus size={16} aria-hidden="true" />
            Register Member
          </button>
        </form>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="mb-4 font-heading text-xl font-bold text-primary">Registered Students</h2>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading members...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="py-2 pr-4">Student</th>
                    <th className="py-2 pr-4">Wallet</th>
                    <th className="py-2 pr-4">On-Chain Status</th>
                    <th className="py-2 pr-4">Loans / Fine</th>
                    <th className="py-2">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {members.map((m) => (
                    <tr key={m.id}>
                      <td className="py-3 pr-4">
                        <p className="font-semibold text-foreground">{m.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {m.usn ?? 'No USN'} • {m.email}
                        </p>
                      </td>
                      <td className="py-3 pr-4 font-mono text-xs">
                        {shortenAddress(m.walletAddress)}
                      </td>
                      <td className="py-3 pr-4 text-xs">
                        {!m.onChain.registered ? (
                          <span className="rounded bg-amber-100 px-2 py-0.5 font-semibold text-amber-800">
                            Not On-Chain
                          </span>
                        ) : m.onChain.active ? (
                          <span className="rounded bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-800">
                            Active
                          </span>
                        ) : (
                          <span className="rounded bg-destructive/10 px-2 py-0.5 font-semibold text-destructive">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-xs">
                        {m.onChain.activeLoanCount} active • ₹{m.onChain.outstandingFine} fine
                      </td>
                      <td className="py-3">
                        {m.walletAddress && !m.onChain.registered && (
                          <button
                            type="button"
                            onClick={() => void handleRegisterOnChainOnly(m.walletAddress!)}
                            className="cursor-pointer rounded bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground"
                          >
                            Sync On-Chain
                          </button>
                        )}
                        {m.walletAddress && m.onChain.registered && (
                          <button
                            type="button"
                            onClick={() =>
                              void handleToggleActive(m.walletAddress!, !m.onChain.active)
                            }
                            className="cursor-pointer rounded border border-border px-2.5 py-1 text-xs font-medium hover:bg-muted"
                          >
                            {m.onChain.active ? 'Deactivate' : 'Activate'}
                          </button>
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
