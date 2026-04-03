import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../providers/auth';

export function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await signIn(email, password);
    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      navigate('/account/profile', { replace: true });
    }
  }

  return (
    <div className="min-h-screen bg-drift-bg flex flex-col items-center justify-center px-4">
      <Link
        to="/"
        className="font-heading text-2xl font-bold text-drift-accent mb-8"
        style={{ letterSpacing: '4px' }}
      >
        the mdl
      </Link>

      <div className="w-full max-w-sm bg-drift-surface rounded-xl p-8 border border-drift-muted/20">
        <h1 className="font-heading text-xl font-bold text-drift-text mb-6 text-center">
          Sign In
        </h1>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm text-drift-muted mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-drift-bg border border-drift-muted/30 rounded-lg text-drift-text placeholder-drift-muted/50 focus:outline-none focus:border-drift-primary"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm text-drift-muted mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-drift-bg border border-drift-muted/30 rounded-lg text-drift-text placeholder-drift-muted/50 focus:outline-none focus:border-drift-primary"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-drift-primary text-drift-bg font-medium rounded-lg hover:bg-drift-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>

      <p className="mt-6 text-drift-muted text-xs">
        Don&apos;t have an account? Download the app to get started.
      </p>
    </div>
  );
}
