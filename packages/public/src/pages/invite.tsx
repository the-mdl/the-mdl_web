import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../providers/auth';

interface Manifest {
  version: string;
  apkUrl: string;
}

/**
 * Invite landing page — where recipients of a Supabase Auth invite email
 * land after clicking the confirmation link.
 *
 * By the time they arrive here:
 * - Supabase Auth has already processed the magic link in the URL and
 *   established a session (handled by AuthProvider's onAuthStateChange)
 * - The :code param matches the beta_invite_code / circle_invite_code
 *   metadata the admin portal generated
 *
 * This page welcomes them, confirms the invite was accepted, and funnels
 * them to download the mobile app where they'll actually use the product.
 */
export function InvitePage() {
  const { code } = useParams<{ code: string }>();
  const { user, loading: authLoading } = useAuth();
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [manifestLoading, setManifestLoading] = useState(true);

  useEffect(() => {
    const apiBase = import.meta.env.VITE_API_URL ?? 'https://api.the-mdl.com';
    const manifestUrl = `${apiBase}/releases/latest`;

    fetch(manifestUrl)
      .then((res) => (res.ok ? (res.json() as Promise<Manifest>) : null))
      .then((data) => {
        if (!data) {
          setManifest(null);
          return;
        }
        const resolvedApkUrl = data.apkUrl.startsWith('http')
          ? data.apkUrl
          : `${apiBase}${data.apkUrl}`;
        setManifest({ ...data, apkUrl: resolvedApkUrl });
      })
      .catch(() => setManifest(null))
      .finally(() => setManifestLoading(false));
  }, []);

  const isSignedIn = !authLoading && !!user;

  return (
    <div className="min-h-screen bg-drift-bg text-drift-text font-body">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-4xl mx-auto">
        <Link
          to="/"
          className="font-heading text-xl font-bold text-drift-accent"
          style={{ letterSpacing: '4px' }}
        >
          the mdl
        </Link>
        <Link
          to="/account"
          className="text-drift-primary hover:text-drift-accent transition-colors text-sm font-medium"
        >
          {isSignedIn ? 'My Account' : 'Sign In'}
        </Link>
      </nav>

      {/* Hero */}
      <section className="text-center px-6 pt-16 pb-10 max-w-2xl mx-auto">
        <h1 className="font-heading text-4xl sm:text-5xl font-bold text-drift-accent mb-4">
          You're invited
        </h1>
        <p className="text-drift-muted text-lg">
          Welcome to The MDL — an AI-powered communication tool that helps
          people say what they mean and hear what others need.
        </p>
      </section>

      {/* Status card */}
      <section className="max-w-md mx-auto px-6 pb-10">
        <div className="bg-drift-surface rounded-xl p-6 border border-drift-muted/20">
          {authLoading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin h-6 w-6 border-2 border-drift-primary border-t-transparent rounded-full" />
            </div>
          ) : isSignedIn ? (
            <>
              <div className="flex items-center gap-3 mb-3">
                <span className="inline-block w-2 h-2 rounded-full bg-green-400" />
                <h2 className="font-heading text-lg font-bold text-drift-text">
                  Invitation accepted
                </h2>
              </div>
              <p className="text-drift-muted text-sm mb-1">Signed in as</p>
              <p className="text-drift-text text-sm font-medium break-all">
                {user.email}
              </p>
              {code && (
                <>
                  <p className="text-drift-muted text-xs mt-4 mb-1">Invite code</p>
                  <p className="text-drift-accent text-sm font-mono tracking-wider">
                    {code}
                  </p>
                </>
              )}
            </>
          ) : (
            <>
              <h2 className="font-heading text-lg font-bold text-drift-text mb-2">
                Invitation link
              </h2>
              <p className="text-drift-muted text-sm mb-3">
                If you clicked an invitation link, you should already be signed in.
                Otherwise, download the app below and sign in with this email.
              </p>
              {code && (
                <>
                  <p className="text-drift-muted text-xs mb-1">Invite code</p>
                  <p className="text-drift-accent text-sm font-mono tracking-wider">
                    {code}
                  </p>
                </>
              )}
            </>
          )}
        </div>
      </section>

      {/* Download the app — primary CTA */}
      <section className="max-w-md mx-auto px-6 pb-10">
        <div className="bg-drift-surface rounded-xl p-6 border border-drift-primary/30 text-center">
          <h2 className="font-heading text-lg font-bold text-drift-text mb-1">
            Next: Download the app
          </h2>
          <p className="text-drift-muted text-sm mb-4">
            The MDL lives on your phone. Get the Android app to start.
          </p>

          {manifestLoading ? (
            <div className="flex justify-center py-2">
              <div className="animate-spin h-6 w-6 border-2 border-drift-primary border-t-transparent rounded-full" />
            </div>
          ) : manifest ? (
            <>
              <a
                href={manifest.apkUrl}
                className="inline-block px-8 py-3 bg-drift-primary text-drift-bg font-medium rounded-lg hover:bg-drift-accent transition-colors mb-2"
                download
              >
                Download APK ({manifest.version})
              </a>
              <div>
                <Link
                  to="/download"
                  className="text-drift-muted hover:text-drift-accent text-xs underline"
                >
                  Install instructions
                </Link>
              </div>
            </>
          ) : (
            <Link
              to="/download"
              className="inline-block px-8 py-3 bg-drift-primary text-drift-bg font-medium rounded-lg hover:bg-drift-accent transition-colors"
            >
              Go to Download Page
            </Link>
          )}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-2xl mx-auto px-6 pb-12">
        <h2 className="font-heading text-xl font-bold text-drift-text mb-4">
          What happens next
        </h2>
        <ol className="space-y-3">
          {[
            'Download the Android app using the button above.',
            'Open the app and sign in with the email this invite was sent to.',
            'Create your personal MDL — the AI character that mediates for you.',
            'Start a Circle and invite the person you want to communicate better with.',
          ].map((step, i) => (
            <li key={i} className="flex gap-3 text-sm text-drift-muted">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-drift-primary/10 text-drift-primary text-xs font-bold flex items-center justify-center">
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* Footer */}
      <footer className="text-center py-8 text-drift-muted text-xs border-t border-drift-muted/10">
        <Link to="/" className="hover:text-drift-text transition-colors">
          &larr; Back to Home
        </Link>
      </footer>
    </div>
  );
}
