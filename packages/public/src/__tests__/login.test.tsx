import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LoginPage } from '../pages/login';

// Mock useAuth
const mockSignIn = vi.fn();
vi.mock('../providers/auth', () => ({
  useAuth: () => ({
    user: null,
    session: null,
    loading: false,
    signIn: mockSignIn,
    signOut: vi.fn(),
  }),
}));

function renderLogin() {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>,
  );
}

describe('LoginPage', () => {
  beforeEach(() => {
    mockSignIn.mockReset();
  });

  it('renders email and password inputs', () => {
    renderLogin();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('renders sign-in button', () => {
    renderLogin();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('calls signIn on form submit', async () => {
    mockSignIn.mockResolvedValue({});
    renderLogin();

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'secret123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'secret123');
    });
  });

  it('shows error message on failed login', async () => {
    mockSignIn.mockResolvedValue({ error: 'Invalid credentials' });
    renderLogin();

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'bad@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'wrong' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });
});
