import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DownloadPage } from '../pages/download';

describe('DownloadPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders page header and sideload instructions', () => {
    // No manifest URL → immediate error path, but header + instructions still render
    render(
      <MemoryRouter>
        <DownloadPage />
      </MemoryRouter>,
    );
    expect(screen.getByText('Download')).toBeInTheDocument();
    expect(screen.getByText(/how to install/i)).toBeInTheDocument();
  });

  it('fetches manifest and shows version info', async () => {
    // Set the env var so fetch is called
    (import.meta.env as Record<string, unknown>).VITE_MANIFEST_URL = 'https://example.com/manifest.json';

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          version: '1.0.3',
          apkUrl: 'https://example.com/app.apk',
        }),
    });
    vi.stubGlobal('fetch', mockFetch);

    render(
      <MemoryRouter>
        <DownloadPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Version 1.0.3')).toBeInTheDocument();
    });
    expect(screen.getByRole('link', { name: /download apk/i })).toHaveAttribute(
      'href',
      'https://example.com/app.apk',
    );

    // Cleanup
    delete (import.meta.env as Record<string, unknown>).VITE_MANIFEST_URL;
  });

  it('handles manifest fetch failure gracefully', async () => {
    (import.meta.env as Record<string, unknown>).VITE_MANIFEST_URL = 'https://example.com/manifest.json';

    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('Network error')),
    );

    render(
      <MemoryRouter>
        <DownloadPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(
        screen.getByText(/unable to load version info/i),
      ).toBeInTheDocument();
    });

    delete (import.meta.env as Record<string, unknown>).VITE_MANIFEST_URL;
  });
});
