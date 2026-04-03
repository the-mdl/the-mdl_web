import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../providers/auth';
import { apiClient } from '../providers/api-client';

const CONFIRMATION_TEXT = 'DELETE MY ACCOUNT';

export function DeletePage() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const [confirmation, setConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isConfirmed = confirmation === CONFIRMATION_TEXT;

  async function handleDelete(e: FormEvent) {
    e.preventDefault();
    if (!isConfirmed) return;

    setLoading(true);
    setError('');

    try {
      await apiClient.delete('/data-rights/account');
      await signOut();
      navigate('/', { replace: true });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to delete account',
      );
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-heading text-2xl font-bold text-red-400 mb-2">
        Delete Account
      </h1>
      <p className="text-drift-muted mb-8">
        This action is <strong className="text-red-400">permanent</strong> and
        cannot be undone. All your data — profile, circle memberships, messages,
        and preferences — will be permanently deleted.
      </p>

      <div className="bg-drift-surface rounded-xl p-6 border border-red-500/20">
        <form onSubmit={(e) => void handleDelete(e)} className="space-y-4">
          <div>
            <label htmlFor="confirm" className="block text-sm text-drift-muted mb-1">
              Type <code className="text-red-400">{CONFIRMATION_TEXT}</code> to
              confirm
            </label>
            <input
              id="confirm"
              type="text"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              className="w-full px-3 py-2 bg-drift-bg border border-drift-muted/30 rounded-lg text-drift-text placeholder-drift-muted/50 focus:outline-none focus:border-red-400"
              placeholder={CONFIRMATION_TEXT}
              autoComplete="off"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={!isConfirmed || loading}
            className="px-6 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {loading ? 'Deleting…' : 'Permanently Delete My Account'}
          </button>
        </form>
      </div>
    </div>
  );
}
