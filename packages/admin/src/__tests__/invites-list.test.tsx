import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

const { mockGet, mockPost } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockPost: vi.fn(),
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
    request: vi.fn(),
  },
}));

import { Refine } from '@refinedev/core';
import { BrowserRouter } from 'react-router';
import { App as AntdApp } from 'antd';
import { dataProvider } from '../providers/data-provider';
import { InviteListPage } from '../pages/invites/list';
import type { ReactNode } from 'react';

const Wrapper = ({ children }: { children: ReactNode }) => (
  <BrowserRouter>
    <AntdApp>
      <Refine
        dataProvider={dataProvider}
        resources={[
          { name: 'whitelist', list: '/whitelist' },
          { name: 'invites', list: '/invites' },
        ]}
        options={{ disableTelemetry: true }}
      >
        {children}
      </Refine>
    </AntdApp>
  </BrowserRouter>
);

const mockWhitelist = [
  { email: 'vip@example.com', added_at: '2026-03-01T00:00:00Z', notes: 'Early tester' },
  { email: 'beta@example.com', added_at: '2026-03-10T00:00:00Z', notes: null },
];

const mockInvites = [
  {
    id: 'inv1',
    email: 'invited@example.com',
    code: 'ABC123',
    status: 'pending',
    created_at: '2026-03-15T00:00:00Z',
    expires_at: null,
  },
  {
    id: 'inv2',
    email: 'accepted@example.com',
    code: 'DEF456',
    status: 'accepted',
    created_at: '2026-03-10T00:00:00Z',
    expires_at: null,
  },
];

describe('InviteListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // The page makes two useList calls: whitelist and invites
    // Both go through dataProvider.getList which calls apiClient.get
    mockGet.mockImplementation((url: string) => {
      if (url.includes('whitelist')) {
        return Promise.resolve({ data: { entries: mockWhitelist } });
      }
      if (url.includes('invites')) {
        return Promise.resolve({ data: { invites: mockInvites } });
      }
      return Promise.resolve({ data: {} });
    });
    mockPost.mockResolvedValue({ data: { success: true } });
  });

  it('renders whitelist entries', async () => {
    render(<InviteListPage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('vip@example.com')).toBeInTheDocument();
    });

    expect(screen.getByText('beta@example.com')).toBeInTheDocument();
    expect(screen.getByText('Early tester')).toBeInTheDocument();
  });

  it('renders invite rows with status tags', async () => {
    render(<InviteListPage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('invited@example.com')).toBeInTheDocument();
    });

    expect(screen.getByText('accepted@example.com')).toBeInTheDocument();
    expect(screen.getByText('ABC123')).toBeInTheDocument();
    expect(screen.getByText('pending')).toBeInTheDocument();
    expect(screen.getByText('accepted')).toBeInTheDocument();
  });

  it('submits add-whitelist form', async () => {
    render(<InviteListPage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('vip@example.com')).toBeInTheDocument();
    });

    // Find the email input in the whitelist form - first email placeholder
    const emailInputs = screen.getAllByPlaceholderText('Email address');
    fireEvent.change(emailInputs[0], { target: { value: 'new@example.com' } });

    // Click the "Add" button
    const addButton = screen.getByRole('button', { name: 'Add' });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith(
        '/admin/whitelist',
        expect.objectContaining({ email: 'new@example.com' }),
      );
    });
  });

  it('submits send-invite form', async () => {
    mockPost.mockResolvedValue({ data: { invite: { code: 'NEW123' } } });
    render(<InviteListPage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('vip@example.com')).toBeInTheDocument();
    });

    // Find the email input in the invite form - second email placeholder
    const emailInputs = screen.getAllByPlaceholderText('Email address');
    fireEvent.change(emailInputs[1], { target: { value: 'newinvite@example.com' } });

    // Click the "Send Invite" button
    const sendButton = screen.getByRole('button', { name: 'Send Invite' });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith(
        '/admin/invites',
        { email: 'newinvite@example.com' },
      );
    });
  });
});
