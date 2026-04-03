import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DeletePage } from '../pages/delete';

// Mocks
const mockDelete = vi.fn();
const mockSignOut = vi.fn();

vi.mock('../providers/auth', () => ({
  useAuth: () => ({
    user: { id: 'user-1', email: 'test@example.com' },
    session: null,
    loading: false,
    signIn: vi.fn(),
    signOut: mockSignOut,
  }),
}));

vi.mock('../providers/api-client', () => ({
  apiClient: {
    delete: (...args: unknown[]) => mockDelete(...args),
  },
  supabase: {
    auth: { getSession: () => Promise.resolve({ data: { session: null } }) },
  },
}));

function renderDelete() {
  return render(
    <MemoryRouter>
      <DeletePage />
    </MemoryRouter>,
  );
}

describe('DeletePage', () => {
  beforeEach(() => {
    mockDelete.mockReset();
    mockSignOut.mockReset();
  });

  it('renders warning text', () => {
    renderDelete();
    expect(screen.getAllByText(/permanent/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/cannot be undone/i)).toBeInTheDocument();
  });

  it('delete button disabled until exact confirmation typed', () => {
    renderDelete();
    const button = screen.getByRole('button', {
      name: /permanently delete/i,
    });
    expect(button).toBeDisabled();

    // Partial match — still disabled
    fireEvent.change(screen.getByLabelText(/type/i), {
      target: { value: 'DELETE MY' },
    });
    expect(button).toBeDisabled();

    // Exact match — enabled
    fireEvent.change(screen.getByLabelText(/type/i), {
      target: { value: 'DELETE MY ACCOUNT' },
    });
    expect(button).toBeEnabled();
  });

  it('calls apiClient.delete on confirmation', async () => {
    mockDelete.mockResolvedValue({});
    mockSignOut.mockResolvedValue(undefined);
    renderDelete();

    fireEvent.change(screen.getByLabelText(/type/i), {
      target: { value: 'DELETE MY ACCOUNT' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: /permanently delete/i }),
    );

    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalledWith('/data-rights/account');
    });
  });

  it('signs out after successful deletion', async () => {
    mockDelete.mockResolvedValue({});
    mockSignOut.mockResolvedValue(undefined);
    renderDelete();

    fireEvent.change(screen.getByLabelText(/type/i), {
      target: { value: 'DELETE MY ACCOUNT' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: /permanently delete/i }),
    );

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled();
    });
  });
});
