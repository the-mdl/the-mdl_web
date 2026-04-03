import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

const { mockGet, mockPost, mockRequest } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockPost: vi.fn(),
  mockRequest: vi.fn(),
}));

vi.mock('../providers/api-client', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    }),
  },
  apiClient: {
    defaults: { baseURL: '/api' },
    interceptors: { request: { use: vi.fn() } },
    get: mockGet,
    post: mockPost,
    patch: vi.fn(),
    delete: vi.fn(),
    request: mockRequest,
  },
}));

vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return {
    ...actual,
    useParams: () => ({ id: 'u1' }),
  };
});

import { Refine } from '@refinedev/core';
import { BrowserRouter } from 'react-router';
import { App as AntdApp } from 'antd';
import { dataProvider } from '../providers/data-provider';
import { UserShowPage } from '../pages/users/show';
import type { ReactNode } from 'react';

const mockUserDetail = {
  user: {
    id: 'u1',
    email: 'alice@example.com',
    display_name: 'Alice',
    created_at: '2026-01-15T08:00:00Z',
    last_sign_in_at: '2026-03-01T12:00:00Z',
    is_banned: false,
    banned_until: null,
    disclaimer_accepted_at: '2026-01-16T09:00:00Z',
  },
  circles: [
    {
      circle_id: 'c1',
      role: 'member',
      joined_at: '2026-02-01T00:00:00Z',
      circles: { id: 'c1', name: 'Family', created_at: '2026-01-20T00:00:00Z' },
    },
  ],
  stats: {
    message_count: 42,
    circle_count: 1,
  },
};

const Wrapper = ({ children }: { children: ReactNode }) => (
  <BrowserRouter>
    <AntdApp>
      <Refine
        dataProvider={dataProvider}
        resources={[{ name: 'users', list: '/users', show: '/users/:id' }]}
        options={{ disableTelemetry: true }}
      >
        {children}
      </Refine>
    </AntdApp>
  </BrowserRouter>
);

describe('UserShowPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequest.mockResolvedValue({ data: mockUserDetail });
  });

  it('renders user details', async () => {
    render(<UserShowPage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('alice@example.com')).toBeInTheDocument();
    });

    expect(screen.getAllByText('Alice').length).toBeGreaterThan(0);
    expect(screen.getByText('u1')).toBeInTheDocument();
  });

  it('renders stat cards with message count and circle count', async () => {
    render(<UserShowPage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    expect(screen.getByText('Messages')).toBeInTheDocument();
    expect(screen.getByText('Circles')).toBeInTheDocument();
  });

  it('renders circle memberships table', async () => {
    render(<UserShowPage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('Family')).toBeInTheDocument();
    });

    expect(screen.getByText('member')).toBeInTheDocument();
  });

  it('shows ban button for active user', async () => {
    render(<UserShowPage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('Ban User')).toBeInTheDocument();
    });
  });

  it('calls toggle-ban endpoint when ban button clicked', async () => {
    mockPost.mockResolvedValue({
      data: { user: { id: 'u1', banned_until: '2126-01-01T00:00:00Z' } },
    });

    render(<UserShowPage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('Ban User')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Ban User'));

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith(
        '/admin/users/u1/toggle-ban',
        { ban: true },
      );
    });
  });

  it('calls reset-password endpoint when reset button clicked', async () => {
    mockPost.mockResolvedValue({
      data: { success: true, email: 'alice@example.com' },
    });

    render(<UserShowPage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('Reset Password')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Reset Password'));

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith('/admin/users/u1/reset-password');
    });
  });

  it('shows unban button for banned user', async () => {
    mockRequest.mockResolvedValue({
      data: {
        ...mockUserDetail,
        user: { ...mockUserDetail.user, is_banned: true, banned_until: '2126-01-01T00:00:00Z' },
      },
    });

    render(<UserShowPage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('Unban User')).toBeInTheDocument();
    });
  });
});
