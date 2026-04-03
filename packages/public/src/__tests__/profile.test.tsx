import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProfilePage } from '../pages/profile';

// Mocks
const mockUser = { id: 'user-1', email: 'link@the-mdl.com' };
vi.mock('../providers/auth', () => ({
  useAuth: () => ({
    user: mockUser,
    session: null,
    loading: false,
    signIn: vi.fn(),
    signOut: vi.fn(),
  }),
}));

const mockFrom = vi.fn();
vi.mock('../providers/api-client', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

function renderProfile() {
  return render(
    <MemoryRouter>
      <ProfilePage />
    </MemoryRouter>,
  );
}

describe('ProfilePage', () => {
  beforeEach(() => {
    mockFrom.mockReset();
  });

  it('shows loading state initially', () => {
    // Make the queries hang to observe loading
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () => new Promise(() => {}),
        }),
      }),
    });
    renderProfile();
    // The spinner should be visible (role="status" not set, so check for the element)
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('renders user email and display name after fetch', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: () => ({
            eq: () => ({
              single: () =>
                Promise.resolve({
                  data: { display_name: 'Link', role: 'admin' },
                  error: null,
                }),
            }),
          }),
        };
      }
      // circle_members
      return {
        select: () => ({
          eq: () =>
            Promise.resolve({ data: [], error: null }),
        }),
      };
    });

    renderProfile();

    await waitFor(() => {
      expect(screen.getByText('link@the-mdl.com')).toBeInTheDocument();
    });
    expect(screen.getByText('Link')).toBeInTheDocument();
  });

  it('renders circle memberships', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: () => ({
            eq: () => ({
              single: () =>
                Promise.resolve({
                  data: { display_name: 'Link', role: 'user' },
                  error: null,
                }),
            }),
          }),
        };
      }
      return {
        select: () => ({
          eq: () =>
            Promise.resolve({
              data: [
                {
                  circle_id: 'c1',
                  role: 'member',
                  circles: { name: 'Family' },
                },
              ],
              error: null,
            }),
        }),
      };
    });

    renderProfile();

    await waitFor(() => {
      expect(screen.getByText('Family')).toBeInTheDocument();
    });
    expect(screen.getByText('member')).toBeInTheDocument();
  });

  it('handles fetch error gracefully', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: () => ({
            eq: () => ({
              single: () =>
                Promise.resolve({
                  data: null,
                  error: { message: 'Network error' },
                }),
            }),
          }),
        };
      }
      return {
        select: () => ({
          eq: () =>
            Promise.resolve({ data: [], error: null }),
        }),
      };
    });

    renderProfile();

    await waitFor(() => {
      expect(screen.getByText(/failed to load profile/i)).toBeInTheDocument();
    });
  });
});
