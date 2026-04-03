import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ExportPage } from '../pages/export';

// Mock apiClient
const mockGet = vi.fn();
vi.mock('../providers/api-client', () => ({
  apiClient: {
    get: (...args: unknown[]) => mockGet(...args),
  },
  supabase: {
    auth: { getSession: () => Promise.resolve({ data: { session: null } }) },
  },
}));

function renderExport() {
  return render(
    <MemoryRouter>
      <ExportPage />
    </MemoryRouter>,
  );
}

describe('ExportPage', () => {
  beforeEach(() => {
    mockGet.mockReset();
  });

  it('renders download button', () => {
    renderExport();
    expect(
      screen.getByRole('button', { name: /download my data/i }),
    ).toBeInTheDocument();
  });

  it('calls apiClient.get on button click and shows success', async () => {
    mockGet.mockResolvedValue({ data: new Blob(['{}']) });
    renderExport();

    fireEvent.click(screen.getByRole('button', { name: /download my data/i }));

    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledWith('/data-rights/export', {
        responseType: 'blob',
      });
    });
    expect(screen.getByText(/export has started downloading/i)).toBeInTheDocument();
  });

  it('shows loading state during export', async () => {
    // Make the API hang
    mockGet.mockReturnValue(new Promise(() => {}));
    renderExport();

    fireEvent.click(screen.getByRole('button', { name: /download my data/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /preparing download/i })).toBeDisabled();
    });
  });

  it('shows error message on API failure', async () => {
    mockGet.mockRejectedValue(new Error('Server error'));
    renderExport();

    fireEvent.click(screen.getByRole('button', { name: /download my data/i }));

    await waitFor(() => {
      expect(screen.getByText('Server error')).toBeInTheDocument();
    });
  });
});
