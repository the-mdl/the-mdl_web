import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

const { mockGet } = vi.hoisted(() => ({
  mockGet: vi.fn(),
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
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    request: vi.fn(),
  },
}));

import { Refine } from '@refinedev/core';
import { BrowserRouter } from 'react-router';
import { App as AntdApp } from 'antd';
import { dataProvider } from '../providers/data-provider';
import { UserListPage } from '../pages/users/list';
import type { ReactNode } from 'react';

const Wrapper = ({ children }: { children: ReactNode }) => (
  <BrowserRouter>
    <AntdApp>
      <Refine
        dataProvider={dataProvider}
        resources={[{ name: 'users', list: '/users' }]}
        options={{ disableTelemetry: true }}
      >
        {children}
      </Refine>
    </AntdApp>
  </BrowserRouter>
);

const mockUsers = [
  {
    id: 'u1',
    email: 'alice@example.com',
    display_name: 'Alice',
    last_sign_in_at: '2026-03-01T12:00:00Z',
    is_banned: false,
    created_at: '2026-01-15T08:00:00Z',
  },
  {
    id: 'u2',
    email: 'bob@example.com',
    display_name: 'Bob',
    last_sign_in_at: null,
    is_banned: true,
    created_at: '2026-02-20T10:00:00Z',
  },
];

describe('UserListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockResolvedValue({
      data: { users: mockUsers, total: 2 },
    });
  });

  it('renders user rows in the table', async () => {
    render(<UserListPage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('alice@example.com')).toBeInTheDocument();
    });

    expect(screen.getByText('bob@example.com')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('shows banned status tags', async () => {
    render(<UserListPage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('alice@example.com')).toBeInTheDocument();
    });

    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Banned')).toBeInTheDocument();
  });

  it('forwards search param to API', async () => {
    render(<UserListPage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('alice@example.com')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search by email or name…');
    fireEvent.change(searchInput, { target: { value: 'alice' } });

    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledWith(
        '/admin/users',
        expect.objectContaining({
          params: expect.objectContaining({ search: 'alice' }),
        }),
      );
    });
  });

  it('displays total user count', async () => {
    render(<UserListPage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('2 users')).toBeInTheDocument();
    });
  });
});
