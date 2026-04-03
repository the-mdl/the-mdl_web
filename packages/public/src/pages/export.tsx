import { useState } from 'react';
import { apiClient } from '../providers/api-client';

export function ExportPage() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleExport() {
    setLoading(true);
    setStatus('idle');
    setErrorMsg('');

    try {
      const response = await apiClient.get('/data-rights/export', {
        responseType: 'blob',
      });

      const blob = new Blob([response.data as BlobPart], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'the-mdl-export.json';
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);

      setStatus('success');
    } catch (err) {
      setStatus('error');
      setErrorMsg(
        err instanceof Error ? err.message : 'Failed to export data',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-heading text-2xl font-bold text-drift-text mb-2">
        Export Your Data
      </h1>
      <p className="text-drift-muted mb-8">
        Download a copy of all your data stored in the mdl, including your
        profile, circle memberships, and message history.
      </p>

      <div className="bg-drift-surface rounded-xl p-6 border border-drift-muted/20">
        <button
          onClick={() => void handleExport()}
          disabled={loading}
          className="px-6 py-2.5 bg-drift-primary text-drift-bg font-medium rounded-lg hover:bg-drift-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Preparing download…' : 'Download My Data'}
        </button>

        {status === 'success' && (
          <p className="mt-4 text-green-400 text-sm">
            ✓ Your data export has started downloading.
          </p>
        )}

        {status === 'error' && (
          <p className="mt-4 text-red-400 text-sm">{errorMsg}</p>
        )}
      </div>
    </div>
  );
}
