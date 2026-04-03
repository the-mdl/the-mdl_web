import { useEffect, useState } from 'react';
import { useAuth } from '../providers/auth';
import { supabase } from '../providers/api-client';

interface Profile {
  display_name: string | null;
  role: string | null;
}

interface CircleMembership {
  circle_id: string;
  role: string;
  circles: { name: string } | null;
}

export function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [circles, setCircles] = useState<CircleMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;

    async function load() {
      setLoading(true);
      setError('');

      try {
        const [profileRes, circlesRes] = await Promise.all([
          supabase
            .from('profiles')
            .select('display_name, role')
            .eq('id', user!.id)
            .single(),
          supabase
            .from('circle_members')
            .select('circle_id, role, circles(name)')
            .eq('user_id', user!.id),
        ]);

        if (profileRes.error) throw profileRes.error;
        setProfile(profileRes.data);

        if (circlesRes.error) throw circlesRes.error;
        setCircles((circlesRes.data ?? []) as unknown as CircleMembership[]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-drift-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 text-red-400">
        {error}
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-heading text-2xl font-bold text-drift-text mb-6">
        Profile
      </h1>

      <div className="bg-drift-surface rounded-xl p-6 border border-drift-muted/20 space-y-4">
        <div>
          <span className="text-sm text-drift-muted">Email</span>
          <p className="text-drift-text">{user?.email ?? '—'}</p>
        </div>
        <div>
          <span className="text-sm text-drift-muted">Display Name</span>
          <p className="text-drift-text">{profile?.display_name ?? '—'}</p>
        </div>
        <div>
          <span className="text-sm text-drift-muted">Role</span>
          <p className="text-drift-text capitalize">{profile?.role ?? '—'}</p>
        </div>
      </div>

      <h2 className="font-heading text-lg font-bold text-drift-text mt-8 mb-4">
        Circles
      </h2>

      {circles.length === 0 ? (
        <p className="text-drift-muted text-sm">No circle memberships found.</p>
      ) : (
        <div className="space-y-2">
          {circles.map((cm) => (
            <div
              key={cm.circle_id}
              className="bg-drift-surface rounded-lg p-4 border border-drift-muted/20 flex items-center justify-between"
            >
              <span className="text-drift-text">
                {cm.circles?.name ?? 'Unknown Circle'}
              </span>
              <span className="text-drift-muted text-xs uppercase tracking-wider">
                {cm.role}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
