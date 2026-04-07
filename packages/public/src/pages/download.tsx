import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

interface Manifest {
  version: string;
  apkUrl: string;
}

const steps = [
  'Tap the download button above to get the APK file.',
  'Open your device Settings → Security → Enable "Install from unknown sources".',
  'Open the downloaded APK file from your notifications or file manager.',
  'Follow the on-screen prompts to complete installation.',
  'Open "the mdl" from your app drawer and sign in.',
];

export function DownloadPage() {
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [manifestError, setManifestError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const apiBase = import.meta.env.VITE_API_URL ?? 'https://api.the-mdl.com';
    const manifestUrl = `${apiBase}/releases/latest`;

    fetch(manifestUrl)
      .then((res) => {
        if (!res.ok) throw new Error('Manifest fetch failed');
        return res.json() as Promise<Manifest>;
      })
      .then((data) => {
        // Resolve relative apkUrl against the API base so the Download
        // button hits the backend proxy endpoint, not a relative path.
        const resolvedApkUrl = data.apkUrl.startsWith('http')
          ? data.apkUrl
          : `${apiBase}${data.apkUrl}`;
        setManifest({ ...data, apkUrl: resolvedApkUrl });
        setLoading(false);
      })
      .catch(() => {
        setManifestError(true);
        setLoading(false);
      });
  }, []);

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
          Sign In
        </Link>
      </nav>

      {/* Header */}
      <section className="text-center px-6 pt-16 pb-10 max-w-3xl mx-auto">
        <h1 className="font-heading text-4xl font-bold text-drift-accent mb-4">
          Download
        </h1>
        <p className="text-drift-muted text-lg">
          Get the mdl on your device and start finding the middle ground.
        </p>
      </section>

      {/* Version card */}
      <section className="max-w-md mx-auto px-6 pb-12">
        <div className="bg-drift-surface rounded-xl p-6 border border-drift-muted/20 text-center">
          <h2 className="font-heading text-lg font-bold text-drift-text mb-1">
            Android
          </h2>

          {loading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin h-6 w-6 border-2 border-drift-primary border-t-transparent rounded-full" />
            </div>
          ) : manifestError ? (
            <p className="text-drift-muted text-sm py-4">
              Unable to load version info. Please try again later.
            </p>
          ) : manifest ? (
            <>
              <p className="text-drift-muted text-sm mb-4">
                Version {manifest.version}
              </p>
              <a
                href={manifest.apkUrl}
                className="inline-block px-8 py-3 bg-drift-primary text-drift-bg font-medium rounded-lg hover:bg-drift-accent transition-colors"
                download
              >
                Download APK
              </a>
            </>
          ) : null}
        </div>
      </section>

      {/* Sideload instructions */}
      <section className="max-w-2xl mx-auto px-6 pb-12">
        <h2 className="font-heading text-xl font-bold text-drift-text mb-4">
          How to Install (Sideload)
        </h2>
        <ol className="space-y-3">
          {steps.map((step, i) => (
            <li key={i} className="flex gap-3 text-sm text-drift-muted">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-drift-primary/10 text-drift-primary text-xs font-bold flex items-center justify-center">
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* Store placeholders */}
      <section className="max-w-2xl mx-auto px-6 pb-16 grid sm:grid-cols-2 gap-4">
        <div className="bg-drift-surface rounded-xl p-6 border border-drift-muted/20 text-center">
          <h3 className="font-heading text-sm font-bold text-drift-text mb-1">
            Google Play
          </h3>
          <p className="text-drift-muted text-xs">Coming Soon</p>
        </div>
        <div className="bg-drift-surface rounded-xl p-6 border border-drift-muted/20 text-center">
          <h3 className="font-heading text-sm font-bold text-drift-text mb-1">
            App Store
          </h3>
          <p className="text-drift-muted text-xs">Coming Soon</p>
        </div>
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
