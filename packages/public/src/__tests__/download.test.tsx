import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DownloadPage } from '../pages/download';

describe('DownloadPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders page header and sideload instructions', () => {
    // Fetch will fire but the header + instructions render regardless
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('no network')),
    );
    render(
      <MemoryRouter>
        <DownloadPage />
      </MemoryRouter>,
    );
    expect(screen.getByText('Download')).toBeInTheDocument();
    expect(screen.getByText(/how to install/i)).toBeInTheDocument();
  });

  it('fetches release manifest and shows version info', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          version: 'v1.0.5+8',
          apkUrl: '/releases/latest/apk',
          publishedAt: '2026-04-04T02:10:41Z',
        }),
    });
    vi.stubGlobal('fetch', mockFetch);

    render(
      <MemoryRouter>
        <DownloadPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/v1\.0\.5\+8/)).toBeInTheDocument();
    });

    const downloadLink = screen.getByRole('link', { name: /download apk/i });
    expect(downloadLink).toHaveAttribute(
      'href',
      expect.stringContaining('/releases/latest/apk'),
    );
  });

  it('handles release fetch failure gracefully', async () => {
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
  });
});
