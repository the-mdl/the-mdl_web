import { Link } from 'react-router-dom';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-drift-bg text-drift-text font-body">
      {/* Hero */}
      <header className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
        <h1
          className="font-heading text-5xl md:text-7xl font-bold text-drift-accent mb-4"
          style={{ letterSpacing: '4px' }}
        >
          the mdl
        </h1>
        <p className="text-xl md:text-2xl text-drift-text mb-2">
          Find the middle ground.
        </p>
        <p className="text-drift-muted max-w-md mb-10">
          The space between what you feel and what they hear.
        </p>

        <div className="flex gap-4">
          <Link
            to="/account"
            className="px-8 py-3 bg-drift-primary text-drift-bg font-medium rounded-lg hover:bg-drift-accent transition-colors"
          >
            Get Started
          </Link>
          <Link
            to="/download"
            className="px-8 py-3 border border-drift-primary text-drift-primary rounded-lg hover:bg-drift-primary/10 transition-colors"
          >
            Download
          </Link>
        </div>
      </header>

      {/* Feature highlights */}
      <section className="max-w-4xl mx-auto px-4 py-16 grid md:grid-cols-3 gap-8 text-center">
        <div>
          <h3 className="font-heading text-lg font-bold text-drift-accent mb-2">Mirror</h3>
          <p className="text-drift-muted text-sm">
            Your MDL reflects your communication style — a distinct AI character that understands how you express yourself.
          </p>
        </div>
        <div>
          <h3 className="font-heading text-lg font-bold text-drift-accent mb-2">Digest</h3>
          <p className="text-drift-muted text-sm">
            Messages are translated through proven mediation frameworks — NVC, Gottman, Tactical Empathy — so the meaning lands, not the sting.
          </p>
        </div>
        <div>
          <h3 className="font-heading text-lg font-bold text-drift-accent mb-2">Learn</h3>
          <p className="text-drift-muted text-sm">
            Every conversation teaches your MDL to communicate better on your behalf, building bridges over time.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-drift-muted/20 py-8 text-center text-drift-muted text-xs">
        <p>© {new Date().getFullYear()} The MDL — Mirror. Digest. Learn.</p>
      </footer>
    </div>
  );
}
